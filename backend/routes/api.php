<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\APi\BodegaController;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\CategoriaMaquinaController;
use App\Http\Controllers\Api\CombustibleController;
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
use App\Http\Controllers\Api\MantenimientoController;
use App\Http\Controllers\Api\PersonalExternoController;
use App\Http\Controllers\Api\ProyeccionConsumoController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\TonelajeController;
use App\Http\Controllers\DatabaseCheckController;
use App\Http\Controllers\Api\ProduccionController;
use App\Http\Controllers\Api\VerificacionIngresosController;


/*
|--------------------------------------------------------------------------
| 🔐 AUTENTICACIÓN
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Rutas protegidas por Sanctum
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();

    // Cargar la relación con la faena
    $user->load('faena');

    // Agregar el nombre de la faena a la respuesta
    $userData = $user->toArray();

    return response()->json($userData);
});

Route::middleware('auth:sanctum')->get('/usuarios/recientes', [UserController::class, 'recientes']);

/*
|--------------------------------------------------------------------------
| 👥 USUARIOS
|--------------------------------------------------------------------------
*/
Route::get('/user/{id}', [UserController::class, 'show']);

/*
|--------------------------------------------------------------------------
| 📦 BODEGA
|--------------------------------------------------------------------------
*/
Route::get('/maquinarias-bodega', [BodegaController::class, 'obtenerMaquinarias']);
Route::middleware('auth:sanctum')->get('/personal-bodega', [BodegaController::class, 'index']);
Route::get('/personal-bodega-invalidos', [BodegaController::class, 'rutInvalidos']);
Route::get('/maquinarias', [BodegaController::class, 'getMaquinarias']);

/*
|--------------------------------------------------------------------------
| 👨‍💼 PERSONAL INTERNO
|--------------------------------------------------------------------------
*/
Route::get('/solicitantes', [PersonalInternoController::class, 'listarSolicitantes']);
Route::post('/registrarUsuarioInterno', [PersonalInternoController::class, 'register']);
Route::get('/personal-internos', [PersonalInternoController::class, 'index']);
Route::post('/asignarPermisoSolicitante', [PersonalInternoController::class, 'asignarPermisoSolicitante']);
Route::get('/personal-internos-externos', [PersonalInternoController::class, 'indexInternoExterno']);

/*
|--------------------------------------------------------------------------
| 🏢 EMPRESAS EXTERNAS Y PERSONAL EXTERNO
|--------------------------------------------------------------------------
*/
Route::post('/ingresos-empresas-externas', [EmpresaExternaController::class, 'store']);
Route::get('/empresas-disponibles', [EmpresaExternaController::class, 'index']);
Route::post('/registrar-personal-externo', [PersonalExternoController::class, 'store']);
Route::get('/personal-externos', [PersonalExternoController::class, 'index']);

/*
|--------------------------------------------------------------------------
| 🚛 MAQUINARIAS
|--------------------------------------------------------------------------
*/
Route::apiResource('categorias-maquinas', CategoriaMaquinaController::class);
Route::get('/categorias', [CategoriaMaquinaController::class, 'index']);
Route::post('/maquinas-internas', [MaquinaInternaController::class, 'store']);
Route::get('/maquinas-internas-registradas', [MaquinaInternaController::class, 'index']);
Route::get('/maquinas-internas-permiso', [MaquinaInternaController::class, 'indexConPermisos']);

/*
|--------------------------------------------------------------------------
| 🏭 FAENAS
|--------------------------------------------------------------------------
*/
Route::get('/faenas', [FaenaController::class, 'index']);
Route::get('/faenas-disponibles/{id_solicitante}', [FaenaController::class, 'faenasDisponibles']);
Route::get('/permisosFaenas', [FaenaController::class, 'getPermisosFaenas']);
Route::get('/verificarPermiso', [FaenaController::class, 'verificarPermiso']);
Route::get('/faenasDisponibles', [FaenaController::class, 'getFaenasDisponibles']);


/*
|--------------------------------------------------------------------------
| ⛽ GESTIÓN PETROLERA
|--------------------------------------------------------------------------
*/
// Ingresos de petróleo
Route::get('/ingresos-petroleo', [IngresoPetroleoController::class, 'index']);
Route::post('/ingresos-petroleo', [IngresoPetroleoController::class, 'store']);

// Estanques
Route::get('/estanques/{id_faena}', [EstanqueController::class, 'estanquesPorFaena']);
Route::post('/calcular-litros-petroleo', [EstanqueController::class, 'calcularLitrosPetroleo']);
Route::get('/capacidad-disponible/{id_faena}', [EstanqueController::class, 'capacidadDisponible']);

// Consumos
Route::post('/consumos', [ConsumoController::class, 'store']);

/*
|--------------------------------------------------------------------------
| 📊 KPIs Y ANÁLISIS
|--------------------------------------------------------------------------
*/
Route::apiResource('/kpi-valores-entrada', KpiValoresEntradaController::class);
Route::get('/informes-kpi', [InformeKpiController::class, 'index']);
Route::get('/informes-kpi/test', [InformeKpiController::class, 'test']);
Route::get('/informes-kpi/mes-anterior', [InformeKpiController::class, 'obtenerValoresMesAnterior']);

// Cálculos de KPIs
Route::post('/calcular-kpis', [KpiCalculoController::class, 'calcular']);
Route::get('/datos-mes-anterior', [InformeKpiController::class, 'obtenerValoresMesAnterior']);
Route::get('/faenas-disponibles', [KpiCalculoController::class, 'getFaenasDisponibles']);
Route::get('/kpis-comparativos', [KpiCalculoController::class, 'obtenerKpisComparativos']);
Route::get('/kpis-getCostoPetroleoSinUltimosConsumos', [KpiCalculoController::class, 'getCostoPetroleoSinUltimosConsumos']);

// Valores de entrada KPI
Route::get('/kpi-valores-entrada/verificar-permiso', [App\Http\Controllers\Api\KpiValoresEntradaController::class, 'verificarPermiso']);
Route::get('/kpi-valores-entrada-historial', [KpiValoresEntradaController::class, 'obtenerHistorial']);
Route::get('/kpi-valores-entrada-historial', [KpiValoresEntradaController::class, 'getHistorialGeneral']);
Route::get('/kpi-valores-entrada-historial/faena/{idFaena}', [KpiValoresEntradaController::class, 'getHistorialPorFaena']);
Route::get('/kpi-estadisticas-por-faena', [KpiValoresEntradaController::class, 'getEstadisticasPorFaena']);
Route::get('/kpi-totales-acumulados', [KpiValoresEntradaController::class, 'getTotalesAcumulados']);
Route::get('/kpi-valores-entrada-historial-filtrado', [KpiValoresEntradaController::class, 'getHistorialFiltrado']);

// Informes específicos
Route::get('/informes-kpi/consumo-maquinas', [App\Http\Controllers\Api\InformesController::class, 'getConsumoMaquinas']);
Route::get('/informes-kpi/balance-combustible', [App\Http\Controllers\Api\InformesController::class, 'getBalanceCombustible']);

/*
|--------------------------------------------------------------------------
| 📈 PROYECCIONES DE CONSUMO
|--------------------------------------------------------------------------
*/
Route::get('/proyeccion-consumo', [ProyeccionConsumoController::class, 'getProyeccionAvanzada']);
Route::get('/proyeccion-consumo/equipos', [ProyeccionConsumoController::class, 'getEquiposConUltimoConsumo']);
Route::get('/proyeccion-consumo-ayer', [ProyeccionConsumoController::class, 'getMaquinasConConsumoHastaAyer']);
Route::get('/consumo-resumen-fecha', [ProyeccionConsumoController::class, 'getResumenConsumoParaFecha']);
Route::get('/proyeccion-consumo/rango', [ProyeccionConsumoController::class, 'getMaquinasConConsumoEnRango']);
Route::get('/proyeccion-consumo/reporte', [ProyeccionConsumoController::class, 'getReporteProyeccionPorPeriodo']);


Route::get('/proyeccion-test', [ProyeccionConsumoController::class, 'getKpisConProyeccion']);

/*
|--------------------------------------------------------------------------
| ⚖️ TONELAJES
|--------------------------------------------------------------------------
*/
Route::get('/faenasTon', [TonelajeController::class, 'getFaenas']);
Route::get('/faenasTon/{id}/padrones', [TonelajeController::class, 'getPadrones']);
Route::get('/registros', [TonelajeController::class, 'getRegistros']);

// CRUD básico de tonelajes
Route::get('/tonelajes', [TonelajeController::class, 'index']);
Route::post('/tonelajes', [TonelajeController::class, 'store']);
Route::get('/tonelajes/{id}', [TonelajeController::class, 'show']);
Route::put('/tonelajes/{id}', [TonelajeController::class, 'update']);
Route::delete('/tonelajes/{id}', [TonelajeController::class, 'destroy']);
Route::get('/tonelajes/{id}/historial', [TonelajeController::class, 'getHistorial']);
Route::get('/tonelajes/{id}/puede-editar', [TonelajeController::class, 'puedeEditar']);

/*
|--------------------------------------------------------------------------
| 🔧 MANTENIMIENTO
|--------------------------------------------------------------------------
*/
Route::prefix('mantenimiento')->group(function () {
    Route::get('/', [MantenimientoController::class, 'index']);
    Route::post('/', [MantenimientoController::class, 'store']);
    Route::get('{id}/historial', [MantenimientoController::class, 'historial']);
    Route::put('{id}/operativa', [MantenimientoController::class, 'marcarOperativa']);
    Route::get('estadisticas', [MantenimientoController::class, 'estadisticas']);
    Route::post('programar', [MantenimientoController::class, 'programarMantenimiento']);
    Route::get('alertas', [MantenimientoController::class, 'obtenerAlertas']);
    Route::get('reporte/export', [MantenimientoController::class, 'exportarReporte']);
    Route::get('costos', [MantenimientoController::class, 'obtenerCostos']);
    Route::get('dashboard', [MantenimientoController::class, 'dashboard']);
});

Route::prefix('maquinas')->group(function () {
    Route::get('/', [MantenimientoController::class, 'obtenerMaquinas']);
    Route::get('{id}', [MantenimientoController::class, 'obtenerMaquina']);
    Route::put('{id}/configuracion', [MantenimientoController::class, 'actualizarConfiguracion']);
    Route::get('{id}/metricas', [MantenimientoController::class, 'obtenerMetricas']);
});

Route::prefix('categorias')->group(function () {
    Route::get('/', [MantenimientoController::class, 'obtenerCategorias']);
    Route::post('/', [MantenimientoController::class, 'crearCategoria']);
    Route::put('{id}', [MantenimientoController::class, 'actualizarCategoria']);
    Route::delete('{id}', [MantenimientoController::class, 'eliminarCategoria']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    // Las rutas que necesiten autenticación pueden ir aquí cuando estés listo
});

/*
|--------------------------------------------------------------------------
| 📄 REPORTES PDF
|--------------------------------------------------------------------------
*/
Route::get('/reporte/pdf', [ReporteController::class, 'generarPDF']);

Route::group(['prefix' => 'reportes'], function () {
    Route::get('/prueba', [ReporteController::class, 'generarReportePrueba']);
    Route::get('/pdf', [ReporteController::class, 'generarPDF']);
    Route::post('/completo', [ReporteController::class, 'generarReporteCompleto']);
    Route::post('/consumos', [ReporteController::class, 'reporteConsumosPorPeriodo']);
    Route::post('/stock', [ReporteController::class, 'reporteStockActual']);
    Route::post('/rendimiento', [ReporteController::class, 'reporteRendimientoMaquinas']);
    Route::post('/preview', [ReporteController::class, 'previewReporte']);
});

/*
|--------------------------------------------------------------------------
| 🧪 TESTING Y VERIFICACIÓN
|--------------------------------------------------------------------------
*/
Route::get('/check-databases', [DatabaseCheckController::class, 'check']);

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

Route::get('/test-mantenimiento', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'API de mantenimiento funcionando correctamente',
        'timestamp' => now(),
        'endpoints' => [
            'GET /api/mantenimiento' => 'Obtener estado de máquinas',
            'POST /api/mantenimiento' => 'Registrar mantenimiento',
            'GET /api/mantenimiento/{id}/historial' => 'Obtener historial',
            'PUT /api/mantenimiento/{id}/operativa' => 'Marcar como operativa',
            'GET /api/mantenimiento/estadisticas' => 'Obtener estadísticas'
        ]
    ]);
});


/*
|--------------------------------------------------------------------------
| 📊 GESTIÓN DE PRODUCCIÓN
|--------------------------------------------------------------------------
*/
Route::prefix('produccion')->controller(ProduccionController::class)->group(function () {
    Route::get('/dashboard', 'dashboard');
    Route::get('/faena/{id}', 'getEstadisticasFaena');
    Route::get('/por-faena/{dias?}', 'getProduccionPorFaena');
    Route::get('/por-planta', 'getProduccionPorPlanta');
    Route::get('/top-padrones/{limite?}', 'getTopPadronesProductores');
    Route::get('/tendencia/{dias?}', 'getTendenciaProduccion');
    Route::get('/diaria/ultima', 'getProduccionDiariaUltima');
    Route::get('/diaria', 'getProduccionDiariaPorFecha');

    // NUEVAS RUTAS PARA FILTROS AVANZADOS
    Route::get('/faenasProd', 'getFaenas');
    Route::get('/filtrada', 'getProduccionFiltrada');
});

/*
|--------------------------------------------------------------------------
| 🛢️ CONTROL DE COMBUSTIBLE (puede que se tenga que borrar de momento esta en el limbo)
|--------------------------------------------------------------------------
*/
Route::prefix('combustible')->controller(CombustibleController::class)->group(function () {
    // Dashboard principal
    Route::get('/dashboard', 'dashboard');
    Route::get('/dashboard/{idFaena?}', 'dashboardPorFaena');

    // Stock y estanques
    Route::get('/stock/general', 'getStockGeneral');
    Route::get('/stock/por-faena', 'getStockPorFaena');
    Route::get('/stock/detalle/{idFaena}', 'getDetalleStockFaena');
    Route::get('/estanques/capacidad', 'getCapacidadEstanques');
    Route::get('/estanques/alertas', 'getAlertasStock');

    // Ingresos de combustible
    Route::get('/ingresos/historial', 'getHistorialIngresos');
    Route::get('/ingresos/ultimos/{dias?}', 'getIngresosRecientes');
    Route::get('/ingresos/estadisticas', 'getEstadisticasIngresos');
    Route::get('/ingresos/por-periodo', 'getIngresosPorPeriodo');

    // Consumos
    Route::get('/consumos/resumen', 'getResumenConsumos');
    Route::get('/consumos/por-equipo', 'getConsumosPorEquipo');
    Route::get('/consumos/por-faena', 'getConsumosPorFaena');
    Route::get('/consumos/tendencia', 'getTendenciaConsumos');
    Route::get('/consumos/eficiencia', 'getEficienciaConsumos');
    Route::get('/consumos/ultimos/{dias?}', 'getConsumosRecientes');

    // Análisis financiero
    Route::get('/costos/resumen', 'getResumenCostos');
    Route::get('/costos/por-periodo', 'getCostosPorPeriodo');
    Route::get('/costos/proyeccion', 'getProyeccionCostos');
    Route::get('/precios/historial', 'getHistorialPrecios');

    // Análisis y proyecciones
    Route::get('/analisis/rendimiento', 'getAnalisisRendimiento');
    Route::get('/proyecciones/stock', 'getProyeccionStock');
    Route::get('/alertas/sistema', 'getAlertasSistema');
    Route::get('/movimientos/historial', 'getHistorialMovimientos');

    // Reportes específicos
    Route::get('/reportes/balance', 'getReporteBalance');
    Route::get('/reportes/consumo-detallado', 'getReporteConsumoDetallado');
    Route::get('/reportes/eficiencia-equipos', 'getReporteEficienciaEquipos');
});

// Rutas para verificación de ingresos

Route::get('/verificacion-ingresos', [VerificacionIngresosController::class, 'index']);

// Obtener detalle de un ingreso específico
Route::get('/verificacion-ingresos{id}', [VerificacionIngresosController::class, 'show']);

// Obtener resumen de errores por período
Route::get('/verificacion-ingresos/resumen', [VerificacionIngresosController::class, 'resumen']);
