// hooks/useHistorialConsumos.js - HOOK SEPARADO PARA HISTORIAL
import { useState, useCallback, useRef } from 'react';
import axios from '../../lib/axios';

export const useHistorialConsumos = () => {
  const DEBUG = false;
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [historialConsumos, setHistorialConsumos] = useState([]);

  // Para evitar llamadas duplicadas
  const currentHistorialRequestRef = useRef(null);
  const lastMaquinaIdRef = useRef(null);

  // 🎯 Función para cargar historial de últimos consumos
  const cargarHistorialConsumos = useCallback(async (idMaquina, limit = 2) => {
    if (!idMaquina) {
      setErrorHistorial('ID de máquina requerido');
      return null;
    }

    // Si ya estamos cargando el historial de la misma máquina, no hacer otra petición
    if (currentHistorialRequestRef.current && lastMaquinaIdRef.current === idMaquina) {
      DEBUG && console.log('⏸️ Petición de historial en curso para la misma máquina, esperando...');
      return currentHistorialRequestRef.current;
    }

    try {
      setLoadingHistorial(true);
      setErrorHistorial(null);
      lastMaquinaIdRef.current = idMaquina;

      DEBUG && console.log(`📋 Cargando historial de consumos para máquina: ${idMaquina}`);

      // Crear la promesa y guardarla para evitar duplicados
      const requestPromise = axios.get(`/api/consumos/ultimos/${idMaquina}`, {
        params: { limit }
      });

      currentHistorialRequestRef.current = requestPromise;
      const response = await requestPromise;

      if (response.data.success) {
        // 🎯 Filtrar solo los datos que necesitas - MEJORADO
        const consumosFiltrados = response.data.data.map(consumo => ({
          id_consumo: consumo.id_consumo,
          id_faena: consumo.id_faena,
          fecha_consumo: consumo.fecha_consumo,
          litros_consumidos: parseFloat(consumo.litros_consumidos),
          medicion: parseFloat(consumo.medicion),
          tipo_operacion: consumo.tipo_operacion,

          // ✅ NUEVOS CAMPOS MEJORADOS
          faena_ubicacion: consumo.faena_ubicacion || `${consumo.id_faena}`,
          faena_detalle: consumo.faena_detalle,

          // 🆕 Formatear fecha para mostrar - CORREGIDO
          fecha_formateada: (() => {
            try {
              // Convertir "2025-07-27 07:28:30" a formato ISO
              const isoDate = consumo.fecha_consumo.replace(' ', 'T');
              const date = new Date(isoDate);

              // Verificar que la fecha es válida
              if (isNaN(date.getTime())) {
                return consumo.fecha_consumo; // Fallback al string original
              }

              return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            } catch (error) {
              console.warn('Error formateando fecha:', consumo.fecha_consumo, error);
              return consumo.fecha_consumo; // Fallback al string original
            }
          })()
        }));

        setHistorialConsumos(consumosFiltrados);
        DEBUG && console.log('✅ Historial cargado:', consumosFiltrados);

        // ✅ GUARDAR INFO DE LA MÁQUINA si está disponible
        if (response.data.machine_info) {
          DEBUG && console.log('ℹ️ Info de máquina:', response.data.machine_info);
        }

        return {
          consumos: consumosFiltrados,
          machineInfo: response.data.machine_info || null
        };
      } else {
        throw new Error(response.data.message || 'Error al cargar historial');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar historial de consumos';
      setErrorHistorial(errorMessage);
      DEBUG && console.error('❌ Error cargando historial:', errorMessage);
      return null;
    } finally {
      setLoadingHistorial(false);
      currentHistorialRequestRef.current = null;
    }
  }, []);

  // 🔄 Función para limpiar datos
  const limpiarHistorial = useCallback(() => {
    setHistorialConsumos([]);
    setErrorHistorial(null);
    setLoadingHistorial(false);
    currentHistorialRequestRef.current = null;
    lastMaquinaIdRef.current = null;
  }, []);

  // 🔄 Función para recargar datos
  const recargarHistorial = useCallback(async (limit = 2) => {
    if (lastMaquinaIdRef.current) {
      currentHistorialRequestRef.current = null; // Forzar nueva petición
      return await cargarHistorialConsumos(lastMaquinaIdRef.current, limit);
    }
  }, [cargarHistorialConsumos]);

  return {
    // Estados
    loadingHistorial,
    errorHistorial,
    historialConsumos,

    // Funciones
    cargarHistorialConsumos,
    limpiarHistorial,
    recargarHistorial,

    // Datos derivados (para fácil acceso)
    tieneHistorial: historialConsumos.length > 0,
    ultimoConsumo: historialConsumos[0] || null,
    penultimoConsumo: historialConsumos[1] || null,
    cantidadConsumos: historialConsumos.length
  };
};