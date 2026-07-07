from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from authentication.models import PortalClient, PortalUser


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    FRONTEND_BASE_URL='https://notariamendoza.com/portal',
)
class AuthenticationSecurityTests(APITestCase):
    def setUp(self):
        self.client_record = PortalClient.objects.create(
            document_type='DNI',
            document_number='12345678',
            full_name='Cliente Seguro',
            email='cliente@example.com',
        )
        self.user = PortalUser.objects.create_user(
            username='cliente',
            email='cliente@example.com',
            password='PasswordSegura123!',
            client=self.client_record,
            role='CLIENT',
            is_active=True,
            must_change_password=False,
        )

    def test_login_correcto(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'cliente', 'password': 'PasswordSegura123!'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'cliente@example.com')

    def test_login_incorrecto(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'cliente', 'password': 'incorrecta'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Credenciales inválidas.', str(response.data))

    def test_me_no_permite_escalar_privilegios(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            '/api/auth/me/',
            {'role': 'SUPERADMIN', 'is_active': False, 'must_change_password': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'CLIENT')
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.must_change_password)

    def test_forgot_password_usa_frontend_base_url(self):
        response = self.client.post(
            '/api/auth/forgot-password/',
            {'identifier': 'cliente'},
            format='json',
            HTTP_ORIGIN='https://attacker.example.com',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[0].body
        self.assertIn('https://notariamendoza.com/portal/reset-password/', body)
        self.assertNotIn('https://attacker.example.com', body)
