from django.urls import path
from .views import TramiteListView, TramiteDetailView

urlpatterns = [
    path('', TramiteListView.as_view(), name='tramite-list'),
    path('<str:kardex>/', TramiteDetailView.as_view(), name='tramite-detail'),
]
