import logging
import re
from collections import defaultdict
from datetime import datetime
from django.db import connections
from typing import List, Dict, Optional
from urllib.parse import urlencode

from authentication.models import PortalClient, PortalUserClientLink
from tramites.models import (
    MirrorClient,
    MirrorKardex,
    MirrorKardexClient,
    MirrorKardexStatus,
    MirrorRRPPMovement,
)

logger = logging.getLogger(__name__)


def parse_signo_datetime(value: Optional[str]) -> datetime:
    if not value:
        return datetime.min

    normalized = str(value).strip()
    for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(normalized, fmt)
        except ValueError:
            continue
    return datetime.min


def clean_signo_value(value):
    if value in (None, "", 0, "0"):
        return None
    return value


def normalize_rrpp_group_key(value: Optional[str]) -> Optional[str]:
    cleaned = clean_signo_value(value)
    if cleaned is None:
        return None
    return " ".join(str(cleaned).strip().upper().split())


def normalize_contratante_condition(value: Optional[str]) -> Optional[str]:
    cleaned = clean_signo_value(value)
    if cleaned is None:
        return None

    normalized = " ".join(str(cleaned).strip().split())
    if not normalized:
        return None

    # Si viene un código interno o una referencia técnica de SIGNO, no es útil para el cliente.
    if re.search(r"\d", normalized) or "/" in normalized or "." in normalized:
        return None

    if len(re.findall(r"[A-Za-zÁÉÍÓÚÑáéíóúñ]+", normalized)) == 0:
        return None

    return normalized


def build_signo_client_name(row: Dict) -> Optional[str]:
    corporate_name = clean_signo_value(row.get("razonsocial"))
    if corporate_name:
        return str(corporate_name).strip()

    direct_name = clean_signo_value(row.get("nombre"))
    if direct_name:
        return str(direct_name).strip()

    parts = [
        clean_signo_value(row.get("prinom")),
        clean_signo_value(row.get("segnom")),
        clean_signo_value(row.get("apepat")),
        clean_signo_value(row.get("apemat")),
    ]
    full_name = " ".join(str(part).strip() for part in parts if part)
    return full_name or None


def serialize_signo_contratante(row: Dict) -> Dict:
    return {
        "idcontratante": clean_signo_value(row.get("idcontratante")),
        "full_name": build_signo_client_name(row) or "No informado en SIGNO",
        "document_number": clean_signo_value(row.get("document_number") or row.get("numdoc")),
        "condition": normalize_contratante_condition(row.get("condition") or row.get("condicion")),
    }


def pick_primary_contratante(contratantes: List[Dict], preferred_documents: Optional[List[str]] = None) -> Optional[Dict]:
    if not contratantes:
        return None

    preferred_set = {str(value).strip() for value in (preferred_documents or []) if str(value).strip()}
    if preferred_set:
        for contratante in contratantes:
            if str(contratante.get("document_number") or "").strip() in preferred_set:
                return contratante

    for contratante in contratantes:
        if clean_signo_value(contratante.get("full_name")):
            return contratante

    return contratantes[0]


def build_rrpp_groups(rows: List[Dict]) -> List[Dict]:
    grouped = defaultdict(list)

    for row in rows:
        numeropartida = clean_signo_value(row.get("numeroPartida"))
        titulorp = clean_signo_value(row.get("titulorp"))
        title_key = (
            normalize_rrpp_group_key(numeropartida)
            or normalize_rrpp_group_key(titulorp)
            or f"idmovreg-{row.get('idmovreg')}"
        )
        display_title = numeropartida or titulorp or f"Título {row.get('idmovreg')}" or "Sin título"
        grouped[title_key].append({
            "titulo_display": display_title,
            "fecha": row.get("fechamov"),
            "estado": row.get("estado") or "Pendiente",
            "idmovreg": row.get("idmovreg"),
            "itemmov": row.get("itemmov"),
            "tramite": clean_signo_value(row.get("tramite")),
            "sede": clean_signo_value(row.get("sede")),
            "seccion": clean_signo_value(row.get("seccion")),
            "importe": None if row.get("importee") in (None, "") else str(row.get("importee")),
            "numeropartida": clean_signo_value(row.get("numeroPartida")),
            "registrador": clean_signo_value(row.get("encargado")),
            "asiento": clean_signo_value(row.get("asiento")),
            "fechainscripcion": clean_signo_value(row.get("fechaInscripcion")),
            "observaciones": clean_signo_value(row.get("observa")),
            "_sort_date": parse_signo_datetime(row.get("fechamov")),
        })

    grouped_items = []

    for title_key, history in grouped.items():
        history_sorted = sorted(
            history,
            key=lambda item: (item["_sort_date"], item.get("itemmov") or 0),
            reverse=True,
        )
        latest = history_sorted[0]

        grouped_items.append({
            "titulo": latest.get("titulo_display") or title_key,
            "tramite": latest.get("tramite"),
            "estado_actual": latest.get("estado") or "Pendiente",
            "sede": latest.get("sede"),
            "seccion": latest.get("seccion"),
            "fecha": latest.get("fecha"),
            "importe": latest.get("importe"),
            "numeropartida": latest.get("numeropartida"),
            "registrador": latest.get("registrador"),
            "asiento": latest.get("asiento"),
            "fechainscripcion": latest.get("fechainscripcion"),
            "observaciones": latest.get("observaciones"),
            "historial": [
                {
                    "fecha": item["fecha"],
                    "estado": item["estado"],
                    "idmovreg": item["idmovreg"],
                    "itemmov": item["itemmov"],
                }
                for item in history_sorted
            ],
            "_sort_date": latest["_sort_date"],
        })

    grouped_items.sort(key=lambda item: item["_sort_date"], reverse=True)

    for item in grouped_items:
        item.pop("_sort_date", None)

    return grouped_items


class SignoService:
    """Servicio para interactuar con la base de datos de SIGNO en modo solo lectura."""
    
    @staticmethod
    def _execute_query(query: str, params: tuple = None) -> List[Dict]:
        """Ejecuta una consulta SQL en la base de datos de SIGNO."""
        try:
            with connections['signo'].cursor() as cursor:
                cursor.execute(query, params or ())
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error executing query in SIGNO: {str(e)}")
            raise

    @staticmethod
    def _build_in_clause(values: List[str]) -> tuple[str, tuple]:
        cleaned_values = [str(value).strip() for value in values if str(value).strip()]
        if not cleaned_values:
            return '', tuple()
        placeholders = ', '.join(['%s'] * len(cleaned_values))
        return placeholders, tuple(cleaned_values)
    
    @classmethod
    def get_tramites_by_documento(cls, numdoc: str) -> List[Dict]:
        """
        Obtiene todos los trámites de un cliente por su número de documento.
        """
        query = """
            SELECT DISTINCT
                k.idkardex,
                k.kardex,
                k.idtipkar,
                k.fechaingreso,
                k.referencia,
                k.contrato,
                k.contacto,
                k.telecontacto,
                k.mailcontacto,
                k.fechacalificado,
                k.fechainstrumento,
                k.fechaconclusion,
                k.numescritura,
                k.fechaescritura,
                k.numminuta,
                k.estado,
                k.responsable,
                k.gestor
            FROM kardex k
            INNER JOIN contratantes c ON c.kardex = k.kardex
            INNER JOIN cliente2 cl ON cl.idcontratante = c.idcontratante
            WHERE cl.numdoc = %s
            ORDER BY STR_TO_DATE(k.fechaingreso, '%%d/%%m/%%Y') DESC
        """
        return cls._execute_query(query, (numdoc,))
    
    @classmethod
    def get_kardex_by_kardex(cls, kardex: str) -> Optional[Dict]:
        """
        Obtiene un trámite específico por su número de kardex.
        """
        query = """
            SELECT 
                k.idkardex,
                k.kardex,
                k.idtipkar,
                k.fechaingreso,
                k.referencia,
                k.contrato,
                k.contacto,
                k.telecontacto,
                k.mailcontacto,
                k.fechacalificado,
                k.fechainstrumento,
                k.fechaconclusion,
                k.numescritura,
                k.fechaescritura,
                k.numminuta,
                k.estado,
                k.responsable,
                k.gestor
            FROM kardex k
            WHERE k.kardex = %s
            LIMIT 1
        """
        results = cls._execute_query(query, (kardex,))
        return results[0] if results else None
    
    @classmethod
    def get_historial_registral(cls, kardex: str) -> List[Dict]:
        """
        Obtiene el historial registral completo de un kardex.
        """
        query = """
            SELECT 
                m.kardex,
                d.idmovreg,
                d.itemmov,
                d.fechamov,
                d.vencimiento,
                d.titulorp,
                tr.desctiptraoges AS tramite,
                er.desestreg AS estado,
                er.abrev AS estado_abrev,
                s.dessede AS sede,
                sec.dessecc AS seccion,
                d.encargado,
                d.importee,
                d.numeroPartida,
                d.asiento,
                d.fechaInscripcion,
                d.observa
            FROM movirrpp m 
            INNER JOIN detallemovimiento d ON m.idmovreg = d.idmovreg 
            LEFT JOIN estadoregistral er ON er.idestreg = d.idestreg 
            LEFT JOIN tipotramogestion tr ON tr.idtiptraoges = d.idtiptraoges 
            LEFT JOIN sedesregistrales s ON s.idsedereg = d.idsedereg 
            LEFT JOIN seccionesregistrales sec ON sec.idsecreg = d.idsecreg 
            WHERE m.kardex = %s 
            ORDER BY d.idmovreg, d.itemmov
        """
        return cls._execute_query(query, (kardex,))
    
    @classmethod
    def get_ultimo_estado_registral(cls, idmovreg: int) -> Optional[Dict]:
        """
        Obtiene el último estado registral de un movimiento registral.
        """
        query = """
            SELECT 
                tr.desctiptraoges,
                d.titulorp,
                d.fechamov,
                er.abrev,
                d.itemmov
            FROM detallemovimiento d 
            LEFT JOIN tipotramogestion tr ON tr.idtiptraoges = d.idtiptraoges 
            LEFT JOIN estadoregistral er ON er.idestreg = d.idestreg 
            WHERE d.idmovreg = %s 
            ORDER BY STR_TO_DATE(d.fechamov, '%%d/%%m/%%Y') DESC, d.itemmov DESC 
            LIMIT 1
        """
        results = cls._execute_query(query, (idmovreg,))
        return results[0] if results else None
    
    @classmethod
    def get_estado_kardex(cls, kardex: str) -> Optional[Dict]:
        """
        Obtiene el resumen del estado notarial desde la tabla estadokardex.
        """
        query = """
            SELECT *
            FROM estadokardex
            WHERE kardex = %s
            LIMIT 1
        """
        results = cls._execute_query(query, (kardex,))
        return results[0] if results else None

    @classmethod
    def get_estado_kardex_batch(cls, kardexes: List[str]) -> Dict[str, Dict]:
        placeholders, params = cls._build_in_clause(kardexes)
        if not placeholders:
            return {}

        query = f"""
            SELECT *
            FROM estadokardex
            WHERE kardex IN ({placeholders})
        """
        return {
            row['kardex']: row
            for row in cls._execute_query(query, params)
            if row.get('kardex')
        }
    
    @classmethod
    def get_firmas_status(cls, kardex: str) -> Dict:
        """
        Obtiene el estado de las firmas de un kardex.
        """
        query = """
            SELECT 
                (
                    SELECT COUNT(idcontratante)
                    FROM contratantes
                    WHERE kardex = %s
                    AND FIRMA = 1
                    AND (FECHAFIRMA = '' OR FECHAFIRMA IS NULL)
                ) AS faltantes,
                (
                    SELECT COUNT(idcontratante)
                    FROM contratantes
                    WHERE kardex = %s
                    AND FIRMA = 1
                ) AS total
        """
        results = cls._execute_query(query, (kardex, kardex))
        return results[0] if results else {'faltantes': 0, 'total': 0}
    
    @classmethod
    def get_calificacion(cls, kardex: str) -> List[Dict]:
        """
        Obtiene la calificación de un kardex.
        """
        query = """
            SELECT *
            FROM calificacion
            WHERE kardex = %s
        """
        return cls._execute_query(query, (kardex,))
    
    @classmethod
    def get_documentos_generados(cls, kardex: str) -> List[Dict]:
        """
        Obtiene los documentos generados para un kardex.
        """
        query = """
            SELECT *
            FROM documentogenerados
            WHERE kardex = %s
            ORDER BY id DESC
        """
        return cls._execute_query(query, (kardex,))
    
    @classmethod
    def get_cliente_by_documento(cls, numdoc: str) -> Optional[Dict]:
        """
        Obtiene los datos de un cliente por su número de documento.
        """
        query = """
            SELECT *
            FROM cliente2
            WHERE numdoc = %s
            LIMIT 1
        """
        results = cls._execute_query(query, (numdoc,))
        if results:
            return results[0]

        legacy_query = """
            SELECT *
            FROM cliente
            WHERE numdoc = %s
            LIMIT 1
        """
        legacy_results = cls._execute_query(legacy_query, (numdoc,))
        return legacy_results[0] if legacy_results else None

    @classmethod
    def get_documentos_by_kardex(cls, kardex: str) -> List[str]:
        """
        Obtiene los números de documento vinculados a un kardex.
        """
        query = """
            SELECT DISTINCT cl.numdoc
            FROM contratantes c
            INNER JOIN cliente2 cl ON cl.idcontratante = c.idcontratante
            WHERE c.kardex = %s
              AND cl.numdoc IS NOT NULL
              AND cl.numdoc <> ''
        """
        results = cls._execute_query(query, (kardex,))
        return [row["numdoc"] for row in results if row.get("numdoc")]

    @classmethod
    def get_contratantes_by_kardex(cls, kardex: str) -> List[Dict]:
        """
        Obtiene los contratantes reales asociados a un kardex.
        """
        query = """
            SELECT
                c.idcontratante,
                c.condicion,
                cl.numdoc AS document_number,
                cl.nombre,
                cl.razonsocial,
                cl.prinom,
                cl.segnom,
                cl.apepat,
                cl.apemat
            FROM contratantes c
            INNER JOIN cliente2 cl ON cl.idcontratante = c.idcontratante
            WHERE c.kardex = %s
            ORDER BY c.idcontratante
        """
        rows = cls._execute_query(query, (kardex,))
        return [serialize_signo_contratante(row) for row in rows]

    @classmethod
    def get_contratantes_by_kardex_batch(cls, kardexes: List[str]) -> Dict[str, List[Dict]]:
        placeholders, params = cls._build_in_clause(kardexes)
        if not placeholders:
            return {}

        query = f"""
            SELECT
                c.kardex,
                c.idcontratante,
                c.condicion,
                cl.numdoc AS document_number,
                cl.nombre,
                cl.razonsocial,
                cl.prinom,
                cl.segnom,
                cl.apepat,
                cl.apemat
            FROM contratantes c
            INNER JOIN cliente2 cl ON cl.idcontratante = c.idcontratante
            WHERE c.kardex IN ({placeholders})
            ORDER BY c.kardex, c.idcontratante
        """
        grouped = defaultdict(list)
        for row in cls._execute_query(query, params):
            grouped[row.get('kardex')].append(serialize_signo_contratante(row))
        return grouped

    @classmethod
    def get_pdf_documents_by_kardex(cls, kardex: str) -> List[Dict]:
        """
        Obtiene los PDF RR.PP. registrados para un kardex.
        """
        query = """
            SELECT
                p.id,
                p.descripcion,
                p.extension,
                p.fecha,
                p.tipo,
                d.idmovreg,
                d.itemmov,
                d.titulorp,
                d.fechamov,
                COALESCE(er.desestreg, er.abrev) AS estado
            FROM pdfdocs p
            LEFT JOIN detallemovimiento d
                ON d.itemmov = CAST(p.tipo AS UNSIGNED)
            LEFT JOIN estadoregistral er
                ON er.idestreg = d.idestreg
            WHERE p.kardex = %s
            ORDER BY p.fecha DESC, p.id DESC
        """
        rows = cls._execute_query(query, (kardex,))
        documents = []
        for row in rows:
            documents.append({
                "id": row.get("id"),
                "description": clean_signo_value(row.get("descripcion")) or "PDF RR.PP.",
                "extension": clean_signo_value(row.get("extension")) or "pdf",
                "created_at": clean_signo_value(row.get("fecha")),
                "movement_item": row.get("itemmov"),
                "title": clean_signo_value(row.get("titulorp")),
                "status": clean_signo_value(row.get("estado")),
                "movement_date": clean_signo_value(row.get("fechamov")),
            })
        return documents

    @classmethod
    def get_pdf_document_by_id(cls, kardex: str, document_id: int) -> Optional[Dict]:
        query = """
            SELECT
                p.id,
                p.descripcion,
                p.extension,
                p.fecha,
                p.tipo,
                d.idmovreg,
                d.itemmov,
                d.titulorp,
                d.fechamov,
                COALESCE(er.desestreg, er.abrev) AS estado
            FROM pdfdocs p
            LEFT JOIN detallemovimiento d
                ON d.itemmov = CAST(p.tipo AS UNSIGNED)
            LEFT JOIN estadoregistral er
                ON er.idestreg = d.idestreg
            WHERE p.kardex = %s
              AND p.id = %s
            LIMIT 1
        """
        rows = cls._execute_query(query, (kardex, document_id))
        if not rows:
            return None
        row = rows[0]
        return {
            "id": row.get("id"),
            "description": clean_signo_value(row.get("descripcion")) or "PDF RR.PP.",
            "extension": clean_signo_value(row.get("extension")) or "pdf",
            "created_at": clean_signo_value(row.get("fecha")),
            "movement_item": row.get("itemmov"),
            "title": clean_signo_value(row.get("titulorp")),
            "status": clean_signo_value(row.get("estado")),
            "movement_date": clean_signo_value(row.get("fechamov")),
        }

    @staticmethod
    def build_rrpp_pdf_url(base_url: str, document_id: int) -> str:
        return f"{base_url.rstrip('/')}/verpdfrrpp.php?{urlencode({'var': f'{int(document_id)}.pdf'})}"


class SignoClientLookupService:
    """Lookup de clientes/trámites en SIGNO a partir de DNI/RUC en modo solo lectura."""

    @staticmethod
    def get_client_by_document(document_number: str) -> Optional[Dict]:
        return SignoService.get_cliente_by_documento(document_number)

    @staticmethod
    def get_kardex_list_by_document(document_number: str) -> List[Dict]:
        query = """
            SELECT DISTINCT
                k.idkardex,
                k.kardex,
                k.idtipkar,
                k.fechaingreso,
                k.referencia,
                k.contrato,
                k.contacto,
                k.telecontacto,
                k.mailcontacto,
                k.fechacalificado,
                k.fechainstrumento,
                k.fechaconclusion,
                k.numescritura,
                k.fechaescritura,
                k.numminuta,
                k.estado,
                k.responsable,
                k.gestor
            FROM kardex k
            INNER JOIN contratantes c ON c.kardex = k.kardex
            INNER JOIN cliente2 cl ON cl.idcontratante = c.idcontratante
            WHERE cl.numdoc = %s
            ORDER BY
                STR_TO_DATE(k.fechaingreso, '%%d/%%m/%%Y') DESC,
                k.idkardex DESC
        """
        return SignoService._execute_query(query, (document_number,))

    @classmethod
    def get_kardex_identifiers_by_document(cls, document_number: str) -> List[str]:
        return [item["kardex"] for item in cls.get_kardex_list_by_document(document_number) if item.get("kardex")]

    @classmethod
    def kardex_belongs_to_document(cls, kardex: str, document_number: str) -> bool:
        query = """
            SELECT 1
            FROM contratantes c
            INNER JOIN cliente2 cl ON cl.idcontratante = c.idcontratante
            WHERE c.kardex = %s
              AND cl.numdoc = %s
            LIMIT 1
        """
        return bool(SignoService._execute_query(query, (kardex, document_number)))

    @classmethod
    def kardex_belongs_to_any_document(cls, kardex: str, document_numbers: List[str]) -> bool:
        placeholders, params = SignoService._build_in_clause(document_numbers)
        if not placeholders:
            return False

        query = f"""
            SELECT 1
            FROM contratantes c
            INNER JOIN cliente2 cl ON cl.idcontratante = c.idcontratante
            WHERE c.kardex = %s
              AND cl.numdoc IN ({placeholders})
            LIMIT 1
        """
        return bool(SignoService._execute_query(query, (kardex, *params)))

    @classmethod
    def get_historial_registral_batch(cls, kardexes: List[str]) -> Dict[str, List[Dict]]:
        placeholders, params = SignoService._build_in_clause(kardexes)
        if not placeholders:
            return {}

        query = f"""
            SELECT 
                m.kardex,
                d.idmovreg,
                d.itemmov,
                d.fechamov,
                d.vencimiento,
                d.titulorp,
                tr.desctiptraoges AS tramite,
                er.desestreg AS estado,
                er.abrev AS estado_abrev,
                s.dessede AS sede,
                sec.dessecc AS seccion,
                d.encargado,
                d.importee,
                d.numeroPartida,
                d.asiento,
                d.fechaInscripcion,
                d.observa
            FROM movirrpp m
            INNER JOIN detallemovimiento d ON m.idmovreg = d.idmovreg
            LEFT JOIN estadoregistral er ON er.idestreg = d.idestreg
            LEFT JOIN tipotramogestion tr ON tr.idtiptraoges = d.idtiptraoges
            LEFT JOIN sedesregistrales s ON s.idsedereg = d.idsedereg
            LEFT JOIN seccionesregistrales sec ON sec.idsecreg = d.idsecreg
            WHERE m.kardex IN ({placeholders})
            ORDER BY m.kardex, d.idmovreg, d.itemmov
        """
        grouped = defaultdict(list)
        for row in SignoService._execute_query(query, params):
            grouped[row.get('kardex')].append(row)
        return grouped


class PortalMirrorService:
    """Servicio de lectura para el portal público usando solo la base del portal."""

    @staticmethod
    def get_user_document_numbers(user) -> List[str]:
        documents = set()

        if user.client and user.client.document_number:
            documents.add(user.client.document_number)

        documents.update(
            user.document_links.exclude(document_number__isnull=True)
            .exclude(document_number="")
            .values_list("document_number", flat=True)
        )

        return sorted(documents)

    @staticmethod
    def get_all_sync_documents() -> List[str]:
        documents = set(
            PortalClient.objects.exclude(document_number__isnull=True)
            .exclude(document_number="")
            .values_list("document_number", flat=True)
        )
        documents.update(
            PortalUserClientLink.objects.exclude(document_number__isnull=True)
            .exclude(document_number="")
            .values_list("document_number", flat=True)
        )
        return sorted(documents)

    @staticmethod
    def serialize_kardex_base(kardex_obj: MirrorKardex) -> Dict:
        mirror_clients = list(kardex_obj.clients.all()) if hasattr(kardex_obj, "clients") else []
        contratantes = [
            {
                "idcontratante": None,
                "full_name": client.full_name or "No informado en SIGNO",
                "document_number": client.document_number,
                "condition": None,
            }
            for client in mirror_clients
        ]
        primary_client = pick_primary_contratante(contratantes)
        latest_rrpp = (
            kardex_obj.rrpp_movements.order_by("-idmovreg", "-itemmov").first()
            if hasattr(kardex_obj, "rrpp_movements")
            else None
        )
        return {
            "idkardex": kardex_obj.source_idkardex,
            "kardex": kardex_obj.kardex,
            "fechaingreso": kardex_obj.fechaingreso,
            "referencia": kardex_obj.referencia,
            "contrato": kardex_obj.contrato,
            "contacto": kardex_obj.contacto,
            "telecontacto": kardex_obj.telecontacto,
            "mailcontacto": kardex_obj.mailcontacto,
            "fechacalificado": kardex_obj.fechacalificado,
            "fechainstrumento": kardex_obj.fechainstrumento,
            "fechaconclusion": kardex_obj.fechaconclusion,
            "numescritura": kardex_obj.numescritura,
            "fechaescritura": kardex_obj.fechaescritura,
            "numminuta": kardex_obj.numminuta,
            "estado": clean_signo_value(kardex_obj.estado),
            "responsable": clean_signo_value(kardex_obj.responsable),
            "gestor": clean_signo_value(kardex_obj.gestor),
            "cliente_nombre": primary_client.get("full_name") if primary_client else None,
            "contratantes": contratantes,
            "documentos_disponibles": [],
            "estado_notarial": PortalMirrorService.serialize_estado_notarial(
                getattr(kardex_obj, "notarial_status", None)
            ),
            "ultimo_estado_registral": clean_signo_value(getattr(latest_rrpp, "estado", None)),
        }

    @staticmethod
    def serialize_estado_notarial(status_obj: Optional[MirrorKardexStatus]) -> Dict:
        if not status_obj:
            return {
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

        return {
            "ingresado": status_obj.ingresado,
            "calificado": status_obj.calificado,
            "calificado_observado": status_obj.calificado_observado,
            "calificado_digitacion": status_obj.calificado_digitacion,
            "generado_proyecto": status_obj.generado_proyecto,
            "confrontado": status_obj.confrontado,
            "escriturado": status_obj.escriturado,
            "firmas_proceso": status_obj.firmas_proceso,
            "firmas_concluidas": status_obj.firmas_concluidas,
            "partes_terminados": status_obj.partes_terminados,
            "presentado": status_obj.presentado,
            "inscrito": status_obj.inscrito,
        }

    @staticmethod
    def serialize_rrpp_grouped(kardex_obj: MirrorKardex) -> List[Dict]:
        rows = []
        for mov in kardex_obj.rrpp_movements.all():
            rows.append({
                "idmovreg": mov.idmovreg,
                "itemmov": mov.itemmov,
                "fechamov": mov.fechamov,
                "titulorp": mov.titulorp,
                "tramite": mov.tramite,
                "estado": mov.estado,
                "sede": mov.sede,
                "seccion": mov.seccion,
                "importee": mov.importee,
                "numeroPartida": mov.numero_partida,
                "encargado": mov.encargado,
                "asiento": mov.asiento,
                "fechaInscripcion": mov.fecha_inscripcion,
                "observa": mov.observa,
            })
        return build_rrpp_groups(rows)

    @classmethod
    def get_tramites_for_documents(cls, document_numbers: List[str]) -> List[Dict]:
        if not document_numbers:
            return []

        queryset = (
            MirrorKardex.objects.filter(clients__document_number__in=document_numbers)
            .distinct()
            .prefetch_related("rrpp_movements", "clients")
            .select_related("notarial_status")
            .order_by("-source_idkardex")
        )
        return [cls.serialize_kardex_base(item) for item in queryset]

    @classmethod
    def get_tramite_detail_for_user(cls, user, kardex: str) -> Optional[Dict]:
        document_numbers = cls.get_user_document_numbers(user)
        if not document_numbers:
            return None

        kardex_obj = (
            MirrorKardex.objects.filter(
                kardex=kardex,
                clients__document_number__in=document_numbers,
            )
            .prefetch_related("rrpp_movements", "clients")
            .select_related("notarial_status")
            .distinct()
            .first()
        )
        if not kardex_obj:
            return None

        data = cls.serialize_kardex_base(kardex_obj)
        data["estado_notarial"] = cls.serialize_estado_notarial(
            getattr(kardex_obj, "notarial_status", None)
        )
        data["movimientos_rrpp"] = cls.serialize_rrpp_grouped(kardex_obj)
        data["firmas_status"] = {"faltantes": 0, "total": 0}
        return data

    @classmethod
    def get_public_tramite_detail(cls, kardex: str) -> Optional[Dict]:
        kardex_obj = (
            MirrorKardex.objects.filter(kardex=kardex)
            .prefetch_related("rrpp_movements", "clients")
            .select_related("notarial_status")
            .first()
        )
        if not kardex_obj:
            return None

        data = cls.serialize_kardex_base(kardex_obj)
        data["estado_notarial"] = cls.serialize_estado_notarial(
            getattr(kardex_obj, "notarial_status", None)
        )
        data["movimientos_rrpp"] = cls.serialize_rrpp_grouped(kardex_obj)
        data["firmas_status"] = {"faltantes": 0, "total": 0}
        return data
