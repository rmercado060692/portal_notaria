from django.urls import path

from .views import (
    AdminClientCreateUserView,
    AdminClientDetailView,
    AdminClientListCreateView,
    AdminClientSignoTramitesView,
    AdminUserDisableView,
    AdminUserResetPasswordView,
)

urlpatterns = [
    path('clients/', AdminClientListCreateView.as_view(), name='admin-clients'),
    path('clients/<int:pk>/', AdminClientDetailView.as_view(), name='admin-client-detail'),
    path('clients/<int:pk>/create-user/', AdminClientCreateUserView.as_view(), name='admin-client-create-user'),
    path('clients/<int:pk>/tramites-signo/', AdminClientSignoTramitesView.as_view(), name='admin-client-tramites-signo'),
    path('users/<int:pk>/reset-password/', AdminUserResetPasswordView.as_view(), name='admin-user-reset-password'),
    path('users/<int:pk>/disable/', AdminUserDisableView.as_view(), name='admin-user-disable'),
]
