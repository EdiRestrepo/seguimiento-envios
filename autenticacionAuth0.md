# Auth0 autentica identidad, pero Conexion360 debe autorizar y administrar usuarios de negocio.

1. Angular redirige a Auth0.
2. Auth0 valida correo/contraseña.
3. Auth0 devuelve sesión al frontend.
4. Angular obtiene un access_token para tu API.
5. Angular llama al backend con:
   
Authorization: Bearer <access_token>

6. El backend C# valida ese token: firma, issuer, audience, expiración.
7. Luego busca el usuario en la base de datos de Conexion360 usando normalmente el sub de Auth0, por ejemplo:
auth0|69a908d8e468fc38695ebf78

Ese sub debe guardarse en tu tabla Users.

El backend no necesita responder otro JWT propio, salvo que tengas una razón muy específica. Lo más limpio es que responda algo como:

{
  "id": "user-123",
  "auth0Id": "auth0|69a908d8e468fc38695ebf78",
  "name": "Edison Estival",
  "email": "edisonestival@gmail.com",
  "company": "TCC S.A.S.",
  "role": "CLIENT",
  "isActive": true,
  "permissions": ["shipments:read", "notifications:read"]
}

Si el usuario existe en Auth0 pero no existe en Conexion360, el backend debería responder 403 Forbidden o un estado tipo:

{
  "code": "USER_NOT_REGISTERED_IN_NEXCARGO",
  "message": "El usuario no está registrado en Conexion360."
}

En tu implementación actual no ves claramente un JWT porque todavía no configuramos un audience para una API propia. Auth0 emite Access Tokens para APIs registradas. Auth0 documenta que las aplicaciones usan Access Tokens para llamar APIs protegidas, y que esos tokens llevan autorización como scopes/permisos. También indica que para APIs propias registradas se emiten JWT Access Tokens y que debes validar el token antes de confiar en él. Fuentes: Auth0 APIs y Access Tokens.

https://auth0.com/docs/get-started/apis
https://auth0.com/docs/secure/tokens/access-tokens

2. Registro con nombre, empresa, correo y teléfono
Tienes varias opciones. La más ordenada para Conexion360 sería separar datos de identidad y datos de negocio:

Auth0 guarda: correo, contraseña, identidad, proveedor, verificación de email.

Backend Conexion360 guarda: empresa, teléfono, rol, estado del usuario, permisos, relación con clientes/envíos.

# Para capturar más datos puedes hacerlo de tres formas:

1. Pantalla propia de Conexion360 antes o después de Auth0
Tu formulario captura nombre, empresa, teléfono y correo. Luego el backend crea un “usuario pendiente” o completa el perfil después del primer login. Esta opción respeta mejor tus mockups.

2. Auth0 Universal Login con campos adicionales
Auth0 permite guardar datos extra en user_metadata; por ejemplo nombre, teléfono o preferencias. Auth0 explica que user_metadata sirve para datos editables del usuario, y app_metadata para información de acceso que el usuario no debería modificar, como roles o permisos.
Fuente: https://auth0.com/docs/manage-users/user-accounts/metadata

3. Backend crea usuarios en Auth0 usando Management API
Si Conexion360 quiere controlar el registro completo, el frontend manda los datos al backend, y el backend crea el usuario en Auth0 y en PostgreSQL. Importante: la Management API no debe llamarse directamente desde Angular porque expondrías credenciales sensibles.

Mi recomendación para tu proyecto:
Usa Auth0 para correo/contraseña y usa tu backend para completar/perfilar el usuario. En PostgreSQL tendrías algo como:

Users
- id
- auth0UserId
- name
- email
- phone
- companyId
- role
- status
- createdAt
- 
Y en Auth0 solo guardarías lo mínimo necesario para identidad. Los roles reales de Conexion360 deberían vivir en tu backend, o en app_metadata si quieres sincronizarlos con Auth0.

3. Modificar la interfaz de Auth0
Desde Auth0 puedes personalizar varias cosas:
- Logo
- Colores
- Nombre de la aplicación
- Texto básico
- Idioma
- Algunas opciones de Universal Login

Ruta típica en Auth0 Dashboard:
Branding -> Universal Login

También revisa:
Applications -> Applications -> tu aplicación -> Settings

Ahí puedes cambiar el nombre que hoy aparece como Auth0Angular.

Pero ojo: si quieres que Auth0 se vea exactamente como tus mockups de Base44, con layout de dos columnas, naranja, tarjetas, tabs “Iniciar sesión / Crear cuenta”, etc., Universal Login estándar puede quedarse corto. Para algo idéntico tienes dos caminos:

* Personalizar Universal Login avanzado desde Auth0, si tu plan/configuración lo permite.
* Mantener tu pantalla Angular como UI principal, y que el botón redirija a Auth0 solo para credenciales. Es lo más simple, pero la pantalla de contraseña seguirá siendo la de Auth0.
* 
Para tu trabajo de grado, yo documentaría esta decisión así:

Conexion360 delega autenticación segura en Auth0 mediante OAuth 2.0/OIDC. El frontend obtiene tokens desde Auth0 y consume el backend C# enviando el Access Token en el encabezado Authorization. El backend valida el token y complementa la autorización con la base de datos propia de Conexion360, donde se almacenan roles, empresa, teléfono, estado del usuario y permisos funcionales.



# Cómo tomar ese token para enviarlo al backend

- Desde Angular no deberías copiar el token del alert. Lo correcto es pedirlo cuando vayas a llamar el backend:
this.auth0.getAccessTokenSilently().subscribe((token) => {
  this.http.get('https://localhost:7001/api/shipments', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
});

- Pero la mejor práctica es usar un HTTP interceptor, para que todas las llamadas al backend salgan automáticamente con:
Authorization: Bearer <access_token>
Cómo sería la comunicación real
El flujo quedaría así:
Angular -> Auth0:
Login del usuario

Auth0 -> Angular:
Devuelve sesión y tokens

Angular -> Backend C#:
GET /api/shipments
Authorization: Bearer <access_token>

Backend C# -> Auth0:
Valida firma pública / issuer / audience

Backend C#:
Busca el usuario por sub:
auth0|69a908d8e468fc38695ebf78

Backend C# -> Angular:
Devuelve datos de Conexion360
Qué debes revisar ahora
Tu token actual tiene:
"aud": "<AUTH0_CLIENT_ID>"

Eso apunta a la app SPA.
Para backend necesitas que el token tenga como aud el identifier de tu API Conexion360. Si todavía no existe esa API en Auth0, créala. Luego configuras Angular para pedir tokens con ese audience.
En resumen:
Sí, es JWT.
Cambia cada login porque debe cambiar.
Expira en 10 horas según tu captura.
Para backend C# no uses el token cuyo aud es el Client ID.
Crea una API en Auth0 para Conexion360 y pide el token con ese audience.
El backend valida ese JWT y luego busca el usuario en PostgreSQL por sub.
