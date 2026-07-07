# Despliegue de Producción

## Objetivo final

- Frontend: `https://notariamendoza.com/portal`
- Backend API: `https://api.notariamendoza.com`
- Backend Django instalado en el servidor donde corre SIGNO
- `default` en PostgreSQL para datos propios del portal
- `signo` en MariaDB solo lectura por `127.0.0.1`
- No tocar SIGNO, no modificar MariaDB y no crear `portal_cliente` en MariaDB

## Arquitectura final

### Base `default`

- Motor: PostgreSQL
- Uso: usuarios, contraseñas, notificaciones, logs, tokens y configuración
- Host recomendado: `127.0.0.1`
- Puerto recomendado: `5432`
- Base: `portal_cliente`
- Usuario: `portal_user`

### Base `signo`

- Motor: MariaDB
- Driver Django: backend MySQL con `PyMySQL`
- Uso: lectura de `notarios`, kardex, contratantes, movimientos y títulos registrales
- Host obligatorio: `127.0.0.1`
- Puerto: `3306`
- Base: `notarios`
- Acceso: solo lectura, sin cambios estructurales ni provisión adicional

## Archivos preparados

- Plantilla backend: `backend/.env.example`
- Frontend producción: `frontend/.env.production`
- Script PostgreSQL del portal: `deploy/postgresql/create_portal_cliente.sql`

## Paso 1. Preparar Windows Server

### 1. Copiar proyecto

```powershell
C:\inetpub\portal-notaria
```

### 2. Crear entorno virtual del backend

```powershell
cd C:\inetpub\portal-notaria\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Paso 2. Instalar PostgreSQL para la base del portal

### 1. Instalar PostgreSQL en Windows Server

Instalar PostgreSQL en el mismo servidor o en un servidor interno controlado. Recomendación práctica en Windows Server:

1. Descargar e instalar PostgreSQL con el instalador oficial para Windows Server.
2. Mantener el servicio de PostgreSQL como servicio de Windows.
3. Durante la instalación definir la contraseña del superusuario `postgres`.
4. Usar puerto `5432`.
5. No publicar PostgreSQL a internet.

### 2. Generar una contraseña segura para `portal_user`

Ejemplo PowerShell:

```powershell
$chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@$%^*-_=+'
$PortalDbPassword = -join ((1..32) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
$PortalDbPassword
```

Guardar esa clave solo en:

- el archivo privado `C:\secure\portal-api\.env.production`
- el script privado que se ejecute en el servidor

No versionarla en el proyecto.

### 3. Crear base y usuario PostgreSQL

Copiar la plantilla de entorno:

```powershell
copy C:\inetpub\portal-notaria\backend\.env.example C:\secure\portal-api\.env.production
```

Editar antes el script:

```text
C:\inetpub\portal-notaria\deploy\postgresql\create_portal_cliente.sql
```

Reemplazar:

```text
CHANGE_ME_PORTAL_DB_PASSWORD
```

por la contraseña real generada en el servidor.

Ejecutar luego:

```powershell
$env:PGPASSWORD='REEMPLAZAR_PASSWORD_ADMIN_POSTGRES'
psql -h 127.0.0.1 -U postgres -d postgres -f C:\inetpub\portal-notaria\deploy\postgresql\create_portal_cliente.sql
```

Resultado esperado:

- base `portal_cliente` creada en PostgreSQL
- usuario `portal_user` creado o actualizado
- `portal_user` con privilegios sobre `portal_cliente`
- MariaDB/SIGNO intactos

## Paso 3. Variables de producción

Completar `C:\secure\portal-api\.env.production` con valores reales y privados:

- `SECRET_KEY`
- `DB_PASSWORD`
- `SIGNO_DB_PASSWORD`
- `EMAIL_HOST_PASSWORD`

Variables clave:

```env
DEBUG=False
ALLOWED_HOSTS=api.notariamendoza.com
USE_X_FORWARDED_HOST=True
USE_X_FORWARDED_PROTO=True
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

DB_NAME=portal_cliente
DB_USER=portal_user
DB_PASSWORD=REEMPLAZAR_EN_SERVIDOR
DB_HOST=127.0.0.1
DB_PORT=5432
DB_CONN_MAX_AGE=60
DB_SSLMODE=prefer

SIGNO_DB_NAME=notarios
SIGNO_DB_USER=bkssigno
SIGNO_DB_PASSWORD=REEMPLAZAR_EN_SERVIDOR
SIGNO_DB_HOST=127.0.0.1
SIGNO_DB_PORT=3306
```

## Paso 4. Migraciones y validación

```powershell
cd C:\inetpub\portal-notaria\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
venv\Scripts\python.exe manage.py migrate --database=default
venv\Scripts\python.exe manage.py collectstatic --noinput
venv\Scripts\python.exe manage.py check --deploy
```

## Paso 5. Ejecutar Django con Waitress

### Opción recomendada

```powershell
cd C:\inetpub\portal-notaria\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
powershell.exe -ExecutionPolicy Bypass -File C:\inetpub\portal-notaria\backend\start_backend_production.ps1
```

Esto deja Waitress escuchando solo en:

```text
127.0.0.1:8000
```

## Paso 6. IIS para `api.notariamendoza.com`

### Instalar componentes

- IIS
- URL Rewrite
- Application Request Routing (ARR)

### Configuración

1. Crear sitio `api.notariamendoza.com`
2. Asociar certificado SSL
3. Configurar reverse proxy a `http://127.0.0.1:8000`
4. Reenviar `Host`, `X-Forwarded-Proto` y `X-Forwarded-For`

## Paso 7. Frontend para `/portal`

### Build

```powershell
cd C:\Users\rmerc\OneDrive\Escritorio\api notaria cliente\frontend
npm install
npm run build
```

### Publicación

Publicar `frontend\build` bajo:

```text
https://notariamendoza.com/portal
```

El `web.config` SPA ya permite:

- `/portal/login`
- `/portal/dashboard`
- `/portal/tramite/K12345`

## Seguridad de red

### PostgreSQL del portal

- `DB_HOST=127.0.0.1` o IP interna privada controlada
- No publicar `5432` a internet

### MariaDB de SIGNO

- `SIGNO_DB_HOST=127.0.0.1`
- `SIGNO_DB_PORT=3306`
- No publicar `3306`
- No crear nuevas bases ahí
- No ejecutar migraciones ahí

### Puertos públicos

- `443`
- `80` solo si se redirige a HTTPS

### Puertos no públicos

- `5432`
- `3306`
- `8000`

## Checklist final

- `default` usa PostgreSQL
- `signo` usa MariaDB solo lectura con `PyMySQL`
- `portal_cliente` existe solo en PostgreSQL
- `portal_user` existe solo en PostgreSQL
- `SIGNO_DB_HOST=127.0.0.1`
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `SIGNO_DB_PORT=3306`
- `DEBUG=False`
- `SECRET_KEY` real
- `check --deploy` ejecutado
- frontend compilado con `PUBLIC_URL=/portal`
- Waitress escuchando en `127.0.0.1:8000`
- IIS con SSL funcionando
- sin exposición pública de PostgreSQL ni MariaDB

## Comandos clave

### Backend

```powershell
cd C:\inetpub\portal-notaria\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example C:\secure\portal-api\.env.production
$env:PGPASSWORD='REEMPLAZAR_PASSWORD_ADMIN_POSTGRES'
psql -h 127.0.0.1 -U postgres -d postgres -f C:\inetpub\portal-notaria\deploy\postgresql\create_portal_cliente.sql
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
venv\Scripts\python.exe manage.py migrate --database=default
venv\Scripts\python.exe manage.py collectstatic --noinput
venv\Scripts\python.exe manage.py check --deploy
powershell.exe -ExecutionPolicy Bypass -File C:\inetpub\portal-notaria\backend\start_backend_production.ps1
```

### Frontend

```powershell
cd C:\Users\rmerc\OneDrive\Escritorio\api notaria cliente\frontend
npm install
npm run build
```
