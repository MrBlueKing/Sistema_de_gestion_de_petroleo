// hooks/OperadorVehiculo/useOperadorData.js
import { useState, useEffect } from 'react';
import { getAuthUser } from '../../utils/session';
import apiClient from '../../lib/axios';

export const useOperadorData = () => {
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [maquinaAsignada, setMaquinaAsignada] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener datos básicos de sesión como fallback
        const usuarioSesion = getAuthUser();

        // Intentar obtener la máquina asignada desde la API (ahora incluye último consumo)
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
              `${asignacion.maquina.ultimo_consumo.litros}L` : 'Sin consumos'
          });

        } else {
          // No tiene máquina asignada
          console.log('⚠️ Usuario sin máquina asignada');
          
          if (usuarioSesion) {
            setUsuario({
              id: usuarioSesion.id,
              rut: usuarioSesion.rut,
              nombre: usuarioSesion.nombre,
              apellido: null,
              nombreCompleto: usuarioSesion.nombre,
              rol: usuarioSesion.rol,
              id_faena: usuarioSesion.id_faena
            });
          }
          
          setMaquinaAsignada(null);
        }

      } catch (error) {
        console.error('❌ Error al cargar datos del operador:', error);
        
        if (error.response?.status === 404) {
          setError('No tienes una máquina asignada');
        } else if (error.response?.status === 401) {
          setError('Sesión expirada');
        } else {
          setError(error.message || 'Error al cargar datos');
        }
        
        // Fallback: usar datos de sesión si falla la API
        const usuarioSesion = getAuthUser();
        if (usuarioSesion) {
          setUsuario({
            id: usuarioSesion.id,
            rut: usuarioSesion.rut,
            nombre: usuarioSesion.nombre,
            apellido: null,
            nombreCompleto: usuarioSesion.nombre,
            rol: usuarioSesion.rol,
            id_faena: usuarioSesion.id_faena
          });
        }
        
        setMaquinaAsignada(null);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Función para recargar datos
  const recargarDatos = () => {
    cargarDatos();
  };

  return {
    loading,
    usuario,
    maquinaAsignada,
    error,
    recargarDatos,
    
    // Funciones helper útiles
    tieneVehiculo: !!maquinaAsignada,
    nombreCorto: usuario?.nombre?.split(' ')[0] || 'Usuario',
    nombreCompleto: usuario?.nombreCompleto || usuario?.nombre || 'Usuario',
    
    // ✅ Datos específicos de la máquina para fácil acceso
    vehiculoInfo: maquinaAsignada ? {
      nombre: maquinaAsignada.maquina?.maquina_interna?.nombre || maquinaAsignada.maquina?.nombre_maquina || 'Sin nombre',
      patente: maquinaAsignada.maquina?.patente || maquinaAsignada.maquina?.maquina_interna?.patente || 'Sin patente',
      tipo: maquinaAsignada.maquina?.tipo_maquina || 'No especificado',
      estado: maquinaAsignada.maquina?.estado || 'desconocido',
      categoria: maquinaAsignada.maquina?.maquina_interna?.categoria || 'Sin categoría',
      combustible: maquinaAsignada.maquina?.tipo_combustible || 'Diésel',
      kilometraje: maquinaAsignada.maquina?.kilometraje_actual || null,
    } : null,

    // ✅ Helper específico para datos de combustible (MANTENER COMPATIBILIDAD)
    combustibleInfo: maquinaAsignada ? {
      tipo: maquinaAsignada.maquina?.tipo_combustible || 'Diésel',
      ultima_medicion: maquinaAsignada.maquina?.ultima_medicion?.medicion || null,
      medicion_formateada: maquinaAsignada.maquina?.ultima_medicion?.medicion ? 
        `${parseFloat(maquinaAsignada.maquina.ultima_medicion.medicion).toFixed(1)} L` : 'Sin medición',
      fecha_medicion: maquinaAsignada.maquina?.ultima_medicion?.fecha_medicion || null,
      fecha_medicion_formateada: maquinaAsignada.maquina?.ultima_medicion?.fecha_medicion ? 
        new Date(maquinaAsignada.maquina.ultima_medicion.fecha_medicion).toLocaleDateString('es-ES') : null,
      tiene_medicion: !!(maquinaAsignada.maquina?.ultima_medicion?.medicion)
    } : null,

    // ✅ NUEVO: Helper específico para último consumo completo (NOMBRES CORRECTOS)
    ultimoConsumoInfo: maquinaAsignada?.maquina?.ultimo_consumo ? {
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
    }
  };
};