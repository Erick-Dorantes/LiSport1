LiSport - Catálogo + Panel Admin (Google Sheets + Cloudinary)
===============================================================

INSTRUCCIONES RÁPIDAS
---------------------
1) Descomprime este ZIP y revisa los archivos:
   - index.html    -> Catálogo público
   - admin.html    -> Panel de administración (protegido por contraseña)
   - style.css     -> Estilos extras
   - app.js        -> Lógica del catálogo
   - admin.js      -> Lógica del panel admin
   - config.js     -> Config (APP_SCRIPT_URL, CLOUD_NAME, UPLOAD_PRESET, ADMIN_PASSWORD)

2) CONFIGURAR Cloudinary:
   - Entra a tu dashboard de Cloudinary y crea un "unsigned upload preset" (Upload Preset)
   - Copia el nombre del preset y pégalo en config.js en la variable UPLOAD_PRESET

3) CONFIGURAR Google Apps Script:
   - Asegúrate de que tu Apps Script está desplegado como Web App y que
     APP_SCRIPT_URL en config.js apunta a la URL /exec de tu deployment.
   - Para acciones de escritura (create/update/delete) el Apps Script valida
     el token enviado. Aquí usamos ADMIN_PASSWORD como token compartido.

4) SUBIR a Render / Netlify (opcional):
   - index.html puede desplegarse como sitio estático.
   - admin.html puedes mantenerla local o subirla; si la subes, protege la carpeta (recomendado).

DETALLES IMPORTANTES
--------------------
- Para subir imágenes desde el panel admin se usa la API de Cloudinary en modo unsigned.
  Esto requiere crear un unsigned upload preset en tu cuenta Cloudinary. No se incluye
  el API Secret aquí (no se debe poner en el front-end).
- ADMIN_PASSWORD por defecto: admin123
  Puedes cambiarla editando config.js.

AYUDA RÁPIDA
------------
- Si ves errores en consola al subir imagen: revisa que CLOUD_NAME y UPLOAD_PRESET en config.js sean correctos.
- Si las acciones de crear/editar/eliminar devuelven error: revisa el token ADMIN_PASSWORD y que Apps Script tenga la lógica del token.

CREADO PARA: LiSport
COLORES: rosa y blanco, con modo oscuro (icono en esquina superior derecha).

Si quieres, puedo:
- Subir el ZIP a un enlace descargable para que lo bajes directamente.
- O ayudarte a configurar el unsigned upload preset en Cloudinary paso a paso.
