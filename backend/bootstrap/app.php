<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__)) // Configura la base de la aplicación.
    ->withRouting(
        web: __DIR__.'/../routes/web.php',  // Rutas para el frontend de la aplicación.
        api: __DIR__.'/../routes/api.php',  // Rutas para la API de la aplicación.
        commands: __DIR__.'/../routes/console.php',  // Rutas para comandos de consola.
        health: '/up',  // Ruta para la comprobación de estado de la aplicación (ruta de salud).
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Configuración para el manejo de cookies.
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']); 
        // Excluye las cookies relacionadas con la apariencia y el estado de la barra lateral de la encriptación.

        // Middleware específico para rutas web (frontend).
        $middleware->web(append: [
            HandleAppearance::class, // Middleware para gestionar la apariencia de la aplicación (temas, personalización).
            HandleInertiaRequests::class, // Middleware para manejar las peticiones realizadas con Inertia.js (SPA).
            AddLinkHeadersForPreloadedAssets::class, // Middleware para agregar encabezados de enlace para la pre-carga de activos.
        ]);

        // Middleware específico para rutas API (backend).
        $middleware->api(append: [
            EnsureFrontendRequestsAreStateful::class, // Middleware de Sanctum para autenticar peticiones API basadas en cookies de sesión.
        ]);
    })
    
    ->withExceptions(function (Exceptions $exceptions) {
        // Este bloque es para manejar las excepciones globales, aunque está vacío en este caso.
        // Aquí puedes definir una lógica personalizada para capturar y procesar excepciones.
        //
        // Ejemplo: 
        // $exceptions->register(function ($exception) {
        //     // Personalizar la respuesta cuando se capture una excepción específica.
        // });
    })
    ->create();  // Crea la aplicación con la configuración dada.
