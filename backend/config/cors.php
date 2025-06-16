<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'], /* que rutas pueden realizar peticiones CORS */

    'allowed_methods' => ['*'], /* que metodos(POST, GET, DELETE) pueden realizar peticiones CORS */

    'allowed_origins' => [
        env('FRONTEND_URL'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        /* 'http://192.168.18.108:5173',Ruta para pruebas locales de auditoria */
        'https://api.m3h.cl'
    ], /* que dominios pueden realizar peticiones CORS */

    'allowed_origins_patterns' => [], /* patrones de dominios que pueden realizar peticiones CORS */

    'allowed_headers' => ['*'], /* que headers pueden realizar peticiones CORS */

    'exposed_headers' => [], /* que headers pueden ser expuestos en la respuesta de la peticion CORS */

    'max_age' => 0, /* cuanto tiempo en segundos el navegador puede cachear la respuesta de la peticion CORS */

    'supports_credentials' => true, /* si se permiten credenciales en la peticion CORS */

];
