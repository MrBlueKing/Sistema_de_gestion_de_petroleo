// 🆕 CREAR: frontend/src/hook/OperadorVehiculo/useHistorialUsuario.js
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../lib/axios';

export const useHistorialUsuario = () => {
  const [loading, setLoading] = useState(false);
  const [cargas, setCargas] = useState([]);
  const [ultimaCarga, setUltimaCarga] = useState(null);
  const [penultimaCarga, setPenultimaCarga] = useState(null);
  const [totalCargas, setTotalCargas] = useState(0);
  const [error, setError] = useState(null);
  const [estadisticasMes, setEstadisticasMes] = useState(null);

  // 🎯 FUNCIÓN PRINCIPAL PARA CARGAR CARGAS DEL USUARIO
  const cargarMisCargas = useCallback(async (limite = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Cargando historial de cargas del usuario...');
      
      const response = await apiClient.get('/api/chofer/mis-cargas', {
        params: { limite }
      });
      
      console.log("🔍 DEBUGGING - Datos completos que recibo:", response.data);
      
      // ✅ CORREGIDO: Manejar la estructura real del backend
      if (response.data) {
        let cargasData = [];
        let estadisticas = null;
        
        // 🎯 NUEVA ESTRUCTURA: Backend devuelve directamente en root
        if (response.data.cargas_recientes && Array.isArray(response.data.cargas_recientes)) {
          cargasData = response.data.cargas_recientes;
          estadisticas = response.data.resumen || null;
          console.log("✅ Usando response.data.cargas_recientes (estructura nueva)");
        }
        // 🛡️ Fallbacks por si usas estructura anidada
        else if (response.data.data && response.data.data.cargas_recientes && Array.isArray(response.data.data.cargas_recientes)) {
          cargasData = response.data.data.cargas_recientes;
          estadisticas = response.data.data.resumen || null;
          console.log("✅ Usando response.data.data.cargas_recientes (estructura anidada)");
        }
        else if (Array.isArray(response.data.data)) {
          cargasData = response.data.data;
          console.log("✅ Usando response.data.data como array directo");
        }
        else if (Array.isArray(response.data)) {
          cargasData = response.data;
          console.log("✅ Usando response.data como array directo");
        }
        else {
          console.error("❌ No se encontró estructura de datos válida:", response.data);
          cargasData = [];
        }

        console.log("🔍 DEBUGGING - cargasData final:", cargasData.length, "elementos");
        console.log("🔍 DEBUGGING - estadisticas:", estadisticas);
        
        setCargas(cargasData);
        setTotalCargas(response.data.total_cargas || cargasData.length);
        setEstadisticasMes(estadisticas);
        
        // Establecer última y penúltima carga
        if (cargasData.length > 0) {
          setUltimaCarga(cargasData[0]);
          setPenultimaCarga(cargasData[1] || null);
        } else {
          setUltimaCarga(null);
          setPenultimaCarga(null);
        }
        
        console.log('✅ Historial de usuario cargado:', {
          total: cargasData.length,
          ultima_carga: cargasData[0]?.numero_boleta,
          estadisticas_mes: estadisticas
        });
        
        return cargasData;
      } else {
        throw new Error('No se pudieron cargar las cargas del usuario');
      }
    } catch (err) {
      console.error('❌ Error cargando historial del usuario:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Error al cargar el historial de cargas';
      
      setError(errorMessage);
      setCargas([]);
      setUltimaCarga(null);
      setPenultimaCarga(null);
      setTotalCargas(0);
      setEstadisticasMes(null);
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 🎯 FUNCIÓN PARA FILTRAR POR ESTADO
  const filtrarPorEstado = useCallback((estado) => {
    if (!estado || estado === 'todos') return cargas;
    return cargas.filter(carga => 
      carga.estado?.toLowerCase() === estado.toLowerCase()
    );
  }, [cargas]);

  // 🎯 FUNCIÓN PARA OBTENER ESTADÍSTICAS CALCULADAS
  const calcularEstadisticasPersonales = useCallback(() => {
    if (!cargas.length) return null;

    const totalLitros = cargas.reduce((sum, carga) => 
      sum + (parseFloat(carga.litros) || 0), 0
    );
    
    const totalCosto = cargas.reduce((sum, carga) => 
      sum + (parseFloat(carga.costo) || 0), 0
    );

    const porEstado = cargas.reduce((acc, carga) => {
      const estado = carga.estado || 'Sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    return {
      total_litros: totalLitros,
      total_costo: totalCosto,
      promedio_por_carga: cargas.length > 0 ? totalLitros / cargas.length : 0,
      por_estado: porEstado
    };
  }, [cargas]);

  // 🎯 AUTO-CARGAR AL MONTAR EL COMPONENTE
  useEffect(() => {
    cargarMisCargas();
  }, [cargarMisCargas]);

  return {
    // Estados
    loading,
    error,
    cargas,
    ultimaCarga,
    penultimaCarga,
    totalCargas,
    estadisticasMes, // Del backend (resumen mensual)
    
    // Funciones
    cargarMisCargas,
    filtrarPorEstado,
    calcularEstadisticasPersonales, // Calculadas localmente
    
    // Datos derivados
    hayCargas: cargas.length > 0,
    cargasPendientes: cargas.filter(c => c.estado === 'Pendiente'),
    cargasAprobadas: cargas.filter(c => c.estado === 'Aprobado'),
    cargasRendidas: cargas.filter(c => c.estado === 'Rendido')
  };
}; 