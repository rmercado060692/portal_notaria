# Guía Final Windows Server + IIS

## Arquitectura objetivo

- Backend Django instalado en el servidor donde corre SIGNO
- Waitress escuchando solo en `127.0.0.1:8000`
- IIS recibe `https://api.notariamendoza.com` y reenvía a Waitress
- Frontend React publicado en `https://notariamendoza.com/portal`
- El frontend consulta la API en `https://api.notariamendoza.com/api`
- `default` usa PostgreSQL para todos los datos propios del portal
- `signo` usa MariaDB solo lectura mediante `PyMySQL`
- SIGNO queda intacto: sin cambios de estructura, sin migraciones y sin nueva base en MariaDB

## Archivos finales

- Script de backend:
  - [start_backend_production.ps1](file:///c:/Users/rmerc/OneDrive/Escritorio/api%20notaria%20cliente/backend/start_backend_production.ps1)
- Plantilla de variables backend:
  - [.env.example](file:///c:/Users/rmerc/OneDrive/Escritorio/api%20notaria%20cliente/backend/.env.example)
- Script PostgreSQL del portal:
  - [create_portal_cliente.sql](file:///c:/Users/rmerc/OneDrive/Escritorio/api%20notaria%20cliente/deploy/postgresql/create_portal_cliente.sql)
- Reverse proxy IIS para API:
  - [web.config](file:///c:/Users/rmerc/OneDrive/Escritorio/api%20notaria%20cliente/deploy/api.notariamendoza.com/web.config)
- Rewrite SPA del frontend:
  - [web.config](file:///c:/Users/rmerc/OneDrive/Escritorio/api%20notaria%20cliente/frontend/public/web.config)

## Parte 1. Backend en el servidor SIGNO

### 1. Ruta de instalación

```powershell
C:\inetpub\portal-notaria
```

### 2. Crear y preparar el entorno virtual

```powershell
cd C:\inetpub\portal-notaria\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Parte 2. Instalar PostgreSQL para la base del portal

### 1. Instalar PostgreSQL

En Windows Server:

1. Instalar PostgreSQL con el instalador oficial.
2. Crear o mantener el servicio de Windows para PostgreSQL.
3. Definir contraseña del superusuario `postgres`.
4. Mantener el puerto `5432`.
5. No exponer PostgreSQL a internet.

### 2. Generar contraseña segura de `portal_user`

```powershell
$chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@$%^*-_=+'
$PortalDbPassword = -join ((1..32) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
$PortalDbPassword
```

Guardar esa contraseña solo fuera del repositorio.

### 3. Crear base y usuario del portal

```powershell
cd C:\inetpub\portal-notaria\backend
copy .env.example C:\secure\portal-api\.env.production
```

Editar el script:

```text
C:\inetpub\portal-notaria\deploy\postgresql\create_portal_cliente.sql
```

Reemplazar `CHANGE_ME_PORTAL_DB_PASSWORD` por la clave real generada.

Ejecutar:

```powershell
$env:PGPASSWORD='REEMPLAZAR_PASSWORD_ADMIN_POSTGRES'
psql -h 127.0.0.1 -U postgres -d postgres -f C:\inetpub\portal-notaria\deploy\postgresql\create_portal_cliente.sql
```

Resultado esperado:

- `portal_cliente` existe en PostgreSQL
- `portal_user` existe en PostgreSQL
- `portal_user` tiene permisos sobre `portal_cliente`
- MariaDB/SIGNO no se modifica

### 4. Preparar variables de producción

Completar `C:\secure\portal-api\.env.production` con:

- `SECRET_KEY`
- `DB_PASSWORD`
- `SIGNO_DB_PASSWORD`
- `EMAIL_HOST_PASSWORD`

Valores críticos:

```env
DEBUG=False
ALLOWED_HOSTS=api.notariamendoza.com
CORS_ALLOWED_ORIGINS=https://notariamendoza.com
SIGNO_DB_HOST=127.0.0.1
SIGNO_DB_NAME=notarios
SIGNO_DB_USER=bkssigno
DB_NAME=portal_cliente
DB_USER=portal_user
DB_HOST=127.0.0.1
DB_PORT=5432
DB_CONN_MAX_AGE=60
DB_SSLMODE=prefer
```

### 5. Migraciones y estáticos

```powershell
cd C:\inetpub\portal-notaria\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
venv\Scripts\python.exe manage.py migrate --database=default
venv\Scripts\python.exe manage.py collectstatic --noinput
```

### 6. Verificar seguridad de despliegue

```powershell
cd C:\inetpub\portal-notaria\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
venv\Scripts\python.exe manage.py check --deploy
```

### 7. Arrancar Waitress

```powershell
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
powershell.exe -ExecutionPolicy Bypass -File C:\inetpub\portal-notaria\backend\start_backend_production.ps1
```

Este script:

- activa `venv`
- carga el entorno privado
- arranca Waitress en `127.0.0.1:8000`
- sirve `portal.wsgi:application`

### 8. Recomendación operativa

Registrar el backend como servicio con `NSSM` o `WinSW`.

Configuración recomendada en NSSM:

- Application:
  - `powershell.exe`
- Arguments:
  - `-ExecutionPolicy Bypass -Command "$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'; & 'C:\inetpub\portal-notaria\backend\start_backend_production.ps1'"`
- Startup directory:
  - `C:\inetpub\portal-notaria\backend`

## Parte 3. IIS para `api.notariamendoza.com`

### 1. Instalar IIS

- `Web Server (IIS)`
- `Management Tools`
- `IIS Management Console`

### 2. Instalar URL Rewrite

- `IIS URL Rewrite Module 2`

### 3. Instalar ARR

- `Application Request Routing 3.0`

### 4. Activar proxy en ARR

1. Seleccionar el servidor en IIS Manager
2. Abrir `Application Request Routing Cache`
3. Abrir `Server Proxy Settings`
4. Marcar `Enable Proxy`
5. Aplicar

### 5. Crear el sitio `api.notariamendoza.com`

1. `Sites` -> `Add Website`
2. Site name: `api.notariamendoza.com`
3. Physical path: `C:\inetpub\portal-notaria\deploy\api.notariamendoza.com`
4. Binding `https`
5. Host name: `api.notariamendoza.com`
6. Port: `443`
7. Seleccionar certificado SSL

### 6. Copiar `web.config`

Copiar [web.config](file:///c:/Users/rmerc/OneDrive/Escritorio/api%20notaria%20cliente/deploy/api.notariamendoza.com/web.config) hacia:

```powershell
C:\inetpub\portal-notaria\deploy\api.notariamendoza.com\web.config
```

### 7. Qué hace ese `web.config`

- reenvía tráfico a `http://127.0.0.1:8000/{ruta}`
- preserva `Host`
- envía `X-Forwarded-Proto=https`
- envía `X-Forwarded-Host`
- envía `X-Forwarded-For`

### 8. Prueba rápida de API

Probar:

```text
https://api.notariamendoza.com/api/me/
```

Sin token, el resultado esperado es:

- `401 Unauthorized`

## Parte 4. Frontend en `https://notariamendoza.com/portal`

### 1. Generar build

```powershell
cd C:\Users\rmerc\OneDrive\Escritorio\api notaria cliente\frontend
npm install
npm run build
```

### 2. Publicar build

Copiar `frontend\build` a la ruta física publicada como `/portal`.

### 3. Verificar SPA

El build ya incorpora [web.config](file:///c:/Users/rmerc/OneDrive/Escritorio/api%20notaria%20cliente/frontend/public/web.config), por lo que deben funcionar:

- `/portal/login`
- `/portal/dashboard`
- `/portal/tramite/...`

## Parte 5. Checklist final

### Configuración

- `DEBUG=False`
- `SECRET_KEY` real y fuerte
- `default` en PostgreSQL
- `portal_cliente` en PostgreSQL
- `portal_user` en PostgreSQL
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `signo` en MariaDB solo lectura
- `SIGNO_DB_HOST=127.0.0.1`
- `SIGNO_DB_NAME=notarios`
- `SIGNO_DB_PORT=3306`
- `ALLOWED_HOSTS=api.notariamendoza.com`
- `CORS_ALLOWED_ORIGINS=https://notariamendoza.com`
- `REACT_APP_API_URL=https://api.notariamendoza.com/api`
- `PUBLIC_URL=/portal`

### Backend

- `pip install -r requirements.txt` ejecutado
- `migrate` ejecutado solo sobre `default`
- `collectstatic` ejecutado
- Waitress corriendo en `127.0.0.1:8000`
- API accesible por IIS

### Red

- SSL activo en `api.notariamendoza.com`
- SSL activo en `notariamendoza.com`
- PostgreSQL no expuesto a internet
- MariaDB de SIGNO no expuesta a internet
- solo `443` publicado

### Pruebas funcionales

- login probado
- dashboard probado
- detalle probado
- recuperación de contraseña probada
- `403` probado para trámite ajeno

## Parte 6. Qué no debes hacer

- no abrir `5432` a internet
- no abrir `3306` a internet
- no publicar `8000`
- no ejecutar migraciones sobre `signo`
- no crear `portal_cliente` en MariaDB
- no tocar estructura de SIGNO
- no dejar `DEBUG=True`

## Flujo final operativo

1. Backend Django se instala en el servidor SIGNO
2. PostgreSQL aloja `portal_cliente`
3. Waitress corre en `127.0.0.1:8000`
4. IIS recibe `https://api.notariamendoza.com`
5. IIS reenvía a Waitress
6. Frontend React se publica en `https://notariamendoza.com/portal`
7. El cliente entra a `/portal`
8. El portal consume `https://api.notariamendoza.com/api`
9. Django consulta MariaDB/SIGNO solo para lectura

## Comandos exactos

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
