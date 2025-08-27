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

        // Crear nueva asignación
        Route::post('/asignaciones', [AdminOperadorController::class, 'crearAsignacion']);

        // Finalizar asignación activa
        Route::post('/asignaciones/{id}/finalizar', [AdminOperadorController::class, 'finalizarAsignacion']);

        // ✅ ==========================================
        // 🚛 GESTIÓN DE MÁQUINAS (REGISTRO Y ADMINISTRACIÓN)
        // ✅ ==========================================

        // Obtener datos necesarios para el formulario (categorías, faenas, máquinas)
        Route::get('/maquinas/datos', [AdminOperadorController::class, 'obtenerDatosMaquinas']);

        // Listar todas las máquinas registradas
        Route::get('/maquinas/lista', [AdminOperadorController::class, 'listarMaquinas']);

        // Registrar nueva máquina (interna o externa)
        Route::post('/maquinas', [AdminOperadorController::class, 'registrarMaquina']);

        // Actualizar máquina existente
        Route::put('/maquinas/{id}', [AdminOperadorController::class, 'actualizarMaquina']);

        // Eliminar máquina
        Route::delete('/maquinas/{id}', [AdminOperadorController::class, 'eliminarMaquina']);

        // Ver detalle de una máquina específica
        Route::get('/maquinas/{id}', [AdminOperadorController::class, 'verMaquina']);

        // ========================================================================================
        // 👥 RUTAS PARA GESTIÓN DE USUARIOS
        // ========================================================================================

        // 📋 Obtener todos los datos necesarios (usuarios, faenas, roles, estadísticas)
        Route::get('/usuarios/datos', [AdminOperadorController::class, 'obtenerDatosUsuarios']);

        // 👤 CRUD básico de usuarios
        Route::get('/usuarios', [AdminOperadorController::class, 'obtenerDatosUsuarios']); // Alias para compatibilidad
        Route::post('/usuarios', [AdminOperadorController::class, 'crearUsuario']);
        Route::get('/usuarios/{id}', [AdminOperadorController::class, 'obtenerDetalleUsuario']);
        Route::put('/usuarios/{id}', [AdminOperadorController::class, 'actualizarUsuario']);

        // 🔄 Acciones especiales
        Route::patch('/usuarios/{id}/toggle-estado', [AdminOperadorController::class, 'toggleEstadoUsuario']);

        // 🔐 Rutas adicionales (si las necesitas después)
        Route::post('/usuarios/{id}/reset-password', [AdminOperadorController::class, 'resetearPassword']); // Para implementar después
        Route::get('/usuarios/{id}/historial', [AdminOperadorController::class, 'obtenerHistorialUsuario']); // Para implementar después

        // ========================================================================================
        // 📊 RUTAS PARA ESTADÍSTICAS DE USUARIOS (opcionales)
        // ========================================================================================

        Route::get('/usuarios/estadisticas/resumen', [AdminOperadorController::class, 'obtenerEstadisticasUsuarios']);
        Route::get('/usuarios/estadisticas/por-faena', [AdminOperadorController::class, 'obtenerUsuariosPorFaena']);
        Route::get('/usuarios/estadisticas/por-rol', [AdminOperadorController::class, 'obtenerUsuariosPorRol']);
    });
});
