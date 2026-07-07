import secrets
import string

from django.db import transaction
from rest_framework import serializers

from authentication.models import PortalClient, PortalUser, PortalUserClientLink
from authentication.serializers import PortalClientSerializer, PortalUserSerializer


def generate_temp_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_username(base: str) -> str:
    cleaned = ''.join(ch.lower() for ch in base if ch.isalnum())[:12] or 'cliente'
    candidate = cleaned
    suffix = 1
    while PortalUser.objects.filter(username=candidate).exists():
        suffix += 1
        candidate = f'{cleaned}{suffix}'
    return candidate


class AdminPortalUserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalUserClientLink
        fields = ['id', 'document_type', 'document_number', 'relationship_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class AdminPortalUserSummarySerializer(PortalUserSerializer):
    documents = AdminPortalUserDocumentSerializer(source='document_links', many=True, read_only=True)

    class Meta(PortalUserSerializer.Meta):
        fields = PortalUserSerializer.Meta.fields + ['documents']


class AdminPortalClientSerializer(PortalClientSerializer):
    users = AdminPortalUserSummarySerializer(many=True, read_only=True)

    class Meta(PortalClientSerializer.Meta):
        fields = '__all__'


class AdminPortalClientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalClient
        fields = [
            'id',
            'document_type',
            'document_number',
            'full_name',
            'email',
            'phone',
            'address',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminCreatePortalUserSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    relationship_type = serializers.ChoiceField(
        choices=PortalUserClientLink.RELATIONSHIP_TYPES,
        default='TITULAR'
    )

    def validate(self, attrs):
        client = self.context['client']
        username = (attrs.get('username') or '').strip()
        email = (attrs.get('email') or client.email or '').strip()

        if client.users.exists():
            raise serializers.ValidationError('Este cliente ya tiene un usuario principal creado.')

        if not email:
            raise serializers.ValidationError({'email': 'Debe indicar un correo para crear el usuario.'})

        if username and PortalUser.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'Ese nombre de usuario ya existe.'})

        if PortalUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'Ese correo ya está registrado por otro usuario.'})

        attrs['username'] = username or generate_username(client.document_number or client.full_name)
        attrs['email'] = email
        attrs['password'] = (attrs.get('password') or '').strip() or generate_temp_password()
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        client = self.context['client']
        user = PortalUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            client=client,
            role='CLIENT',
            is_active=True,
            must_change_password=True,
        )

        PortalUserClientLink.objects.get_or_create(
            user=user,
            document_type=client.document_type,
            document_number=client.document_number,
            defaults={'relationship_type': validated_data['relationship_type']},
        )

        return {
            'user': user,
            'temporary_password': validated_data['password'],
        }


class AdminResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def save(self, **kwargs):
        user = self.context['user']
        password = (self.validated_data.get('password') or '').strip() or generate_temp_password()
        user.set_password(password)
        user.must_change_password = True
        user.save(update_fields=['password', 'must_change_password', 'updated_at'])
        return {
            'user': user,
            'temporary_password': password,
        }


class AdminToggleUserStatusSerializer(serializers.Serializer):
    is_active = serializers.BooleanField(required=False, default=False)

    def save(self, **kwargs):
        user = self.context['user']
        user.is_active = self.validated_data['is_active']
        user.save(update_fields=['is_active', 'updated_at'])
        return user
