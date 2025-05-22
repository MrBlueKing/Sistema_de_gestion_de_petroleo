<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\APi\BodegaController;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\CategoriaMaquinaController;
use App\Http\Controllers\Api\ConsumoController;
use App\Http\Controllers\Api\EmpresaExternaController;
use App\Http\Controllers\Api\FaenaController;
use App\Http\Controllers\Api\PersonalInternoController;
use App\Http\Controllers\Api\MaquinaInternaController;
use App\Http\Controllers\Api\IngresoPetroleoController;
use App\Http\Controllers\Api\EstanqueController;
use App\Http\Controllers\Api\InformeKpiController;
use App\Http\Controllers\Api\InformesController;
use App\Http\Controllers\Api\KpiCalculadoraController;
use App\Http\Controllers\Api\KpiCalculoController;
use App\Http\Controllers\Api\KpiHistoricoController;
use App\Http\Controllers\Api\KpiValoresEntradaController;
use App\Http\Controllers\Api\PersonalExternoController;
use App\Http\Controllers\Api\ProyeccionConsumoController;
use App\Http\Controllers\Api\TonelajeController;
use App\Http\Controllers\DatabaseCheckController;

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

Route::get('/solicitantes', [PersonalInternoController::class, 'listarSolicitantes']);

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



//RUTAS DE Entidades EXTERNAS
Route::post('/ingresos-empresas-externas', [EmpresaExternaController::class, 'store']);
Route::get('/empresas-disponibles', [EmpresaExternaController::class, 'index']);
Route::post('/registrar-personal-externo', [PersonalExternoController::class, 'store']);
Route::get('/personal-externos', [PersonalExternoController::class, 'index']);


//RUTAS DE SOLICITANTES INTERNOS
// Ruta para registrar un nuevo usuario interno en la base de datos.
Route::post('/registrarUsuarioInterno', [PersonalInternoController::class, 'register']);
Route::get('/personal-internos', [PersonalInternoController::class, 'index']);
Route::get('/faenas-disponibles/{id_solicitante}', [FaenaController::class, 'faenasDisponibles']);
Route::post('/asignarPermisoSolicitante', [PersonalInternoController::class, 'asignarPermisoSolicitante']);
Route::get('/permisosFaenas', [FaenaController::class, 'getPermisosFaenas']);
Route::get('/verificarPermiso', [FaenaController::class, 'verificarPermiso']);
Route::get('/faenasDisponibles', [FaenaController::class, 'getFaenasDisponibles']);

Route::get('/personal-internos-externos', [PersonalInternoController::class, 'indexInternoExterno']);



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
Route::apiResource('/kpi-valores-entrada', KpiValoresEntradaController::class);
Route::get('/informes-kpi', [InformeKpiController::class, 'index']);
Route::get('/informes-kpi/test', [InformeKpiController::class, 'test']);
Route::get('/informes-kpi/mes-anterior', [InformeKpiController::class, 'obtenerValoresMesAnterior']);

// Rutas para proyección de consumo
Route::get('/proyeccion-consumo', [ProyeccionConsumoController::class, 'getProyeccionAvanzada']);
Route::get('/proyeccion-consumo/equipos', [ProyeccionConsumoController::class, 'getEquiposConUltimoConsumo']);

// Ruta para proyeccion de consumos del dia de ayer
Route::get('/proyeccion-consumo-ayer', [ProyeccionConsumoController::class, 'getMaquinasConConsumoHastaAyer']);

// Ruta para proyeccion de consumo del dia de ayer v2
Route::get('/consumo-resumen-fecha', [ProyeccionConsumoController::class, 'getResumenConsumoParaFecha']);


// Nuevas rutas para proyección en rango
Route::get('/proyeccion-consumo/rango', [ProyeccionConsumoController::class, 'getMaquinasConConsumoEnRango']);
Route::get('/proyeccion-consumo/reporte', [ProyeccionConsumoController::class, 'getReporteProyeccionPorPeriodo']);


// Calculo de kpis de Distpach
Route::post('/calcular-kpis', [KpiCalculoController::class, 'calcular']);

Route::get('/datos-mes-anterior', [InformeKpiController::class, 'obtenerValoresMesAnterior']);

Route::get('/faenas-disponibles', [KpiCalculoController::class, 'getFaenasDisponibles']);

Route::get('/kpis-comparativos', [KpiCalculoController::class, 'obtenerKpisComparativos']);

Route::get('/kpis-getCostoPetroleoSinUltimosConsumos', [KpiCalculoController::class, 'getCostoPetroleoSinUltimosConsumos']);

// Rutas para valores de entrada
Route::get('/kpi-valores-entrada/verificar-permiso', [App\Http\Controllers\Api\KpiValoresEntradaController::class, 'verificarPermiso']);
Route::get('/kpi-valores-entrada-historial', [KpiValoresEntradaController::class, 'obtenerHistorial']);

//PROBANDO ESTAS APIS 
// Historial general de valores KPI
Route::get('/kpi-valores-entrada-historial', [KpiValoresEntradaController::class, 'getHistorialGeneral']);
// Historial de valores KPI por faena específica
Route::get('/kpi-valores-entrada-historial/faena/{idFaena}', [KpiValoresEntradaController::class, 'getHistorialPorFaena']);
// Estadísticas de KPI agrupadas por faena
Route::get('/kpi-estadisticas-por-faena', [KpiValoresEntradaController::class, 'getEstadisticasPorFaena']);
// Totales acumulados de todos los valores KPI
Route::get('/kpi-totales-acumulados', [KpiValoresEntradaController::class, 'getTotalesAcumulados']);

Route::get('/kpi-valores-entrada-historial-filtrado', [KpiValoresEntradaController::class, 'getHistorialFiltrado']);

// Rutas específicas para informes
Route::get('/informes-kpi/consumo-maquinas', [App\Http\Controllers\Api\InformesController::class, 'getConsumoMaquinas']);
Route::get('/informes-kpi/balance-combustible', [App\Http\Controllers\Api\InformesController::class, 'getBalanceCombustible']);



//PROBAR CONEXION BASE DE DATOS REAL 
Route::get('/check-databases', [DatabaseCheckController::class, 'check']);




// En routes/api.php
// Obtener faenas disponibles
Route::get('/faenas', [TonelajeController::class, 'getFaenas']);

// Obtener padrones de una faena
Route::get('/faenas/{id}/padrones', [TonelajeController::class, 'getPadrones']);

// Obtener registros del día
Route::get('/registros', [TonelajeController::class, 'getRegistros']);

// CRUD básico de tonelajes
Route::get('/tonelajes', [TonelajeController::class, 'index']);
Route::post('/tonelajes', [TonelajeController::class, 'store']);
Route::get('/tonelajes/{id}', [TonelajeController::class, 'show']);
Route::put('/tonelajes/{id}', [TonelajeController::class, 'update']);
Route::delete('/tonelajes/{id}', [TonelajeController::class, 'destroy']);

// Historial de un tonelaje
Route::get('/tonelajes/{id}/historial', [TonelajeController::class, 'getHistorial']);

// Verificar si un registro puede ser editado
Route::get('/tonelajes/{id}/puede-editar', [TonelajeController::class, 'puedeEditar']);
