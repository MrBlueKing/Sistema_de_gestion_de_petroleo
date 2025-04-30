import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../../context/userContext";
import SearchBar from "../../molecules/SearchBar";
import Header from "../../organisms/Bombero/Header";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/List";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import StepHeader from "../../molecules/StepHeader";
import { FaArrowLeft } from "react-icons/fa";
import bomberoService from "../../../context/bomberoService";

const Solicitante = ({ onNext, onPrevious, tipoSolicitante }) => {
  // Obtener usuario del contexto
  const { user } = useContext(UserContext);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
  const usersPerPage = 5;

  // Obtener la faena del usuario del contexto
  const faenaId = user?.id_faena;
  const faenaNombre = user?.faena || user?.nombre_faena;

  // Cargar usuarios según el tipo de solicitante seleccionado, ya filtrados por faena
  useEffect(() => {
    const cargarUsuarios = async () => {
      setLoading(true);
      try {
        // Siempre filtrar por faena
        const data = await bomberoService.getPersonalPorTipo(tipoSolicitante, null);
        
        // Verificar que data sea un array
        if (Array.isArray(data)) {
          // Filtrar por id_faena si existe, de lo contrario por nombre de faena
          let usuariosFiltrados;
          
          if (faenaId) {
            // Filtrar por id_faena (prioridad)
            usuariosFiltrados = data.filter(usuario => 
              usuario.id_faena === faenaId
            );
          } else if (faenaNombre) {
            // Filtrar por nombre de faena como respaldo
            usuariosFiltrados = data.filter(usuario => 
              usuario.faena && usuario.faena.toLowerCase() === faenaNombre.toLowerCase()
            );
          } else {
            // Si no hay información de faena, mostrar todos
            usuariosFiltrados = data;
          }
          
          setUsuarios(usuariosFiltrados);
          setTodosLosUsuarios(usuariosFiltrados);
        } else {
          console.error("La respuesta de la API no es un array:", data);
          setUsuarios([]);
          setTodosLosUsuarios([]);
          setError("Formato de datos no válido recibido de la API");
        }
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setError("No se pudieron cargar los usuarios. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, [tipoSolicitante, faenaId, faenaNombre]);

  // Manejo del término de búsqueda
  useEffect(() => {
    // Si el campo de búsqueda está vacío, restauramos la lista original
    if (!searchTerm.trim()) {
      setUsuarios(todosLosUsuarios);
      return;
    }

    const buscarUsuarios = async () => {
      setLoading(true);
      try {
        // Primero intentamos buscar a través de la API
        const data = await bomberoService.buscarPersonal(tipoSolicitante, searchTerm, null);
        
        if (Array.isArray(data)) {
          // Filtrar por id_faena si existe, de lo contrario por nombre de faena
          let usuariosFiltrados;
          
          if (faenaId) {
            // Filtrar por id_faena (prioridad)
            usuariosFiltrados = data.filter(usuario => 
              usuario.id_faena === faenaId
            );
          } else if (faenaNombre) {
            // Filtrar por nombre de faena como respaldo
            usuariosFiltrados = data.filter(usuario => 
              usuario.faena && usuario.faena.toLowerCase() === faenaNombre.toLowerCase()
            );
          } else {
            // Si no hay información de faena, mostrar todos
            usuariosFiltrados = data;
          }
          
          setUsuarios(usuariosFiltrados);
        } else {
          // Fallback a búsqueda local si la API falla
          realizarBusquedaLocal();
        }
      } catch (error) {
        console.error("Error al buscar usuarios:", error);
        // Fallback a búsqueda local en caso de error
        realizarBusquedaLocal();
      } finally {
        setLoading(false);
      }
    };

    const realizarBusquedaLocal = () => {
      const searchTermLower = searchTerm.toLowerCase();
      const resultadosFiltrados = todosLosUsuarios.filter(user => 
        (user.nombre && user.nombre.toLowerCase().includes(searchTermLower)) ||
        (user.apellido && user.apellido.toLowerCase().includes(searchTermLower)) ||
        (user.rut && user.rut.toLowerCase().includes(searchTermLower))
      );
      
      setUsuarios(resultadosFiltrados);
    };

    const timeoutId = setTimeout(() => {
      buscarUsuarios();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, tipoSolicitante, todosLosUsuarios, faenaId, faenaNombre]);

  // Filtrar por término de búsqueda
  const filteredUsers = Array.isArray(usuarios) ? usuarios : [];

  // Calcula totalPages
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));

  // Calcula paginatedUsers
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Reset a la página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tipoSolicitante]);

  // Manejar la limpieza del campo de búsqueda
  const handleClearSearch = () => {
    setSearchTerm("");
    setUsuarios(todosLosUsuarios);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center relative z-0">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>

          {/* Título con indicador de tipo */}
          <div className="w-full flex justify-center items-center">
            <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg">
              Solicitado Por Personal:{" "}
              <span className={`${tipoSolicitante === "interno" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"} rounded-full px-2 py-1 text-xs uppercase ml-1`}>
                {tipoSolicitante}
              </span>
            </h2>
          </div>

          {/* Indicador de filtro activo por faena */}
          {faenaNombre && (
            <div className="bg-blue-100 text-blue-800 text-xs rounded-lg py-1 px-3 flex items-center">
              <span className="mr-1">Mostrando personal de la faena:</span>
              <span className="font-medium">{faenaNombre}</span>
            </div>
          )}

          {/* Contenedor principal con altura fija para evitar saltos */}
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col relative z-0">
            <TabProgressBar activeTab="solicitante" />
            
            {/* Barra de búsqueda */}
            <div className="flex items-center space-x-2">
              <div className="flex-grow">
                <SearchBar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  placeholder="Buscar por nombre, apellido o RUT"
                  onClear={handleClearSearch}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col justify-center">
              {loading ? (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando usuarios...
                </div>
              ) : error ? (
                <div className="py-4 text-red-500 flex-grow flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                  </svg>
                  {error}
                </div>
              ) : filteredUsers.length > 0 ? (
                <List
                  items={paginatedUsers}
                  onItemSelect={(user) => onNext(user)}
                  buttonStyle={true}
                  mostrarApellido={true}
                  tipoElemento="personal" // Especificamos que son elementos de personal
                />
              ) : (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>No se encontraron usuarios {tipoSolicitante}s {faenaNombre ? `en la faena ${faenaNombre}` : ""}</p>
                    {searchTerm && (
                      <button 
                        onClick={handleClearSearch}
                        className="mt-2 text-orange-500 hover:text-orange-700 font-medium"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controles inferiores */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />}
            />

            <div className="flex-1 flex justify-center">
              {!loading && !error && filteredUsers.length > 0 && (
                <PageControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
            
            <div className="w-5 h-5 md:w-6 md:h-6"></div>
          </div>

          {/* Ayuda */}
          <div className="bg-blue-50 text-blue-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm">
            <p className="flex items-center justify-center">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="inline-block">
                Seleccione un usuario para continuar
                {faenaNombre && (
                  <> (Solo se muestran usuarios de la faena {faenaNombre})</>
                )}
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Solicitante;