import logging
from typing import Optional

from .models import PortalAccessLog, PortalUser

logger = logging.getLogger(__name__)


def get_client_ip(request) -> str:
    forwarded_for = (request.META.get('HTTP_X_FORWARDED_FOR') or '').split(',')[0].strip()
    if forwarded_for:
        return forwarded_for
    return request.META.get('REMOTE_ADDR', '') or '0.0.0.0'


def log_portal_event(request, action: str, *, user: Optional[PortalUser] = None, details: str = '') -> None:
    try:
        PortalAccessLog.objects.create(
            user=user,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:1000],
            action=action[:50],
            details=details[:5000],
        )
    except Exception as exc:
        logger.warning('No se pudo registrar PortalAccessLog | action=%s error=%s', action, exc)

    logger.info('portal_audit action=%s user=%s details=%s', action, getattr(user, 'username', 'anonymous'), details)
