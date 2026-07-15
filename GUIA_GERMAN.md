# 🎯 Guía de uso del CS Command Center — German Rojas

## Acceso al dashboard

**Link oficial:** https://cs-dashboard-phi-three.vercel.app

> ✅ Estuvo roto (pantalla en blanco / "Cargando datos..." infinito) desde antes del 06-jul-2026 por un archivo corrupto — quedó arreglado el 06-jul-2026 por la tarde. Si algún día vuelve a fallar, avisar a Sami de inmediato (ver sección de abajo) — es un bug que ya se repitió una vez.
>
> Link de respaldo (versión más simple, sin los paneles de insights) si el de arriba llegara a fallar: https://samlatam.github.io/cs-command-center-anymarket/
>
> ⚠️ El link viejo de Netlify (marvelous-florentine-0615b0.netlify.app) sigue sin actualizarse desde el 25 de junio por falta de créditos — no usarlo por ahora.

1. Abre el link en el browser
2. Aparece la pantalla de perfiles → haz clic en **⚡ German**
3. Verás solo tus clientes asignados (74 clientes, 5 países)

> Si entras directo sin ver el selector de perfiles, haz clic en tu nombre/ícono en la esquina superior derecha para cambiar de perfil.

> Si ves pantalla en blanco o algo raro → **Ctrl + Shift + R** (limpia caché)

---

## Puedes editar directo en el dashboard (sin pasar por Claude)

No necesitas pedirle nada a Claude para el uso diario. Dentro del dashboard puedes editar tickets, NPS, notas, acciones y último contacto directamente desde la interfaz (botones "Editar", "Registrar contacto", "Nueva acción", etc.).

**¿Sami ve tus cambios?** Sí, se sincronizan solos — no hace falta que le avises ni que le mandes nada:

- Al guardar un cambio, el dashboard lo sube automáticamente en unos 3 segundos.
- Del otro lado, se refresca solo cada 90 segundos, o al apretar el botón **🔄 Sync**, o al recargar la página.
- No es instantáneo tipo Google Docs — si Sami necesita ver algo *ya mismo*, dile que aprete Sync o recargue.
- Esto es independiente del selector de perfiles: cada quien ve y edita solo sus propios clientes, pero Sami (como admin) ve el consolidado de todos.

Usa el mensaje para Claude (sección de abajo) solo cuando quieras cargar datos en lote, pedir un resumen, o hacer cambios más grandes.

---

## Configuración previa: darle acceso a German a la carpeta (una sola vez)

Importante: la conversación de German con Claude en Cowork **no es la misma** que la de Sami. Para que su Claude pueda leer/editar el archivo real del dashboard (y no solo dar respuestas sueltas), necesita tener conectada la misma carpeta del proyecto. Esto se configura una sola vez:

**Paso 1 — Sami comparte la carpeta (en OneDrive, no en Cowork):**
1. Abre OneDrive (web o el explorador de archivos de Windows).
2. Ubica la carpeta `dashboard sami Cs`.
3. Clic derecho → **Compartir** → agrega el correo de German (su cuenta @db1.com.br) con permiso de **Editor** (no solo lectura, porque necesita poder guardar cambios en `index.html.html`).

**Paso 2 — German acepta el acceso:**
1. Le va a llegar un correo/notificación de OneDrive con el enlace a la carpeta compartida.
2. La agrega a su propio OneDrive ("Agregar acceso directo a Mi OneDrive" o similar) para que le aparezca como una carpeta normal en su computador.

**Paso 3 — German conecta esa carpeta en su Cowork:**
1. Abre Cowork y, cuando le pida seleccionar una carpeta de trabajo (o desde configuración/ajustes de la conversación), elige la carpeta `dashboard sami Cs` que ya tiene sincronizada desde el Paso 2.
2. Desde ahí, ya puede pedirle a Claude en lenguaje natural que actualice sus datos — sin secciones especiales, chat normal.

> Esto se hace una única vez. Después de configurado, German puede volver a esa misma conversación/proyecto cada semana sin repetir los pasos.

---

## Usar IA para actualizar tus datos

El dashboard vive en el archivo `index.html.html` dentro de la carpeta del proyecto compartido.

Puedes pedirle a Claude (Cowork) que actualice tus datos de clientes con este mensaje base:

---

### 📋 Mensaje para copiar y pegar en Claude

```
Estoy trabajando en el proyecto "dashboard sami Cs".
El archivo principal es index.html.html.

Necesito actualizar los datos semanales de MIS clientes (German Rojas, id: 'german').

Solo modifica los campos de los clientes que están en mi clientIds.
No toques funciones JavaScript, estilos CSS, ni datos de otros CSMs (Sami, María Laura, Marcio, Rodolfo).
No crees archivos nuevos — siempre edita el mismo index.html.html.

[Aquí describe lo que quieres actualizar, por ejemplo:]
- CLIENTE X: tiene 2 tickets abiertos, el más crítico es #12345 - descripción
- CLIENTE Y: NPS actualizado a 75
- CLIENTE Z: último contacto fue hoy 2026-06-26
```

---

## Qué SÍ puedes pedirle a Claude

| Tarea | Ejemplo de pedido |
|-------|------------------|
| Actualizar tickets | "AUDIOMUSICA tiene 1 ticket abierto #30123 - error en stock" |
| Registrar NPS | "El NPS de GARMIN quedó en 60 según Tracksale" |
| Agregar acción | "Crear acción urgente para PETRIZZIO: llamar esta semana por riesgo de churn" |
| Actualizar último contacto | "Tuve reunión hoy con FLEX CL, actualizar lastContact a 2026-06-26" |
| Ver resumen de tu cartera | "Dame un resumen del estado de mis clientes con riesgo" |

---

## Qué NO debes pedirle que toque

🚫 Funciones del dashboard (`calcHS`, `load`, `renderKPIs`, etc.)  
🚫 Datos de clientes de Sami, María Laura u otros CSMs  
🚫 `SEED_USERS`, `SEED_VERSION`, `ISOLATION_VERSION`  
🚫 Estilos CSS o estructura HTML del dashboard  
🚫 Crear un archivo nuevo de dashboard  

---

## Backup antes de editar (recomendado)

Antes de hacer cambios grandes, haz una copia del archivo:

```
index.html.html  ← archivo real, no renombrar
```

Pídele a Claude:
> *"Haz una copia de seguridad de index.html.html con el nombre index_backup_26jun2026.html antes de editar"*

---

## Deploy después de editar

El dashboard ahora se publica en GitHub Pages (repo `SamLatam/cs-command-center-anymarket`), no en Netlify (esa cuenta sigue sin créditos). Pídele a Claude:
> *"Sube el index.html.html actualizado al repo de GitHub y publícalo"*

⚠️ **Importante:** nunca crear un archivo llamado `index.html` (sin doble extensión) en esta carpeta — el 1-jul-2026 se creó uno por error, quedó corrupto (truncado a mitad de un `<script>`) y causó que el dashboard mostrara pantalla en blanco / carga infinita para todos. El archivo real y completo es siempre `index.html.html`.

---

## Contacto si algo se rompe

Avisar a **Sami** con el mensaje:
> *"Algo quedó mal en el dashboard después de mi último cambio — ¿puedes revisar?"*

Sami o Claude pueden revertir al último backup.

---

*Dashboard CS Command Center — AnyMarket LATAM | Versión 2026-07-06*
