<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\APi\BodegaController;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\Api\PersonalInternoController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

Route::post('/register', [AuthController::class, 'register']);

// Ruta para obtener un usuario por ID
Route::get('/user/{id}', [UserController::class, 'show']);

Route::get('/maquinarias-bodega', [BodegaController::class, 'obtenerMaquinarias']);

Route::middleware('auth:sanctum')->get('/personal-bodega', [BodegaController::class, 'index']);

//RUTAS DE SOLICITANTES INTERNOS
// Ruta para registrar un nuevo usuario interno en la base de datos.
Route::post('/registrarUsuarioInterno', [PersonalInternoController::class, 'register']);
Route::get('/personal-internos', [PersonalInternoController::class, 'index']);


Route::get('/test-bodega', function () {
    try {
        $result = DB::connection('bodega')->table('personal')->limit(1)->get();
        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
});

// Ruta protegida por Sanctum
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
Route::middleware('auth:sanctum')->get('/usuarios/recientes', [UserController::class, 'recientes']);

