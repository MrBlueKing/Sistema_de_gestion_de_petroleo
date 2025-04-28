import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { FaChevronDown } from "react-icons/fa";
import { UserContext } from "../../context/userContext";

const UserProfileDropdown = ({ userMenuOpen, setUserMenuOpen, handleLogout }) => {
  const { user } = useContext(UserContext);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);
  
  // Esta variable controla si ya se ha cargado el usuario
  // para evitar sobreescribir datos después de la carga inicial
  const dataInitializedRef = useRef(false);

  useEffect(() => {
    // Solo cargamos los datos si no se han inicializado previamente
    if (!dataInitializedRef.current) {
      const loadUserData = async () => {
        setIsLoading(true);
        try {
          // Prioridad 1: Usar el contexto del usuario si está disponible
          if (user) {
            setUserData(user);
          } else {
            // Prioridad 2: Intentar obtener del localStorage
            const sessionData = localStorage.getItem("authToken");
            
            if (sessionData) {
              try {
                const parsedData = JSON.parse(sessionData);
                if (parsedData && parsedData.user) {
                  setUserData(parsedData.user);
                } else {
                  // Prioridad 3: Si las anteriores fallan, hacer llamada a la API
                  const response = await axios.get("http://127.0.0.1:8000/api/user");
                  setUserData(response.data);
                }
              } catch (parseError) {
                console.error("Error al analizar datos de sesión:", parseError);
                // Si hay error de parseo, intentar la API
                const response = await axios.get("http://127.0.0.1:8000/api/user");
                setUserData(response.data);
              }
            } else {
              // Si no hay datos en localStorage, llamar a la API
              const response = await axios.get("http://127.0.0.1:8000/api/user");
              setUserData(response.data);
            }
          }
          // Marcar que los datos ya se han inicializado
          dataInitializedRef.current = true;
        } catch (error) {
          console.error("Error al obtener los datos del usuario:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadUserData();
    }
  }, [user]); // Solo depender de user para la carga inicial

  // Manejador para clics fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [userMenuOpen, setUserMenuOpen]);

  // Renderizado condicional para las iniciales
  const renderInitials = () => {
    if (isLoading) {
      return <span className="font-semibold text-white">...</span>;
    }
    
    if (!userData || !userData.nombre || !userData.apellido) {
      return <span className="font-semibold text-white">N/A</span>;
    }
    
    return (
      <span className="font-semibold text-white">
        {userData.nombre.charAt(0)}{userData.apellido.charAt(0)}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setUserMenuOpen((prev) => !prev)}
        className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg"
      >
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          {renderInitials()}
        </div>
        <div className="hidden md:block text-left">
          {isLoading ? (
            <p className="text-xs text-gray-500">Cargando...</p>
          ) : (
            userData && (
              <>
                <h3 className="font-medium text-gray-800">
                  {userData.nombre || 'Usuario'} {userData.apellido || ''}
                </h3>
                <p className="text-xs text-gray-500">
                  {userData.rol || "Rol desconocido"}
                </p>
              </>
            )
          )}
        </div>
        <FaChevronDown size={16} className="text-gray-500 hidden md:block" />
      </button>

      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200">
          <a
            href="/perfil"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Tu perfil
          </a>
          <a
            href="/configuracion"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Configuración
          </a>
          <div className="border-t border-gray-100"></div>
          <button
            onClick={handleLogout}
            className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;