<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BodegaController;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\CategoriaMaquinaController;
use App\Http\Controllers\Api\CombustibleController;
use App\Http\Controllers\Api\ConsumoController;
use App\Http\Controllers\Api\ConsumoProyeccionController;
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
| 🔐 RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
|--------------------------------------------------------------------------
*/

// Autenticación básica
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Testing básico (mantener mínimo para desarrollo)
Route::get('/test-mantenimiento', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'API de mantenimiento funcionando correctamente',
        'timestamp' => now()
    ]);
});

Route::get('/faenasDisponibles', [FaenaController::class, 'getFaenasDisponibles']);
// Rutas para verificación de ingresos

Route::get('/verificacion-ingresos', [VerificacionIngresosController::class, 'index']);

// Obtener detalle de un ingreso específico
Route::get('/verificacion-ingresos{id}', [VerificacionIngresosController::class, 'show']);

// Obtener resumen de errores por período
Route::get('/verificacion-ingresos/resumen', [VerificacionIngresosController::class, 'resumen']);

/*
|--------------------------------------------------------------------------
| 🔒 RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | 🔐 AUTENTICACIÓN Y USUARIO
    |--------------------------------------------------------------------------
    */
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $user->load('faena', 'rol');
        return response()->json($user);
    });

    Route::get('/usuarios/recientes', [UserController::class, 'recientes']);
    Route::get('/user/{id}', [UserController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | 📦 BODEGA
    |--------------------------------------------------------------------------
    */
    Route::prefix('bodega')->group(function () {
        Route::get('/maquinarias', [BodegaController::class, 'obtenerMaquinarias']);
        Route::get('/personal', [BodegaController::class, 'index']);
        Route::get('/personal-invalidos', [BodegaController::class, 'rutInvalidos']);
        Route::get('/maquinarias-lista', [BodegaController::class, 'getMaquinarias']);
    });

    /*
    |--------------------------------------------------------------------------
    | 👨‍💼 PERSONAL INTERNO
    |--------------------------------------------------------------------------
    */
    Route::prefix('personal-interno')->group(function () {
        Route::get('/solicitantes', [PersonalInternoController::class, 'listarSolicitantes']);
        Route::post('/registrar', [PersonalInternoController::class, 'register']);
        Route::get('/', [PersonalInternoController::class, 'index']);
        Route::post('/asignar-permiso', [PersonalInternoController::class, 'asignarPermisoSolicitante']);
        Route::get('/interno-externo', [PersonalInternoController::class, 'indexInternoExterno']);
    });

    /*
    |--------------------------------------------------------------------------
    | 🏢 EMPRESAS EXTERNAS Y PERSONAL EXTERNO
    |--------------------------------------------------------------------------
    */
    Route::prefix('empresas-externas')->group(function () {
        Route::post('/', [EmpresaExternaController::class, 'store']);
        Route::get('/disponibles', [EmpresaExternaController::class, 'index']);
    });

    Route::prefix('personal-externo')->group(function () {
        Route::post('/registrar', [PersonalExternoController::class, 'store']);
        Route::get('/', [PersonalExternoController::class, 'index']);
    });

    /*
    |--------------------------------------------------------------------------
    | 🚛 MAQUINARIAS
    |--------------------------------------------------------------------------
    */
    Route::apiResource('categorias-maquinas', CategoriaMaquinaController::class);
    Route::get('/categorias', [CategoriaMaquinaController::class, 'index']);

    Route::prefix('maquinas-internas')->group(function () {
        Route::post('/', [MaquinaInternaController::class, 'store']);
        Route::get('/registradas', [MaquinaInternaController::class, 'index']);
        Route::get('/con-permisos', [MaquinaInternaController::class, 'indexConPermisos']);
    });

    /*
    |--------------------------------------------------------------------------
    | 🏭 FAENAS
    |--------------------------------------------------------------------------
    */
    Route::prefix('faenas')->group(function () {
        Route::get('/', [FaenaController::class, 'index']);
        Route::get('/disponibles/{id_solicitante}', [FaenaController::class, 'faenasDisponibles']);
        Route::get('/permisos', [FaenaController::class, 'getPermisosFaenas']);
        Route::get('/verificar-permiso', [FaenaController::class, 'verificarPermiso']);
        Route::get('/disponibles-general', [FaenaController::class, 'getFaenasDisponibles']);
    });

    /*
    |--------------------------------------------------------------------------
    | ⛽ GESTIÓN PETROLERA
    |--------------------------------------------------------------------------
    */
    Route::prefix('petroleo')->group(function () {
        // Ingresos de petróleo
        Route::prefix('ingresos')->group(function () {
            Route::get('/', [IngresoPetroleoController::class, 'index']);
            Route::post('/', [IngresoPetroleoController::class, 'store']);
        });

        // Estanques
        Route::prefix('estanques')->group(function () {
            Route::get('/{id_faena}', [EstanqueController::class, 'estanquesPorFaena']);
            Route::post('/calcular-litros', [EstanqueController::class, 'calcularLitrosPetroleo']);
            Route::get('/capacidad-disponible/{id_faena}', [EstanqueController::class, 'capacidadDisponible']);
        });

        // Consumos
        Route::post('/consumos', [ConsumoController::class, 'store']);
    });

    /*
    |--------------------------------------------------------------------------
    | 📊 KPIs Y ANÁLISIS
    |--------------------------------------------------------------------------
    */
    Route::prefix('kpi')->group(function () {
        Route::apiResource('valores-entrada', KpiValoresEntradaController::class);
        Route::get('/informes', [InformeKpiController::class, 'index']);
        Route::get('/informes/test', [InformeKpiController::class, 'test']);
        Route::get('/informes/mes-anterior', [InformeKpiController::class, 'obtenerValoresMesAnterior']);

        // Cálculos de KPIs
        Route::post('/calcular', [KpiCalculoController::class, 'calcular']);
        Route::get('/datos-mes-anterior', [InformeKpiController::class, 'obtenerValoresMesAnterior']);
        Route::get('/faenas-disponibles', [KpiCalculoController::class, 'getFaenasDisponibles']);
        Route::get('/comparativos', [KpiCalculoController::class, 'obtenerKpisComparativos']);
        Route::get('/costo-petroleo-sin-ultimos', [KpiCalculoController::class, 'getCostoPetroleoSinUltimosConsumos']);

        // Valores de entrada KPI
        Route::get('/verificar-permiso', [KpiValoresEntradaController::class, 'verificarPermiso']);
        Route::get('/historial', [KpiValoresEntradaController::class, 'obtenerHistorial']);
        Route::get('/historial-general', [KpiValoresEntradaController::class, 'getHistorialGeneral']);
        Route::get('/historial/faena/{idFaena}', [KpiValoresEntradaController::class, 'getHistorialPorFaena']);
        Route::get('/estadisticas-por-faena', [KpiValoresEntradaController::class, 'getEstadisticasPorFaena']);
        Route::get('/totales-acumulados', [KpiValoresEntradaController::class, 'getTotalesAcumulados']);
        Route::get('/historial-filtrado', [KpiValoresEntradaController::class, 'getHistorialFiltrado']);

        // Informes específicos
        Route::get('/consumo-maquinas', [InformesController::class, 'getConsumoMaquinas']);
        Route::get('/balance-combustible', [InformesController::class, 'getBalanceCombustible']);
    });

    /*
    |--------------------------------------------------------------------------
    | 📈 PROYECCIONES DE CONSUMO
    |--------------------------------------------------------------------------
    */
    Route::prefix('proyeccion-consumo')->group(function () {
        Route::get('/', [ProyeccionConsumoController::class, 'getProyeccionAvanzada']);
        Route::get('/equipos', [ProyeccionConsumoController::class, 'getEquiposConUltimoConsumo']);
        Route::get('/ayer', [ProyeccionConsumoController::class, 'getMaquinasConConsumoHastaAyer']);
        Route::get('/resumen-fecha', [ProyeccionConsumoController::class, 'getResumenConsumoParaFecha']);
        Route::get('/rango', [ProyeccionConsumoController::class, 'getMaquinasConConsumoEnRango']);
        Route::get('/reporte', [ProyeccionConsumoController::class, 'getReporteProyeccionPorPeriodo']);
        Route::get('/test', [ProyeccionConsumoController::class, 'getKpisConProyeccion']);
    });

    Route::prefix('proyeccion-consumo2')->group(function () {
        Route::post('/proyeccion', [ConsumoProyeccionController::class, 'calcularConsumoRango']);
        Route::post('/proyeccion/maquina/{id}', [ConsumoProyeccionController::class, 'calcularMaquinaIndividual']);
        Route::get('/configuracion', [ConsumoProyeccionController::class, 'obtenerConfiguracion']);
    });

    /*
    |--------------------------------------------------------------------------
    | ⚖️ TONELAJES
    |--------------------------------------------------------------------------
    */
    Route::prefix('tonelajes')->group(function () {
        Route::get('/faenas', [TonelajeController::class, 'getFaenas']);
        Route::get('/faenas/{id}/padrones', [TonelajeController::class, 'getPadrones']);
        Route::get('/registros', [TonelajeController::class, 'getRegistros']);

        // CRUD básico de tonelajes
        Route::get('/', [TonelajeController::class, 'index']);
        Route::post('/', [TonelajeController::class, 'store']);
        Route::get('/{id}', [TonelajeController::class, 'show']);
        Route::put('/{id}', [TonelajeController::class, 'update']);
        Route::delete('/{id}', [TonelajeController::class, 'destroy']);
        Route::get('/{id}/historial', [TonelajeController::class, 'getHistorial']);
        Route::get('/{id}/puede-editar', [TonelajeController::class, 'puedeEditar']);
    });

    /*
    |--------------------------------------------------------------------------
    | 🔧 MANTENIMIENTO
    |--------------------------------------------------------------------------
    */
    Route::prefix('mantenimiento')->group(function () {
        Route::get('/', [MantenimientoController::class, 'index']);
        Route::post('/', [MantenimientoController::class, 'store']);
        Route::get('/{id}/historial', [MantenimientoController::class, 'historial']);
        Route::put('/{id}/operativa', [MantenimientoController::class, 'marcarOperativa']);
        Route::get('/estadisticas', [MantenimientoController::class, 'estadisticas']);
        Route::post('/programar', [MantenimientoController::class, 'programarMantenimiento']);
        Route::get('/alertas', [MantenimientoController::class, 'obtenerAlertas']);
        Route::get('/reporte/export', [MantenimientoController::class, 'exportarReporte']);
        Route::get('/costos', [MantenimientoController::class, 'obtenerCostos']);
        Route::get('/dashboard', [MantenimientoController::class, 'dashboard']);
    });

    Route::prefix('maquinas')->group(function () {
        Route::get('/', [MantenimientoController::class, 'obtenerMaquinas']);
        Route::get('/{id}', [MantenimientoController::class, 'obtenerMaquina']);
        Route::put('/{id}/configuracion', [MantenimientoController::class, 'actualizarConfiguracion']);
        Route::get('/{id}/metricas', [MantenimientoController::class, 'obtenerMetricas']);
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
        Route::get('/faenas-prod', 'getFaenas');
        Route::get('/filtrada', 'getProduccionFiltrada');
    });

    /*
    |--------------------------------------------------------------------------
    | 🛢️ CONTROL DE COMBUSTIBLE
    |--------------------------------------------------------------------------
    */
    Route::prefix('combustible')->controller(CombustibleController::class)->group(function () {
        // Dashboard principal
        Route::get('/dashboard/{idFaena?}', 'dashboard');
        Route::get('/dashboard', 'dashboard');

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

    /*
    |--------------------------------------------------------------------------
    | 📄 REPORTES PDF
    |--------------------------------------------------------------------------
    */
    Route::prefix('reportes')->group(function () {
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
    | 🧪 TESTING Y VERIFICACIÓN (SOLO PARA DESARROLLO)
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

    /*
    |--------------------------------------------------------------------------
    | 📂 CATEGORÍAS (MANTENIMIENTO)
    |--------------------------------------------------------------------------
     OJOOOOOOOOOOO QUE SE CAMBIO POR PROBLEMAS CON CATEGORIAS MAQUINAS*/
    Route::prefix('categoriasMantenimiento')->group(function () {
        Route::get('/', [MantenimientoController::class, 'obtenerCategorias']);
        Route::post('/', [MantenimientoController::class, 'crearCategoria']);
        Route::put('/{id}', [MantenimientoController::class, 'actualizarCategoria']);
        Route::delete('/{id}', [MantenimientoController::class, 'eliminarCategoria']);
    });

    // Rutas legacy que mantienes por compatibilidad (considera migrar estas)
    Route::get('/maquinarias-bodega', [BodegaController::class, 'obtenerMaquinarias']);
    Route::get('/personal-bodega', [BodegaController::class, 'index']);
    Route::get('/personal-bodega-invalidos', [BodegaController::class, 'rutInvalidos']);
    Route::get('/maquinarias', [BodegaController::class, 'getMaquinarias']);
    Route::get('/solicitantes', [PersonalInternoController::class, 'listarSolicitantes']);
    Route::post('/registrarUsuarioInterno', [PersonalInternoController::class, 'register']);
    Route::get('/personal-internos', [PersonalInternoController::class, 'index']);
    Route::post('/asignarPermisoSolicitante', [PersonalInternoController::class, 'asignarPermisoSolicitante']);
    Route::get('/personal-internos-externos', [PersonalInternoController::class, 'indexInternoExterno']);
    Route::post('/ingresos-empresas-externas', [EmpresaExternaController::class, 'store']);
    Route::get('/empresas-disponibles', [EmpresaExternaController::class, 'index']);
    Route::post('/registrar-personal-externo', [PersonalExternoController::class, 'store']);
    Route::get('/personal-externos', [PersonalExternoController::class, 'index']);
    Route::post('/maquinas-internas', [MaquinaInternaController::class, 'store']);
    Route::get('/maquinas-internas-registradas', [MaquinaInternaController::class, 'index']);
    Route::get('/maquinas-internas-permiso', [MaquinaInternaController::class, 'indexConPermisos']);
    Route::get('/faenas', [FaenaController::class, 'index']);
    Route::get('/faenas-disponibles/{id_solicitante}', [FaenaController::class, 'faenasDisponibles']);
    Route::get('/permisosFaenas', [FaenaController::class, 'getPermisosFaenas']);
    Route::get('/verificarPermiso', [FaenaController::class, 'verificarPermiso']);
    Route::get('/faenasDisponibles', [FaenaController::class, 'getFaenasDisponibles']);
    Route::get('/ingresos-petroleo', [IngresoPetroleoController::class, 'index']);
    Route::post('/ingresos-petroleo', [IngresoPetroleoController::class, 'store']);
    Route::get('/estanques/{id_faena}', [EstanqueController::class, 'estanquesPorFaena']);
    Route::post('/calcular-litros-petroleo', [EstanqueController::class, 'calcularLitrosPetroleo']);
    Route::get('/capacidad-disponible/{id_faena}', [EstanqueController::class, 'capacidadDisponible']);
    Route::post('/consumos', [ConsumoController::class, 'store']);
    Route::apiResource('/kpi-valores-entrada', KpiValoresEntradaController::class);
    Route::get('/informes-kpi', [InformeKpiController::class, 'index']);
    Route::get('/informes-kpi/test', [InformeKpiController::class, 'test']);
    Route::get('/informes-kpi/mes-anterior', [InformeKpiController::class, 'obtenerValoresMesAnterior']);
    Route::post('/calcular-kpis', [KpiCalculoController::class, 'calcular']);
    Route::get('/datos-mes-anterior', [InformeKpiController::class, 'obtenerValoresMesAnterior']);
    Route::get('/faenas-disponibles', [KpiCalculoController::class, 'getFaenasDisponibles']);
    Route::get('/kpis-comparativos', [KpiCalculoController::class, 'obtenerKpisComparativos']);
    Route::get('/kpis-getCostoPetroleoSinUltimosConsumos', [KpiCalculoController::class, 'getCostoPetroleoSinUltimosConsumos']);
    Route::get('/kpi-valores-entrada/verificar-permiso', [KpiValoresEntradaController::class, 'verificarPermiso']);
    Route::get('/kpi-valores-entrada-historial', [KpiValoresEntradaController::class, 'obtenerHistorial']);
    Route::get('/kpi-valores-entrada-historial', [KpiValoresEntradaController::class, 'getHistorialGeneral']);
    Route::get('/kpi-valores-entrada-historial/faena/{idFaena}', [KpiValoresEntradaController::class, 'getHistorialPorFaena']);
    Route::get('/kpi-estadisticas-por-faena', [KpiValoresEntradaController::class, 'getEstadisticasPorFaena']);
    Route::get('/kpi-totales-acumulados', [KpiValoresEntradaController::class, 'getTotalesAcumulados']);
    Route::get('/kpi-valores-entrada-historial-filtrado', [KpiValoresEntradaController::class, 'getHistorialFiltrado']);
    Route::get('/informes-kpi/consumo-maquinas', [InformesController::class, 'getConsumoMaquinas']);
    Route::get('/informes-kpi/balance-combustible', [InformesController::class, 'getBalanceCombustible']);
    Route::get('/proyeccion-consumo', [ProyeccionConsumoController::class, 'getProyeccionAvanzada']);
    Route::get('/proyeccion-consumo/equipos', [ProyeccionConsumoController::class, 'getEquiposConUltimoConsumo']);
    Route::get('/proyeccion-consumo-ayer', [ProyeccionConsumoController::class, 'getMaquinasConConsumoHastaAyer']);
    Route::get('/consumo-resumen-fecha', [ProyeccionConsumoController::class, 'getResumenConsumoParaFecha']);
    Route::get('/proyeccion-consumo/rango', [ProyeccionConsumoController::class, 'getMaquinasConConsumoEnRango']);
    Route::get('/proyeccion-consumo/reporte', [ProyeccionConsumoController::class, 'getReporteProyeccionPorPeriodo']);
    Route::get('/proyeccion-test', [ProyeccionConsumoController::class, 'getKpisConProyeccion']);
    Route::get('/faenasTon', [TonelajeController::class, 'getFaenas']);
    Route::get('/faenasTon/{id}/padrones', [TonelajeController::class, 'getPadrones']);
    Route::get('/registros', [TonelajeController::class, 'getRegistros']);
    Route::get('/tonelajes', [TonelajeController::class, 'index']);
    Route::post('/tonelajes', [TonelajeController::class, 'store']);
    Route::get('/tonelajes/{id}', [TonelajeController::class, 'show']);
    Route::put('/tonelajes/{id}', [TonelajeController::class, 'update']);
    Route::delete('/tonelajes/{id}', [TonelajeController::class, 'destroy']);
    Route::get('/tonelajes/{id}/historial', [TonelajeController::class, 'getHistorial']);
    Route::get('/tonelajes/{id}/puede-editar', [TonelajeController::class, 'puedeEditar']);
    Route::get('/reporte/pdf', [ReporteController::class, 'generarPDF']);
});
