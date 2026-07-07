from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from .audit import log_portal_event
from .models import PortalUser, PortalNotification
from .serializers import (
    CurrentUserSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordConfirmSerializer,
    PortalNotificationSerializer,
    LogoutSerializer,
    UpdateProfileSerializer,
)
from .throttles import (
    ForgotPasswordThrottle,
    LoginThrottle,
    LogoutThrottle,
    RefreshTokenThrottle,
    ResetPasswordThrottle,
)


class LoginView(generics.GenericAPIView):
    """Vista para iniciar sesión."""
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    throttle_classes = [LoginThrottle]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.save(), status=status.HTTP_200_OK)


class MeView(generics.RetrieveAPIView):
    """Vista segura para obtener los datos del usuario autenticado."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CurrentUserSerializer
    
    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    """Vista para actualizar el perfil del usuario."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UpdateProfileSerializer
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """Vista para cambiar la contraseña."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)


class ForgotPasswordView(generics.GenericAPIView):
    """Vista para solicitar recuperación de contraseña."""
    permission_classes = [permissions.AllowAny]
    serializer_class = ForgotPasswordSerializer
    throttle_classes = [ForgotPasswordThrottle]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user()
        identifier = serializer.validated_data.get('identifier', '')

        if user and user.email:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f'{settings.FRONTEND_BASE_URL}/reset-password/{uid}/{token}'

            send_mail(
                subject='Recuperación de contraseña - Portal del Cliente',
                message=(
                    f'Hola {user.client.full_name if user.client else user.username},\n\n'
                    'Recibimos una solicitud para restablecer tu contraseña del portal de la Notaría Mendoza Vásquez.\n'
                    'Haz clic en el siguiente enlace para crear una nueva contraseña:\n\n'
                    f'{reset_url}\n\n'
                    'Si no solicitaste este cambio, puedes ignorar este mensaje.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        log_portal_event(request, 'password_reset_requested', user=user, details=f'identificador={identifier}')
        return Response({'detail': 'Si el correo existe, recibirás un mensaje con instrucciones.'}, status=status.HTTP_200_OK)


class ResetPasswordConfirmView(generics.GenericAPIView):
    """Vista para confirmar el cambio de contraseña usando token."""
    permission_classes = [permissions.AllowAny]
    serializer_class = ResetPasswordConfirmSerializer
    throttle_classes = [ResetPasswordThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = PortalUser.objects.get(pk=user_id, is_active=True)
        except (PortalUser.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'detail': 'El enlace de recuperación no es válido.'}, status=status.HTTP_400_BAD_REQUEST)

        token = serializer.validated_data['token']
        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'El enlace de recuperación ha expirado o ya no es válido.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.must_change_password = False
        user.save(update_fields=['password', 'must_change_password', 'updated_at'])
        log_portal_event(request, 'password_reset_completed', user=user)

        return Response({'detail': 'Tu contraseña fue actualizada correctamente.'}, status=status.HTTP_200_OK)


class PortalTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RefreshTokenThrottle]


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LogoutSerializer
    throttle_classes = [LogoutThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_portal_event(request, 'logout', user=request.user)
        return Response({'detail': 'Sesión cerrada correctamente.'}, status=status.HTTP_200_OK)


class NotificationsListView(generics.ListAPIView):
    """Vista para obtener las notificaciones del usuario."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PortalNotificationSerializer
    
    def get_queryset(self):
        return PortalNotification.objects.filter(user=self.request.user).order_by('-created_at')


class NotificationReadView(generics.UpdateAPIView):
    """Vista para marcar una notificación como leída."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PortalNotificationSerializer
    
    def get_queryset(self):
        return PortalNotification.objects.filter(user=self.request.user)
    
    def patch(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(self.get_serializer(notification).data)


class MarkAllNotificationsReadView(generics.GenericAPIView):
    """Vista para marcar todas las notificaciones como leídas."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        PortalNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'Todas las notificaciones marcadas como leídas.'}, status=status.HTTP_200_OK)
