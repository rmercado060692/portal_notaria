from django.db import connections
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        database_ok = True

        try:
            with connections['default'].cursor() as cursor:
                cursor.execute('SELECT 1')
                cursor.fetchone()
        except Exception:
            database_ok = False

        response_status = status.HTTP_200_OK if database_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(
            {
                'status': 'ok' if database_ok else 'degraded',
                'service': 'portal-api',
                'time': timezone.now().isoformat(),
                'checks': {
                    'database_default': 'ok' if database_ok else 'error',
                },
            },
            status=response_status,
        )
