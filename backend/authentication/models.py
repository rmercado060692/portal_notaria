from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class PortalClientManager(BaseUserManager):
    """Manager para PortalClient."""
    
    def create_client(self, document_type, document_number, full_name, email=None, phone=None, **extra_fields):
        if not document_type:
            raise ValueError('Debe especificar el tipo de documento')
        if not document_number:
            raise ValueError('Debe especificar el número de documento')
        if not full_name:
            raise ValueError('Debe especificar el nombre completo')
        
        client = self.model(
            document_type=document_type,
            document_number=document_number,
            full_name=full_name,
            email=email,
            phone=phone,
            **extra_fields
        )
        client.save(using=self._db)
        return client


class PortalClient(models.Model):
    """Modelo para clientes del portal."""
    
    DOCUMENT_TYPES = [
        ('DNI', 'DNI'),
        ('RUC', 'RUC'),
        ('CE', 'Carné de Extranjería'),
        ('PAS', 'Pasaporte'),
    ]
    
    document_type = models.CharField(max_length=3, choices=DOCUMENT_TYPES)
    document_number = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=200)
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = PortalClientManager()
    
    class Meta:
        db_table = 'portal_clients'
        verbose_name = 'Cliente del Portal'
        verbose_name_plural = 'Clientes del Portal'
    
    def __str__(self):
        return f"{self.full_name} ({self.document_type} {self.document_number})"


class PortalUserManager(BaseUserManager):
    """Manager para PortalUser."""
    
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('Debe especificar un nombre de usuario')
        if not email:
            raise ValueError('Debe especificar un correo electrónico')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        
        if password:
            user.set_password(password)
        
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('must_change_password', False)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)


class PortalUser(AbstractBaseUser, PermissionsMixin):
    """Modelo para usuarios del portal (clientes y admin)."""
    
    ROLE_CHOICES = [
        ('CLIENT', 'Cliente'),
        ('ADMIN', 'Admin'),
        ('SUPERADMIN', 'Superadmin'),
    ]
    
    client = models.ForeignKey(PortalClient, on_delete=models.CASCADE, related_name='users', blank=True, null=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(max_length=255, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CLIENT')
    must_change_password = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = PortalUserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'portal_users'
        verbose_name = 'Usuario del Portal'
        verbose_name_plural = 'Usuarios del Portal'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def update_last_login(self):
        """Actualiza la última fecha de inicio de sesión."""
        self.last_login_at = timezone.now()
        self.save(update_fields=['last_login_at'])


class PortalUserClientLink(models.Model):
    """Modelo para asociar un usuario a múltiples documentos (apoderados, empresas, etc.)."""
    
    RELATIONSHIP_TYPES = [
        ('TITULAR', 'Titular'),
        ('APODERADO', 'Apoderado'),
        ('REPRESENTANTE', 'Representante Legal'),
        ('OTRO', 'Otro'),
    ]
    
    user = models.ForeignKey(PortalUser, on_delete=models.CASCADE, related_name='document_links')
    document_type = models.CharField(max_length=3, choices=PortalClient.DOCUMENT_TYPES)
    document_number = models.CharField(max_length=20)
    relationship_type = models.CharField(max_length=20, choices=RELATIONSHIP_TYPES, default='TITULAR')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'portal_user_client_links'
        unique_together = ('user', 'document_type', 'document_number')
        verbose_name = 'Vinculación Usuario-Documento'
        verbose_name_plural = 'Vinculaciones Usuario-Documento'
    
    def __str__(self):
        return f"{self.user.username} -> {self.document_type} {self.document_number} ({self.get_relationship_type_display()})"


class PortalAccessLog(models.Model):
    """Modelo para logs de acceso al portal."""
    
    user = models.ForeignKey(PortalUser, on_delete=models.SET_NULL, null=True, related_name='access_logs')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    action = models.CharField(max_length=50)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'portal_access_logs'
        verbose_name = 'Log de Acceso'
        verbose_name_plural = 'Logs de Acceso'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username if self.user else 'Anonymous'} - {self.action} - {self.created_at}"


class PortalNotification(models.Model):
    """Modelo para notificaciones del portal."""
    
    user = models.ForeignKey(PortalUser, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'portal_notifications'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
