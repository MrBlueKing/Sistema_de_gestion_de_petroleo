// hook/OperadorVehiculo/useConsumosMensuales.js - VERSIÓN CON DEBUG DETALLADO
import { useState, useCallback } from 'react';
import axios from '../../lib/axios';

export const useConsumosMensuales = () => {
    const [loadingMensuales, setLoadingMensuales] = useState(false);
    const [errorMensuales, setErrorMensuales] = useState(null);
    const [consumosMensuales, setConsumosMensuales] = useState([]);
    const [estadisticasMensuales, setEstadisticasMensuales] = useState(null);

    const cargarConsumosMensuales = useCallback(async (idMaquina) => {
        // 🚨 DEBUG: Log de entrada
        console.log('🚀 [DEBUG] cargarConsumosMensuales ejecutándose con idMaquina:', idMaquina);
        console.log('🚀 [DEBUG] Tipo de idMaquina:', typeof idMaquina);
        console.log('🚀 [DEBUG] idMaquina es truthy?', !!idMaquina);

        if (!idMaquina) {
            console.log('❌ [DEBUG] ID de máquina requerido - función terminada');
            setErrorMensuales('ID de máquina requerido');
            return;
        }

        console.log('⏳ [DEBUG] Iniciando carga de consumos mensuales...');
        setLoadingMensuales(true);
        setErrorMensuales(null);

        try {
            // 🚨 DEBUG: Log de la URL completa
            const url = '/api/chofer/cargas-externas-mes-actual';
            const params = { id_maquina: idMaquina };
            
            console.log('📡 [DEBUG] Haciendo petición a:', url);
            console.log('📋 [DEBUG] Con parámetros:', params);
            console.log('🔧 [DEBUG] axios instance:', axios.defaults.baseURL);

            const response = await axios.get(url, {
                params: params
            });

            console.log('📥 [DEBUG] Respuesta completa recibida:', response);
            console.log('📊 [DEBUG] response.data:', response.data);
            console.log('✅ [DEBUG] response.status:', response.status);

            if (response.data.status === 'success') {
                const consumos = response.data.data;
                console.log('🎯 [DEBUG] Consumos extraídos:', consumos);
                console.log('📏 [DEBUG] Cantidad de consumos:', consumos.length);
                
                setConsumosMensuales(response.data); // ✅ GUARDAR LA RESPUESTA COMPLETA

                // Calcular estadísticas
                const ahora = new Date();
                const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
                const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
                const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

                console.log('📅 [DEBUG] Fechas de referencia:', {
                    inicioMesActual: inicioMesActual.toISOString(),
                    inicioMesAnterior: inicioMesAnterior.toISOString(),
                    finMesAnterior: finMesAnterior.toISOString()
                });

                // Filtrar consumos por mes
                const consumosMesActual = consumos.filter(c => {
                    const fechaConsumo = new Date(c.fecha_consumo);
                    return fechaConsumo >= inicioMesActual;
                });

                const consumosMesAnterior = consumos.filter(c => {
                    const fechaConsumo = new Date(c.fecha_consumo);
                    return fechaConsumo >= inicioMesAnterior && fechaConsumo <= finMesAnterior;
                });

                console.log('📊 [DEBUG] Filtrado por fechas:', {
                    totalConsumos: consumos.length,
                    mesActual: consumosMesActual.length,
                    mesAnterior: consumosMesAnterior.length
                });

                // Calcular totales
                const litrosMesActual = consumosMesActual.reduce((sum, c) => sum + (parseFloat(c.litros_consumidos) || 0), 0);
                const litrosMesAnterior = consumosMesAnterior.reduce((sum, c) => sum + (parseFloat(c.litros_consumidos) || 0), 0);

                // Calcular diferencia y porcentaje
                const diferencia = litrosMesActual - litrosMesAnterior;
                const porcentajeCambio = litrosMesAnterior > 0 ? ((diferencia / litrosMesAnterior) * 100) : 0;

                // Separar por tipo de consumo
                const internosMesActual = consumosMesActual.filter(c => c.tipo_consumo_origen === 'INTERNO');
                const externosMesActual = consumosMesActual.filter(c => c.tipo_consumo_origen === 'EXTERNO');

                const litrosInternosMesActual = internosMesActual.reduce((sum, c) => sum + (parseFloat(c.litros_consumidos) || 0), 0);
                const litrosExternosMesActual = externosMesActual.reduce((sum, c) => sum + (parseFloat(c.litros_consumidos) || 0), 0);

                console.log('🧮 [DEBUG] Cálculos finales:', {
                    litrosMesActual,
                    litrosMesAnterior,
                    diferencia,
                    porcentajeCambio,
                    litrosInternosMesActual,
                    litrosExternosMesActual
                });

                setEstadisticasMensuales({
                    mesActual: {
                        litros: litrosMesActual,
                        cantidad: consumosMesActual.length,
                        internos: litrosInternosMesActual,
                        externos: litrosExternosMesActual
                    },
                    mesAnterior: {
                        litros: litrosMesAnterior,
                        cantidad: consumosMesAnterior.length
                    },
                    comparacion: {
                        diferencia: diferencia,
                        porcentaje: porcentajeCambio,
                        tendencia: diferencia > 0 ? 'AUMENTO' : diferencia < 0 ? 'REDUCCION' : 'IGUAL'
                    }
                });

                console.log('📊 [DEBUG] Estadísticas mensuales calculadas:', {
                    mesActual: litrosMesActual,
                    mesAnterior: litrosMesAnterior,
                    diferencia,
                    porcentaje: porcentajeCambio.toFixed(1)
                });
            } else {
                console.log('❌ [DEBUG] Respuesta no exitosa:', response.data);
                throw new Error(response.data.message || 'Respuesta no exitosa');
            }
        } catch (error) {
            console.error('❌ [DEBUG] Error completo:', error);
            console.error('❌ [DEBUG] error.response:', error.response);
            console.error('❌ [DEBUG] error.response.data:', error.response?.data);
            console.error('❌ [DEBUG] error.message:', error.message);
            
            const errorMessage = error.response?.data?.message || error.message || 'Error al cargar datos mensuales';
            console.error('❌ [DEBUG] Error final a mostrar:', errorMessage);
            
            setErrorMensuales(errorMessage);
        } finally {
            console.log('🏁 [DEBUG] Finalizando cargarConsumosMensuales, loading = false');
            setLoadingMensuales(false);
        }
    }, []);

    // 🚨 DEBUG: Log de estado actual
    console.log('🔍 [DEBUG] Estado actual del hook:', {
        loadingMensuales,
        errorMensuales,
        consumosMensualesLength: consumosMensuales?.data?.length || 0,
        estadisticasMensuales: !!estadisticasMensuales
    });

    return {
        loadingMensuales,
        errorMensuales,
        consumosMensuales,
        estadisticasMensuales,
        cargarConsumosMensuales
    };
};