import logging
import os
import socket

import pymysql
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Prueba la conexión a la base de datos de SIGNO y ejecuta consultas de verificación'

    def _get_signo_config(self):
        config = settings.DATABASES['signo']
        return {
            'host': config.get('HOST'),
            'port': int(config.get('PORT') or 3306),
            'user': config.get('USER'),
            'password': config.get('PASSWORD'),
            'database': config.get('NAME'),
        }

    def _diagnose_network(self, host, port):
        self.stdout.write('\n1. Verificando resolución del host de SIGNO...')
        try:
            resolved_ip = socket.gethostbyname(host)
            self.stdout.write(self.style.SUCCESS(
                f'   [OK] Host resuelto correctamente: {host} -> {resolved_ip}'
            ))
        except socket.gaierror as exc:
            raise RuntimeError(
                f'No se pudo resolver el host "{host}". '
                'La VPN de Radmin puede estar desconectada o el hostname no existe en la red virtual.'
            ) from exc

        self.stdout.write('\n2. Verificando acceso TCP al puerto 3306...')
        try:
            with socket.create_connection((host, port), timeout=5):
                self.stdout.write(self.style.SUCCESS(
                    f'   [OK] El puerto {port} está accesible en {host}'
                ))
        except socket.timeout as exc:
            raise RuntimeError(
                f'No hubo respuesta al intentar conectar con {host}:{port}. '
                'La VPN puede estar caída, la ruta no está disponible o el servidor no es alcanzable.'
            ) from exc
        except ConnectionRefusedError as exc:
            raise RuntimeError(
                f'El host {host} respondió pero rechazó la conexión en el puerto {port}. '
                'El puerto 3306 está cerrado o MySQL no está escuchando en esa interfaz.'
            ) from exc
        except OSError as exc:
            raise RuntimeError(
                f'No fue posible abrir una conexión TCP a {host}:{port}: {exc}. '
                'Esto suele indicar un problema de VPN, firewall o enrutamiento.'
            ) from exc

    def _diagnose_mysql_auth(self, config):
        self.stdout.write('\n3. Verificando autenticación MySQL...')
        try:
            connection = pymysql.connect(
                host=config['host'],
                port=config['port'],
                user=config['user'],
                password=config['password'],
                database=config['database'],
                connect_timeout=5,
                read_timeout=5,
                write_timeout=5,
                charset='utf8mb4',
                ssl_disabled=True,
            )
            connection.close()
            self.stdout.write(self.style.SUCCESS(
                '   [OK] MySQL aceptó la conexión y las credenciales son válidas'
            ))
        except pymysql.err.OperationalError as exc:
            code = exc.args[0] if exc.args else None
            message = exc.args[1] if len(exc.args) > 1 else str(exc)

            if code == 1045:
                raise RuntimeError(
                    'MySQL rechazó las credenciales configuradas. '
                    'El usuario o la contraseña de SIGNO son incorrectos.'
                ) from exc
            if code == 1049:
                raise RuntimeError(
                    f'La base de datos "{config["database"]}" no existe en el servidor MySQL.'
                ) from exc
            if code in (2003, 2005):
                raise RuntimeError(
                    f'MySQL no permitió establecer la conexión ({message}). '
                    'Verifica la VPN, el firewall y que MySQL acepte conexiones remotas.'
                ) from exc

            raise RuntimeError(
                f'MySQL rechazó la conexión con el error {code}: {message}'
            ) from exc

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Iniciando prueba de conexión a SIGNO ==='))
        config = self._get_signo_config()
        self.stdout.write(
            f'Host configurado: {config["host"]}:{config["port"]} | '
            f'Base: {config["database"]} | Usuario: {config["user"]}'
        )

        try:
            self._diagnose_network(config['host'], config['port'])
            self._diagnose_mysql_auth(config)

            self.stdout.write('\n4. Probando conexión Django a SIGNO...')
            with connections['signo'].cursor() as cursor:
                self.stdout.write(self.style.SUCCESS('   [OK] Django se conectó correctamente a SIGNO'))

                self.stdout.write('\n5. Ejecutando: SELECT COUNT(*) FROM kardex;')
                cursor.execute('SELECT COUNT(*) FROM kardex')
                count_kardex = cursor.fetchone()[0]
                self.stdout.write(self.style.SUCCESS(f'   [OK] Total de registros en kardex: {count_kardex}'))

                sample_kardex = os.getenv('SIGNO_TEST_KARDEX', '').strip()
                if not sample_kardex:
                    cursor.execute('SELECT kardex FROM movirrpp WHERE kardex IS NOT NULL AND kardex <> "" LIMIT 1')
                    sample_row = cursor.fetchone()
                    sample_kardex = sample_row[0] if sample_row else ''

                self.stdout.write('\n6. Ejecutando: SELECT * FROM movirrpp WHERE kardex=%s;')
                cursor.execute('SELECT * FROM movirrpp WHERE kardex = %s', (sample_kardex,))
                movimientos = cursor.fetchall()
                self.stdout.write(self.style.SUCCESS(f'   [OK] Se encontraron {len(movimientos)} movimientos para {sample_kardex or "N/A"}'))

                self.stdout.write('\n7. Ejecutando consulta completa de historial registral...')
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
                cursor.execute(query, (sample_kardex,))
                historial = cursor.fetchall()
                self.stdout.write(self.style.SUCCESS(f'   [OK] Se encontraron {len(historial)} registros en el historial'))

                self.stdout.write('\n' + '=' * 60)
                self.stdout.write(self.style.SUCCESS('=== Todas las pruebas se completaron con éxito ==='))

        except RuntimeError as e:
            self.stdout.write(self.style.ERROR(f'   [ERROR] Diagnóstico de conexión: {str(e)}'))
            logger.error(f'Diagnóstico de conexión a SIGNO: {str(e)}')
        except OperationalError as e:
            self.stdout.write(self.style.ERROR(
                f'   [ERROR] Django no pudo usar la conexión configurada a SIGNO: {str(e)}'
            ))
            logger.error(f'Error de conexión a SIGNO: {str(e)}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   [ERROR] Error general: {str(e)}'))
            logger.error(f'Error general en prueba de SIGNO: {str(e)}')
