from django.urls import path
from .views import (
    LoginView,
    MeView,
    UpdateProfileView,
    ChangePasswordView,
    ForgotPasswordView,
    LogoutView,
    PortalTokenRefreshView,
    ResetPasswordConfirmView,
    NotificationsListView,
    NotificationReadView,
    MarkAllNotificationsReadView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', PortalTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('me/update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/confirm/', ResetPasswordConfirmView.as_view(), name='reset-password-confirm'),
    path('notifications/', NotificationsListView.as_view(), name='notifications-list'),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', MarkAllNotificationsReadView.as_view(), name='notifications-read-all'),
]
