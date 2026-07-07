# README Deploy

## Objetivo

Este documento define el flujo correcto de ramas, el procedimiento exacto para preparar el servidor y las validaciones obligatorias antes de desplegar el portal.

Repositorio:

```text
https://github.com/rmercado060692/portal_notaria.git
```

## Flujo de ramas

### `desarrollo`

- Es la rama de trabajo.
- Aquí se hacen cambios, pruebas, ajustes y refactorizaciones.
- Todo cambio nuevo debe entrar primero a `desarrollo`.

### `main`

- Es la rama de producción.
- Solo debe contener código validado.
- El servidor debe usar únicamente `main`.

### Regla principal

```text
NUNCA desplegar desde desarrollo.
```

Flujo obligatorio:

```text
Trae / cambios locales
        ↓
desarrollo
        ↓
build + tests + revisión
        ↓
Pull Request
        ↓
main
        ↓
servidor
```

## Comandos exactos para el servidor

## 1. Instalar Git

Si el servidor tiene `winget`:

```powershell
winget install --id Git.Git -e --source winget
git --version
```

Si `winget` no está disponible:

1. Descargar Git for Windows desde:

```text
https://git-scm.com/download/win
```

2. Instalarlo con opciones por defecto.
3. Verificar:

```powershell
git --version
```

## 2. Clonar el repositorio usando `main`

```powershell
cd C:\
mkdir C:\inetpub\portal-notaria -Force
cd C:\inetpub
git clone -b main https://github.com/rmercado060692/portal_notaria.git portal-notaria
cd C:\inetpub\portal-notaria
git branch
```

El resultado esperado debe mostrar:

```text
* main
```

## 3. Crear entorno virtual del backend

```powershell
cd C:\inetpub\portal-notaria\backend
python -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
```

## 4. Instalar dependencias

```powershell
cd C:\inetpub\portal-notaria\backend
venv\Scripts\python.exe -m pip install -r requirements.txt
```

## 5. Crear archivo `.env` privado

Crear la carpeta segura:

```powershell
New-Item -ItemType Directory -Force -Path C:\secure\portal-api
```

Copiar la plantilla:

```powershell
Copy-Item C:\inetpub\portal-notaria\backend\.env.example C:\secure\portal-api\.env.production
```

Editar el archivo privado:

```powershell
notepad C:\secure\portal-api\.env.production
```

Completar como mínimo:

```env
SECRET_KEY=REEMPLAZAR_EN_SERVIDOR
DEBUG=False
ALLOWED_HOSTS=api.notariamendoza.com
DB_NAME=portal_cliente
DB_USER=portal_user
DB_PASSWORD=REEMPLAZAR_EN_SERVIDOR
DB_HOST=127.0.0.1
DB_PORT=5432
SIGNO_DB_NAME=notarios
SIGNO_DB_USER=bkssigno
SIGNO_DB_PASSWORD=REEMPLAZAR_EN_SERVIDOR
SIGNO_DB_HOST=127.0.0.1
SIGNO_DB_PORT=3306
FRONTEND_BASE_URL=https://notariamendoza.com/portal
```

Exportar la variable de entorno para la sesión actual:

```powershell
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
```

## 6. Ejecutar migraciones

```powershell
cd C:\inetpub\portal-notaria\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
venv\Scripts\python.exe manage.py migrate --database=default
```

## 7. Ejecutar `collectstatic`

```powershell
cd C:\inetpub\portal-notaria\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
venv\Scripts\python.exe manage.py collectstatic --noinput
```

## 8. Levantar backend

```powershell
cd C:\inetpub\portal-notaria\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
powershell.exe -ExecutionPolicy Bypass -File C:\inetpub\portal-notaria\backend\start_backend_production.ps1
```

Resultado esperado:

- Waitress escuchando en `127.0.0.1:8000`
- Django leyendo el `.env.production` privado
- backend listo para ser publicado detrás de IIS

## Guía corta de Pull Request

Flujo obligatorio:

```text
desarrollo -> main
```

Reglas:

1. Nunca hacer cambios directos en `main`.
2. Todo cambio se trabaja y se sube primero a `desarrollo`.
3. Antes del Pull Request, revisar build y tests.
4. Solo después de validar todo, hacer merge a `main`.
5. El servidor siempre debe actualizarse desde `main`.

Proceso recomendado:

```powershell
git checkout desarrollo
git pull origin desarrollo
git checkout -b feature/nombre-del-cambio
```

Cuando el cambio esté listo:

```powershell
git add .
git commit -m "feat: descripcion corta"
git push -u origin feature/nombre-del-cambio
```

Luego:

1. Abrir Pull Request hacia `desarrollo` o integrar primero en `desarrollo`.
2. Validar cambios.
3. Abrir Pull Request `desarrollo -> main`.
4. Revisar checklist de despliegue.
5. Hacer merge recién cuando todo esté validado.

## Checklist antes de desplegar

Antes de tocar el servidor, ejecutar y revisar:

### Frontend

```powershell
cd C:\Users\rmerc\OneDrive\Escritorio\api notaria cliente\frontend
npm run build
```

### Backend - seguridad

```powershell
cd C:\Users\rmerc\OneDrive\Escritorio\api notaria cliente\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
venv\Scripts\python.exe manage.py check --deploy
```

### Backend - pruebas

```powershell
cd C:\Users\rmerc\OneDrive\Escritorio\api notaria cliente\backend
$env:PORTAL_ENV_FILE='C:\secure\portal-api\.env.production'
venv\Scripts\python.exe manage.py test
```

### Verificación de entorno

- Revisar que el `.env.production` privado tenga valores reales correctos.
- Confirmar que `DEBUG=False`.
- Confirmar que `FRONTEND_BASE_URL=https://notariamendoza.com/portal`.
- Confirmar que `DB_HOST` y `SIGNO_DB_HOST` apunten al host correcto.

### Verificación de Git

Revisar que no haya secretos versionados:

```powershell
cd C:\Users\rmerc\OneDrive\Escritorio\api notaria cliente
git status
git ls-files | Select-String "\.env|\.production|db\.sqlite3|node_modules|venv|build"
```

El resultado no debe incluir:

- `.env`
- `.env.production`
- `venv`
- `node_modules`
- `build`
- `db.sqlite3`
- archivos temporales o logs

## Regla final de producción

```text
Si no pasó build, tests y check --deploy, no se mergea a main y no se despliega.
```
