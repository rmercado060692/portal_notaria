import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parent


def parse_args():
    parser = argparse.ArgumentParser(description='Inicia Waitress para Portal Notaria en producción.')
    parser.add_argument('--listen', default='127.0.0.1:8000', help='Dirección y puerto de escucha para Waitress.')
    parser.add_argument('--env-file', help='Ruta absoluta del archivo .env.production privado.')
    return parser.parse_args()


def load_environment(env_file_arg: str | None):
    env_file_value = env_file_arg or os.getenv('PORTAL_ENV_FILE')
    if not env_file_value:
        raise RuntimeError('Debes indicar --env-file o definir la variable PORTAL_ENV_FILE.')

    env_path = Path(env_file_value).expanduser()
    if not env_path.is_absolute():
        raise RuntimeError(f'La ruta del archivo de entorno debe ser absoluta: {env_path}')
    if not env_path.exists():
        raise RuntimeError(f'No existe el archivo de entorno: {env_path}')

    load_dotenv(env_path, override=True)
    os.environ['PORTAL_ENV_FILE'] = str(env_path)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portal.settings')


def build_waitress_options(listen: str):
    return {
        'listen': listen,
        'threads': int(os.getenv('WAITRESS_THREADS', '8')),
        'connection_limit': int(os.getenv('WAITRESS_CONNECTION_LIMIT', '100')),
        'cleanup_interval': int(os.getenv('WAITRESS_CLEANUP_INTERVAL', '30')),
        'channel_timeout': int(os.getenv('WAITRESS_CHANNEL_TIMEOUT', '120')),
        'ident': None,
    }


def main():
    args = parse_args()
    load_environment(args.env_file)

    sys.path.insert(0, str(BACKEND_ROOT))

    from waitress import serve
    from portal.wsgi import application

    options = build_waitress_options(args.listen)
    print(
        '[PORTAL API] Waitress listo | '
        f"listen={options['listen']} "
        f"threads={options['threads']} "
        f"connection_limit={options['connection_limit']}"
    )
    serve(application, **options)


if __name__ == '__main__':
    main()
