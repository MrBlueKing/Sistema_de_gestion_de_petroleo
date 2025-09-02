<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OperadorVehiculo\CargaExternaController;
use App\Http\Controllers\Api\OperadorVehiculo\AsignacionUserMaquinaController;

// 📦 Todas las rutas estarán bajo /api/chofer/...
Route::prefix('chofer')->group(function () {
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
            return response()->json(['message' => 'API funcionando', 'time' => now()]);
        });

        // ✅ RUTAS PARA INFORMACIÓN DEL USUARIO
        // Obtener máquina asignada al usuario autenticado (CON apellido del usuario)
        Route::get('/mi-maquina', [AsignacionUserMaquinaController::class, 'getMaquinaUsuario']);

        // 🆕 NUEVO: Obtener máquinas disponibles para selección (reemplazo del sistema de asignación fija)
        Route::get('/maquinas-disponibles', [AsignacionUserMaquinaController::class, 'getMaquinasDisponibles']);

        // 🆕 Alternativa: Solo información del usuario (opcional)
        Route::get('/mi-informacion', [AsignacionUserMaquinaController::class, 'miInformacion']);

        // ✅ RUTAS PARA ASIGNACIONES (ADMIN)
        // Obtener todas las asignaciones (admin)
        Route::get('/asignaciones', [AsignacionUserMaquinaController::class, 'index']);

        // Obtener asignación específica (admin)
        Route::get('/asignaciones/{id}', [AsignacionUserMaquinaController::class, 'show']);

        // Crear nueva asignación (admin)
        Route::post('/asignaciones', [AsignacionUserMaquinaController::class, 'store']);

        // Reasignar máquina (admin)
        Route::post('/asignaciones/reasignar', [AsignacionUserMaquinaController::class, 'reasignar']);

        // Desactivar asignación (admin)
        Route::patch('/asignaciones/{id}/desactivar', [AsignacionUserMaquinaController::class, 'desactivar']);

        // ✅ RUTAS PARA CARGAS EXTERNAS
        // Crear carga externa
        Route::post('/cargas-externas', [CargaExternaController::class, 'store']);

        // Listar cargas del usuario autenticado
        Route::get('/mis-cargas', [CargaExternaController::class, 'misCargas']);

        // Listar todas las cargas (admin)
        Route::get('/cargas-externas', [CargaExternaController::class, 'index']);

        // Ver carga específica
        Route::get('/cargas-externas/{id}', [CargaExternaController::class, 'show']);

        // Cargas del mes actual
        Route::get('/cargas-externas-mes-actual', [CargaExternaController::class, 'cargasMesActual']);
    });
});
