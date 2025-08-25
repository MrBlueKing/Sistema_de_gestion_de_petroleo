<?php

use App\Http\Controllers\Api\AdminOperador\AdminOperadorController;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;


// 📦 Todas las rutas estarán bajo /api/adminOperador/...
Route::prefix('adminOperador')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | 🔒 RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/logout', [AuthController::class, 'logout']);

        // Usuario autenticado
        Route::get('/user', function (Request $request) {
            $user = $request->user();
            $user->load('faena', 'rol');
            return response()->json($user);
        });

        Route::get('/test-auth', function () {
            return response()->json(['message' => 'API funcionando ADMIN OPERADOR', 'time' => now()]);
        });

        // ✅ ==========================================
        // 📋 GESTIÓN DE CARGAS EXTERNAS (SOLO CONSULTA Y APROBACIÓN)
        // ✅ ==========================================

        // Listar todas las cargas (para revisión)
        Route::get('/cargas', [AdminOperadorController::class, 'index']);

        // Ver detalle de una carga específica
        Route::get('/cargas/{id}', [AdminOperadorController::class, 'show']);

        // Aprobar carga pendiente
        Route::post('/cargas/{id}/aprobar', [AdminOperadorController::class, 'aprobar']);

        // Rechazar carga pendiente (requiere motivo)
        Route::post('/cargas/{id}/rechazar', [AdminOperadorController::class, 'rechazar']);

        // ✅ ==========================================
        // 🎯 GESTIÓN DE ASIGNACIONES MÁQUINA-OPERADOR (NUEVOS ENDPOINTS)
        // ✅ ==========================================

        // Obtener todos los datos necesarios para el drag & drop
        Route::get('/asignaciones/datos', [AdminOperadorController::class, 'obtenerDatos']);
    });
});
