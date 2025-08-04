// ✅ LoginScreen.jsx usando tu UserContext mejorado
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../../lib/axios";
import { storeSession, isSessionValid, clearSession } from "../../../utils/session";
import Icon from "../../atoms/Icons/Icon3h";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import LoadingOverlay from "../../atoms/FeedBack/Loading";
import ErrorMessage from "../../atoms/FeedBack/ErrorMessage";
import icono from "../../../assets/logo.png";
import { FaUser, FaLock } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";

const LoginScreen = () => {
  const [formData, setFormData] = useState({
    rut: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  
  // 🎯 USAR TUS FUNCIONES DEL CONTEXTO
  const { setUser, clearUserContext, forceRefresh } = useContext(UserContext);

  const extractRole = (roleData) => {
    if (typeof roleData === 'string') return roleData;
    if (roleData?.rol) return roleData.rol;
    if (roleData?.role) return roleData.role;
    return null;
  };

  // 🎯 REDIRECCIÓN PROFESIONAL CON TU CONTEXTO
  const redirectByRole = async (roleData) => {
    const rol = extractRole(roleData);
    console.log("🎯 Redirigiendo usuario con rol:", rol);

    const roleRoutes = {
      admin: "/administrador",
      bombero: "/bombero", 
      gerente: "/gerente",
      toneladas: "/IngresoToneladas",
      planificador: "/Mantenimiento",
      OperadorVehiculo: "/OperadorVehiculo",
      asistente_bombero: "/bombero",
    };

    const targetRoute = roleRoutes[rol] || "/";

    try {
      console.log("✅ Redirigiendo a:", targetRoute);
      
      // 🔄 USANDO TU FUNCIÓN DE FORZAR REFRESH
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navegación React Router con estado
      navigate(targetRoute, { 
        replace: true,
        state: { 
          loginSuccess: true,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error("❌ Error en redirección:", error);
      // Fallback solo si algo falla
      window.location.href = targetRoute;
    }
  };

  // Verificar sesión existente
  useEffect(() => {
    if (isSessionValid()) {
      try {
        const sessionData = JSON.parse(localStorage.getItem("authToken"));
        if (sessionData?.role) {
          console.log("👤 Usuario ya autenticado, redirigiendo...");
          redirectByRole(sessionData.role);
        }
      } catch (error) {
        console.error("Error al leer sesión:", error);
        clearSession();
      }
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.rut.trim()) {
      setError("El RUT es obligatorio");
      return false;
    }
    if (!formData.password.trim()) {
      setError("La contraseña es obligatoria");
      return false;
    }
    if (formData.password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError("");
    setIsLoading(true);

    try {
      console.log("🔐 Iniciando login para:", formData.rut);

      // 🧹 PASO 1: Limpiar estado previo usando TU FUNCIÓN
      clearUserContext();
      clearSession();

      const response = await axios.post("/api/login", {
        rut: formData.rut.trim(),
        password: formData.password
      });

      const { token, user, expires_at } = response.data;
      const userRole = extractRole(user.rol);

      // 🔐 PASO 2: Guardar nueva sesión
      storeSession({
        token,
        user: { ...user, rol: userRole },
        expiresAt: expires_at
      });

      console.log("✅ Login exitoso, actualizando contexto...");

      try {
        // 📡 PASO 3: Usar TU LÓGICA de obtener datos completos
        const userResponse = await axios.get("/api/user", {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        console.log("✅ Datos completos obtenidos");
        const userData = userResponse.data;

        // 🎯 PASO 4: Actualizar contexto usando TU SETTER
        setUser(userData);

        // 🚀 PASO 5: Redirección
        const completeUserRole = extractRole(userData.rol);
        await redirectByRole(completeUserRole || userRole);

      } catch (userDataError) {
        console.warn("⚠️ Error obteniendo datos completos, usando básicos");
        setUser(user);
        await redirectByRole(userRole);
      }

    } catch (err) {
      console.error("❌ Error en login:", err);
      
      let errorMessage = "Error al iniciar sesión.";
      
      if (err.response?.status === 401) {
        errorMessage = "RUT o contraseña incorrectos.";
        setFormData(prev => ({ ...prev, password: "" }));
      } else if (err.response?.status === 403) {
        errorMessage = err.response.data?.message || "Cuenta inactiva.";
      } else if (err.response?.status === 422) {
        errorMessage = "Datos de entrada inválidos.";
      } else if (err.response?.status === 429) {
        errorMessage = "Demasiados intentos. Intenta más tarde.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Error del servidor. Intenta más tarde.";
      } else if (!err.response) {
        errorMessage = "Sin conexión al servidor.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-100 to-white-200 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <LoadingOverlay isLoading={isLoading} message="Iniciando sesión..." />

        <div className="text-center mb-8">
          <Icon src={icono} alt="3H COOPER" size="w-24 h-28 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Iniciar Sesión</h1>
          <p className="text-gray-600">Accede al sistema de gestión</p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
              RUT
            </label>
            <InputField
              id="rut"
              type="text"
              placeholder="Ej: 12345678-9"
              value={formData.rut}
              onChange={(e) => handleInputChange('rut', e.target.value)}
              icon={<FaUser className="text-gray-400" />}
              disabled={isLoading}
              maxLength={12}
              autoComplete="username"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <InputField
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              icon={<FaLock className="text-gray-400" />}
              disabled={isLoading}
              autoComplete="current-password"
              className="w-full"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-orange-600 hover:text-orange-500 focus:outline-none focus:underline"
              disabled={isLoading}
              onClick={() => alert("Contacta al administrador para recuperar tu contraseña")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.rut.trim() || !formData.password.trim()}
            color="orange"
            rounded="lg"
            className="w-full font-bold py-3 px-4 min-h-[48px] border-0"
            text={isLoading ? "Iniciando sesión..." : "Ingresar"}
            loading={isLoading}
          />
        </form>
        
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;