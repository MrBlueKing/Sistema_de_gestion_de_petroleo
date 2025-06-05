// hooks/useHybridData.js - VERSIÓN CORREGIDA
import { useState, useCallback } from 'react';
import axios from '../lib/axios';

/**
 * Hook personalizado para manejar datos híbridos con precios del rango específico
 */
const useHybridData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  // ✅ NUEVA FUNCIÓN: Obtener precios reales de consumos en el rango
  const getPreciosDelRango = useCallback(async (fechaDesde, fechaHasta, faenaSeleccionada) => {
    try {
      const response = await axios.get('/api/informes-kpi/verificar-precios-consumos', {
        params: {
          fecha_inicio: fechaDesde,
          fecha_fin: fechaHasta,
          faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null
        }
      });

      if (response.data?.success && response.data.consumos_detalle) {
        // Agrupar precios por máquina
        const preciosPorMaquina = {};
        
        response.data.consumos_detalle.forEach(consumo => {
          // ✅ ASEGURAR: Usar exactamente el mismo formato que en combine
          const maquinaKey = `${consumo.nombre_maquina}_${consumo.faena}`;
          
          if (!preciosPorMaquina[maquinaKey]) {
            preciosPorMaquina[maquinaKey] = {
              precios: [],
              litros: [],
              costoTotal: 0,
              litrosTotal: 0
            };
          }
          
          const precio = parseFloat(consumo.precio_litro) || 0;
          const litros = parseFloat(consumo.litros_consumidos) || 0;
          
          preciosPorMaquina[maquinaKey].precios.push(precio);
          preciosPorMaquina[maquinaKey].litros.push(litros);
          preciosPorMaquina[maquinaKey].costoTotal += litros * precio;
          preciosPorMaquina[maquinaKey].litrosTotal += litros;
          
          // ✅ DEBUG: Log cada consumo procesado
          console.log(`💰 Procesando consumo: ${maquinaKey} - ${litros}L @ ${precio}/L = ${litros * precio}`);
        });

        // Calcular precio promedio ponderado por máquina
        const preciosPromedioPorMaquina = {};
        
        Object.keys(preciosPorMaquina).forEach(maquinaKey => {
          const data = preciosPorMaquina[maquinaKey];
          const precioPromedio = data.litrosTotal > 0 ? data.costoTotal / data.litrosTotal : 0;
          preciosPromedioPorMaquina[maquinaKey] = precioPromedio;
          
          // ✅ DEBUG: Log precio calculado por máquina
          console.log(`📊 Precio calculado para ${maquinaKey}: ${precioPromedio.toFixed(2)}/L (${data.litrosTotal}L total)`);
        });

        // También obtener precio promedio general del período
        const precioPromedioGeneral = response.data.estadisticas_precios?.precio_promedio || 900;
        
        console.log(`🔍 Resumen precios del rango:`, {
          maquinasConPrecios: Object.keys(preciosPromedioPorMaquina).length,
          precioPromedioGeneral: precioPromedioGeneral,
          maquinasDetectadas: Object.keys(preciosPromedioPorMaquina)
        });

        return {
          preciosPorMaquina: preciosPromedioPorMaquina,
          precioPromedioGeneral: precioPromedioGeneral,
          estadisticas: response.data.estadisticas_precios
        };
      }
      
      // Fallback si no hay datos
      return {
        preciosPorMaquina: {},
        precioPromedioGeneral: 900,
        estadisticas: null
      };

    } catch (err) {
      console.warn('Error al obtener precios del rango, usando fallback:', err);
      return {
        preciosPorMaquina: {},
        precioPromedioGeneral: 900,
        estadisticas: null
      };
    }
  }, []);

  // ✅ FUNCIÓN CORREGIDA: Combinar datos con precios específicos del rango
  const combineData = useCallback((consumoData, rendimientoData, preciosData) => {
    const combined = [];

    if (consumoData.success && consumoData.analisis_por_categoria) {
      consumoData.analisis_por_categoria.forEach(categoria => {
        if (categoria.analisis_detallado) {
          categoria.analisis_detallado.forEach(maquinaAnalisis => {
            const maquina = maquinaAnalisis.maquina;
            
            // Calcular totales de consumo
            let totalLitrosConfirmados = 0;
            let totalLitrosSimulados = 0;

            // Sumar consumos confirmados
            if (maquinaAnalisis.periodos_confirmados) {
              maquinaAnalisis.periodos_confirmados.forEach(periodo => {
                totalLitrosConfirmados += periodo.consumo.litros || 0;
              });
            }

            // Sumar consumo simulado
            if (maquinaAnalisis.simulacion) {
              totalLitrosSimulados = maquinaAnalisis.simulacion.calculo.consumo_proyectado_real || 0;
            }

            // ✅ CORREGIDO: Usar mismo identificador que en el backend
            const maquinaKey = `${maquina.nombre}_${maquina.faena?.nombre || 'N/A'}`;
            let precioEspecifico = preciosData.preciosPorMaquina[maquinaKey];
            
            // ✅ DEBUG: Log para verificar coincidencias
            console.log(`🔍 Buscando precio para máquina: "${maquinaKey}"`, {
              precioEncontrado: precioEspecifico,
              preciosDisponibles: Object.keys(preciosData.preciosPorMaquina)
            });
            
            // Si no hay precio específico, usar el promedio del período
            if (!precioEspecifico || precioEspecifico === 0) {
              precioEspecifico = preciosData.precioPromedioGeneral;
            }

            // ✅ CORREGIDO: Calcular valor usando precio del rango específico
            const valorTotal = (totalLitrosConfirmados + totalLitrosSimulados) * precioEspecifico;

            // Buscar datos de rendimiento correspondientes
            const rendimientoMaquina = rendimientoData.consumo_por_maquina?.find(
              m => m.id_maquina === maquina.id
            );

            // Determinar tipo de medición basado en categoría
            const tipoMedicion = categoria.categoria.nombre.toLowerCase().includes('dumper') 
              ? 'Horometro' : 'Kilometraje';

            combined.push({
              // Datos de identificación
              id_maquina: maquina.id,
              nombre_maquina: maquina.nombre,
              patente: maquina.patente || 'N/A',
              nombre_faena: maquina.faena?.nombre || 'N/A',
              categoria: categoria.categoria.nombre,
              tipo_medicion: tipoMedicion,
              
              // Datos de consumo (ConsumoCategoriasController)
              litros_confirmados: totalLitrosConfirmados,
              litros_simulados: totalLitrosSimulados,
              litros_totales: totalLitrosConfirmados + totalLitrosSimulados,
              
              // ✅ CORREGIDO: Valor y precio específicos del rango
              valor_consumo: valorTotal,
              precio_litro_usado: precioEspecifico,
              precio_por_litro: totalLitrosConfirmados + totalLitrosSimulados > 0 
                ? valorTotal / (totalLitrosConfirmados + totalLitrosSimulados) 
                : precioEspecifico,
              
              precision_porcentaje: totalLitrosConfirmados + totalLitrosSimulados > 0 ? 
                (totalLitrosConfirmados / (totalLitrosConfirmados + totalLitrosSimulados)) * 100 : 0,
              
              // Datos de rendimiento (InformesController)
              rendimiento: rendimientoMaquina ? {
                litros_por_unidad: rendimientoMaquina.litros_por_unidad || 0,
                costo_por_unidad: rendimientoMaquina.costo_por_unidad || 0,
                unidad: rendimientoMaquina.unidad || (tipoMedicion === 'Horometro' ? 'hr' : 'km'),
                interpretacion: rendimientoMaquina.rendimiento?.interpretacion || 'No disponible',
                medicion_inicial: rendimientoMaquina.medicion_inicial || 0,
                medicion_final: rendimientoMaquina.medicion_final || 0,
                diferencia_medicion: rendimientoMaquina.diferencia_medicion || 0
              } : {
                litros_por_unidad: 0,
                costo_por_unidad: 0,
                unidad: tipoMedicion === 'Horometro' ? 'hr' : 'km',
                interpretacion: 'Sin datos de rendimiento',
                medicion_inicial: 0,
                medicion_final: 0,
                diferencia_medicion: 0
              },

              // ✅ NUEVO: Información de precios para debugging
              precio_info: {
                precio_especifico: preciosData.preciosPorMaquina[maquinaKey] || null,
                precio_usado: precioEspecifico,
                precio_promedio_periodo: preciosData.precioPromedioGeneral,
                fuente_precio: preciosData.preciosPorMaquina[maquinaKey] ? 'específico' : 'promedio_período'
              },

              // Estadísticas adicionales
              estadisticas: maquinaAnalisis.estadisticas || null,
              periodos_confirmados: maquinaAnalisis.periodos_confirmados || [],
              simulacion: maquinaAnalisis.simulacion || null,
              
              // Metadatos
              fuente_datos: {
                consumo: 'ConsumoCategoriasController',
                rendimiento: rendimientoMaquina ? 'InformesController' : 'No disponible',
                precios: 'InformesController - Rango específico'
              }
            });
          });
        }
      });
    }

    return combined;
  }, []);

  // ✅ FUNCIÓN PRINCIPAL CORREGIDA: Cargar datos híbridos con precios del rango
  const fetchHybridData = useCallback(async (fechaDesde, fechaHasta, faenaSeleccionada) => {
    if (!fechaDesde || !fechaHasta) {
      setError('Fechas de inicio y fin son requeridas');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Preparar parámetros
      const faenaId = faenaSeleccionada !== 'todas' ? parseInt(faenaSeleccionada) : null;

      // ✅ PASO 1: Obtener precios específicos del rango
      console.log('🔍 Obteniendo precios del rango...');
      const preciosData = await getPreciosDelRango(fechaDesde, fechaHasta, faenaSeleccionada);
      
      console.log('💰 Precios obtenidos:', {
        maquinasConPrecio: Object.keys(preciosData.preciosPorMaquina).length,
        precioPromedioGeneral: preciosData.precioPromedioGeneral,
        estadisticas: preciosData.estadisticas
      });

      // ✅ PASO 2: Ejecutar consultas principales en paralelo
      const [responseConsumo, responseRendimiento] = await Promise.all([
        // Datos de ConsumoCategoriasController
        axios.post('/api/consumo-categorias/calcular', {
          fecha_inicio: fechaDesde,
          fecha_fin: fechaHasta,
          id_faena: faenaId,
          incluir_simulacion: true,
          usar_fechas_automaticas: false
        }),
        
        // Datos de InformesController
        axios.get('/api/informes-kpi/consumo-maquinas', {
          params: {
            fecha_inicio: fechaDesde,
            fecha_fin: fechaHasta,
            faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : 'todas'
          }
        })
      ]);

      // Verificar respuestas
      if (!responseConsumo.data?.success) {
        throw new Error('Error en datos de consumo: ' + (responseConsumo.data?.message || 'Respuesta inválida'));
      }

      if (!responseRendimiento.data?.status === 'success') {
        throw new Error('Error en datos de rendimiento: ' + (responseRendimiento.data?.message || 'Respuesta inválida'));
      }

      // ✅ PASO 3: Combinar datos usando precios del rango específico
      const combinedData = combineData(
        responseConsumo.data,
        responseRendimiento.data.data,
        preciosData  // ✅ NUEVO: Pasar datos de precios
      );

      setData(combinedData);
      
      // ✅ LOGS PARA DEBUGGING
      console.log('📊 Datos combinados:', {
        totalMaquinas: combinedData.length,
        ejemploPrecio: combinedData[0]?.precio_info,
        valorPromedio: combinedData.reduce((sum, m) => sum + m.valor_consumo, 0) / combinedData.length
      });
      
      return {
        success: true,
        data: combinedData,
        metadata: {
          totalMaquinas: combinedData.length,
          conRendimiento: combinedData.filter(m => m.rendimiento.litros_por_unidad > 0).length,
          sinRendimiento: combinedData.filter(m => m.rendimiento.litros_por_unidad === 0).length,
          precisionAlta: combinedData.filter(m => m.precision_porcentaje >= 80).length,
          precisionMedia: combinedData.filter(m => m.precision_porcentaje >= 60 && m.precision_porcentaje < 80).length,
          precisionBaja: combinedData.filter(m => m.precision_porcentaje < 60).length,
          // ✅ NUEVO: Metadatos de precios
          preciosInfo: {
            maquinasConPrecioEspecifico: combinedData.filter(m => m.precio_info.fuente_precio === 'específico').length,
            maquinasConPrecioPromedio: combinedData.filter(m => m.precio_info.fuente_precio === 'promedio_período').length,
            precioPromedioUsado: preciosData.precioPromedioGeneral,
            estadisticasPrecios: preciosData.estadisticas
          }
        }
      };

    } catch (err) {
      console.error('Error al cargar datos híbridos:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido al cargar datos';
      setError(errorMessage);
      setData([]);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [getPreciosDelRango, combineData]);

  // Función para limpiar datos
  const clearData = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  // ✅ FUNCIÓN CORREGIDA: Obtener estadísticas con precios del rango
  const getStats = useCallback(() => {
    if (!data.length) return null;

    const totalLitros = data.reduce((sum, m) => sum + m.litros_totales, 0);
    const totalValor = data.reduce((sum, m) => sum + m.valor_consumo, 0);
    const promedioRendimiento = data
      .filter(m => m.rendimiento.litros_por_unidad > 0)
      .reduce((sum, m, _, arr) => sum + m.rendimiento.litros_por_unidad / arr.length, 0);

    return {
      totalMaquinas: data.length,
      totalLitros: totalLitros,
      totalValor: totalValor,
      promedioRendimiento: promedioRendimiento,
      precisionPromedio: data.reduce((sum, m, _, arr) => sum + m.precision_porcentaje / arr.length, 0),
      maquinasConRendimiento: data.filter(m => m.rendimiento.litros_por_unidad > 0).length,
      maquinasSinRendimiento: data.filter(m => m.rendimiento.litros_por_unidad === 0).length,
      // ✅ NUEVO: Estadísticas de precios
      precioPromedioPonderado: totalLitros > 0 ? totalValor / totalLitros : 0,
      maquinasConPrecioEspecifico: data.filter(m => m.precio_info.fuente_precio === 'específico').length,
      maquinasConPrecioPromedio: data.filter(m => m.precio_info.fuente_precio === 'promedio_período').length
    };
  }, [data]);

  return {
    // Estados
    loading,
    error,
    data,
    
    // Funciones
    fetchHybridData,
    clearData,
    getStats,
    
    // Utilidades
    isEmpty: data.length === 0,
    hasError: !!error,
    isReady: !loading && !error && data.length > 0
  };
};

export default useHybridData;