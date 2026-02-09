import axios from '../lib/axios';

/**
 * Servicio para manejar autenticación desde el sistema centralizado
 */
class AuthCentralizadoService {
  /**
   * Autenticar con token del sistema centralizado
   * @param {string} token - Token Bearer del sistema centralizado
   * @param {number} moduloId - ID del módulo (Gestión de Petróleo)
   * @param {string} rolSolicitado - Rol específico solicitado (ej: 'bombero', 'admin')
   * @returns {Promise<Object>} Datos del usuario autenticado
   */
  async loginWithToken(token, moduloId, rolSolicitado = null) {
    try {
      console.log('🔐 Autenticando con sistema centralizado...', {
        moduloId,
        rolSolicitado,
        tokenPreview: token.substring(0, 20) + '...'
      });

      const response = await axios.post(
        '/api/login-centralizado',
        {
          modulo_id: parseInt(moduloId),
          rol_solicitado: rolSolicitado // 🆕 Enviar el rol
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Autenticación centralizada exitosa', {
          user: response.data.user.nombre,
          rol: response.data.user.rol
        });

        // Guardar token y usuario en localStorage
        this.saveSession(response.data);

        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          authenticatedBy: 'sistema_centralizado'
        };
      }

      return {
        success: false,
        message: response.data.message || 'Error en autenticación'
      };

    } catch (error) {
      console.error('❌ Error en autenticación centralizada:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Error al autenticar con el sistema centralizado',
        error: error.response?.data
      };
    }
  }

  /**
   * Guardar sesión en localStorage
   * Usa el formato esperado por el sistema de petróleo
   */
  saveSession(data) {
    // ✅ IMPORTANTE: Usar el mismo formato que storeSession() de utils/session.js
    const sessionData = {
      token: data.token,
      expiration: data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + 24 * 60 * 60 * 1000,
      role: data.user.rol, // role (no "rol")
      roleId: data.user.id_rol, // 🆕 Agregar roleId para que UserProfileDropdown lo pueda usar
      userId: data.user.id,
      userName: data.user.nombre,
      userLastName: data.user.apellido,
      userRut: data.user.rut,
      faenaId: data.user.id_faena,
      storedAt: Date.now()
    };

    localStorage.setItem('authToken', JSON.stringify(sessionData));

    // ✅ CRÍTICO: También guardar el objeto 'user' completo
    // Esto es lo que faltaba y causaba el problema de datos mezclados
    const userData = {
      id: data.user.id,
      nombre: data.user.nombre,
      apellido: data.user.apellido,
      rut: data.user.rut,
      email: data.user.email,
      rol: data.user.rol,
      faena: data.user.faena,
      id_rol: data.user.id_rol,
      id_faena: data.user.id_faena
    };

    localStorage.setItem('user', JSON.stringify(userData));

    // También guardar en sessionStorage como respaldo
    sessionStorage.setItem('authToken_backup', JSON.stringify({
      token: data.token,
      expiration: sessionData.expiration,
      role: data.user.rol
    }));

    // Guardar información adicional (opcional)
    if (data.roles_centralizados) {
      localStorage.setItem('roles_centralizados', JSON.stringify(data.roles_centralizados));
    }

    if (data.permisos) {
      localStorage.setItem('permisos_centralizados', JSON.stringify(data.permisos));
    }

    console.log('💾 Sesión guardada en localStorage', {
      authToken: sessionData,
      user: userData
    });
  }

  /**
   * Verificar si hay parámetros de autenticación centralizada en la URL
   */
  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const moduloId = params.get('modulo_id');
    const rol = params.get('rol'); // 🆕 Obtener el rol de la URL

    if (token && moduloId) {
      console.log('🔍 Detectados parámetros de autenticación centralizada');
      console.log('🔑 Token recibido:', token);
      console.log('📦 Módulo ID:', moduloId);
      console.log('👤 Rol solicitado:', rol); // 🆕
      console.log('📏 Longitud del token:', token.length);
      return { token, moduloId, rol }; // 🆕 Incluir rol
    }

    return null;
  }

  /**
   * Limpiar parámetros de la URL sin recargar
   */
  cleanUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('modulo_id');
    url.searchParams.delete('rol'); // 🆕 Limpiar también el rol
    window.history.replaceState({}, document.title, url.pathname);
    console.log('🧹 URL limpiada');
  }

  /**
   * Obtener URL del sistema centralizado (FRONTEND)
   */
  getCentralSystemUrl() {
    // URL del FRONTEND del sistema centralizado, no del backend
    // NOTA: Actualmente usando 5174 porque 5173 estaba ocupado
    return import.meta.env.VITE_SISTEMA_CENTRALIZADO_URL || 'http://localhost:5174';
  }
}

export default new AuthCentralizadoService();
