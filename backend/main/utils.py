from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

def get_custom_pagination_class(page_size):
    """
    Returns a custom pagination class with the specified page size.
    """
    class CustomPagination(PageNumberPagination):
        def __init__(self):
            self.page_size = page_size

    return CustomPagination


def search_model_by_fields(model, query, fields):
    """
    Filter a model's queryset based on a case-insensitive substring match for the given field.

    Args:
        model (Model): The Django model to query.
        query (str): The search query.
        field (str): The field to filter on (default is 'name').

    Returns:
        QuerySet: The filtered queryset.
    """
    queries = Q()
    for field in fields:
        queries |= Q(**{f"{field}__icontains": query})
    return model.objects.filter(queries)
