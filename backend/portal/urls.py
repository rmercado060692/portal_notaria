"""
URL configuration for portal project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from authentication.views import MeView
from core.views import HealthCheckView
from tramites.views import TramiteDetailView, TramiteDocumentDownloadView, TramiteListView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', HealthCheckView.as_view(), name='api-health'),
    path('api/auth/', include('authentication.urls')),
    path('api/tramites/', include('tramites.urls')),
    path('api/admin/', include('admin_portal.urls')),
    path('api/me/', MeView.as_view(), name='api-me'),
    path('api/me/tramites/', TramiteListView.as_view(), name='api-me-tramites'),
    path('api/me/tramites/<str:kardex>/', TramiteDetailView.as_view(), name='api-me-tramite-detail'),
    path('api/me/tramites/<str:kardex>/documents/<int:document_id>/download/', TramiteDocumentDownloadView.as_view(), name='api-me-tramite-document-download'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
