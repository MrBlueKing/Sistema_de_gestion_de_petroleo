// hooks/OperadorVehiculo/useMaquinasDisponibles.js
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../lib/axios';

export const useMaquinasDisponibles = () => {
  const [loading, setLoading] = useState(true);
  const [maquinasDisponibles, setMaquinasDisponibles] = useState([]);
  const [maquinasPorCategoria, setMaquinasPorCategoria] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [totalMaquinas, setTotalMaquinas] = useState(0);
  const [error, setError] = useState(null);

  // 🆕 FUNCIÓN PRINCIPAL PARA CARGAR MÁQUINAS DISPONIBLES
  const cargarMaquinasDisponibles = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('🚀 Cargando máquinas disponibles...');

      const response = await apiClient.get('/api/chofer/maquinas-disponibles');

      if (response.data.status === 'success' && response.data.data) {
        const { data } = response.data;

        // Establecer los datos en el estado
        setMaquinasDisponibles(data.maquinas || []);
        setMaquinasPorCategoria(data.por_categoria || []);
        setCategoriasDisponibles(data.categorias_disponibles || []);
        setTotalMaquinas(data.total_maquinas || 0);

        console.log('✅ Máquinas disponibles cargadas:', {
          total: data.total_maquinas,
          categorias: data.categorias_disponibles,
          maquinas: data.maquinas?.map(m => `${m.nombre_maquina} (${m.patente})`)
        });

        return data;
      } else {
        throw new Error(response.data.message || 'Error al obtener máquinas disponibles');
      }

    } catch (err) {
      console.error('❌ Error cargando máquinas disponibles:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else if (err.response?.status === 404) {
        setError('No se encontraron máquinas disponibles.');
      } else {
        setError('Error al cargar máquinas: ' + (err.response?.data?.message || err.message));
      }

      // Resetear datos en caso de error
      setMaquinasDisponibles([]);
      setMaquinasPorCategoria([]);
      setCategoriasDisponibles([]);
      setTotalMaquinas(0);
      
      return null;
      
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // 🎯 CARGAR MÁQUINAS AL MONTAR EL HOOK
  useEffect(() => {
    cargarMaquinasDisponibles();
  }, [cargarMaquinasDisponibles]);

  // 🔍 FUNCIÓN HELPER: Buscar máquina por ID
  const obtenerMaquinaPorId = useCallback((idMaquina) => {
    return maquinasDisponibles.find(maquina => 
      maquina.id_maquina === parseInt(idMaquina) || 
      maquina.id_maquina === idMaquina
    );
  }, [maquinasDisponibles]);

  // 🏷️ FUNCIÓN HELPER: Obtener máquinas de una categoría específica
  const obtenerMaquinasPorCategoria = useCallback((idCategoria) => {
    return maquinasDisponibles.filter(maquina => 
      maquina.categoria.id === parseInt(idCategoria) || 
      maquina.categoria.id === idCategoria
    );
  }, [maquinasDisponibles]);

  // 📊 FUNCIÓN HELPER: Obtener información de categorías con conteo
  const obtenerResumenCategorias = useCallback(() => {
    return maquinasPorCategoria.map(categoria => ({
      id: categoria.id_categoria,
      nombre: categoria.nombre_categoria,
      cantidad: categoria.cantidad_maquinas,
      tipo_medicion: categoria.tipo_medicion
    }));
  }, [maquinasPorCategoria]);

  // 🔄 FUNCIÓN PARA REFRESCAR DATOS
  const refrescarMaquinas = useCallback(async () => {
    console.log('🔄 Refrescando lista de máquinas disponibles...');
    return await cargarMaquinasDisponibles(false);
  }, [cargarMaquinasDisponibles]);

  // 🎯 DATOS PARA EL SELECTOR/DROPDOWN
  const opcionesMaquinas = maquinasDisponibles.map(maquina => ({
    value: maquina.id_maquina,
    label: maquina.display_name || `${maquina.nombre_maquina} (${maquina.patente})`,
    categoria: maquina.categoria.nombre,
    categoriaId: maquina.categoria.id,
    data: maquina // Datos completos de la máquina
  }));

  // 📋 DATOS AGRUPADOS PARA SELECTORS CON CATEGORÍAS
  const opcionesPorCategoria = maquinasPorCategoria.map(categoria => ({
    label: categoria.nombre_categoria,
    options: categoria.maquinas.map(maquina => ({
      value: maquina.id_maquina,
      label: maquina.display_name || `${maquina.nombre_maquina} (${maquina.patente})`,
      data: maquina
    }))
  }));

  return {
    // Estados principales
    loading,
    error,
    
    // Datos de máquinas
    maquinasDisponibles,
    maquinasPorCategoria, 
    categoriasDisponibles,
    totalMaquinas,
    
    // Datos para componentes de UI
    opcionesMaquinas,
    opcionesPorCategoria,
    
    // Funciones de utilidad
    obtenerMaquinaPorId,
    obtenerMaquinasPorCategoria,
    obtenerResumenCategorias,
    cargarMaquinasDisponibles,
    refrescarMaquinas,
    
    // Banderas útiles
    tieneMaquinas: totalMaquinas > 0,
    tieneError: !!error,
    estaVacio: !loading && totalMaquinas === 0,
  };
};