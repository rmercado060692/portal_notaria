from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .audit import log_portal_event
from .models import PortalClient, PortalUser, PortalNotification


class PortalClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalClient
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PortalUserSerializer(serializers.ModelSerializer):
    client = PortalClientSerializer(read_only=True)
    
    class Meta:
        model = PortalUser
        fields = ['id', 'username', 'email', 'client', 'role', 'must_change_password', 'is_active', 'is_staff', 'is_superuser', 'last_login_at', 'created_at']
        read_only_fields = ['id', 'last_login_at', 'created_at', 'updated_at']


class CurrentUserSerializer(serializers.ModelSerializer):
    client = PortalClientSerializer(read_only=True)

    class Meta:
        model = PortalUser
        fields = ['id', 'username', 'email', 'client', 'role', 'must_change_password', 'is_active', 'is_staff', 'is_superuser', 'last_login_at', 'created_at']
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username', '').strip()
        password = attrs.get('password')
        request = self.context.get('request')
        
        if username and password:
            user = authenticate(username=username, password=password)

            if not user:
                candidate = (
                    PortalUser.objects.select_related('client')
                    .filter(
                        Q(username__iexact=username) |
                        Q(email__iexact=username) |
                        Q(client__document_number__iexact=username)
                    )
                    .filter(is_active=True)
                    .first()
                )

                if candidate and candidate.check_password(password):
                    user = candidate
            
            if not user:
                if request:
                    log_portal_event(request, 'login_failed', details=f'identificador={username}')
                raise serializers.ValidationError('Credenciales inválidas.')
            
            if not user.is_active:
                if request:
                    log_portal_event(request, 'login_failed', user=user, details='Cuenta desactivada')
                raise serializers.ValidationError('Cuenta desactivada.')
            
            attrs['user'] = user
        else:
            if request:
                log_portal_event(request, 'login_failed', details='Credenciales incompletas')
            raise serializers.ValidationError('Debe incluir nombre de usuario y contraseña.')
        
        return attrs
    
    def create(self, validated_data):
        user = validated_data['user']
        refresh = RefreshToken.for_user(user)
        request = self.context.get('request')
        
        user.update_last_login()
        if request:
            log_portal_event(request, 'login_success', user=user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': CurrentUserSerializer(user).data,
        }


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True, min_length=8)
    
    def validate(self, attrs):
        user = self.context['request'].user
        
        if not user.check_password(attrs['old_password']):
            raise serializers.ValidationError({'old_password': 'La contraseña actual es incorrecta.'})
        
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': 'Las contraseñas no coinciden.'})

        validate_password(attrs['new_password'], user=user)
        return attrs
    
    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.must_change_password = False
        user.save()
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=255)

    def validate_identifier(self, value):
        return value.strip()

    def get_user(self):
        identifier = self.validated_data.get('identifier', '')
        if not identifier:
            return None

        return (
            PortalUser.objects.select_related('client')
            .filter(
                Q(username__iexact=identifier) |
                Q(email__iexact=identifier) |
                Q(client__document_number__iexact=identifier)
            )
            .filter(is_active=True)
            .first()
        )


class ResetPasswordConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': 'Las contraseñas no coinciden.'})

        validate_password(attrs['new_password'])
        return attrs


class PortalNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalNotification
        fields = ['id', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class UpdateProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = PortalUser
        fields = ['email', 'phone', 'address']

    def validate_email(self, value):
        user = self.instance
        cleaned_value = value.strip().lower()
        if cleaned_value and PortalUser.objects.exclude(pk=user.pk).filter(email__iexact=cleaned_value).exists():
            raise serializers.ValidationError('Ese correo ya está registrado por otro usuario.')
        return cleaned_value
    
    def update(self, instance, validated_data):
        if 'email' in validated_data:
            instance.email = validated_data['email']
        
        if instance.client:
            if 'phone' in validated_data:
                instance.client.phone = validated_data['phone']
            if 'address' in validated_data:
                instance.client.address = validated_data['address']
            instance.client.save()
        
        instance.save()
        return instance


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True)

    def validate_refresh(self, value):
        cleaned_value = value.strip()
        if not cleaned_value:
            raise serializers.ValidationError('Debes enviar un refresh token válido.')
        return cleaned_value

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.validated_data['refresh'])
            token.blacklist()
        except TokenError as exc:
            raise serializers.ValidationError({'refresh': 'El refresh token no es válido o ya fue invalidado.'}) from exc
