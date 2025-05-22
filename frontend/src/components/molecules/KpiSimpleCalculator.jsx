import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaCalculator,
  FaTruck,
  FaCalendarAlt,
  FaGasPump,
  FaClock,
  FaChartLine,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTachometerAlt,
  FaRoad,
  FaWarehouse,
  FaLock,
  FaCheckCircle,
  FaSpinner,
  FaDownload,
  FaEye,
  FaSync
} from "react-icons/fa";
import PropTypes from 'prop-types';
import { gerenteService } from "../../context/apiService";

const DailyKpiCalculator = ({
  onCalculate,
  periodo = "diario",
  showExportOptions = false,
  compactMode = false
}) => {
  // Estados principales del formulario
  const [formData, setFormData] = useState({
    toneladas: "",
    camionadas: "",
    faena: "",
    fechaReporte: "",
    fechaProduccion: ""
  });

  // Estados de carga y errores
  const [loadingStates, setLoadingStates] = useState({
    faenas: false,
    consumoData: false,
    submitting: false
  });

  // Estados de datos
  const [dataStates, setDataStates] = useState({
    faenas: [],
    consumoResponse: null, // Respuesta completa de la API
    errors: {
      faenas: null,
      consumo: null,
      validation: null
    }
  });

  // Estados de UI
  const [uiStates, setUiStates] = useState({
    showDetailedView: false,
    showValidationHelper: true,
    formTouched: false
  });

  // Inicialización de fechas al cargar el componente
  useEffect(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    setFormData(prev => ({
      ...prev,
      fechaReporte: today.toISOString().split('T')[0],
      fechaProduccion: yesterday.toISOString().split('T')[0]
    }));

    loadFaenasData();
  }, []);

  // Cargar datos de consumo cuando cambia la faena
  useEffect(() => {
    if (formData.faena && formData.fechaProduccion) {
      loadConsumoData();
    }
  }, [formData.faena, formData.fechaProduccion]);

  // Función para cargar faenas
  const loadFaenasData = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, faenas: true }));
      setDataStates(prev => ({
        ...prev,
        errors: { ...prev.errors, faenas: null }
      }));

      const response = await gerenteService.getFaenasDisponibles();

      if (response.status === 'success' && Array.isArray(response.data)) {
        setDataStates(prev => ({ ...prev, faenas: response.data }));
        
        // Seleccionar la primera faena por defecto
        if (response.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            faena: response.data[0].id_faena.toString()
          }));
        }
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error al cargar faenas:', error);
      setDataStates(prev => ({
        ...prev,
        errors: { ...prev.errors, faenas: 'No se pudieron cargar las faenas disponibles' }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, faenas: false }));
    }
  }, []);

  // Función para cargar datos de consumo
  const loadConsumoData = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, consumoData: true }));
      setDataStates(prev => ({
        ...prev,
        errors: { ...prev.errors, consumo: null }
      }));

      const response = await gerenteService.getResumenConsumoParaFecha(
        formData.faena,
        formData.fechaProduccion
      );

      console.log('Respuesta de consumo:', response); // Para debugging

      if (response.status === 'success' && response.data) {
        setDataStates(prev => ({ ...prev, consumoResponse: response }));
      } else {
        setDataStates(prev => ({ ...prev, consumoResponse: null }));
        setDataStates(prev => ({
          ...prev,
          errors: { 
            ...prev.errors, 
            consumo: response.message || 'No hay datos disponibles para la fecha seleccionada' 
          }
        }));
      }
    } catch (error) {
      console.error('Error al cargar datos de consumo:', error);
      setDataStates(prev => ({
        ...prev,
        consumoResponse: null,
        errors: { ...prev.errors, consumo: 'Error al conectar con el servidor' }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, consumoData: false }));
    }
  }, [formData.faena, formData.fechaProduccion]);

  // Extraer datos de consumo de la respuesta de la API
  const consumoData = useMemo(() => {
    return dataStates.consumoResponse?.data || null;
  }, [dataStates.consumoResponse]);

  // Validaciones del formulario
  const validationResults = useMemo(() => {
    const errors = [];
    const warnings = [];

    // Validaciones obligatorias
    if (!formData.toneladas) {
      errors.push('Las toneladas extraídas son obligatorias');
    } else if (parseFloat(formData.toneladas) <= 0) {
      errors.push('Las toneladas deben ser mayor a 0');
    } else if (parseFloat(formData.toneladas) > 10000) {
      warnings.push('Cantidad de toneladas inusualmente alta (>10,000)');
    }

    if (!formData.faena) {
      errors.push('Debe seleccionar una faena');
    }

    // Validaciones opcionales
    if (formData.camionadas) {
      const camionadas = parseFloat(formData.camionadas);
      if (camionadas <= 0) {
        errors.push('El número de camionadas debe ser mayor a 0');
      } else if (camionadas > 1000) {
        warnings.push('Número de camionadas inusualmente alto (>1,000)');
      }
    }

    // Validación de rendimiento
    if (formData.toneladas && formData.camionadas) {
      const rendimiento = parseFloat(formData.toneladas) / parseFloat(formData.camionadas);
      if (rendimiento < 1) {
        warnings.push('Rendimiento muy bajo (<1 ton/viaje)');
      } else if (rendimiento > 50) {
        warnings.push('Rendimiento muy alto (>50 ton/viaje)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      hasData: formData.toneladas || formData.camionadas
    };
  }, [formData]);

  // Cálculos derivados
  const calculatedMetrics = useMemo(() => {
    const toneladas = parseFloat(formData.toneladas) || 0;
    const camionadas = parseFloat(formData.camionadas) || 0;
    const resumen = consumoData?.resumen || {};

    const rendimiento = camionadas > 0 ? toneladas / camionadas : 0;
    const consumoTotal = resumen.consumo_total || 0;
    const horasTrabajadas = resumen.horas_trabajadas || 0;
    const kilometrosRecorridos = resumen.kilometros_recorridos || 0;

    return {
      rendimiento: rendimiento.toFixed(2),
      consumoPorTonelada: toneladas > 0 && consumoTotal > 0 ? 
        (consumoTotal / toneladas).toFixed(2) : '0.00',
      consumoPorHora: horasTrabajadas > 0 && consumoTotal > 0 ? 
        (consumoTotal / horasTrabajadas).toFixed(2) : '0.00',
      consumoPorKm: kilometrosRecorridos > 0 && consumoTotal > 0 ? 
        (consumoTotal / kilometrosRecorridos).toFixed(2) : '0.00',
      eficiencia: {
        toneladasPorHora: horasTrabajadas > 0 ? (toneladas / horasTrabajadas).toFixed(2) : '0.00',
        toneladasPorKm: kilometrosRecorridos > 0 ? (toneladas / kilometrosRecorridos).toFixed(2) : '0.00',
        litrosPorCamionada: camionadas > 0 && consumoTotal > 0 ? 
          (consumoTotal / camionadas).toFixed(2) : '0.00'
      }
    };
  }, [formData, consumoData]);

  // Detectar alertas en los datos de consumo
  const alerts = useMemo(() => {
    if (!consumoData?.detalle_maquinas) return [];

    const alertsList = [];
    const machines = consumoData.detalle_maquinas;

    // Máquinas sin datos reales (solo proyección)
    const machinesWithoutReal = machines.filter(m => 
      m.tiene_proyeccion && !m.tiene_consumo_real
    );
    if (machinesWithoutReal.length > 0) {
      alertsList.push({
        type: 'warning',
        title: 'Datos proyectados',
        message: `${machinesWithoutReal.length} máquinas operan solo con datos proyectados`,
        count: machinesWithoutReal.length,
        machines: machinesWithoutReal.map(m => m.nombre)
      });
    }

    // Máquinas con alto consumo relativo
    const highConsumptionMachines = machines.filter(m => {
      const avgConsumption = consumoData.resumen.promedio_consumo_por_maquina || 0;
      return m.datos_en_rango.consumo_total > (avgConsumption * 2);
    });

    if (highConsumptionMachines.length > 0) {
      alertsList.push({
        type: 'info',
        title: 'Consumo elevado',
        message: `${highConsumptionMachines.length} máquinas con consumo superior al promedio`,
        count: highConsumptionMachines.length,
        machines: highConsumptionMachines.map(m => m.nombre)
      });
    }

    // Máquinas inactivas (sin actividad)
    const inactiveMachines = machines.filter(m => 
      m.datos_en_rango.diferencia_medicion_total === 0
    );

    if (inactiveMachines.length > 0) {
      alertsList.push({
        type: 'danger',
        title: 'Máquinas inactivas',
        message: `${inactiveMachines.length} máquinas sin actividad registrada`,
        count: inactiveMachines.length,
        machines: inactiveMachines.map(m => m.nombre)
      });
    }

    return alertsList;
  }, [consumoData]);

  // Manejadores de eventos
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setUiStates(prev => ({ ...prev, formTouched: true }));
    
    // Limpiar errores de validación cuando el usuario empiece a escribir
    if (dataStates.errors.validation) {
      setDataStates(prev => ({
        ...prev,
        errors: { ...prev.errors, validation: null }
      }));
    }
  }, [dataStates.errors.validation]);

  const handleReset = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      toneladas: "",
      camionadas: ""
    }));
    setUiStates(prev => ({ 
      ...prev, 
      formTouched: false, 
      showValidationHelper: true 
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validación final
    if (!validationResults.isValid) {
      setDataStates(prev => ({
        ...prev,
        errors: { 
          ...prev.errors, 
          validation: 'Por favor corrija los errores antes de continuar' 
        }
      }));
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, submitting: true }));

      const faenaSeleccionada = dataStates.faenas.find(f => 
        f.id_faena.toString() === formData.faena
      );

      const resumen = consumoData?.resumen || {};

      const datos = {
        valores_entrada: {
          toneladas_extraidas: parseFloat(formData.toneladas),
          camionadas: parseFloat(formData.camionadas) || 0,
          rendimiento: parseFloat(calculatedMetrics.rendimiento),
          petroleo_toneladas: resumen.consumo_total || 0,
          horas_trabajadas: resumen.horas_trabajadas || 0,
          kilometros_recorridos: resumen.kilometros_recorridos || 0,
          petroleo_horas: parseFloat(calculatedMetrics.consumoPorHora) || 0,
          id_faena: parseInt(formData.faena),
          fecha_reporte: formData.fechaReporte,
          fecha_produccion: formData.fechaProduccion
        },
        periodo,
        faena: faenaSeleccionada?.nombre || "Desconocida",
        metricas_calculadas: calculatedMetrics,
        resumen_consumo: resumen,
        detalle_maquinas_activas: consumoData?.detalle_maquinas?.length || 0
      };

      // Simular envío (reemplazar con llamada real)
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (onCalculate && typeof onCalculate === 'function') {
        onCalculate({
          status: 'success',
          data: datos
        });
      }

      // Notificación de éxito mejorada
      const successMessage = `✅ Datos registrados exitosamente

📍 Faena: ${faenaSeleccionada?.nombre}
📅 Producción: ${new Date(formData.fechaProduccion).toLocaleDateString('es-CL')}
⚖️ Toneladas: ${formData.toneladas}
⛽ Consumo total: ${resumen.consumo_total?.toFixed(2) || 0} L
🚚 Máquinas activas: ${resumen.total_maquinas || 0}`;

      alert(successMessage);
      
      handleReset();
    } catch (error) {
      console.error('Error al enviar datos:', error);
      setDataStates(prev => ({
        ...prev,
        errors: { 
          ...prev.errors, 
          validation: 'Error al procesar los datos. Intente nuevamente.' 
        }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, submitting: false }));
    }
  }, [validationResults, formData, dataStates.faenas, consumoData, calculatedMetrics, onCalculate, periodo, handleReset]);

  // Función para formatear números
  const formatNumber = useCallback((num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return parseFloat(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }, []);

  // Renderizado condicional para modo compacto
  if (compactMode) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-md font-semibold mb-3 text-gray-800">Registro Rápido</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Toneladas"
            value={formData.toneladas}
            onChange={(e) => setFormData(prev => ({ ...prev, toneladas: e.target.value }))}
            className="p-2 border rounded text-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={!validationResults.isValid || loadingStates.submitting}
            className="bg-orange-600 text-white rounded text-sm disabled:opacity-50"
          >
            {loadingStates.submitting ? <FaSpinner className="animate-spin" /> : 'Registrar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Sistema de Registro de Producción
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Ingreso diario de datos de extracción y análisis de consumo
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {"diario".toUpperCase()}
            </div>
            {showExportOptions && (
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <FaDownload />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Información de fechas */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <FaInfoCircle className="mr-2" />
            Información del Registro
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-md border border-blue-100">
              <div>
                <div className="text-xs text-blue-600 font-medium">FECHA DE REPORTE</div>
                <div className="text-sm font-semibold text-blue-900">
                  {new Date(formData.fechaReporte).toLocaleDateString('es-CL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
              <FaLock className="text-blue-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-md border border-blue-100">
              <div>
                <div className="text-xs text-blue-600 font-medium">FECHA DE PRODUCCIÓN</div>
                <div className="text-sm font-semibold text-blue-900">
                  {new Date(formData.fechaProduccion).toLocaleDateString('es-CL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
              <FaCalendarAlt className="text-blue-400" />
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <strong>Nota:</strong> Los datos corresponden al trabajo realizado ayer y se registran hoy al finalizar las operaciones.
          </div>
        </div>

        {/* Selección de faena */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Seleccionar Faena <span className="text-red-500">*</span>
          </label>
          {loadingStates.faenas ? (
            <div className="animate-pulse h-12 bg-gray-200 rounded-md"></div>
          ) : (
            <select
              name="faena"
              value={formData.faena}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors"
            >
              <option value="">Seleccione una faena</option>
              {dataStates.faenas.map((faena) => (
                <option key={faena.id_faena} value={faena.id_faena}>
                  {faena.nombre}
                </option>
              ))}
            </select>
          )}
          {dataStates.errors.faenas && (
            <p className="mt-1 text-xs text-red-600">{dataStates.errors.faenas}</p>
          )}
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  alert.type === 'danger' 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm">{alert.message}</div>
                      {alert.machines && (
                        <div className="text-xs mt-1 opacity-75">
                          {alert.machines.slice(0, 3).join(', ')}
                          {alert.machines.length > 3 && ` y ${alert.machines.length - 3} más`}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white rounded-full font-medium">
                    {alert.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumen de consumo */}
        {loadingStates.consumoData ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-md animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : dataStates.errors.consumo ? (
          <div className="mb-6 p-4 bg-yellow-50 rounded-md border border-yellow-200">
            <div className="flex items-start">
              <FaExclamationTriangle className="mr-2 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-800 font-medium">Datos de consumo no disponibles</p>
                <p className="text-yellow-700 text-sm mt-1">{dataStates.errors.consumo}</p>
                <button
                  onClick={loadConsumoData}
                  className="mt-2 inline-flex items-center text-xs text-yellow-800 hover:text-yellow-900 font-medium"
                >
                  <FaSync className="mr-1" />
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        ) : consumoData?.resumen ? (
          <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-gray-800 flex items-center">
                  <FaGasPump className="mr-2 text-blue-500" />
                  Resumen de Consumo - {new Date(formData.fechaProduccion).toLocaleDateString('es-CL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h5>
                <button
                  onClick={() => setUiStates(prev => ({ 
                    ...prev, 
                    showDetailedView: !prev.showDetailedView 
                  }))}
                  className="text-blue-600 hover:text-blue-800 text-sm focus:outline-none flex items-center"
                >
                  <FaEye className="mr-1" />
                  {uiStates.showDetailedView ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-700 mb-2">
                    <FaGasPump className="mr-2" />
                    <span className="font-semibold">Consumo Total</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatNumber(consumoData.resumen.consumo_total)} L
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {formatNumber(consumoData.resumen.porcentaje_proyectado, 1)}% proyectado
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    Real: {formatNumber(consumoData.resumen.consumo_total_real)} L • 
                    Proyectado: {formatNumber(consumoData.resumen.consumo_total_proyectado)} L
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center text-green-700 mb-2">
                    <FaClock className="mr-2" />
                    <span className="font-semibold">Actividad Total</span>
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {formatNumber(consumoData.resumen.horas_trabajadas)} h
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {formatNumber(consumoData.resumen.kilometros_recorridos)} km
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {consumoData.resumen.total_maquinas} máquinas activas
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center text-purple-700 mb-2">
                    <FaChartLine className="mr-2" />
                    <span className="font-semibold">Rendimiento</span>
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {formatNumber(consumoData.resumen.rendimiento_horometro, 3)} h/L
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {formatNumber(consumoData.resumen.rendimiento_kilometraje, 3)} km/L
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    Promedio por máquina: {formatNumber(consumoData.resumen.promedio_consumo_por_maquina)} L
                  </div>
                </div>
              </div>

              {/* Vista detallada */}
              {uiStates.showDetailedView && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-900">
                        {consumoData.resumen.maquinas_kilometraje}
                      </div>
                      <div className="text-xs text-gray-600">Kilometraje</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-900">
                        {consumoData.resumen.maquinas_con_consumo_real}
                      </div>
                      <div className="text-xs text-gray-600">Datos Reales</div>
                    </div>
                  </div>

                  {/* Tabla de máquinas */}
                  {consumoData.detalle_maquinas?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Máquina
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Tipo
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Consumo (L)
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Actividad
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Rendimiento
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {consumoData.detalle_maquinas.map((maquina) => (
                            <tr key={maquina.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {maquina.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {maquina.patente}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500">
                                {maquina.tipo_medicion}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatNumber(maquina.datos_en_rango.consumo_total)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  R: {formatNumber(maquina.datos_en_rango.consumo_real)} • 
                                  P: {formatNumber(maquina.datos_en_rango.consumo_proyectado)}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right text-sm">
                                {formatNumber(maquina.datos_en_rango.diferencia_medicion_total)} 
                                <span className="text-xs text-gray-500 ml-1">
                                  {maquina.tipo_medicion === 'Horometro' ? 'h' : 'km'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right text-sm">
                                {formatNumber(maquina.datos_totales.rendimiento, 3)}
                                <span className="text-xs text-gray-500 ml-1">
                                  {maquina.tipo_medicion === 'Horometro' ? 'h/L' : 'km/L'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {maquina.tiene_consumo_real && maquina.tiene_proyeccion ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                    Mixto
                                  </span>
                                ) : maquina.tiene_consumo_real ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    Real
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    Proyectado
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Campos de entrada principales */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaTruck className="mr-2 text-orange-500" />
            Datos de Producción
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Toneladas extraídas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Toneladas Extraídas <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="toneladas"
                  value={formData.toneladas}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full p-3 pr-12 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                    validationResults.errors.some(e => e.includes('toneladas'))
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">ton</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Total extraído el {new Date(formData.fechaProduccion).toLocaleDateString('es-CL')}
              </p>
              {validationResults.errors.some(e => e.includes('toneladas')) && (
                <p className="mt-1 text-xs text-red-600">
                  {validationResults.errors.find(e => e.includes('toneladas'))}
                </p>
              )}
            </div>

            {/* Número de camionadas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de Camionadas
                <span className="text-gray-400 text-xs ml-1">(opcional)</span>
              </label>
              <input
                type="number"
                name="camionadas"
                value={formData.camionadas}
                onChange={handleInputChange}
                min="0"
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                  validationResults.errors.some(e => e.includes('camionadas'))
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Viajes realizados el {new Date(formData.fechaProduccion).toLocaleDateString('es-CL')}
              </p>
              {validationResults.errors.some(e => e.includes('camionadas')) && (
                <p className="mt-1 text-xs text-red-600">
                  {validationResults.errors.find(e => e.includes('camionadas'))}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Métricas calculadas */}
        {validationResults.hasData && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h5 className="font-semibold text-green-800 mb-3 flex items-center">
              <FaCalculator className="mr-2" />
              Métricas Calculadas
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Rendimiento base */}
              {formData.camionadas && parseFloat(formData.camionadas) > 0 && (
                <div className="p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-xs text-green-600 font-medium">RENDIMIENTO</div>
                  <div className="text-lg font-bold text-green-900">
                    {calculatedMetrics.rendimiento} <span className="text-sm">ton/viaje</span>
                  </div>
                </div>
              )}

              {/* Eficiencia por tonelada */}
              {consumoData?.resumen && parseFloat(calculatedMetrics.consumoPorTonelada) > 0 && (
                <div className="p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-xs text-green-600 font-medium">CONSUMO/TONELADA</div>
                  <div className="text-lg font-bold text-green-900">
                    {calculatedMetrics.consumoPorTonelada} <span className="text-sm">L/ton</span>
                  </div>
                </div>
              )}

              {/* Eficiencia por hora */}
              {consumoData?.resumen && parseFloat(calculatedMetrics.consumoPorHora) > 0 && (
                <div className="p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-xs text-green-600 font-medium">CONSUMO/HORA</div>
                  <div className="text-lg font-bold text-green-900">
                    {calculatedMetrics.consumoPorHora} <span className="text-sm">L/h</span>
                  </div>
                </div>
              )}

              {/* Productividad */}
              {consumoData?.resumen && parseFloat(calculatedMetrics.eficiencia.toneladasPorHora) > 0 && (
                <div className="p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-xs text-green-600 font-medium">PRODUCTIVIDAD</div>
                  <div className="text-lg font-bold text-green-900">
                    {calculatedMetrics.eficiencia.toneladasPorHora} <span className="text-sm">ton/h</span>
                  </div>
                </div>
              )}

              {/* Eficiencia por kilómetro */}
              {consumoData?.resumen?.kilometros_recorridos > 0 && parseFloat(calculatedMetrics.consumoPorKm) > 0 && (
                <div className="p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-xs text-green-600 font-medium">CONSUMO/KM</div>
                  <div className="text-lg font-bold text-green-900">
                    {calculatedMetrics.consumoPorKm} <span className="text-sm">L/km</span>
                  </div>
                </div>
              )}

              {/* Toneladas por kilómetro */}
              {consumoData?.resumen?.kilometros_recorridos > 0 && parseFloat(calculatedMetrics.eficiencia.toneladasPorKm) > 0 && (
                <div className="p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-xs text-green-600 font-medium">PRODUCTIVIDAD/KM</div>
                  <div className="text-lg font-bold text-green-900">
                    {calculatedMetrics.eficiencia.toneladasPorKm} <span className="text-sm">ton/km</span>
                  </div>
                </div>
              )}

              {/* Combustible por camionada */}
              {formData.camionadas && parseFloat(formData.camionadas) > 0 && parseFloat(calculatedMetrics.eficiencia.litrosPorCamionada) > 0 && (
                <div className="p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-xs text-green-600 font-medium">CONSUMO/VIAJE</div>
                  <div className="text-lg font-bold text-green-900">
                    {calculatedMetrics.eficiencia.litrosPorCamionada} <span className="text-sm">L/viaje</span>
                  </div>
                </div>
              )}
            </div>

            {/* Advertencias */}
            {validationResults.warnings.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-xs font-medium text-yellow-800 mb-1 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  Advertencias:
                </div>
                {validationResults.warnings.map((warning, index) => (
                  <div key={index} className="text-xs text-yellow-700">• {warning}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Errores de validación */}
        {(validationResults.errors.length > 0 || dataStates.errors.validation) && uiStates.formTouched && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <FaExclamationTriangle className="mr-2 text-red-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-800">Errores de validación:</div>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {validationResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {dataStates.errors.validation && <li>{dataStates.errors.validation}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={loadingStates.submitting}
            className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
          >
            Limpiar Formulario
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!validationResults.isValid || loadingStates.submitting}
            className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loadingStates.submitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <FaCheckCircle className="mr-2" />
                Registrar Datos de Producción
              </>
            )}
          </button>
        </div>

        {/* Información adicional en el pie */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-500 space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <FaLock className="mr-1" />
              <span>Datos seguros y encriptados</span>
            </div>
            <div className="text-right">
              <div className="font-medium">Sistema de Gestión de Producción</div>
              <div className="text-xs">
                Última actualización: {new Date().toLocaleTimeString('es-CL')}
              </div>
            </div>
          </div>
        </div>

        {/* Helper de validación (opcional) */}
        {uiStates.showValidationHelper && !validationResults.hasData && !consumoData && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <FaInfoCircle className="mr-2 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-800">Ayuda para el registro:</div>
                <div className="text-sm text-blue-700 mt-1">
                  • Las toneladas extraídas son obligatorias para calcular los KPIs<br/>
                  • El número de camionadas es opcional pero mejora la precisión de cálculos<br/>
                  • Los datos de consumo se obtienen automáticamente del sistema<br/>
                  • Seleccione una faena para ver el resumen de consumo del día anterior
                </div>
                <button
                  onClick={() => setUiStates(prev => ({ ...prev, showValidationHelper: false }))}
                  className="text-xs text-blue-600 underline hover:no-underline mt-2"
                >
                  Ocultar ayuda
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

DailyKpiCalculator.propTypes = {
  onCalculate: PropTypes.func,
  periodo: PropTypes.oneOf(["diario"]),
  showExportOptions: PropTypes.bool,
  compactMode: PropTypes.bool
};

export default DailyKpiCalculator;