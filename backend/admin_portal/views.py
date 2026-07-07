from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import PortalClient, PortalUser
from core.services import SignoClientLookupService, SignoService
from tramites.serializers import TramiteListSerializer

from .serializers import (
    AdminCreatePortalUserSerializer,
    AdminPortalClientCreateSerializer,
    AdminPortalClientSerializer,
    AdminPortalUserSummarySerializer,
    AdminResetPasswordSerializer,
    AdminToggleUserStatusSerializer,
)


class IsPortalAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (
                user.is_staff or user.is_superuser or user.role in {'ADMIN', 'SUPERADMIN'}
            )
        )


class AdminClientListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsPortalAdmin]
    queryset = PortalClient.objects.prefetch_related('users__document_links').order_by('-created_at')

    def get_serializer_class(self):
        return AdminPortalClientCreateSerializer if self.request.method == 'POST' else AdminPortalClientSerializer


class AdminClientDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsPortalAdmin]
    serializer_class = AdminPortalClientSerializer
    queryset = PortalClient.objects.prefetch_related('users__document_links')

    def get_serializer_class(self):
        if self.request.method in {'PUT', 'PATCH'}:
            return AdminPortalClientCreateSerializer
        return AdminPortalClientSerializer


class AdminClientCreateUserView(APIView):
    permission_classes = [IsPortalAdmin]

    def post(self, request, pk):
        client = generics.get_object_or_404(PortalClient, pk=pk)
        serializer = AdminCreatePortalUserSerializer(data=request.data, context={'client': client})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response({
            'success': True,
            'data': {
                'user': AdminPortalUserSummarySerializer(result['user']).data,
                'temporary_password': result['temporary_password'],
            }
        }, status=status.HTTP_201_CREATED)


class AdminUserResetPasswordView(APIView):
    permission_classes = [IsPortalAdmin]

    def post(self, request, pk):
        user = generics.get_object_or_404(PortalUser, pk=pk)
        serializer = AdminResetPasswordSerializer(data=request.data, context={'user': user})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response({
            'success': True,
            'data': {
                'user': AdminPortalUserSummarySerializer(result['user']).data,
                'temporary_password': result['temporary_password'],
            }
        })


class AdminUserDisableView(APIView):
    permission_classes = [IsPortalAdmin]

    def post(self, request, pk):
        user = generics.get_object_or_404(PortalUser, pk=pk)
        serializer = AdminToggleUserStatusSerializer(data=request.data, context={'user': user})
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        return Response({
            'success': True,
            'data': AdminPortalUserSummarySerializer(updated_user).data,
        })


class AdminClientSignoTramitesView(APIView):
    permission_classes = [IsPortalAdmin]

    def get(self, request, pk):
        client = generics.get_object_or_404(PortalClient, pk=pk)
        tramites = SignoClientLookupService.get_kardex_list_by_document(client.document_number)
        serializer = TramiteListSerializer(tramites, many=True)
        signo_client = SignoClientLookupService.get_client_by_document(client.document_number)
        return Response({
            'success': True,
            'data': {
                'client': AdminPortalClientSerializer(client).data,
                'signo_client': signo_client,
                'tramites': serializer.data,
                'total': len(serializer.data),
            }
        })
