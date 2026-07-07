# Estado Actual del Proyecto

Fecha de actualización: 2026-07-04

## 1. Qué es este proyecto

Portal del Cliente de la Notaría Mendoza Vásquez.

Objetivo:
- Permitir que un cliente autenticado vea sus trámites reales asociados a su DNI/RUC.
- Mostrar avances entendibles para cliente final, sin exponer jerga interna innecesaria.
- Mantener separación entre el portal público y SIGNO.
- No inventar documentos ni estados ficticios.

Stack actual:
- Backend: Django + Django REST Framework + JWT
- Frontend: React + TypeScript + Tailwind CSS
- Integración externa: SIGNO en modo solo lectura
- Base de datos propia del portal: MySQL

## 2. Estado general

El proyecto ya no está en fase de prototipo. Actualmente tiene:
- Login funcional
- Dashboard cliente funcional
- Detalle de trámite funcional
- Perfil de usuario funcional
- FAQ y contacto funcionales
- Panel administrativo funcional para clientes/usuarios
- Integración real con datos de SIGNO
- Descarga segura de PDFs RR.PP. por proxy autenticado
- Sistema de notificaciones visible en frontend
- Diseño visual institucional premium ya implementado

Estado de madurez actual:
- Apto para seguir endureciendo hacia producción
- No depende de datos mock para la experiencia principal
- Ya tiene reglas reales de negocio implementadas

## 3. Arquitectura funcional actual

### 3.1 Enfoque de datos

No se debe exponer SIGNO directamente al cliente final.

La arquitectura actual apunta a esto:
- SIGNO se consulta en solo lectura
- Se sincroniza información relevante hacia una base espejo/controlada por el portal
- El frontend consume la API del portal, no la base SIGNO directamente

Comando clave:
- `backend/core/management/commands/sync_signo_data.py`

Este comando sincroniza:
- clientes
- kardex
- estados notariales
- movimientos RR.PP.

## 4. Reglas de negocio importantes ya definidas

Estas reglas ya forman parte del comportamiento esperado y no deben romperse:

- El portal es estrictamente de consulta. No se modifica SIGNO.
- El usuario solo puede ver trámites asociados a su documento.
- El backend debe validar propiedad del kardex; si no corresponde, debe responder `403 Forbidden`.
- No se deben mostrar documentos falsos o placeholders de expedientes.
- Los PDFs RR.PP. deben servirse por proxy autenticado del backend, no por enlace directo.
- El timeline del trámite debe mostrar solo hitos claros para cliente:
  - Ingreso
  - Escritura
  - Inscrito/Concluido
- Los hitos solo se muestran si tienen fecha real.
- La condición de contratantes debe limpiarse para no mostrar códigos técnicos.
- El avance porcentual del trámite se basa en lógica real de negocio:
  - Desde ingreso
  - Hasta concluido/inscrito
  - Influido por el estado SUNARP real
- Logout debe limpiar:
  - JWT
  - `localStorage`
  - `sessionStorage`

## 5. Lo más importante que ya se implementó

### 5.1 Rediseño completo del frontend

Se rehízo la experiencia visual para que parezca un producto real, no un demo.

Implementado:
- Identidad visual institucional vino/dorado
- Layout premium tipo banca/portal corporativo
- Sidebar flotante por hover en desktop
- Mejor jerarquía visual
- Más aire visual
- Secciones plegables para evitar saturación
- Skeletons y estados vacíos elegantes

Archivos principales tocados:
- `frontend/src/components/Layout.tsx`
- `frontend/src/components/TramiteCard.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/TramiteDetail.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Profile.tsx`
- `frontend/src/index.css`

### 5.2 Dashboard del cliente

Ya muestra:
- resumen por estados
- filtros
- búsqueda
- tarjetas de trámite con lenguaje entendible
- progreso por trámite

Archivo principal:
- `frontend/src/pages/Dashboard.tsx`

### 5.3 Detalle de trámite

Ya muestra:
- nombre amigable del acto
- cliente principal real
- progreso del trámite
- timeline simplificado
- historial SUNARP
- documentos RR.PP. reales si existen
- contratantes
- secciones colapsables para evitar ruido

Archivo principal:
- `frontend/src/pages/TramiteDetail.tsx`

### 5.4 Cliente principal real y limpieza de datos

Se corrigió el problema donde se tomaba un contacto no representativo en vez del titular real.

Ahora:
- se prioriza el cliente principal correcto
- se limpian etiquetas técnicas para mostrar contenido entendible

Lógica principal:
- `frontend/src/utils/tramites.ts`
- `backend/core/services.py`

### 5.5 Descarga segura de PDFs RR.PP.

Se implementó descarga/visualización segura de PDFs reales.

Modelo actual:
- el frontend pide el documento al backend
- el backend valida autenticación y propiedad del trámite
- el backend actúa como proxy seguro

Esto evita:
- exponer rutas directas a documentos
- saltarse permisos
- abrir recursos sensibles sin control

Frontend relacionado:
- `frontend/src/api/services.ts`
- `frontend/src/pages/TramiteDetail.tsx`

### 5.6 Panel administrativo

Ya existe flujo operativo para administración de clientes del portal.

Implementado:
- listar clientes
- crear cliente
- crear usuario del portal para un cliente
- resetear contraseña
- consultar trámites del cliente en SIGNO
- editar datos del cliente antes de crear usuario

Motivo de la edición:
- hubo un bloqueo real: no se podía crear usuario si faltaba email
- se resolvió con edición previa del cliente

Backend:
- `backend/admin_portal/views.py`
- `backend/admin_portal/serializers.py`
- `backend/admin_portal/urls.py`

Frontend:
- `frontend/src/pages/AdminClients.tsx`
- `frontend/src/api/services.ts`

### 5.7 Notificaciones

Ya existe soporte para:
- listar notificaciones
- marcar una
- marcar todas
- ver badge en interfaz

Backend:
- `backend/authentication/urls.py`

Frontend:
- `frontend/src/components/Layout.tsx`
- `frontend/src/api/services.ts`

## 6. Cambios recientes de esta sesión

### 6.1 Error de compilación por `TramiteCard`

Problema detectado:
- `Dashboard.tsx` no resolvía correctamente `../components/TramiteCard`

Acción tomada:
- se creó `frontend/src/components/index.ts`
- `Dashboard.tsx` ahora importa desde `../components`

Objetivo:
- estabilizar la resolución del módulo y limpiar inconsistencias del watcher

### 6.2 Reinicio del frontend

Se detectó que ya existía una instancia previa ocupando el puerto `3000`.

Acción tomada:
- se cerró la instancia vieja
- se levantó una nueva correctamente

Resultado validado:
- frontend respondiendo en `http://localhost:3000`
- compilación correcta

### 6.3 Corrección visual del sidebar desktop

Problemas detectados:
- el sidebar informativo quedaba superpuesto por el header
- luego, al corregir el offset, parte del contenido lateral quedó cortado en ventanas bajas

Acciones tomadas en `frontend/src/components/Layout.tsx`:
- el sidebar desktop ahora empieza debajo del header
- se corrigió la altura útil
- se habilitó scroll interno real en el contenedor del sidebar

Resultado esperado:
- ya no debe quedar contenido lateral inaccesible
- ya no deben superponerse las barras superiores con las tarjetas informativas

## 7. Archivos clave para entender rápido el sistema

### Backend
- `backend/core/services.py`
  - lógica de consulta y armado de datos de trámite
- `backend/core/management/commands/sync_signo_data.py`
  - sincronización desde SIGNO hacia la base espejo
- `backend/admin_portal/views.py`
  - endpoints administrativos
- `backend/admin_portal/serializers.py`
  - validaciones de clientes/usuarios del portal
- `backend/authentication/models.py`
  - usuarios, clientes, vínculos, notificaciones
- `backend/authentication/serializers.py`
  - datos expuestos al frontend y actualización de perfil

### Frontend
- `frontend/src/App.tsx`
  - rutas y estructura principal
- `frontend/src/contexts/AuthContext.tsx`
  - login, sesión, logout
- `frontend/src/api/services.ts`
  - consumo central de la API
- `frontend/src/utils/tramites.ts`
  - traducción de estados y cálculo de progreso
- `frontend/src/components/Layout.tsx`
  - shell principal, sidebar, notificaciones
- `frontend/src/pages/Dashboard.tsx`
  - resumen principal del cliente
- `frontend/src/pages/TramiteDetail.tsx`
  - detalle completo del trámite
- `frontend/src/pages/AdminClients.tsx`
  - panel administrativo

## 8. Cómo levantar el proyecto en otro computador

## Requisitos

- Node.js + npm
- Python 3.x
- MySQL
- Acceso a SIGNO según entorno
- Si SIGNO solo está accesible por Radmin VPN, esa VPN debe estar operativa

## Backend

1. Ir a `backend`
2. Crear entorno virtual
3. Instalar dependencias
4. Configurar `.env`
5. Ejecutar migraciones
6. Levantar servidor

Comandos:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Frontend

```bash
cd frontend
npm install
npm start
```

URL esperada:
- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`

## Arranque automático en Windows

Ahora existe un iniciador automático en la raíz del proyecto:

- `INICIAR_PORTAL.bat`
- `iniciar_portal.ps1`

Uso recomendado:
- doble clic sobre `INICIAR_PORTAL.bat`

Qué hace:
- valida que existan Python y npm
- crea el `venv` del backend si aún no existe
- instala dependencias del frontend si falta `node_modules`
- levanta backend y frontend en ventanas separadas
- evita abrir otra instancia si ya detecta los puertos `8000` o `3000` en uso
- abre el navegador en `http://localhost:3000`

## Sincronización de datos

Cuando el entorno ya tenga conectividad correcta con SIGNO:

```bash
cd backend
venv\Scripts\activate
python manage.py sync_signo_data
```

Observación:
- ese comando es clave para poblar/actualizar la base espejo del portal

## 9. Estado técnico actual conocido

Validado recientemente:
- frontend compila
- build de frontend compila
- el watcher del frontend volvió a levantar correctamente
- las correcciones del sidebar ya están aplicadas

Puede requerir validación adicional en otro equipo:
- variables de entorno del backend
- conexión MySQL del portal
- conexión a SIGNO
- acceso VPN
- disponibilidad real de PDFs RR.PP.

## 10. Pendientes recomendados

Pendientes de alto valor:
- documentar `.env` real de backend y frontend con un ejemplo completo
- dejar procedimiento formal de despliegue
- automatizar sincronización periódica de SIGNO
- validar exhaustivamente permisos `403` sobre todos los endpoints sensibles
- agregar pruebas backend para propiedad de trámite y descarga de documentos
- agregar pruebas frontend para layout y flujos críticos
- revisar responsive fino en desktop de baja altura y laptops pequeñas
- cerrar warnings heredados de `react-scripts`

## 11. Riesgos actuales

- Si SIGNO o la VPN fallan, algunas consultas y PDFs reales pueden no estar disponibles.
- Si no se ejecuta la sincronización, el portal puede mostrar datos desactualizados.
- El proyecto ya tiene bastante lógica de negocio en presentación y servicios; conviene seguir consolidando reglas compartidas para evitar divergencias.
- El entorno local puede quedar inconsistente si se usan watchers viejos de `npm start`; cuando haya síntomas raros, reiniciar el frontend primero.

## 12. Decisiones de producto que no se deben perder

- El portal debe verse sobrio, institucional y premium.
- La UI no debe saturar al cliente con información interna.
- Los estados deben hablar en lenguaje del cliente, no en lenguaje operativo interno.
- La información sensible debe salir por backend autenticado.
- No usar mocks visuales que aparenten ser documentos reales.

## 13. Siguiente punto lógico de trabajo

La base ya está bien encaminada. El siguiente bloque razonable es:
- endurecimiento para producción
- documentación de despliegue
- pruebas de permisos/datos
- validación final del flujo administrativo con datos reales

## 14. Resumen ejecutivo

Hoy el proyecto ya tiene:
- arquitectura clara
- integración real con SIGNO
- portal cliente funcional
- panel administrativo funcional
- seguridad mejor resuelta para documentos
- diseño visual profesional

Lo que queda no es "hacer el producto desde cero", sino consolidarlo:
- despliegue
- pruebas
- documentación operativa
- estabilización final de entorno
