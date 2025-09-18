from django.urls import path
from .views import *

urlpatterns = [
    path("carmodels/list/", CarModelListApiView.as_view()),
    path('compare/list/', CompareListApiView.as_view()),
    path('selected/equipments/', SelectedEquipmentsComparisonPdfView.as_view())
]