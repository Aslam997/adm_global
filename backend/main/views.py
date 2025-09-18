from .pdfutils import _aggregate_options_props, _build_styles, _build_table, _compute_col_widths, _fetch_ordered_equipments, _render_comparison_pdf, _serialize_equipments, _validate_ids
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import *
from .serializers import CarModelSerializer, CompareListSerializer
from .utils import get_custom_pagination_class, search_model_by_fields
from django.db.models import Prefetch, Min

from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
# Create your views here.

class CarModelListApiView(generics.ListAPIView):
    serializer_class = CarModelSerializer
    pagination_class = get_custom_pagination_class(21)

    def get_base_queryset(self):
        """
        Base queryset with select_related + prefetch to avoid N+1.
        We use `to_attr` to store prefetched lists on the instance:
          - car.modifications_prefetched -> list of modifications
          - modification.equipments_prefetched -> list of equipments
        The serializer should read those attrs when present.
        """
        equipments_qs = EquipmentsModel.objects.only("id", "name", "price")
        equipments_prefetch = Prefetch(
            "equipments",
            queryset=equipments_qs,
            to_attr="equipments_prefetched",
        )

        modifications_qs = ModificationModel.objects.only("id", "name", "car").prefetch_related(equipments_prefetch)
        modifications_prefetch = Prefetch(
            "modifications",
            queryset=modifications_qs,
            to_attr="modifications_prefetched",
        )

        # Annotate min price across modifications->equipments 
        base_qs = CarModel.objects.select_related("brand").prefetch_related(modifications_prefetch).annotate(
            min_price=Min("modifications__equipments__price")
        ).filter(min_price__isnull=False)

        return base_qs

    def get_queryset(self):
        query = self.request.GET.get("query", None)
        base_qs = self.get_base_queryset()

        if query and query != "NaN":

            qs = search_model_by_fields(CarModel, query, ["name", "brand_name"])

            return base_qs.filter(pk__in=qs.values_list("pk", flat=True))
        else:
            return base_qs
        
        

class CompareListApiView(generics.ListAPIView):
    serializer_class = CompareListSerializer
    queryset = EquipmentsModel.objects.all()
    


class SelectedEquipmentsComparisonPdfView(APIView):

    TITLE = "Taqqoslash jadvali"

    def post(self, request, *args, **kwargs):
        
        
        #  Validate
        ids_int, err = _validate_ids(request.data)
        if err:
            return err
        

        #  Fetch ordered models
        ordered_models = _fetch_ordered_equipments(ids_int)
        if not ordered_models:
            return Response({"detail": "No equipments found for provided ids."}, status=status.HTTP_404_NOT_FOUND)

        # Serialize to the expected structure
        equipments_data = _serialize_equipments(ordered_models, request)

        #  Build logical grid of options
        options_props = _aggregate_options_props(equipments_data)

        # 5) Styles & widths
        styles = _build_styles()
        page_width, _ = A4
        col_widths = _compute_col_widths(
            num_equipments=len(equipments_data),
            page_width=page_width,
            left=20,
            right=20,
        )

        # Table
        table = _build_table(equipments_data, options_props, styles, col_widths)

        # PDF
        pdf_bytes = _render_comparison_pdf(self.TITLE, table, styles)

        # Response
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename="equipments_comparison.pdf"'
        response.write(pdf_bytes)
        return response