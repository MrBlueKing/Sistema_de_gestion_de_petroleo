// hooks/OperadorVehiculo/useOperadorData.js - MODIFICADO
import { useState, useEffect, useCallback } from 'react';
import { getAuthUser } from '../../utils/session';
import apiClient from '../../lib/axios';

export const useOperadorData = () => {
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [maquinaAsignada, setMaquinaAsignada] = useState(null);
  const [error, setError] = useState(null);

  // 🆕 FUNCIÓN PRINCIPAL PARA CARGAR DATOS (extraída para reutilizar)
  const cargarDatosOperador = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Obtener datos básicos de sesión como fallback
      const usuarioSesion = getAuthUser();

      // Intentar obtener la máquina asignada desde la API
      const response = await apiClient.get(`/api/chofer/mi-maquina`);
      
      if (response.data.status === 'success' && response.data.data) {
        const asignacion = response.data.data;
        
        // Usar datos completos del usuario desde la API
        setUsuario({
          id: asignacion.user.id,
          rut: asignacion.user.rut,
          nombre: asignacion.user.nombre,
          apellido: asignacion.user.apellido,
          nombreCompleto: `${asignacion.user.nombre} ${asignacion.user.apellido}`.trim(),
          email: asignacion.user.email,
          rol: asignacion.user.id_rol,
          id_faena: asignacion.user.id_faena,
          estado: asignacion.user.estado
        });

        // Mantener la estructura original
        setMaquinaAsignada(asignacion);

        console.log('✅ Datos cargados correctamente:', {
          usuario: asignacion.user.nombre + ' ' + asignacion.user.apellido,
          maquina: asignacion.maquina.maquina_interna?.nombre || asignacion.maquina.nombre_maquina,
          patente: asignacion.maquina.patente,
          ultimo_consumo: asignacion.maquina.ultimo_consumo?.litros ? 
            `${asignacion.maquina.ultimo_consumo.litros} L` : 'Sin consumos'
        });

        return asignacion; // 🆕 RETORNAR DATOS PARA VALIDACIÓN
        
      } else if (response.data.status === 'info' && response.data.message?.includes('sin asignación')) {
        // Usuario logueado pero sin máquina asignada
        if (usuarioSesion?.id) {
          setUsuario({
            id: usuarioSesion.id,
            nombre: usuarioSesion.nombre,
            apellido: usuarioSesion.apellido,
            nombreCompleto: usuarioSesion.nombreCompleto,
            email: usuarioSesion.email,
            rol: usuarioSesion.rol
          });
        }
        setMaquinaAsignada(null);
        setError('No tienes ningún vehículo asignado actualmente. Contacta a tu supervisor.');
        return null; // 🆕 RETORNAR NULL SI NO HAY ASIGNACIÓN
      } else {
        throw new Error(response.data.message || 'Error desconocido al obtener datos');
      }
      
    } catch (err) {
      console.error('❌ Error cargando datos del operador:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else if (err.response?.status === 404) {
        setError('No se encontraron datos de asignación.');
      } else {
        setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
      }
      
      // En caso de error, intentar usar datos de sesión si están disponibles
      const usuarioSesion = getAuthUser();
      if (usuarioSesion?.id) {
        setUsuario(usuarioSesion);
      }
      setMaquinaAsignada(null);
      return null; // 🆕 RETORNAR NULL EN CASO DE ERROR
      
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // 🆕 FUNCIÓN ESPECÍFICA PARA REVALIDAR ASIGNACIÓN ANTES DE INGRESO
  const revalidarAsignacion = useCallback(async () => {
    try {
      console.log('🔄 Revalidando asignación antes del ingreso...');
      
      // Cargar datos sin mostrar loading principal
      const asignacionActiva = await cargarDatosOperador(false);
      
      if (!asignacionActiva) {
        console.log('❌ No hay asignación activa');
        return {
          valida: false,
          mensaje: 'Tu asignación de vehículo ha terminado. No puedes hacer más ingresos.'
        };
      }
      
      // Verificar que la asignación esté realmente activa
      if (asignacionActiva.activo === false || asignacionActiva.activo === 0) {
        console.log('❌ Asignación encontrada pero inactiva');
        setMaquinaAsignada(null);
        setError('Tu asignación de vehículo ha sido desactivada.');
        return {
          valida: false,
          mensaje: 'Tu asignación de vehículo ha sido desactivada. Contacta a tu supervisor.'
        };
      }
      
      console.log('✅ Asignación válida confirmada');
      return {
        valida: true,
        asignacion: asignacionActiva
      };
      
    } catch (error) {
      console.error('❌ Error revalidando asignación:', error);
      return {
        valida: false,
        mensaje: 'Error verificando asignación. Intenta nuevamente.'
      };
    }
  }, [cargarDatosOperador]);

  // Efecto inicial para cargar datos
  useEffect(() => {
    cargarDatosOperador();
  }, [cargarDatosOperador]);

  // 🆕 HELPER FUNCTIONS (mantener tus funciones existentes)
  const infoMaquina = maquinaAsignada ? {
    id: maquinaAsignada.id_maquina || maquinaAsignada.maquina?.id_maquina,
    nombre: maquinaAsignada.maquina?.maquina_interna?.nombre || maquinaAsignada.maquina?.nombre_maquina || 'Sin nombre',
    patente: maquinaAsignada.maquina?.patente || maquinaAsignada.maquina?.maquina_interna?.patente || 'Sin patente',
    tipo: maquinaAsignada.maquina?.tipo_maquina || 'Sin tipo',
    chc: maquinaAsignada.maquina?.chc_maquina || null,
    categoria: maquinaAsignada.maquina?.categoria?.nombre || 'Sin categoría',
    estado: maquinaAsignada.maquina?.estado || 'desconocido',
    disponible: maquinaAsignada.maquina?.estado === 'disponible',
    fecha_asignacion: maquinaAsignada.fecha_asignacion,
    fecha_asignacion_formateada: maquinaAsignada.fecha_asignacion ? 
      new Date(maquinaAsignada.fecha_asignacion).toLocaleDateString('es-ES') : null
  } : null;

  const combustibleInfo = maquinaAsignada ? {
    tipo: maquinaAsignada.maquina?.tipo_combustible || 'Diésel',
    ultima_medicion: maquinaAsignada.maquina?.ultima_medicion?.medicion || null,
    medicion_formateada: maquinaAsignada.maquina?.ultima_medicion?.medicion ? 
      `${parseFloat(maquinaAsignada.maquina.ultima_medicion.medicion).toFixed(1)} L` : 'Sin medición',
    fecha_medicion: maquinaAsignada.maquina?.ultima_medicion?.fecha_medicion || null,
    fecha_medicion_formateada: maquinaAsignada.maquina?.ultima_medicion?.fecha_medicion ? 
      new Date(maquinaAsignada.maquina.ultima_medicion.fecha_medicion).toLocaleDateString('es-ES') : null,
    tiene_medicion: !!(maquinaAsignada.maquina?.ultima_medicion?.medicion)
  } : null;

  const ultimoConsumoInfo = maquinaAsignada?.maquina?.ultimo_consumo ? {
    tiene_consumo: true,
    litros: maquinaAsignada.maquina.ultimo_consumo.litros_consumidos,
    litros_formateados: maquinaAsignada.maquina.ultimo_consumo.litros_consumidos ? 
      `${parseFloat(maquinaAsignada.maquina.ultimo_consumo.litros_consumidos).toFixed(1)} L` : 'N/A',
    kilometraje: maquinaAsignada.maquina.ultimo_consumo.kilometraje,
    kilometraje_formateado: maquinaAsignada.maquina.ultimo_consumo.kilometraje ? 
      `${parseFloat(maquinaAsignada.maquina.ultimo_consumo.kilometraje).toFixed(0)} km` : 'N/A',
    fecha_consumo: maquinaAsignada.maquina.ultimo_consumo.fecha_consumo,
    fecha_formateada: maquinaAsignada.maquina.ultimo_consumo.fecha_consumo ? 
      new Date(maquinaAsignada.maquina.ultimo_consumo.fecha_consumo).toLocaleDateString('es-ES') : 'Sin fecha',
    costo_total: maquinaAsignada.maquina.ultimo_consumo.costo_total,
    costo_formateado: maquinaAsignada.maquina.ultimo_consumo.costo_total ? 
      `${parseFloat(maquinaAsignada.maquina.ultimo_consumo.costo_total).toLocaleString()}` : 'N/A',
    precio_litro: maquinaAsignada.maquina.ultimo_consumo.precio_litro,
    precio_formateado: maquinaAsignada.maquina.ultimo_consumo.precio_litro ? 
      `${parseFloat(maquinaAsignada.maquina.ultimo_consumo.precio_litro).toFixed(0)}` : 'N/A',
    tipo_consumo: maquinaAsignada.maquina.ultimo_consumo.tipo_consumo,
    tipo_operacion: maquinaAsignada.maquina.ultimo_consumo.tipo_operacion,
    numeral_inicial: maquinaAsignada.maquina.ultimo_consumo.numeral_inicial,
    numeral_final: maquinaAsignada.maquina.ultimo_consumo.numeral_final,
    observacion: maquinaAsignada.maquina.ultimo_consumo.observacion,
  } : {
    tiene_consumo: false,
    litros_formateados: 'Sin consumos',
    kilometraje_formateado: 'Sin registros',
    fecha_formateada: 'Sin fecha',
    costo_formateado: 'N/A',
    precio_formateado: 'N/A'
  };

  return {
    loading,
    usuario,
    maquinaAsignada,
    error,
    // Helper functions originales
    infoMaquina,
    combustibleInfo,
    ultimoConsumoInfo,
    // 🆕 NUEVA FUNCIÓN PARA REVALIDAR
    revalidarAsignacion,
    // 🆕 FUNCIÓN PARA RECARGAR DATOS MANUALMENTE
    recargarDatos: () => cargarDatosOperador(true)
  };
};