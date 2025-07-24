// hooks/useUltimaMedicionNumeralFinal.js - VERSIÓN MEJORADA
import { useState, useCallback, useRef } from 'react';
import axios from '../../lib/axios';

export const useUltimaMedicionNumeralFinal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  // Para evitar llamadas duplicadas
  const currentRequestRef = useRef(null);
  const lastMaquinaIdRef = useRef(null);

  // 🎯 Función principal para cargar datos
  const cargarUltimaMedicion = useCallback(async (idMaquina) => {
    if (!idMaquina) {
      setError('ID de máquina requerido');
      return null;
    }

    // Si ya estamos cargando la misma máquina, no hacer otra petición
    if (currentRequestRef.current && lastMaquinaIdRef.current === idMaquina) {
      console.log('⏸️ Petición en curso para la misma máquina, esperando...');
      return currentRequestRef.current;
    }

    try {
      setLoading(true);
      setError(null);
      lastMaquinaIdRef.current = idMaquina;

      console.log(`🔍 Cargando última medición para máquina: ${idMaquina}`);

      // Crear la promesa y guardarla para evitar duplicados
      const requestPromise = axios.get('/api/consumos/ultima-medicion', {
        params: { id_maquina: idMaquina }
      });
      
      currentRequestRef.current = requestPromise;
      const response = await requestPromise;

      if (response.data.success) {
        const responseData = response.data.data;
        setData(responseData);
        console.log('✅ Datos cargados:', responseData);
        return responseData;
      } else {
        throw new Error(response.data.message || 'Error al cargar datos');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar última medición';
      setError(errorMessage);
      console.error('❌ Error cargando última medición:', errorMessage);
      return null;
    } finally {
      setLoading(false);
      currentRequestRef.current = null;
    }
  }, []);

  // 🔄 Función para limpiar datos
  const limpiarDatos = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    currentRequestRef.current = null;
    lastMaquinaIdRef.current = null;
  }, []);

  // 🔄 Función para recargar datos
  const recargarDatos = useCallback(async () => {
    if (lastMaquinaIdRef.current) {
      currentRequestRef.current = null; // Forzar nueva petición
      return await cargarUltimaMedicion(lastMaquinaIdRef.current);
    }
  }, [cargarUltimaMedicion]);

  return {
    // Estados
    loading,
    error,
    data,
    
    // Funciones
    cargarUltimaMedicion,
    limpiarDatos,
    recargarDatos,
    
    // Datos específicos (para fácil acceso)
    tieneConsumo: data?.tiene_consumo || false,
    medicionFormateada: data?.medicion_formateada || '0 km',
    numeralInicialSugerido: data?.numeral_inicial_sugerido || null,
  };
};