import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "../lib/axios";
import { clearSession } from "../utils/session"; // Asumiendo que tienes esta función

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🆕 FUNCIÓN PARA LIMPIAR CONTEXTO COMPLETAMENTE
  const clearUserContext = useCallback(() => {
    console.log("🧹 Limpiando contexto de usuario");
    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  // 🆕 FUNCIÓN PARA REFRESCAR USUARIO (mantiene tu lógica existente)
  const refreshUser = useCallback(async () => {
    const token = JSON.parse(localStorage.getItem("authToken"))?.token;
    if (!token) {
      clearUserContext();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 🔄 USAR TU LÓGICA EXISTENTE PERO MEJORADA
      const response = await axios.get("/api/user", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache', // 🆕 Anti-caché
          'Pragma': 'no-cache'
        },
      });

      console.log("Datos del usuario obtenidos:", response.data);
      const userData = response.data;

      if (!userData.id_faena) {
        console.warn("id_faena faltante, intentando con fetch...");

        try {
          const fetchResponse = await fetch("http://127.0.0.1:8000/api/user", {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              'Cache-Control': 'no-cache', // 🆕 Anti-caché
              'Pragma': 'no-cache'
            },
            credentials: "include",
          });
          const fetchData = await fetchResponse.json();

          if (fetchData.id_faena) {
            console.log("✅ Fetch trajo id_faena, usando datos de fetch.");
            setUser(fetchData);
          } else {
            console.warn("⚠️ Fetch también carece de id_faena, usando datos de axios.");
            setUser(userData);
          }
        } catch (fetchError) {
          console.error("❌ Error con fetch nativo:", fetchError);
          setUser(userData);
        }
      } else {
        setUser(userData);
      }
    } catch (error) {
      console.error("❌ Error al obtener datos del usuario:", error);
      
      // 🔍 MEJOR MANEJO DE ERRORES
      if (error.response?.status === 401) {
        console.log("🔐 Token expirado, limpiando sesión");
        clearSession();
        clearUserContext();
      } else {
        setError("No se pudo cargar el usuario.");
      }
    } finally {
      setLoading(false);
    }
  }, [clearUserContext]);

  // 🆕 FUNCIÓN PARA LOGOUT COMPLETO
  const logout = useCallback(() => {
    clearSession();
    clearUserContext();
  }, [clearUserContext]);

  // 🆕 FUNCIÓN PARA FORZAR ACTUALIZACIÓN (útil post-login)
  const forceRefresh = useCallback(() => {
    console.log("🔄 Forzando actualización del contexto");
    setUser(null); // Limpiar primero
    setTimeout(() => {
      refreshUser(); // Luego refrescar
    }, 100);
  }, [refreshUser]);

  // TU LÓGICA ORIGINAL EN useEffect - MEJORADA
  useEffect(() => {
    const fetchUserData = async () => {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 🆕 USAR HEADERS ANTI-CACHÉ
        const response = await axios.get("/api/user", {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });

        console.log("Datos del usuario obtenidos:", response.data);
        const userData = response.data;

        if (!userData.id_faena) {
          console.warn("id_faena faltante, intentando con fetch...");

          try {
            const fetchResponse = await fetch("http://127.0.0.1:8000/api/user", {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                'Cache-Control': 'no-cache', // 🆕 Anti-caché
                'Pragma': 'no-cache'
              },
              credentials: "include",
            });
            const fetchData = await fetchResponse.json();

            if (fetchData.id_faena) {
              console.log("✅ Fetch trajo id_faena, usando datos de fetch.");
              setUser(fetchData);
            } else {
              console.warn("⚠️ Fetch también carece de id_faena, usando datos de axios.");
              setUser(userData);
            }
          } catch (fetchError) {
            console.error("❌ Error con fetch nativo:", fetchError);
            setUser(userData);
          }
        } else {
          setUser(userData);
        }
      } catch (error) {
        console.error("❌ Error al obtener datos del usuario:", error);
        
        // 🔍 MEJOR MANEJO DE ERRORES
        if (error.response?.status === 401) {
          console.log("🔐 Token expirado en carga inicial");
          clearSession();
          clearUserContext();
        } else {
          setError("No se pudo cargar el usuario.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [clearUserContext]);

  // 🔄 MONITOREAR CAMBIOS EN LOCALSTORAGE (para logout en otras pestañas)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        if (!e.newValue) {
          // Token eliminado en otra pestaña
          console.log("🔐 Token eliminado en otra pestaña");
          clearUserContext();
        } else {
          // Token actualizado en otra pestaña
          console.log("🔄 Token actualizado en otra pestaña");
          setTimeout(() => refreshUser(), 100);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUser, clearUserContext]);

  // 🎯 VALOR DEL CONTEXTO - TUS PROPS ORIGINALES + NUEVAS FUNCIONES
  const value = {
    // ✅ TUS PROPS ORIGINALES
    user, 
    setUser, 
    loading, 
    error,
    
    // 🆕 NUEVAS FUNCIONES ÚTILES
    clearUserContext,  // Para limpiar estado
    refreshUser,       // Para refrescar datos
    logout,           // Para logout completo
    forceRefresh      // Para actualización forzada post-login
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};