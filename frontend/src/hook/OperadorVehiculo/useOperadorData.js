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

        // Intentar obtener la máquina asignada desde la API (ahora incluye última medición)
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

          // ✅ MANTENER LA ESTRUCTURA ORIGINAL + AGREGAR ÚLTIMA MEDICIÓN
          setMaquinaAsignada(asignacion);

          console.log('✅ Datos cargados correctamente:', {
            usuario: asignacion.user.nombre + ' ' + asignacion.user.apellido,
            maquina: asignacion.maquina.maquina_interna?.nombre || asignacion.maquina.nombre_maquina,
            patente: asignacion.maquina.patente,
            ultima_medicion: asignacion.maquina.ultima_medicion?.medicion || 'Sin medición'
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
    
    // ✅ Datos específicos de la máquina para fácil acceso (CON MEDICIÓN)
    vehiculoInfo: maquinaAsignada ? {
      nombre: maquinaAsignada.maquina?.maquina_interna?.nombre || maquinaAsignada.maquina?.nombre_maquina || 'Sin nombre',
      patente: maquinaAsignada.maquina?.patente || maquinaAsignada.maquina?.maquina_interna?.patente || 'Sin patente',
      tipo: maquinaAsignada.maquina?.tipo_maquina || 'No especificado',
      estado: maquinaAsignada.maquina?.estado || 'desconocido',
      categoria: maquinaAsignada.maquina?.maquina_interna?.categoria || 'Sin categoría',
      combustible: maquinaAsignada.maquina?.tipo_combustible || 'Diésel',
      kilometraje: maquinaAsignada.maquina?.kilometraje_actual || null,
      
      // ✅ NUEVOS DATOS DE MEDICIÓN
      ultima_medicion: maquinaAsignada.maquina?.ultima_medicion?.medicion || null,
      fecha_medicion: maquinaAsignada.maquina?.ultima_medicion?.fecha_medicion || null,
    } : null,

    // ✅ Helper específico para datos de combustible
    combustibleInfo: maquinaAsignada ? {
      tipo: maquinaAsignada.maquina?.tipo_combustible || 'Diésel',
      ultima_medicion: maquinaAsignada.maquina?.ultima_medicion?.medicion || null,
      medicion_formateada: maquinaAsignada.maquina?.ultima_medicion?.medicion ? 
        `${parseFloat(maquinaAsignada.maquina.ultima_medicion.medicion).toFixed(1)} L` : 'Sin medición',
      fecha_medicion: maquinaAsignada.maquina?.ultima_medicion?.fecha_medicion || null,
      fecha_medicion_formateada: maquinaAsignada.maquina?.ultima_medicion?.fecha_medicion ? 
        new Date(maquinaAsignada.maquina.ultima_medicion.fecha_medicion).toLocaleDateString('es-ES') : null,
      tiene_medicion: !!(maquinaAsignada.maquina?.ultima_medicion?.medicion)
    } : null
  };
};