// hooks/OperadorVehiculo/useOperadorData.js - REFACTORIZADO
import { useState, useEffect, useCallback } from 'react';
import { getAuthUser } from '../../utils/session';
import apiClient from '../../lib/axios';

export const useOperadorData = () => {
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [error, setError] = useState(null);

  // 🆕 FUNCIÓN SIMPLIFICADA PARA CARGAR SOLO DATOS DEL USUARIO
  const cargarDatosOperador = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('👤 Cargando información del usuario...');

      // ✅ USAR EL NUEVO ENDPOINT QUE SOLO RETORNA INFO DEL USUARIO
      const response = await apiClient.get(`/api/chofer/mi-informacion`);
      
      if (response.data.status === 'success' && response.data.data) {
        const userData = response.data.data;
        
        // ✅ ESTABLECER DATOS DEL USUARIO
        setUsuario({
          id: userData.id,
          rut: userData.rut,
          nombre: userData.nombre,
          apellido: userData.apellido,
          nombreCompleto: userData.nombreCompleto,
          email: userData.email,
          rol: userData.rol,
          id_faena: userData.id_faena,
          faena: userData.faena,
          estado: userData.estado
        });

        console.log('✅ Información del usuario cargada:', userData.nombreCompleto);
        return userData;
        
      } else {
        throw new Error(response.data.message || 'Error al obtener información del usuario');
      }
      
    } catch (err) {
      console.error('❌ Error cargando datos del operador:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      } else if (err.response?.status === 404) {
        setError('No se encontró información del usuario.');
      } else {
        setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
      }
      
      // 🔄 FALLBACK: Intentar usar datos de sesión si están disponibles
      const usuarioSesion = getAuthUser();
      if (usuarioSesion?.id) {
        console.log('🔄 Usando datos de sesión como fallback');
        setUsuario({
          id: usuarioSesion.id,
          nombre: usuarioSesion.nombre,
          apellido: usuarioSesion.apellido,
          nombreCompleto: usuarioSesion.nombreCompleto,
          email: usuarioSesion.email,
          rol: usuarioSesion.rol
        });
      }
      
      return null;
      
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ EFECTO INICIAL PARA CARGAR DATOS
  useEffect(() => {
    cargarDatosOperador();
  }, [cargarDatosOperador]);

  // 🆕 FUNCIÓN PARA RECARGAR DATOS MANUALMENTE
  const recargarDatos = useCallback(() => {
    return cargarDatosOperador(true);
  }, [cargarDatosOperador]);

  return {
    loading,
    usuario,
    error,
    // 🆕 FUNCIÓN PARA RECARGAR DATOS MANUALMENTE
    recargarDatos
  };
};