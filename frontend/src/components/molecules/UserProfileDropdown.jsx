import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { FaChevronDown } from "react-icons/fa";
import { UserContext } from "../../context/userContext"; // Contexto del usuario

const UserProfileDropdown = ({ userMenuOpen, setUserMenuOpen, handleLogout }) => {
  const { user } = useContext(UserContext); // Acceder al usuario del contexto
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Estado para la carga de datos
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      // Si los datos están en el contexto, usarlos directamente
      setUserData(user);
      setIsLoading(false);
    } else {
      const sessionData = JSON.parse(localStorage.getItem("authToken"));
      if (sessionData && sessionData.user) {
        // Si los datos están en localStorage, usarlos
        setUserData(sessionData.user);
        setIsLoading(false);
        console.log("Datos de sesión:", sessionData.user.rol);
      } else {
        // Si no hay datos, hacer la llamada a la API
        const fetchUserData = async () => {
          try {
            const response = await axios.get("http://127.0.0.1:8000/api/user");
            setUserData(response.data); // Guardar los datos obtenidos de la API
          } catch (error) {
            console.error("Error al obtener los datos del usuario:", error);
          } finally {
            setIsLoading(false); // Finalizar la carga
          }
        };
        fetchUserData();
      }
    }
  }, [user]); // Solo se ejecuta cuando el contexto del usuario cambia

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setUserMenuOpen((prev) => !prev)}
        className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg"
      >
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          {isLoading ? (
            <span className="font-semibold text-white">Cargando...</span>
          ) : (
            <span className="font-semibold text-white">
              {userData ? userData.nombre.charAt(0) + userData.apellido.charAt(0) : "N/A"}
            </span>
          )}
        </div>
        <div className="hidden md:block text-left">
          {isLoading ? (
            <p className="text-xs text-gray-500">Cargando...</p>
          ) : (
            userData && (
              <>
                <h3 className="font-medium text-gray-800">
                  {userData.nombre} {userData.apellido}
                </h3>
                <p className="text-xs text-gray-500">{userData.rol || "Rol desconocido"}</p>
              </>
            )
          )}
        </div>
        <FaChevronDown size={16} className="text-gray-500 hidden md:block" />
      </button>

      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40 border border-gray-200">
          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Tu perfil
          </a>
          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
