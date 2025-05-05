<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\APi\BodegaController;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\CategoriaMaquinaController;
use App\Http\Controllers\Api\ConsumoController;
use App\Http\Controllers\Api\FaenaController;
use App\Http\Controllers\Api\PersonalInternoController;
use App\Http\Controllers\Api\MaquinaInternaController;
use App\Http\Controllers\Api\IngresoPetroleoController;
use App\Http\Controllers\Api\EstanqueController;
use App\Http\Controllers\Api\InformeKpiController;
use App\Http\Controllers\Api\KpiValoresEntradaController;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

Route::post('/register', [AuthController::class, 'register']);

// Ruta para obtener un usuario por ID
Route::get('/user/{id}', [UserController::class, 'show']);

//RUTAS DE BODEGA
// Ruta para obtener todo el personal de bodega (personas y maquinarias mezcladas)
Route::get('/maquinarias-bodega', [BodegaController::class, 'obtenerMaquinarias']);
// Ruta para obtener solo el personal de bodega (personas y maquinarias mezcladas)
Route::middleware('auth:sanctum')->get('/personal-bodega', [BodegaController::class, 'index']);
// Ruta para obtener solo el personal de bodega (personas y maquinarias mezcladas) con RUT inválido
Route::get('/personal-bodega-invalidos', [BodegaController::class, 'rutInvalidos']);
//Ruta para obtener las maquinarias de la bodega.
Route::get('/maquinarias', [BodegaController::class, 'getMaquinarias']);


//RUTAS DE MAQUINARIAS
// Ruta para insertar una nueva maquinaria en la base de datos.
Route::apiResource('categorias-maquinas', CategoriaMaquinaController::class);
//Ruta para obtener todas las categorías de máquinas.
Route::get('/categorias', [CategoriaMaquinaController::class, 'index']);
//Ruta registro maquinas internas
Route::post('/maquinas-internas', [MaquinaInternaController::class, 'store']);
//Ruta para obtener todas las maquinas internas registradas
Route::get('/maquinas-internas-registradas', [MaquinaInternaController::class, 'index']);
//Ruta para obtener todas las maquinas internas registradas con permisos dadas por el administrador
Route::get('/maquinas-internas-permiso', [MaquinaInternaController::class, 'indexConPermisos']);




//RUTAS DE SOLICITANTES INTERNOS
// Ruta para registrar un nuevo usuario interno en la base de datos.
Route::post('/registrarUsuarioInterno', [PersonalInternoController::class, 'register']);
Route::get('/personal-internos', [PersonalInternoController::class, 'index']);
Route::get('/faenas-disponibles/{id_solicitante}', [FaenaController::class, 'faenasDisponibles']);
Route::post('/asignarPermisoSolicitante', [PersonalInternoController::class, 'asignarPermisoSolicitante']);
Route::get('/permisosFaenas', [FaenaController::class, 'getPermisosFaenas']);
Route::get('/verificarPermiso', [FaenaController::class, 'verificarPermiso']);
Route::get('/faenasDisponibles', [FaenaController::class, 'getFaenasDisponibles']);

//RUTAS RECEPCION PETROLEO
Route::get('/ingresos-petroleo', [IngresoPetroleoController::class, 'index']);
Route::post('/ingresos-petroleo', [IngresoPetroleoController::class, 'store']);

//RUTAS ESTANQUES
Route::get('/estanques/{id_faena}', [EstanqueController::class, 'estanquesPorFaena']);
Route::post('/calcular-litros-petroleo', [EstanqueController::class, 'calcularLitrosPetroleo']);
Route::get('/capacidad-disponible/{id_faena}', [EstanqueController::class, 'capacidadDisponible']);

//RUTAS DE FAENAS
// Ruta para obtener todas las faenas
Route::get('/faenas', [FaenaController::class, 'index']);


//RUTAS PARA EL CONSUMO
Route::post('/consumos', [ConsumoController::class, 'store']);

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

// Ruta para GERENTE
Route::apiResource('kpi-valores-entrada', KpiValoresEntradaController::class);
Route::apiResource('informes-kpi', InformeKpiController::class);
