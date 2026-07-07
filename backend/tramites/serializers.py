from rest_framework import serializers
from typing import Dict, List, Any


class TramiteContratanteSerializer(serializers.Serializer):
    idcontratante = serializers.CharField(read_only=True, allow_null=True)
    full_name = serializers.CharField(read_only=True)
    document_number = serializers.CharField(read_only=True, allow_null=True)
    condition = serializers.CharField(read_only=True, allow_null=True)


class TramiteDocumentoDisponibleSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    description = serializers.CharField(read_only=True)
    extension = serializers.CharField(read_only=True, allow_null=True)
    created_at = serializers.CharField(read_only=True, allow_null=True)
    movement_item = serializers.IntegerField(read_only=True, allow_null=True)
    title = serializers.CharField(read_only=True, allow_null=True)
    status = serializers.CharField(read_only=True, allow_null=True)
    movement_date = serializers.CharField(read_only=True, allow_null=True)


class TramiteListSerializer(serializers.Serializer):
    """Serializer para listado de trámites en el dashboard."""

    idkardex = serializers.IntegerField(read_only=True)
    kardex = serializers.CharField(read_only=True)
    fechaingreso = serializers.CharField(read_only=True)
    fechacalificado = serializers.CharField(read_only=True, allow_null=True)
    fechaconclusion = serializers.CharField(read_only=True, allow_null=True)
    fechaescritura = serializers.CharField(read_only=True, allow_null=True)
    referencia = serializers.CharField(read_only=True)
    contrato = serializers.CharField(read_only=True)
    contacto = serializers.CharField(read_only=True)
    cliente_nombre = serializers.CharField(read_only=True, allow_null=True)
    telecontacto = serializers.CharField(read_only=True, allow_null=True)
    mailcontacto = serializers.CharField(read_only=True, allow_null=True)
    numescritura = serializers.CharField(read_only=True, allow_null=True)
    estado = serializers.CharField(read_only=True, allow_null=True)
    estado_notarial = serializers.DictField(read_only=True, allow_null=True)
    ultimo_estado_registral = serializers.CharField(read_only=True, allow_null=True)
    contratantes = TramiteContratanteSerializer(many=True, read_only=True, required=False)
    estado_general = serializers.SerializerMethodField()
    avance_porcentaje = serializers.SerializerMethodField()
    etapa_actual = serializers.SerializerMethodField()

    def get_estado_general(self, obj):
        """Determina el estado general del trámite."""
        if obj.get("fechaconclusion"):
            return "CONCLUIDO"
        if obj.get("fechacalificado"):
            return "EN PROCESO"
        return "INGRESADO"

    def get_avance_porcentaje(self, obj):
        """Calcula el avance porcentual (referencial)."""
        progress = 10
        if obj.get("fechacalificado"):
            progress = 20
        if obj.get("fechaescritura"):
            progress = 60
        if obj.get("fechaconclusion"):
            progress = 100
        return progress

    def get_etapa_actual(self, obj):
        """Devuelve la etapa actual del trámite."""
        if obj.get("fechaconclusion"):
            return "Concluido"
        if obj.get("fechaescritura"):
            return "Escriturado"
        if obj.get("fechacalificado"):
            return "En Proceso"
        return "Ingresado"


class HistorialRegistralItemSerializer(serializers.Serializer):
    """Serializer para cada item del historial registral."""

    fecha = serializers.CharField(read_only=True)
    estado = serializers.CharField(read_only=True)
    idmovreg = serializers.IntegerField(read_only=True, allow_null=True)
    itemmov = serializers.IntegerField(read_only=True, allow_null=True)


class EstadoRegistralSerializer(serializers.Serializer):
    """Serializer para cada título/ movimiento registral."""

    titulo = serializers.CharField(read_only=True)
    tramite = serializers.CharField(read_only=True, allow_null=True)
    estado_actual = serializers.CharField(read_only=True)
    sede = serializers.CharField(read_only=True, allow_null=True)
    seccion = serializers.CharField(read_only=True, allow_null=True)
    fecha = serializers.CharField(read_only=True, allow_null=True)
    importe = serializers.CharField(read_only=True, allow_null=True)
    numeropartida = serializers.CharField(read_only=True, allow_null=True)
    registrador = serializers.CharField(read_only=True, allow_null=True)
    asiento = serializers.CharField(read_only=True, allow_null=True)
    fechainscripcion = serializers.CharField(read_only=True, allow_null=True)
    observaciones = serializers.CharField(read_only=True, allow_null=True)
    historial = HistorialRegistralItemSerializer(many=True)


class EstadoNotarialSerializer(serializers.Serializer):
    """Serializer para el estado notarial completo."""

    ingresado = serializers.BooleanField(read_only=True)
    calificado = serializers.BooleanField(read_only=True)
    calificado_observado = serializers.BooleanField(read_only=True)
    calificado_digitacion = serializers.BooleanField(read_only=True)
    generado_proyecto = serializers.BooleanField(read_only=True)
    confrontado = serializers.BooleanField(read_only=True)
    escriturado = serializers.BooleanField(read_only=True)
    firmas_proceso = serializers.BooleanField(read_only=True)
    firmas_concluidas = serializers.BooleanField(read_only=True)
    partes_terminados = serializers.BooleanField(read_only=True)
    presentado = serializers.BooleanField(read_only=True)
    inscrito = serializers.BooleanField(read_only=True)


class TramiteDetailSerializer(serializers.Serializer):
    """Serializer para detalle completo de un trámite."""

    idkardex = serializers.IntegerField(read_only=True)
    kardex = serializers.CharField(read_only=True)
    fechaingreso = serializers.CharField(read_only=True)
    referencia = serializers.CharField(read_only=True)
    contrato = serializers.CharField(read_only=True)
    contacto = serializers.CharField(read_only=True)
    cliente_nombre = serializers.CharField(read_only=True, allow_null=True)
    telecontacto = serializers.CharField(read_only=True, allow_null=True)
    mailcontacto = serializers.CharField(read_only=True, allow_null=True)
    fechacalificado = serializers.CharField(read_only=True, allow_null=True)
    fechainstrumento = serializers.CharField(read_only=True, allow_null=True)
    fechaconclusion = serializers.CharField(read_only=True, allow_null=True)
    numescritura = serializers.CharField(read_only=True, allow_null=True)
    fechaescritura = serializers.CharField(read_only=True, allow_null=True)
    numminuta = serializers.CharField(read_only=True, allow_null=True)
    estado = serializers.CharField(read_only=True, allow_null=True)
    responsable = serializers.CharField(read_only=True, allow_null=True)
    gestor = serializers.CharField(read_only=True, allow_null=True)

    estado_general = serializers.SerializerMethodField()
    avance_porcentaje = serializers.SerializerMethodField()
    etapa_actual = serializers.SerializerMethodField()

    estado_notarial = EstadoNotarialSerializer(read_only=True, allow_null=True)
    movimientos_rrpp = EstadoRegistralSerializer(many=True, read_only=True)
    firmas_status = serializers.DictField(read_only=True, allow_null=True)
    contratantes = TramiteContratanteSerializer(many=True, read_only=True, required=False)
    documentos_disponibles = TramiteDocumentoDisponibleSerializer(many=True, read_only=True, required=False)

    def get_estado_general(self, obj):
        if obj.get("fechaconclusion"):
            return "CONCLUIDO"
        if obj.get("fechaescritura"):
            return "ESCRITURADO"
        if obj.get("fechacalificado"):
            return "EN PROCESO"
        return "INGRESADO"

    def get_avance_porcentaje(self, obj):
        progress = 10
        if obj.get("fechacalificado"):
            progress = 20
        if obj.get("fechaescritura"):
            progress = 60
        if obj.get("fechaconclusion"):
            progress = 100
        return progress

    def get_etapa_actual(self, obj):
        if obj.get("fechaconclusion"):
            return "Concluido"
        if obj.get("fechaescritura"):
            return "Escriturado"
        if obj.get("fechacalificado"):
            return "En Proceso"
        return "Ingresado"
