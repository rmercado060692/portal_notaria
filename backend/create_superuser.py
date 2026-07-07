import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portal.settings')
django.setup()

from authentication.models import PortalUser

username = os.getenv('PORTAL_SUPERUSER_USERNAME')
email = os.getenv('PORTAL_SUPERUSER_EMAIL')
password = os.getenv('PORTAL_SUPERUSER_PASSWORD')

if not username or not email or not password:
    raise SystemExit(
        'Debes definir PORTAL_SUPERUSER_USERNAME, PORTAL_SUPERUSER_EMAIL y PORTAL_SUPERUSER_PASSWORD en el entorno del servidor.'
    )

if not PortalUser.objects.filter(username=username).exists():
    user = PortalUser.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        role='SUPERADMIN',
        is_active=True,
        is_staff=True,
        must_change_password=False,
    )
    print(f'Superuser creado exitosamente: {user.username}')
else:
    print(f'El superuser {username} ya existe')
