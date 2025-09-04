import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGasPump,
  FaPlus,
  FaHistory,
  FaUser,
} from "react-icons/fa";
import UniversalHeader from "../../components/organisms/Todos/UniversalHeader";
import FormularioAsignacionVehiculo from "../../components/templates/OperadorVehiculo/FormularioAsignacionVehiculo";
import HistorialUsuarioOperadorVehiculo from "../../components/molecules/HistorialUsuarioOperadorVehiculo";
import { getAuthUser } from "../../utils/session"; // Para obtener datos básicos del usuario

const MenuPrincipalOperadorVehiculo = () => {
  const navigate = useNavigate();
  
  // 🆕 Estados simples sin dependencias obsoletas
  const [vistaActiva, setVistaActiva] = useState("ingreso"); // 'ingreso' o 'historial'
  const [recargarHistorialUsuario, setRecargarHistorialUsuario] = useState(0);

  // 🆕 Obtener datos básicos del usuario desde la sesión
  const usuario = getAuthUser();

  // 🆕 Función para manejar ingreso exitoso
  const handleIngresoExitoso = useCallback(() => {
    console.log('✅ Ingreso exitoso detectado, recargando historial del usuario...');
    setRecargarHistorialUsuario(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER UNIVERSAL */}
       <UniversalHeader type="operador" />

      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white overflow-hidden">
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-repeat opacity-30" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
               }}>
          </div>
        </div>

        {/* Contenido del hero */}
        <div className="relative z-10 text-center py-8 sm:py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <FaGasPump className="text-4xl sm:text-6xl text-white mx-auto mb-4 opacity-90" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              ¡Hola {usuario?.nombre || 'Operador'}! 👋
            </h1>
            <p className="text-orange-100 text-sm sm:text-base lg:text-lg max-w-md mx-auto mb-4">
              Sistema de Gestión de Combustible
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN POR TABS - 2 BOTONES HORIZONTALES */}
      <div className="container mx-auto px-2 py-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {/* BOTÓN INGRESO */}
              <button
                onClick={() => setVistaActiva("ingreso")}
                className={`
                  flex-1 py-4 px-6 text-center font-semibold transition-all duration-200
                  ${vistaActiva === "ingreso"
                    ? "bg-orange-500 text-white border-b-2 border-orange-600"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }
                `}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaPlus
                    className={`text-lg ${vistaActiva === "ingreso"
                      ? "text-white"
                      : "text-orange-500"
                      }`}
                  />
                  <span className="text-base sm:text-lg">Registrar Carga</span>
                </div>
                {vistaActiva === "ingreso" && (
                  <p className="text-orange-100 text-xs mt-1">
                    Selecciona una máquina y registra combustible
                  </p>
                )}
              </button>

              {/* BOTÓN HISTORIAL */}
              <button
                onClick={() => setVistaActiva("historial")}
                className={`
                  flex-1 py-4 px-6 text-center font-semibold transition-all duration-200
                  ${vistaActiva === "historial"
                    ? "bg-orange-500 text-white border-b-2 border-orange-600"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }
                `}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaHistory
                    className={`text-lg ${vistaActiva === "historial"
                      ? "text-white"
                      : "text-blue-500"
                      }`}
                  />
                  <span className="text-base sm:text-lg">Mi Historial</span>
                </div>
                {vistaActiva === "historial" && (
                  <p className="text-orange-100 text-xs mt-1">
                    Ver todas mis cargas registradas
                  </p>
                )}
              </button>
            </div>
          </div>

          {/* INDICADOR VISUAL DEL TAB ACTIVO */}
          <div className="h-1 bg-gray-100 relative">
            <div
              className={`absolute h-full bg-orange-500 transition-all duration-300 ease-in-out ${
                vistaActiva === "ingreso" ? "w-1/2 left-0" : "w-1/2 left-1/2"
              }`}
            />
          </div>
        </div>

        {/* CONTENIDO DINÁMICO SEGÚN EL TAB SELECCIONADO */}
        <div className="transition-all duration-300">
          {vistaActiva === "ingreso" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <FormularioAsignacionVehiculo
                onIngresoExitoso={handleIngresoExitoso}
              />
            </div>
          )}
          
          {vistaActiva === "historial" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <HistorialUsuarioOperadorVehiculo 
                recargarKey={recargarHistorialUsuario} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPrincipalOperadorVehiculo;