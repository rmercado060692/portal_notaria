from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.models import PortalClient, PortalUser
from tramites.models import MirrorClient, MirrorKardex, MirrorKardexClient


@override_settings(PORTAL_DATA_SOURCE='mirror')
class TramitesSecurityTests(APITestCase):
    def setUp(self):
        portal_client = PortalClient.objects.create(
            document_type='DNI',
            document_number='12345678',
            full_name='Cliente Portal',
            email='portal@example.com',
        )
        self.user = PortalUser.objects.create_user(
            username='clienteportal',
            email='portal@example.com',
            password='PasswordSegura123!',
            client=portal_client,
            role='CLIENT',
            is_active=True,
            must_change_password=False,
        )

        mirror_client_owner = MirrorClient.objects.create(
            document_type='DNI',
            document_number='12345678',
            full_name='Cliente Portal',
        )
        mirror_client_other = MirrorClient.objects.create(
            document_type='DNI',
            document_number='87654321',
            full_name='Otro Cliente',
        )

        self.owner_kardex = MirrorKardex.objects.create(
            source_idkardex=1,
            kardex='K10001',
            fechaingreso='01/01/2026',
            contrato='Compraventa',
            contacto='Mesa principal',
        )
        self.other_kardex = MirrorKardex.objects.create(
            source_idkardex=2,
            kardex='K20002',
            fechaingreso='02/01/2026',
            contrato='Poder',
            contacto='Mesa secundaria',
        )

        MirrorKardexClient.objects.create(kardex=self.owner_kardex, client=mirror_client_owner)
        MirrorKardexClient.objects.create(kardex=self.other_kardex, client=mirror_client_other)

    def test_dashboard_devuelve_solo_tramites_del_documento_autenticado(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/me/tramites/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tramites = response.data['data']['tramites']
        self.assertEqual(len(tramites), 1)
        self.assertEqual(tramites[0]['kardex'], 'K10001')

    def test_usuario_no_puede_ver_kardex_ajeno(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/me/tramites/K20002/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_endpoint_publico_de_prueba_ya_no_existe(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/tramites/test/K10001/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
