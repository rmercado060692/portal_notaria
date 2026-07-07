import logging
import re

import requests
from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from authentication.audit import log_portal_event
from core.services import (
    PortalMirrorService,
    SignoClientLookupService,
    SignoService,
    build_rrpp_groups,
    clean_signo_value,
    pick_primary_contratante,
)
from .serializers import (
    TramiteListSerializer,
    TramiteDetailSerializer,
)

logger = logging.getLogger(__name__)
REMOTE_PDF_TIMEOUT = (5, 60)


def is_signo_live_mode():
    return getattr(settings, 'PORTAL_DATA_SOURCE', 'mirror') == 'signo_live'


def get_user_documents(user):
    if is_signo_live_mode():
        documents = set()
        if user.client and user.client.document_number:
            documents.add(user.client.document_number)
        for link in user.document_links.all():
            if link.document_number:
                documents.add(link.document_number)
        return sorted(documents)

    return PortalMirrorService.get_user_document_numbers(user)


def get_tramites_for_documents(documentos):
    tramites = []
    for document_number in documentos:
        tramites.extend(SignoClientLookupService.get_kardex_list_by_document(document_number))

    unique_tramites = {}
    for tramite in tramites:
        unique_tramites[tramite.get("kardex")] = tramite

    kardexes = [tramite.get("kardex") for tramite in unique_tramites.values() if tramite.get("kardex")]
    estados_by_kardex = SignoService.get_estado_kardex_batch(kardexes)
    movimientos_by_kardex = SignoClientLookupService.get_historial_registral_batch(kardexes)
    contratantes_by_kardex = SignoService.get_contratantes_by_kardex_batch(kardexes)

    enriched_tramites = []
    for tramite in unique_tramites.values():
        kardex = tramite.get("kardex")
        if kardex:
            estado_notarial = estados_by_kardex.get(kardex)
            movimientos_rrpp = movimientos_by_kardex.get(kardex, [])
            contratantes = contratantes_by_kardex.get(kardex, [])
            primary_client = pick_primary_contratante(contratantes, documentos)
            tramite["estado_notarial"] = estado_notarial
            tramite["ultimo_estado_registral"] = (
                build_rrpp_groups(movimientos_rrpp)[0]["estado_actual"]
                if movimientos_rrpp else None
            )
            tramite["cliente_nombre"] = primary_client.get("full_name") if primary_client else None
            tramite["contratantes"] = contratantes
        else:
            tramite["estado_notarial"] = None
            tramite["ultimo_estado_registral"] = None
            tramite["cliente_nombre"] = None
            tramite["contratantes"] = []
        enriched_tramites.append(tramite)

    return enriched_tramites


def normalize_status_label(value):
    return str(value or "").strip().upper()


def is_completed_tramite(tramite):
    latest_status = normalize_status_label(tramite.get("ultimo_estado_registral"))
    return bool(tramite.get("fechaconclusion")) or latest_status == "INSCRITO"


def is_observed_tramite(tramite):
    latest_status = normalize_status_label(tramite.get("ultimo_estado_registral"))
    return latest_status == "OBSERVADO"


def is_in_sunarp_tramite(tramite):
    latest_status = normalize_status_label(tramite.get("ultimo_estado_registral"))
    if latest_status in {"", "OBSERVADO", "INSCRITO"}:
        return False
    return latest_status in {"PRESENTADO", "LIQUIDADO", "REINGRESADO", "REINGRESO", "APELADO", "PRORROGADO", "TACHADO", "SUSPENDIDO"}


def is_in_notary_tramite(tramite):
    return not is_completed_tramite(tramite) and not is_observed_tramite(tramite) and not is_in_sunarp_tramite(tramite)


def get_tramites_summary(tramites):
    return {
        "total": len(tramites),
        "en_proceso": sum(1 for tramite in tramites if is_in_notary_tramite(tramite)),
        "concluidos": sum(1 for tramite in tramites if is_completed_tramite(tramite)),
        "observados": sum(1 for tramite in tramites if is_observed_tramite(tramite)),
        "en_sunarp": sum(1 for tramite in tramites if is_in_sunarp_tramite(tramite)),
        "listos_entrega": sum(1 for tramite in tramites if is_completed_tramite(tramite)),
    }


def user_has_access_to_kardex(user, kardex):
    if is_signo_live_mode():
        user_documents = set(get_user_documents(user))
        return SignoClientLookupService.kardex_belongs_to_any_document(kardex, list(user_documents))

    return bool(PortalMirrorService.get_tramite_detail_for_user(user, kardex))


def build_safe_pdf_filename(kardex, document):
    extension = str(document.get("extension") or "pdf").strip(".").lower() or "pdf"
    status = re.sub(r"[^A-Z0-9]+", "-", normalize_status_label(document.get("status")) or "RRPP").strip("-")
    title = re.sub(r"[^A-Z0-9]+", "-", str(document.get("title") or "DOCUMENTO").upper()).strip("-")
    return f"{kardex}_{status}_{title}.{extension}"


def build_tramite_detail_from_signo(kardex, preferred_documents=None):
    kardex_data = SignoService.get_kardex_by_kardex(kardex)
    if not kardex_data:
        return None

    estado_notarial = SignoService.get_estado_kardex(kardex) or {
        "ingresado": False,
        "calificado": False,
        "calificado_observado": False,
        "calificado_digitacion": False,
        "generado_proyecto": False,
        "confrontado": False,
        "escriturado": False,
        "firmas_proceso": False,
        "firmas_concluidas": False,
        "partes_terminados": False,
        "presentado": False,
        "inscrito": False,
    }

    movimientos_rrpp = SignoService.get_historial_registral(kardex)
    rrpp_agrupados = build_rrpp_groups(movimientos_rrpp)
    contratantes = SignoService.get_contratantes_by_kardex(kardex)
    primary_client = pick_primary_contratante(contratantes, preferred_documents)
    documentos_disponibles = SignoService.get_pdf_documents_by_kardex(kardex)

    firmas_status = SignoService.get_firmas_status(kardex) or {"faltantes": 0, "total": 0}

    kardex_data["estado"] = clean_signo_value(kardex_data.get("estado"))
    kardex_data["responsable"] = clean_signo_value(kardex_data.get("responsable"))
    kardex_data["gestor"] = clean_signo_value(kardex_data.get("gestor"))
    kardex_data["estado_notarial"] = estado_notarial
    kardex_data["movimientos_rrpp"] = rrpp_agrupados
    kardex_data["firmas_status"] = firmas_status
    kardex_data["cliente_nombre"] = primary_client.get("full_name") if primary_client else None
    kardex_data["contratantes"] = contratantes
    kardex_data["documentos_disponibles"] = documentos_disponibles
    return kardex_data


class TramiteListView(APIView):
    """
    Obtiene la lista de todos los trámites de un cliente autenticado.
    Utiliza el DNI registrado en el perfil del usuario.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            documentos = get_user_documents(user)
            logger.info(
                f"Usuario autenticado: {user.username} | Documentos: {documentos} | "
                f"modo={'signo_live' if is_signo_live_mode() else 'mirror'}"
            )

            if is_signo_live_mode():
                tramites = get_tramites_for_documents(documentos)
                logger.info(f"Trámites encontrados en SIGNO: {len(tramites)}")
            else:
                tramites = PortalMirrorService.get_tramites_for_documents(documentos)
                logger.info(f"Trámites encontrados en base espejo: {len(tramites)}")

            serializer = TramiteListSerializer(tramites, many=True)

            response = {
                "success": True,
                "data": {
                    "resumen": get_tramites_summary(tramites),
                    "tramites": serializer.data,
                },
            }
            log_portal_event(request, 'tramites_list_view', user=user, details=f'total={len(tramites)} modo={"signo_live" if is_signo_live_mode() else "mirror"}')
            return Response(response)

        except Exception as e:
            logger.error(f"Error en TramiteListView: {str(e)}")
            return Response(
                {"success": False, "error": "Error al cargar los trámites"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TramiteDetailView(APIView):
    """
    Obtiene el detalle completo de un trámite específico por su número de kardex.
    Incluye estado notarial y movimientos registrales.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, kardex):
        try:
            user_documents = set(get_user_documents(request.user))
            if not user_documents:
                log_portal_event(request, 'tramite_forbidden', user=request.user, details=f'kardex={kardex} motivo=sin_documentos')
                return Response(
                    {"success": False, "error": "No tienes permiso para ver este trámite"},
                    status=status.HTTP_403_FORBIDDEN
                )

            if is_signo_live_mode():
                if not user_has_access_to_kardex(request.user, kardex):
                    log_portal_event(request, 'tramite_forbidden', user=request.user, details=f'kardex={kardex}')
                    return Response(
                        {"success": False, "error": "No tienes permiso para ver este trámite"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                kardex_data = build_tramite_detail_from_signo(kardex, list(user_documents))
            else:
                kardex_data = PortalMirrorService.get_tramite_detail_for_user(request.user, kardex)
                if not kardex_data:
                    log_portal_event(request, 'tramite_forbidden', user=request.user, details=f'kardex={kardex}')
                    return Response(
                        {"success": False, "error": "No tienes permiso para ver este trámite"},
                        status=status.HTTP_403_FORBIDDEN
                    )

            if not kardex_data:
                return Response(
                    {"success": False, "error": "Trámite no encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = TramiteDetailSerializer(
                kardex_data,
                context={"estado_kardex": kardex_data.get("estado_notarial")}
            )

            response = {
                "success": True,
                "data": serializer.data,
            }
            log_portal_event(request, 'tramite_detail_view', user=request.user, details=f'kardex={kardex}')
            return Response(response)

        except Exception as e:
            logger.error(f"Error en TramiteDetailView: {str(e)}", exc_info=True)
            return Response(
                {"success": False, "error": "Error al cargar el detalle del trámite"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TramiteDocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, kardex, document_id):
        try:
            user_documents = set(get_user_documents(request.user))
            if not user_documents:
                log_portal_event(request, 'tramite_forbidden', user=request.user, details=f'kardex={kardex} documento={document_id} motivo=sin_documentos')
                return Response(
                    {"success": False, "error": "No tienes permiso para descargar este documento"},
                    status=status.HTTP_403_FORBIDDEN
                )

            if not user_has_access_to_kardex(request.user, kardex):
                log_portal_event(request, 'tramite_forbidden', user=request.user, details=f'kardex={kardex} documento={document_id}')
                return Response(
                    {"success": False, "error": "No tienes permiso para descargar este documento"},
                    status=status.HTTP_403_FORBIDDEN
                )

            if not is_signo_live_mode():
                return Response(
                    {"success": False, "error": "La descarga de PDF solo está disponible en modo SIGNO en vivo"},
                    status=status.HTTP_404_NOT_FOUND
                )

            document = SignoService.get_pdf_document_by_id(kardex, document_id)
            if not document:
                return Response(
                    {"success": False, "error": "Documento PDF no encontrado para este trámite"},
                    status=status.HTTP_404_NOT_FOUND
                )

            remote_url = SignoService.build_rrpp_pdf_url(settings.SIGNO_WEB_BASE_URL, document_id)
            remote_response = requests.get(remote_url, stream=True, timeout=REMOTE_PDF_TIMEOUT)
            remote_response.raise_for_status()

            content_type = (remote_response.headers.get("Content-Type") or "").lower()
            if "application/pdf" not in content_type:
                remote_response.close()
                logger.warning("Respuesta no PDF desde SIGNO | kardex=%s document_id=%s content_type=%s", kardex, document_id, content_type)
                return Response(
                    {"success": False, "error": "La fuente remota no devolvió un PDF válido"},
                    status=status.HTTP_502_BAD_GATEWAY
                )

            response = StreamingHttpResponse(
                streaming_content=remote_response.iter_content(chunk_size=8192),
                content_type="application/pdf",
            )
            response["Content-Disposition"] = f'inline; filename="{build_safe_pdf_filename(kardex, document)}"'
            response["Cache-Control"] = "private, no-store, max-age=0"
            response["X-Content-Type-Options"] = "nosniff"
            response["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'self'; sandbox"
            content_length = remote_response.headers.get("Content-Length")
            if content_length:
                response["Content-Length"] = content_length
            log_portal_event(request, 'tramite_document_download', user=request.user, details=f'kardex={kardex} documento={document_id}')
            return response
        except requests.RequestException as exc:
            logger.error("Error descargando PDF RRPP desde SIGNO | kardex=%s document_id=%s error=%s", kardex, document_id, exc)
            return Response(
                {"success": False, "error": "No se pudo obtener el PDF desde SIGNO"},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except Exception as exc:
            logger.error("Error en TramiteDocumentDownloadView: %s", exc, exc_info=True)
            return Response(
                {"success": False, "error": "Error al descargar el PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
