<?php

use App\Http\Controllers\Api\AdminOperador\AdminOperadorController;
use App\Http\Controllers\Api\AdminOperador\MostrarDatosCargasController;
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

        // ===============================================================================
        // 📋 GESTIÓN DE CARGAS EXTERNAS (PAGINACIÓN + RUTAS ESPECÍFICAS PRIMERO)
        // ===============================================================================

        // 🔥 RUTAS ESPECÍFICAS PRIMERO (antes de rutas dinámicas con {id})

        // 🆕 NUEVA: Cargas con paginación y filtros avanzados
        Route::get('/cargas/paginadas', [MostrarDatosCargasController::class, 'listarCargasPaginadas'])
            ->name('api.admin-operador.cargas.paginadas');

        // Rutas específicas con {id} (antes de ruta genérica {id})
        Route::post('/cargas/{id}/rendir', [AdminOperadorController::class, 'rendir'])
            ->name('api.admin-operador.cargas.rendir');

        // 🔥 RUTAS GENERALES AL FINAL

        // Listar todas las cargas (método original)
        Route::get('/cargas', [AdminOperadorController::class, 'index'])
            ->name('api.admin-operador.cargas.index');

        // Ver detalle de una carga específica (AL FINAL para evitar conflictos)
        Route::get('/cargas/{id}', [AdminOperadorController::class, 'show'])
            ->name('api.admin-operador.cargas.show');

        // ===============================================================================
        // 🎯 GESTIÓN DE ASIGNACIONES MÁQUINA-OPERADOR
        // ===============================================================================

        // Obtener todos los datos necesarios para el drag & drop
        Route::get('/asignaciones/datos', [AdminOperadorController::class, 'obtenerDatos'])
            ->name('api.admin-operador.asignaciones.datos');

        // Crear nueva asignación
        Route::post('/asignaciones', [AdminOperadorController::class, 'crearAsignacion'])
            ->name('api.admin-operador.asignaciones.create');

        // Finalizar asignación activa
        Route::post('/asignaciones/{id}/finalizar', [AdminOperadorController::class, 'finalizarAsignacion'])
            ->name('api.admin-operador.asignaciones.finalizar');

        // ===============================================================================
        // 🚛 GESTIÓN DE MÁQUINAS (REGISTRO Y ADMINISTRACIÓN)
        // ===============================================================================

        // Rutas específicas primero
        Route::get('/maquinas/datos', [AdminOperadorController::class, 'obtenerDatosMaquinas'])
            ->name('api.admin-operador.maquinas.datos');

        Route::get('/maquinas/lista', [AdminOperadorController::class, 'listarMaquinas'])
            ->name('api.admin-operador.maquinas.lista');

        // CRUD de máquinas
        Route::post('/maquinas', [AdminOperadorController::class, 'registrarMaquina'])
            ->name('api.admin-operador.maquinas.create');

        Route::put('/maquinas/{id}', [AdminOperadorController::class, 'actualizarMaquina'])
            ->name('api.admin-operador.maquinas.update');

        Route::delete('/maquinas/{id}', [AdminOperadorController::class, 'eliminarMaquina'])
            ->name('api.admin-operador.maquinas.delete');

        Route::get('/maquinas/{id}', [AdminOperadorController::class, 'verMaquina'])
            ->name('api.admin-operador.maquinas.show');

        // ===============================================================================
        // 👥 GESTIÓN DE USUARIOS
        // ===============================================================================

        // Rutas específicas de usuarios primero
        Route::get('/usuarios/datos', [AdminOperadorController::class, 'obtenerDatosUsuarios'])
            ->name('api.admin-operador.usuarios.datos');

        Route::get('/usuarios/estadisticas/resumen', [AdminOperadorController::class, 'obtenerEstadisticasUsuarios'])
            ->name('api.admin-operador.usuarios.estadisticas.resumen');

        Route::get('/usuarios/estadisticas/por-faena', [AdminOperadorController::class, 'obtenerUsuariosPorFaena'])
            ->name('api.admin-operador.usuarios.estadisticas.por-faena');

        Route::get('/usuarios/estadisticas/por-rol', [AdminOperadorController::class, 'obtenerUsuariosPorRol'])
            ->name('api.admin-operador.usuarios.estadisticas.por-rol');

        // CRUD básico de usuarios
        Route::get('/usuarios', [AdminOperadorController::class, 'obtenerDatosUsuarios'])
            ->name('api.admin-operador.usuarios.index'); // Alias para compatibilidad

        Route::post('/usuarios', [AdminOperadorController::class, 'crearUsuario'])
            ->name('api.admin-operador.usuarios.create');

        // Rutas específicas con {id}
        Route::patch('/usuarios/{id}/toggle-estado', [AdminOperadorController::class, 'toggleEstadoUsuario'])
            ->name('api.admin-operador.usuarios.toggle-estado');

        Route::post('/usuarios/{id}/reset-password', [AdminOperadorController::class, 'resetearPassword'])
            ->name('api.admin-operador.usuarios.reset-password'); // Para implementar después

        Route::get('/usuarios/{id}/historial', [AdminOperadorController::class, 'obtenerHistorialUsuario'])
            ->name('api.admin-operador.usuarios.historial'); // Para implementar después

        Route::get('/usuarios/{id}', [AdminOperadorController::class, 'obtenerDetalleUsuario'])
            ->name('api.admin-operador.usuarios.show');

        Route::put('/usuarios/{id}', [AdminOperadorController::class, 'actualizarUsuario'])
            ->name('api.admin-operador.usuarios.update');
    });
});

