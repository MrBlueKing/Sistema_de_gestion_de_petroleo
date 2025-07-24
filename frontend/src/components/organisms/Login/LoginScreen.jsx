// ✅ SOLUCION: LoginScreen.jsx con manejo correcto del rol
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
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
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
  const { setUser } = useContext(UserContext);

  // ✅ FIX: Función para extraer el rol correctamente
  const extractRole = (roleData) => {
    console.log("🔍 Datos de rol recibidos:", roleData);

    // Si es un string, devolverlo directamente
    if (typeof roleData === 'string') {
      return roleData;
    }

    // Si es un objeto con propiedad 'rol'
    if (roleData && typeof roleData === 'object' && roleData.rol) {
      return roleData.rol;
    }

    // Si es un objeto con propiedad 'role'
    if (roleData && typeof roleData === 'object' && roleData.role) {
      return roleData.role;
    }

    console.warn("⚠️ No se pudo extraer el rol de:", roleData);
    return null;
  };

  // ✅ FIX: Función de redirección corregida
  const redirectByRole = (roleData) => {
    const rol = extractRole(roleData);
    console.log("🎯 Redirigiendo usuario con rol extraído:", rol);

    const roleRoutes = {
      admin: "/administrador",
      bombero: "/bombero",
      gerente: "/gerente",
      toneladas: "/IngresoToneladas",
      planificador: "/Mantenimiento",
      OperadorVehiculo: "/OperadorVehiculo",
    };

    const targetRoute = roleRoutes[rol];

    if (targetRoute) {
      console.log("✅ Redirigiendo a:", targetRoute);
      navigate(targetRoute, { replace: true });
    } else {
      console.warn("⚠️ Rol no reconocido:", rol, "- redirigiendo a home");
      navigate("/", { replace: true });
    }
  };

  // Verificar si ya está autenticado al cargar el componente
  useEffect(() => {
    if (isSessionValid()) {
      try {
        const sessionData = JSON.parse(localStorage.getItem("authToken"));
        if (sessionData?.role) {
          console.log("👤 Usuario ya autenticado, rol:", sessionData.role);
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
      console.log("🔐 Iniciando proceso de login para RUT:", formData.rut);

      const response = await axios.post("/api/login", {
        rut: formData.rut.trim(),
        password: formData.password
      });

      console.log("✅ Login exitoso:", response.data);

      const { token, user, expires_at } = response.data;

      // ✅ FIX: Extraer rol correctamente antes de guardar sesión
      const userRole = extractRole(user.rol);
      console.log("🔍 Rol extraído del usuario básico:", userRole);

      // Guardar sesión con el rol extraído
      storeSession({
        token,
        user: {
          ...user,
          rol: userRole // Asegurar que se guarde como string
        },
        expiresAt: expires_at
      });

      try {
        console.log("📡 Obteniendo datos completos del usuario...");
        const userResponse = await axios.get("/api/user");

        console.log("✅ Datos completos obtenidos:", userResponse.data);

        setUser(userResponse.data);

        // ✅ FIX: Extraer rol de los datos completos
        const completeUserRole = extractRole(userResponse.data.rol);
        console.log("🎯 Rol detectado para redirección:", completeUserRole);

        if (completeUserRole) {
          redirectByRole(completeUserRole);
        } else {
          console.error("❌ No se pudo determinar el rol del usuario completo");
          // Usar el rol básico como fallback
          if (userRole) {
            console.log("🔄 Usando rol básico como fallback:", userRole);
            redirectByRole(userRole);
          } else {
            setError("Error: No se pudo determinar el rol del usuario");
          }
        }

      } catch (userDataError) {
        console.warn("⚠️ Error al obtener datos completos:", userDataError);

        setUser(user);
        console.log("🎯 Usando rol básico para redirección:", userRole);

        if (userRole) {
          redirectByRole(userRole);
        } else {
          console.error("❌ No hay rol en datos básicos");
          setError("Error: No se pudo determinar el rol del usuario");
        }
      }

    } catch (err) {
      console.error("❌ Error en login:", err);

      let errorMessage = "Error al iniciar sesión.";

      if (err.response) {
        switch (err.response.status) {
          case 401:
            errorMessage = "RUT o contraseña incorrectos.";
            break;
          case 403:
            errorMessage = err.response.data?.message || "Cuenta inactiva.";
            break;
          case 422:
            errorMessage = "Datos de entrada inválidos.";
            if (err.response.data?.errors) {
              const errors = Object.values(err.response.data.errors).flat();
              errorMessage = errors.join(", ");
            }
            break;
          case 429:
            errorMessage = "Demasiados intentos. Intenta más tarde.";
            break;
          case 500:
            errorMessage = "Error del servidor. Intenta más tarde.";
            break;
          default:
            errorMessage = err.response.data?.message || "Error del servidor.";
        }
      } else if (err.request) {
        errorMessage = "Sin conexión al servidor.";
      } else {
        errorMessage = err.message || "Error inesperado.";
      }

      setError(errorMessage);

      if (err.response?.status === 401) {
        setFormData(prev => ({ ...prev, password: "" }));
      }

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
              autoComplete="username" // ✅ YA ESTABA CORRECTO
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <InputField
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                icon={<FaLock className="text-gray-400" />}
                disabled={isLoading}
                autoComplete="current-password" // ✅ AGREGADO - Esto solucionará la advertencia
                className="w-full pr-12"
                showPassword={showPassword} // ✅ AGREGADO
                setShowPassword={setShowPassword} // ✅ AGREGADO
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-orange-600 hover:text-orange-500 focus:outline-none focus:underline"
              disabled={isLoading}
              onClick={() => {
                alert("Contacta al administrador para recuperar tu contraseña");
              }}
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