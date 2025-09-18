from collections import OrderedDict
from io import BytesIO

from rest_framework import status
from rest_framework.response import Response

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import EquipmentsModel
from .serializers import SelectedEquipmentSerializer


# Simple container instead of a typed dataclass (no type hints)
class PDFStyles:
    def __init__(self, cell, header, option, title):
        self.cell = cell
        self.header = header
        self.option = option
        self.title = title


def _validate_ids(payload):
    ids = payload.get('ids')
    if ids is None:
        return (), Response({"detail": "Field 'ids' is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(ids, (list, tuple)):
        return (), Response({"detail": "Field 'ids' must be a list of integers."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        ids_int = [int(x) for x in ids]
    except (TypeError, ValueError):
        return (), Response({"detail": "All ids must be integers."}, status=status.HTTP_400_BAD_REQUEST)
    if not ids_int:
        return (), Response({"detail": "Empty ids list."}, status=status.HTTP_400_BAD_REQUEST)
    return ids_int, None


def _fetch_ordered_equipments(ids_int):
    """
    Fetch equipments in the same order as ids_int.
    """
    qs = (
        EquipmentsModel.objects
        .filter(id__in=ids_int)
        .select_related('modification__car__brand')
    )
    eq_by_id = {e.id: e for e in qs}
    return [eq_by_id[i] for i in ids_int if i in eq_by_id]


def _serialize_equipments(equipments, request):
    serializer = SelectedEquipmentSerializer(equipments, many=True, context={'request': request})
    return serializer.data


def _aggregate_options_props(equipments_data):
    """
    Build ordered mapping of option name -> list of unique property titles (preserving first-seen order).
    """
    options_props = OrderedDict()
    for eq in equipments_data:
        for opt in eq.get('options', []):
            opt_name = opt.get('name') or ''
            if opt_name not in options_props:
                options_props[opt_name] = []
            for prop in opt.get('properties', []):
                title = prop.get('title')
                if title and title not in options_props[opt_name]:
                    options_props[opt_name].append(title)
    return options_props


def _build_styles():
    base = getSampleStyleSheet()
    return PDFStyles(
        cell=ParagraphStyle(
            name='Cell',
            parent=base['BodyText'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            alignment=TA_LEFT,
            wordWrap='CJK',
        ),
        header=ParagraphStyle(
            name='HeaderCell',
            parent=base['BodyText'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=9,
            alignment=TA_LEFT,
            wordWrap='CJK',
        ),
        option=ParagraphStyle(
            name='OptionCell',
            parent=base['BodyText'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            alignment=TA_LEFT,
            wordWrap='CJK',
        ),
        title=base['Title'],
    )


def _build_header_row(equipments_data, styles):
    header_cells = [Paragraph('', styles.header)]
    for eq in equipments_data:
        brand = eq.get('brand_name') or ''
        model = eq.get('car_name') or ''
        name = eq.get('name') or ''
        price = eq.get('price') or 0
        price_str = f"{price:,}"
        text = f"<b>{brand}</b><br/>{model}<br/>{name}<br/>{price_str}"
        header_cells.append(Paragraph(text, styles.header))
    return header_cells


def _equipment_has_prop(eq, opt_name, prop_title):
    for opt in eq.get('options', []):
        if opt.get('name') == opt_name:
            for prop in opt.get('properties', []):
                if prop.get('title') == prop_title:
                    return True
    return False


def _build_table_rows(equipments_data, options_props, styles):
    rows = []
    for opt_name, props in options_props.items():
        rows.append([Paragraph(opt_name, styles.option)] + ['' for _ in range(len(equipments_data))])
        for prop_title in props:
            left = Paragraph(prop_title, styles.cell)
            row = [left]
            for eq in equipments_data:
                mark = '✓' if _equipment_has_prop(eq, opt_name, prop_title) else ''
                row.append(Paragraph(mark, styles.cell))
            rows.append(row)
    return rows


def _compute_col_widths(num_equipments, page_width, left, right):
    usable = page_width - left - right
    first_col = max(usable * 0.40, 120)  # 40% or min 120pt
    remaining = max(usable - first_col, 0)
    other = remaining / max(1, num_equipments)

    min_other = 60
    if other < min_other:
        extra_needed = (min_other * num_equipments) - remaining
        first_col = max(first_col - extra_needed, 100)
        remaining = max(usable - first_col, 0)
        other = remaining / max(1, num_equipments)

    return [first_col] + [other] * num_equipments


def _build_table(equipments_data, options_props, styles, col_widths):
    table_data = []
    table_data.append(_build_header_row(equipments_data, styles))
    table_data.extend(_build_table_rows(equipments_data, options_props, styles))

    table = Table(table_data, colWidths=col_widths, repeatRows=1)

    style = TableStyle([
        ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (-1,0), 'CENTER'),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f2f2f2')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ])

    # Option row spans & look
    row_index = 1  # header is row 0
    for _, props in options_props.items():
        style.add('SPAN', (0, row_index), (-1, row_index))
        style.add('BACKGROUND', (0, row_index), (-1, row_index), colors.HexColor('#d9edf7'))
        style.add('ALIGN', (0, row_index), (-1, row_index), 'LEFT')
        style.add('FONTNAME', (0, row_index), (0, row_index), 'Helvetica-Bold')
        row_index += 1 + len(props)

    table.setStyle(style)
    return table


def _render_comparison_pdf(title, table, styles):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20,
        rightMargin=20,
        topMargin=20,
        bottomMargin=20,
    )

    elems = [
        Paragraph(title, styles.title),
        Spacer(1, 12),
        table,
    ]
    doc.build(elems)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
