from django.db import models


class MirrorClient(models.Model):
    """Cliente espejo sincronizado desde SIGNO para consumo del portal."""

    DOCUMENT_TYPES = [
        ('DNI', 'DNI'),
        ('RUC', 'RUC'),
        ('CE', 'Carné de Extranjería'),
        ('PAS', 'Pasaporte'),
    ]

    document_type = models.CharField(max_length=3, choices=DOCUMENT_TYPES, default='DNI')
    document_number = models.CharField(max_length=20, unique=True, db_index=True)
    full_name = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mirror_clients'
        verbose_name = 'Cliente espejo'
        verbose_name_plural = 'Clientes espejo'

    def __str__(self):
        return f'{self.document_number} - {self.full_name or "Sin nombre"}'


class MirrorKardex(models.Model):
    """Kardex espejo sincronizado desde SIGNO."""

    source_idkardex = models.IntegerField(unique=True, db_index=True)
    kardex = models.CharField(max_length=50, unique=True, db_index=True)
    fechaingreso = models.CharField(max_length=20, blank=True, default='')
    referencia = models.CharField(max_length=255, blank=True, default='')
    contrato = models.CharField(max_length=255, blank=True, default='')
    contacto = models.CharField(max_length=255, blank=True, default='')
    telecontacto = models.CharField(max_length=30, blank=True, null=True)
    mailcontacto = models.CharField(max_length=255, blank=True, null=True)
    fechacalificado = models.CharField(max_length=20, blank=True, null=True)
    fechainstrumento = models.CharField(max_length=20, blank=True, null=True)
    fechaconclusion = models.CharField(max_length=20, blank=True, null=True)
    numescritura = models.CharField(max_length=50, blank=True, null=True)
    fechaescritura = models.CharField(max_length=20, blank=True, null=True)
    numminuta = models.CharField(max_length=50, blank=True, null=True)
    estado = models.CharField(max_length=100, blank=True, null=True)
    responsable = models.CharField(max_length=255, blank=True, null=True)
    gestor = models.CharField(max_length=255, blank=True, null=True)
    clients = models.ManyToManyField(
        MirrorClient,
        through='MirrorKardexClient',
        related_name='kardexes',
    )
    synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mirror_kardex'
        verbose_name = 'Kardex espejo'
        verbose_name_plural = 'Kardex espejo'
        ordering = ['-source_idkardex']

    def __str__(self):
        return self.kardex


class MirrorKardexClient(models.Model):
    """Relación espejo entre cliente y kardex."""

    kardex = models.ForeignKey(MirrorKardex, on_delete=models.CASCADE, related_name='client_links')
    client = models.ForeignKey(MirrorClient, on_delete=models.CASCADE, related_name='kardex_links')
    synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mirror_kardex_clients'
        verbose_name = 'Vínculo espejo cliente-kardex'
        verbose_name_plural = 'Vínculos espejo cliente-kardex'
        unique_together = ('kardex', 'client')

    def __str__(self):
        return f'{self.client.document_number} -> {self.kardex.kardex}'


class MirrorKardexStatus(models.Model):
    """Estado notarial espejo de un kardex."""

    kardex = models.OneToOneField(
        MirrorKardex,
        on_delete=models.CASCADE,
        related_name='notarial_status',
    )
    ingresado = models.BooleanField(default=False)
    calificado = models.BooleanField(default=False)
    calificado_observado = models.BooleanField(default=False)
    calificado_digitacion = models.BooleanField(default=False)
    generado_proyecto = models.BooleanField(default=False)
    confrontado = models.BooleanField(default=False)
    escriturado = models.BooleanField(default=False)
    firmas_proceso = models.BooleanField(default=False)
    firmas_concluidas = models.BooleanField(default=False)
    partes_terminados = models.BooleanField(default=False)
    presentado = models.BooleanField(default=False)
    inscrito = models.BooleanField(default=False)
    synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mirror_kardex_status'
        verbose_name = 'Estado notarial espejo'
        verbose_name_plural = 'Estados notariales espejo'

    def __str__(self):
        return f'Estado {self.kardex.kardex}'


class MirrorRRPPMovement(models.Model):
    """Movimiento RRPP espejo sincronizado desde SIGNO."""

    kardex = models.ForeignKey(
        MirrorKardex,
        on_delete=models.CASCADE,
        related_name='rrpp_movements',
    )
    idmovreg = models.IntegerField(db_index=True)
    itemmov = models.IntegerField(default=0)
    fechamov = models.CharField(max_length=20, blank=True, null=True)
    vencimiento = models.CharField(max_length=20, blank=True, null=True)
    titulorp = models.CharField(max_length=100, blank=True, null=True)
    tramite = models.CharField(max_length=255, blank=True, null=True)
    estado = models.CharField(max_length=255, blank=True, null=True)
    estado_abrev = models.CharField(max_length=50, blank=True, null=True)
    sede = models.CharField(max_length=255, blank=True, null=True)
    seccion = models.CharField(max_length=255, blank=True, null=True)
    encargado = models.CharField(max_length=255, blank=True, null=True)
    importee = models.CharField(max_length=50, blank=True, null=True)
    numero_partida = models.CharField(max_length=100, blank=True, null=True)
    asiento = models.CharField(max_length=100, blank=True, null=True)
    fecha_inscripcion = models.CharField(max_length=20, blank=True, null=True)
    observa = models.TextField(blank=True, null=True)
    synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mirror_rrpp_movements'
        verbose_name = 'Movimiento RRPP espejo'
        verbose_name_plural = 'Movimientos RRPP espejo'
        unique_together = ('idmovreg', 'itemmov')
        ordering = ['idmovreg', 'itemmov']

    def __str__(self):
        return f'{self.kardex.kardex} - {self.titulorp or self.idmovreg}'
