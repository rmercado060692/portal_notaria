# Portal Digital del Cliente - Notaría Mendoza Vásquez

Plataforma web moderna y segura que permite a los clientes de la notaría ver el estado de sus trámites notariales en tiempo real.

## Arquitectura del Proyecto

### Backend (Django + Django REST Framework)
- Framework: Django 5.1
- API: Django REST Framework
- Autenticación: JWT (JSON Web Tokens)
- Base de datos propia: MySQL
- Conexión a SIGNO: MySQL (solo lectura)

### Frontend (React + TypeScript + TailwindCSS)
- Framework: React 18
- Lenguaje: TypeScript
- Estilos: TailwindCSS
- Rutas: React Router DOM
- Animaciones: Framer Motion

## Estructura del Proyecto

```
api notaria cliente/
├── backend/
│   ├── admin_portal/         # App para administración
│   ├── authentication/       # App para autenticación y usuarios
│   ├── core/                 # Core (servicios, routers)
│   ├── portal/               # Configuración del proyecto Django
│   ├── tramites/             # App para gestión de trámites
│   ├── .env                  # Variables de entorno
│   ├── .env.example          # Ejemplo de variables de entorno
│   ├── manage.py             # Script de administración Django
│   └── requirements.txt      # Dependencias del backend
└── frontend/
    ├── public/               # Archivos públicos
    ├── src/
    │   ├── api/              # Cliente API y servicios
    │   ├── contexts/         # Contextos de React
    │   ├── pages/            # Páginas de la aplicación
    │   ├── types/            # Definiciones de tipos TypeScript
    │   ├── App.tsx           # Componente principal
    │   └── index.tsx         # Punto de entrada
    ├── package.json          # Dependencias del frontend
    ├── tailwind.config.js    # Configuración de Tailwind
    └── postcss.config.js     # Configuración de PostCSS
```

## Configuración Inicial

### Backend

1. Crear un entorno virtual:
```bash
cd backend
python -m venv venv
```

2. Activar el entorno virtual:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno:
```bash
# Copiar el archivo de ejemplo
cp .env.example .env
# Editar .env con tus credenciales
```

5. Configurar bases de datos:
   - Base propia: MySQL (para usuarios del portal)
   - Base SIGNO: MySQL/MariaDB (solo lectura)

6. Realizar migraciones:
```bash
python manage.py migrate
```

7. Crear superusuario:
```bash
python manage.py createsuperuser
```

8. Ejecutar el servidor:
```bash
python manage.py runserver
```

### Frontend

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Configurar variables de entorno (opcional):
```bash
# Normalmente no necesitas .env en frontend para desarrollo local.
# El dev server usa un proxy local configurable vía PORTAL_BACKEND_ORIGIN.
```

3. Ejecutar el servidor de desarrollo:
```bash
npm start
```

4. Si necesitas apuntar el frontend a otro backend local:
```bash
# PowerShell
$env:PORTAL_BACKEND_ORIGIN="http://127.0.0.1:8001"
npm start
```

## Características Principales

### Backend
- Autenticación JWT segura
- Recuperación de contraseña por enlace enviado al correo registrado
- Conexión de solo lectura a SIGNO
- API RESTful para trámites y usuarios
- Manejo de refresco de tokens
- Permisos y autorización por roles

### Frontend
- Login institucional simplificado con recuperación de contraseña
- Dashboard con resumen de trámites
- Detalle completo de trámite
- Historial registral
- Barra de progreso visual
- Diseño responsive (mobile, tablet, desktop)
- Colores institucionales (vino/granate)

## Seguridad

- Autenticación JWT con refresh tokens
- Conexión de solo lectura a la base de datos de SIGNO
- Validación en backend de que un usuario solo vea sus trámites
- Almacenamiento seguro de contraseñas (hash Argon2)
- Variables de entorno para credenciales

## Modelo de Datos (Propio del Portal)

### portal_clients
- Datos de los clientes (documento, nombre, contacto)

### portal_users
- Usuarios del portal (clientes, admin, superadmin)
- Relación con portal_clients

### portal_user_client_links
- Permite asociar un usuario a múltiples documentos

### portal_access_logs
- Registros de acceso para auditoría

### portal_notifications
- Notificaciones para los usuarios

## Conexión a SIGNO

El portal se conecta a la base de datos de SIGNO en modo **solo lectura**. Se recomienda:
1. Crear un usuario MySQL específico para el portal
2. Asignar únicamente permisos SELECT
3. No exponer la base de datos de SIGNO directamente a internet

## Endpoints API

### Autenticación
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/refresh/` - Refrescar token
- `GET /api/auth/me/` - Obtener datos del usuario
- `POST /api/auth/change-password/` - Cambiar contraseña
- `POST /api/auth/forgot-password/` - Recuperar contraseña

### Trámites
- `GET /api/tramites/` - Listar trámites del usuario
- `GET /api/tramites/<kardex>/` - Detalle de un trámite
- `GET /api/tramites/<kardex>/historial/` - Historial registral

## Diseño y Marca

- Colores principales: Vino/Granate (#7f1d1d)
- Tipografía: Sans-serif moderna
- Tarjetas con bordes redondeados
- Iconos simples (Lucide React)
- Fondo con imagen institucional desenfocada

## Siguientes Pasos

1. **Fase 1 - Pruebas locales**
   - Configurar conexión a SIGNO en entorno local
   - Probar consultas y validar datos

2. **Fase 2 - Sincronización segura**
   - Implementar proceso de sincronización periódica
   - Base espejo en la nube para no exponer SIGNO directamente

3. **Fase 3 - Mejoras**
   - Panel de administración completo
   - Notificaciones por correo/WhatsApp
   - Visualización de documentos (si aplica)
   - Tema claro/oscuro
   - Accesibilidad WCAG

## Aviso Legal

> La información mostrada es referencial y corresponde a los registros internos de la Notaría Mendoza Vásquez. Para información registral oficial, puede consultar los canales oficiales de SUNARP.
