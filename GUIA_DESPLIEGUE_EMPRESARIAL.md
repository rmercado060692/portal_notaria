# GUÍA DE DESPLIEGUE EMPRESARIAL - PORTAL DEL CLIENTE

## ARQUITECTURA FINAL
```
Default Web Site (IIS)
├── SIGNO (Aplicación PHP - NO MODIFICAR)
├── calendario (Aplicación PHP - NO MODIFICAR)
├── portal (Aplicación React - http[s]://servidor/portal/)
└── api (Aplicación Reverse Proxy - http[s]://servidor/api/)
    └──→ http://127.0.0.1:8000 (Waitress + Django)
```

---

## PASO 1: PRE-REQUISITOS EN WINDOWS SERVER 2019

### 1.1 Instalar roles y características de IIS
Abre PowerShell como Administrador y ejecuta:
```powershell
Install-WindowsFeature -Name Web-Server, Web-WebServer, Web-Common-Http, Web-Static-Content, Web-Default-Doc, Web-Dir-Browsing, Web-Http-Errors, Web-Http-Redirect, Web-App-Dev, Web-ASP, Web-CGI, Web-ISAPI-Ext, Web-ISAPI-Filter, Web-Health, Web-Http-Logging, Web-Log-Libraries, Web-Request-Monitor, Web-Http-Tracing, Web-Security, Web-Filtering, Web-Basic-Auth, Web-Windows-Auth, Web-Performance, Web-Stat-Compression, Web-Dyn-Compression, Web-Mgmt-Tools, Web-Mgmt-Console, Web-Scripting-Tools, Web-Mgmt-Service -IncludeManagementTools
```

### 1.2 Instalar Application Request Routing (ARR) y URL Rewrite
Descarga e instala:
- **URL Rewrite Module 2.1**: https://www.iis.net/downloads/microsoft/url-rewrite
- **Application Request Routing 3.0**: https://www.iis.net/downloads/microsoft/application-request-routing

### 1.3 Habilitar Proxy en ARR
1. Abre **Administrador de IIS**
2. Selecciona el servidor en la conexión izquierda
3. Haz doble clic en **Application Request Routing Cache**
4. En el panel Acciones (derecha), haz clic en **Server Proxy Settings...**
5. Marca la casilla **Enable proxy**
6. Aplica los cambios

### 1.4 Instalar Python 3.12
- Descarga Python 3.12 desde https://www.python.org/downloads/
- Instálalo con la opción **"Add Python to PATH"** activada
- Verifica instalación: `python --version`

---

## PASO 2: ESTRUCTURA DE CARPETAS EN EL SERVIDOR
Crea la siguiente estructura:
```
C:\inetpub\wwwroot\
├── SIGNO\ (EXISTENTE - NO MODIFICAR)
├── calendario\ (EXISTENTE - NO MODIFICAR)
├── portal\ (NUEVA - React build)
└── api\ (NUEVA - solo web.config)

C:\opt\portal_notaria\
├── backend\ (Django completo)
│   ├── venv\ (entorno virtual)
│   ├── ... (todos los archivos del backend)
│   └── .env.production (fuera del repo, con credenciales)
└── logs\ (logs opcionales)
```

---

## PASO 3: CONFIGURAR EL BACKEND DJANGO

### 3.1 Copiar código del backend
Copia la carpeta `backend/` del repo a `C:\opt\portal_notaria\backend\`

### 3.2 Crear entorno virtual
```powershell
cd C:\opt\portal_notaria\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3.3 Crear archivo .env.production (fuera del repo)
Crea `C:\opt\portal_notaria\.env.production` con:
```env
# ===== DJANGO CORE =====
DEBUG=False
SECRET_KEY=tu_clave_secreta_muy_larga_y_aleatoria_aqui
ALLOWED_HOSTS=localhost,127.0.0.1,servidor.notariamendoza.com,nombre-del-servidor
USE_X_FORWARDED_HOST=True
USE_X_FORWARDED_PROTO=True

# ===== BASE DE DATOS PORTAL (POSTGRESQL) =====
DB_NAME=portal_cliente
DB_USER=portal_user
DB_PASSWORD=tu_password_postgresql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_SSLMODE=prefer

# ===== BASE DE DATOS SIGNO (MARIA DB - SOLO LECTURA) =====
SIGNO_DB_NAME=notarios
SIGNO_DB_USER=usuario_signo_lectura
SIGNO_DB_PASSWORD=password_signo
SIGNO_DB_HOST=127.0.0.1
SIGNO_DB_PORT=3306

# ===== SEGURIDAD SSL (si usas HTTPS) =====
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_BROWSER_XSS_FILTER=True

# ===== CORS =====
CORS_ALLOWED_ORIGINS=http://servidor.notariamendoza.com,https://servidor.notariamendoza.com
CSRF_TRUSTED_ORIGINS=http://servidor.notariamendoza.com,https://servidor.notariamendoza.com

# ===== FRONTEND =====
FRONTEND_BASE_URL=https://servidor.notariamendoza.com/portal

# ===== EMAIL (si lo usas) =====
EMAIL_HOST=smtp.tu-servidor.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=no-reply@notariamendoza.com
EMAIL_HOST_PASSWORD=tu_password_email
DEFAULT_FROM_EMAIL=no-reply@notariamendoza.com

# ===== WAITRESS =====
WAITRESS_THREADS=8
WAITRESS_CONNECTION_LIMIT=100

# ===== LOGGING =====
LOG_LEVEL=INFO
```

### 3.4 Ejecutar migraciones y collectstatic
```powershell
cd C:\opt\portal_notaria\backend
.\venv\Scripts\Activate.ps1
$env:PORTAL_ENV_FILE='C:\opt\portal_notaria\.env.production'
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3.5 Instalar el servicio Windows (PortalNotariaAPI)
Abre PowerShell como Administrador y usa el script del repo:
```powershell
cd C:\opt\portal_notaria\backend
powershell -ExecutionPolicy Bypass -File "C:\ruta-a-tu-repo\deploy\windows\install_portal_notaria_service.ps1"
```

Verifica que el servicio esté corriendo:
```powershell
Get-Service PortalNotariaAPI
```
Si no está corriendo: `Start-Service PortalNotariaAPI`

---

## PASO 4: COMPILAR Y DESPLEGAR EL FRONTEND REACT

### 4.1 Compilar el frontend (en tu máquina de desarrollo o en el servidor)
Si usas tu máquina de desarrollo:
```powershell
cd frontend
npm install
npm run build
```

### 4.2 Copiar el build a IIS
Copia **todos los archivos** de `frontend/build/` a `C:\inetpub\wwwroot\portal\`

### 4.3 Copiar web.config del portal
Copia `deploy/iis/portal/web.config` a `C:\inetpub\wwwroot\portal\web.config`

---

## PASO 5: CONFIGURAR LAS APLICACIONES EN IIS

### 5.1 Convertir /portal en aplicación IIS
1. Abre **Administrador de IIS**
2. Expande **Sitios** → **Default Web Site**
3. Haz clic derecho en la carpeta **portal** → **Convertir en aplicación**
4. **Application Pool**: Usa `DefaultAppPool` (o crea uno propio como `.NET CLR Version: No Managed Code`)
5. Haz clic en **Aceptar**

### 5.2 Crear la aplicación /api
1. En el explorador de archivos, crea la carpeta `C:\inetpub\wwwroot\api\`
2. Copia `deploy/iis/api/web.config` a `C:\inetpub\wwwroot\api\web.config`
3. En Administrador de IIS, haz clic derecho en **Default Web Site** → **Agregar aplicación**
4. **Alias**: `api`
5. **Ruta física**: `C:\inetpub\wwwroot\api\`
6. **Application Pool**: Usa el mismo que para /portal
7. Haz clic en **Aceptar**

---

## PASO 6: CONFIGURAR VARIABLES DE SERVIDOR EN URL REWRITE
Para que los encabezados X-Forwarded-* funcionen:

1. En Administrador de IIS, selecciona el **servidor** en la conexión izquierda
2. Haz doble clic en **URL Rewrite**
3. En el panel Acciones (derecha), haz clic en **View Server Variables...**
4. Agrega las siguientes variables (si no existen):
   - `HTTP_X_FORWARDED_PROTO`
   - `HTTP_X_FORWARDED_HOST`
   - `HTTP_X_FORWARDED_FOR`
   - `HTTP_X_FORWARDED_PORT`

---

## PASO 7: PERMISOS NTFS

### 7.1 Permisos para la carpeta del portal
```powershell
icacls "C:\inetpub\wwwroot\portal" /grant "IIS AppPool\DefaultAppPool:(OI)(CI)RX" /T
```

### 7.2 Permisos para la carpeta api (solo lectura)
```powershell
icacls "C:\inetpub\wwwroot\api" /grant "IIS AppPool\DefaultAppPool:(OI)(CI)RX" /T
```

### 7.3 Permisos para logs de Django (si es necesario)
Si usas una carpeta de logs, da permisos al usuario del servicio:
```powershell
icacls "C:\opt\portal_notaria\logs" /grant "NT SERVICE\PortalNotariaAPI:(OI)(CI)RWX" /T
```

---

## PASO 8: VERIFICAR QUE TODO FUNCIONE

### 8.1 Verificar el backend directamente (en el servidor)
Abre un navegador en el servidor y visita:
- http://127.0.0.1:8000/admin/ (debe cargar el login de Django Admin)
- http://127.0.0.1:8000/api/auth/login/ (debe responder con JSON)

### 8.2 Verificar el proxy inverso de la API
Visita desde el servidor o otra PC:
- http://servidor/api/admin/ (debe cargar el mismo login que 8.1)
- http://servidor/api/auth/login/ (debe responder con JSON)

### 8.3 Verificar el frontend
Visita:
- http://servidor/portal/ (debe cargar la aplicación React)
- Navega por las rutas (ej: /portal/login, /portal/dashboard) - deben funcionar con React Router

---

## PASO 9: PROBAR DESDE OTRA PC EN LA RED

1. Asegúrate de que el Firewall de Windows permita tráfico en el puerto 80 (y 443 si usas HTTPS)
2. Desde otra PC, abre un navegador y visita:
   - http://nombre-del-servidor/portal/
   - http://nombre-del-servidor/api/

---

## PASO 10: CONFIGURACIONES ANTES DE PRODUCCIÓN (CHECKLIST)

- [ ] `DEBUG=False` en .env.production
- [ ] `SECRET_KEY` es segura y única
- [ ] `ALLOWED_HOSTS` incluye todos los dominios/IPs válidos
- [ ] `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE` y `CSRF_COOKIE_SECURE` están en True si usas HTTPS
- [ ] `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` están correctamente configurados
- [ ] Las contraseñas de las bases de datos son seguras
- [ ] El servicio PortalNotariaAPI está configurado para iniciar automáticamente
- [ ] Los backups de PostgreSQL están configurados
- [ ] El servidor tiene SSL/TLS configurado si es necesario
- [ ] Los logs están siendo monitoreados
- [ ] No hay archivos .env o credenciales dentro de C:\inetpub\wwwroot
- [ ] El archivo .env.production está seguro y con permisos restrictivos

---

## CHECKLIST FINAL DE DESPLIEGUE

- [ ] Pre-requisitos IIS instalados (ARR, URL Rewrite)
- [ ] Proxy en ARR está habilitado
- [ ] Estructura de carpetas creada
- [ ] Backend copiado y entorno virtual creado
- [ ] .env.production creado y configurado
- [ ] Migraciones ejecutadas y collectstatic hecho
- [ ] Servicio Windows PortalNotariaAPI instalado y corriendo
- [ ] Frontend compilado y copiado a C:\inetpub\wwwroot\portal\
- [ ] web.config de portal copiado
- [ ] Carpeta api creada y web.config copiado
- [ ] Aplicaciones /portal y /api creadas en IIS
- [ ] Variables de servidor en URL Rewrite agregadas
- [ ] Permisos NTFS configurados
- [ ] Backend probado directamente en 127.0.0.1:8000
- [ ] Proxy probado en /api
- [ ] Frontend probado en /portal
- [ ] Pruebas desde otra PC en la red
- [ ] Checklist de producción completado

---

## SOLUCIÓN DE PROBLEMAS COMUNES

### Error 502.3 - Bad Gateway en /api
- Verifica que el servicio PortalNotariaAPI esté corriendo: `Get-Service PortalNotariaAPI`
- Verifica que Waitress esté escuchando en 127.0.0.1:8000: `netstat -ano | findstr :8000`
- Verifica que el proxy en ARR esté habilitado

### Error 404 en rutas del frontend (ej: /portal/dashboard)
- Asegúrate de que el web.config del portal esté en C:\inetpub\wwwroot\portal\
- Asegúrate de que la regla de rewrite "PortalReactRouter" exista y esté activa

### Error 400 - Bad Request o CSRF verification failed
- Verifica que `CSRF_TRUSTED_ORIGINS` incluya tu dominio
- Verifica que `USE_X_FORWARDED_HOST` y `USE_X_FORWARDED_PROTO` estén en True
- Verifica que los encabezados X-Forwarded-* estén configurados en URL Rewrite

### Archivos estáticos de Django Admin no cargan (404)
- Asegúrate de haber ejecutado `python manage.py collectstatic --noinput`
- Verifica que WhiteNoise esté correctamente configurado en settings.py

---

## MANTENIMIENTO

### Actualizar el backend
1. Detener el servicio: `Stop-Service PortalNotariaAPI`
2. Copiar nuevo código a C:\opt\portal_notaria\backend\
3. Activar venv y ejecutar migraciones y collectstatic
4. Iniciar el servicio: `Start-Service PortalNotariaAPI`

### Actualizar el frontend
1. Compilar nuevo build: `npm run build`
2. Borrar contenido de C:\inetpub\wwwroot\portal\
3. Copiar nuevo build y web.config
