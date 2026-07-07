from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import PortalClient, PortalUser, PortalUserClientLink, PortalAccessLog, PortalNotification


@admin.register(PortalClient)
class PortalClientAdmin(admin.ModelAdmin):
    list_display = ['document_type', 'document_number', 'full_name', 'email', 'phone', 'created_at']
    list_filter = ['document_type', 'created_at']
    search_fields = ['document_number', 'full_name', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PortalUser)
class PortalUserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'is_staff', 'must_change_password', 'last_login_at', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'created_at']
    search_fields = ['username', 'email']
    readonly_fields = ['last_login_at', 'created_at', 'updated_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información adicional', {
            'fields': ('client', 'role', 'must_change_password', 'last_login_at'),
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'client', 'role', 'is_active', 'is_staff', 'must_change_password'),
        }),
    )


@admin.register(PortalUserClientLink)
class PortalUserClientLinkAdmin(admin.ModelAdmin):
    list_display = ['user', 'document_type', 'document_number', 'relationship_type', 'created_at']
    list_filter = ['document_type', 'relationship_type', 'created_at']
    search_fields = ['user__username', 'document_number']


@admin.register(PortalAccessLog)
class PortalAccessLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'action', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__username', 'ip_address']
    readonly_fields = ['created_at']


@admin.register(PortalNotification)
class PortalNotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'title']
    readonly_fields = ['created_at']
