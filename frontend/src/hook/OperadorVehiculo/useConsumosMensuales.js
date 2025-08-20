// hook/OperadorVehiculo/useConsumosMensuales.js
import { useState, useCallback } from 'react';
import axios from '../../lib/axios';

export const useConsumosMensuales = () => {
    const [loadingMensuales, setLoadingMensuales] = useState(false);
    const [errorMensuales, setErrorMensuales] = useState(null);
    const [consumosMensuales, setConsumosMensuales] = useState([]);
    const [estadisticasMensuales, setEstadisticasMensuales] = useState(null);

    const cargarConsumosMensuales = useCallback(async (idMaquina) => {
        if (!idMaquina) {
            setErrorMensuales('ID de máquina requerido');
            return;
        }

        setLoadingMensuales(true);
        setErrorMensuales(null);

        try {
            const response = await axios.get('/api/chofer/cargas-externas-mes-actual', {
                params: { id_maquina: idMaquina }
            });

            if (response.data.status === 'success') {
                const consumos = response.data.data;
                setConsumosMensuales(consumos);

                // Calcular estadísticas
                const ahora = new Date();
                const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
                const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
                const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

                // Filtrar consumos por mes
                const consumosMesActual = consumos.filter(c => {
                    const fechaConsumo = new Date(c.fecha_consumo);
                    return fechaConsumo >= inicioMesActual;
                });

                const consumosMesAnterior = consumos.filter(c => {
                    const fechaConsumo = new Date(c.fecha_consumo);
                    return fechaConsumo >= inicioMesAnterior && fechaConsumo <= finMesAnterior;
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

                console.log('📊 Estadísticas mensuales calculadas:', {
                    mesActual: litrosMesActual,
                    mesAnterior: litrosMesAnterior,
                    diferencia,
                    porcentaje: porcentajeCambio.toFixed(1)
                });
            }
        } catch (error) {
            console.error('❌ Error al cargar consumos mensuales:', error);
            setErrorMensuales(error.response?.data?.message || 'Error al cargar datos mensuales');
        } finally {
            setLoadingMensuales(false);
        }
    }, []);

    return {
        loadingMensuales,
        errorMensuales,
        consumosMensuales,
        estadisticasMensuales,
        cargarConsumosMensuales
    };
};