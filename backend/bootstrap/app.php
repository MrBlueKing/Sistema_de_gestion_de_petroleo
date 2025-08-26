<?php

use App\Http\Middleware\CheckFaena;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\TokenExpired;
// use App\Http\Middleware\TokenExpired; // ← COMENTAR ESTA LÍNEA
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: [
            __DIR__ . '/../routes/api.php',       // rutas API generales
            __DIR__ . '/../routes/api-chof.php',  // rutas para choferes
            __DIR__ . '/../routes/apiAdminOperador.php', // rutas para admin operador
        ],
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Configuración para el manejo de cookies.
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Middleware específico para rutas web (frontend).
        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // ✅ Agregar TokenExpired solo después de crearlo
        $middleware->api(append: [
            TokenExpired::class,
        ]);

        // ✅ Registrar aliases para usar en rutas específicas
        $middleware->alias([
            'role' => CheckRole::class,
            'faena' => CheckFaena::class,
            'token.expired' => TokenExpired::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {
        // Manejo de excepciones personalizado si es necesario
    })
    ->create();
