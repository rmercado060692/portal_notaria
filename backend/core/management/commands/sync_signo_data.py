from django.core.management.base import BaseCommand, CommandError

from authentication.models import PortalClient
from core.services import PortalMirrorService, SignoService
from tramites.models import (
    MirrorClient,
    MirrorKardex,
    MirrorKardexClient,
    MirrorKardexStatus,
    MirrorRRPPMovement,
)


class Command(BaseCommand):
    help = (
        'Sincroniza datos permitidos desde SIGNO hacia la base espejo del portal: '
        'clientes, kardex, estados notariales y movimientos RRPP.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--document',
            dest='documents',
            action='append',
            help='Número de documento específico a sincronizar. Se puede repetir.',
        )
        parser.add_argument(
            '--kardex',
            dest='kardexes',
            action='append',
            help='Número de kardex específico a sincronizar. Se puede repetir.',
        )

    def handle(self, *args, **options):
        documents = set(options.get('documents') or [])
        kardexes = set(options.get('kardexes') or [])

        if not documents:
            documents.update(PortalMirrorService.get_all_sync_documents())

        if not documents and not kardexes:
            raise CommandError(
                'No hay documentos ni kardex para sincronizar. '
                'Crea clientes/vínculos en el portal o usa --document / --kardex.'
            )

        self.stdout.write(self.style.SUCCESS('=== Iniciando sincronización espejo desde SIGNO ==='))
        self.stdout.write(f'Documentos a sincronizar: {len(documents)}')
        self.stdout.write(f'Kardex explícitos a sincronizar: {len(kardexes)}')

        synced_kardexes = set()
        synced_clients = set()
        rrpp_rows = 0

        for document_number in sorted(documents):
            self.stdout.write(f'\n[DOC] Sincronizando documento {document_number}')
            client = self.sync_client(document_number)
            if client:
                synced_clients.add(client.document_number)

            for tramite in SignoService.get_tramites_by_documento(document_number):
                kardex_obj, kardex_rrpp_count, linked_documents = self.sync_kardex(
                    tramite['kardex'],
                    kardex_payload=tramite,
                    seed_documents={document_number},
                )
                if kardex_obj:
                    synced_kardexes.add(kardex_obj.kardex)
                    rrpp_rows += kardex_rrpp_count
                    synced_clients.update(linked_documents)

        for kardex in sorted(kardexes):
            self.stdout.write(f'\n[KARDEX] Sincronizando kardex {kardex}')
            kardex_obj, kardex_rrpp_count, linked_documents = self.sync_kardex(kardex)
            if kardex_obj:
                synced_kardexes.add(kardex_obj.kardex)
                rrpp_rows += kardex_rrpp_count
                synced_clients.update(linked_documents)

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('Sincronización completada'))
        self.stdout.write(self.style.SUCCESS(f'Clientes espejo sincronizados: {len(synced_clients)}'))
        self.stdout.write(self.style.SUCCESS(f'Kardex espejo sincronizados: {len(synced_kardexes)}'))
        self.stdout.write(self.style.SUCCESS(f'Movimientos RRPP sincronizados: {rrpp_rows}'))

    def sync_client(self, document_number):
        source_data = SignoService.get_cliente_by_documento(document_number) or {}
        portal_client = PortalClient.objects.filter(document_number=document_number).first()

        document_type = (
            self.pick_first(source_data, ['tipodoc', 'tipdoc', 'tipodocumento', 'tipo_documento'])
            or (portal_client.document_type if portal_client else None)
            or self.infer_document_type(document_number)
        )
        full_name = (
            self.pick_first(
                source_data,
                ['nomcliente', 'cliente', 'apenom', 'nombrecompleto', 'nombre', 'razonsocial']
            )
            or (portal_client.full_name if portal_client else '')
        )
        email = (
            self.pick_first(source_data, ['email', 'correo', 'mail', 'mailcontacto'])
            or (portal_client.email if portal_client else None)
        )
        phone = (
            self.pick_first(source_data, ['telefono', 'telefono1', 'celular', 'telecontacto'])
            or (portal_client.phone if portal_client else None)
        )

        if document_type not in {'DNI', 'RUC', 'CE', 'PAS'}:
            document_type = self.infer_document_type(document_number)

        client, _ = MirrorClient.objects.update_or_create(
            document_number=document_number,
            defaults={
                'document_type': document_type,
                'full_name': full_name or '',
                'email': email or None,
                'phone': phone or None,
            }
        )
        return client

    def sync_kardex(self, kardex, kardex_payload=None, seed_documents=None):
        kardex_data = kardex_payload or SignoService.get_kardex_by_kardex(kardex)
        if not kardex_data:
            self.stdout.write(self.style.WARNING(
                f'   [WARN] No se encontró el kardex {kardex} en SIGNO'
            ))
            return None, 0, set()

        kardex_obj, _ = MirrorKardex.objects.update_or_create(
            kardex=kardex_data['kardex'],
            defaults={
                'source_idkardex': kardex_data.get('idkardex') or 0,
                'fechaingreso': kardex_data.get('fechaingreso') or '',
                'referencia': kardex_data.get('referencia') or '',
                'contrato': kardex_data.get('contrato') or '',
                'contacto': kardex_data.get('contacto') or '',
                'telecontacto': kardex_data.get('telecontacto') or None,
                'mailcontacto': kardex_data.get('mailcontacto') or None,
                'fechacalificado': kardex_data.get('fechacalificado') or None,
                'fechainstrumento': kardex_data.get('fechainstrumento') or None,
                'fechaconclusion': kardex_data.get('fechaconclusion') or None,
                'numescritura': kardex_data.get('numescritura') or None,
                'fechaescritura': kardex_data.get('fechaescritura') or None,
                'numminuta': kardex_data.get('numminuta') or None,
                'estado': kardex_data.get('estado') or None,
                'responsable': kardex_data.get('responsable') or None,
                'gestor': kardex_data.get('gestor') or None,
            }
        )

        status_data = SignoService.get_estado_kardex(kardex) or {}
        MirrorKardexStatus.objects.update_or_create(
            kardex=kardex_obj,
            defaults={
                'ingresado': bool(status_data.get('ingresado')),
                'calificado': bool(status_data.get('calificado')),
                'calificado_observado': bool(status_data.get('calificado_observado')),
                'calificado_digitacion': bool(status_data.get('calificado_digitacion')),
                'generado_proyecto': bool(status_data.get('generado_proyecto')),
                'confrontado': bool(status_data.get('confrontado')),
                'escriturado': bool(status_data.get('escriturado')),
                'firmas_proceso': bool(status_data.get('firmas_proceso')),
                'firmas_concluidas': bool(status_data.get('firmas_concluidas')),
                'partes_terminados': bool(status_data.get('partes_terminados')),
                'presentado': bool(status_data.get('presentado')),
                'inscrito': bool(status_data.get('inscrito')),
            }
        )

        linked_documents = set(seed_documents or set())
        linked_documents.update(SignoService.get_documentos_by_kardex(kardex))

        for document_number in sorted(linked_documents):
            client = self.sync_client(document_number)
            if client:
                MirrorKardexClient.objects.update_or_create(
                    kardex=kardex_obj,
                    client=client,
                    defaults={},
                )

        rrpp_source_rows = SignoService.get_historial_registral(kardex)
        kardex_obj.rrpp_movements.all().delete()
        rrpp_objects = [
            MirrorRRPPMovement(
                kardex=kardex_obj,
                idmovreg=row.get('idmovreg') or 0,
                itemmov=row.get('itemmov') or 0,
                fechamov=row.get('fechamov') or None,
                vencimiento=row.get('vencimiento') or None,
                titulorp=row.get('titulorp') or None,
                tramite=row.get('tramite') or None,
                estado=row.get('estado') or None,
                estado_abrev=row.get('estado_abrev') or None,
                sede=row.get('sede') or None,
                seccion=row.get('seccion') or None,
                encargado=row.get('encargado') or None,
                importee=str(row.get('importee')) if row.get('importee') not in (None, '') else None,
                numero_partida=row.get('numeroPartida') or None,
                asiento=row.get('asiento') or None,
                fecha_inscripcion=row.get('fechaInscripcion') or None,
                observa=row.get('observa') or None,
            )
            for row in rrpp_source_rows
        ]
        if rrpp_objects:
            MirrorRRPPMovement.objects.bulk_create(rrpp_objects)

        self.stdout.write(self.style.SUCCESS(
            f'   [OK] Kardex {kardex_obj.kardex} sincronizado | '
            f'clientes vinculados: {len(linked_documents)} | rrpp: {len(rrpp_objects)}'
        ))
        return kardex_obj, len(rrpp_objects), linked_documents

    @staticmethod
    def pick_first(data, keys):
        for key in keys:
            value = data.get(key)
            if value not in (None, ''):
                return str(value).strip()
        return None

    @staticmethod
    def infer_document_type(document_number):
        if len(document_number) == 11 and document_number.isdigit():
            return 'RUC'
        if len(document_number) == 8 and document_number.isdigit():
            return 'DNI'
        return 'CE'
