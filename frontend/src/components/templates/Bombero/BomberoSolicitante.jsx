import React, { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../../../context/userContext";
import SearchBar from "../../molecules/SearchBar";
import Header from "../../organisms/Bombero/Header";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/OptionsFormBombero";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import StepHeader from "../../molecules/StepHeader";
import { FaArrowLeft, FaMapMarkerAlt } from "react-icons/fa";
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
  const [ubicacionUsuario, setUbicacionUsuario] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Usamos un valor dinámico para usersPerPage basado en la altura de la pantalla
  const [usersPerPage, setUsersPerPage] = useState(8);

  // Ajustamos usersPerPage basado en el tamaño de la ventana
  useEffect(() => {
    const calcularElementosPorPagina = () => {
      // En dispositivos móviles pequeños mostramos menos elementos por página
      if (window.innerWidth < 640) {
        setUsersPerPage(4);
      } else if (window.innerWidth < 768) {
        setUsersPerPage(6);
      } else {
        setUsersPerPage(8);
      }
    };

    calcularElementosPorPagina();
    window.addEventListener('resize', calcularElementosPorPagina);

    return () => {
      window.removeEventListener('resize', calcularElementosPorPagina);
    };
  }, []);

  // Función para filtrar usuarios por término de búsqueda
  const filtrarUsuarios = useCallback((usuarios, termino) => {
    if (!termino || !termino.trim()) return usuarios;
    return bomberoService.buscarPersonal(usuarios, termino);
  }, []);

  // Cargar faenas y usuarios en un solo useEffect para reducir recargas
  useEffect(() => {
    let isMounted = true;

    const inicializarDatos = async () => {
      try {
        setLoading(true);

        // 1. Primero obtener todas las faenas
        const faenas = await bomberoService.getAllFaenas();

        let ubicacion = "";

        // 2. Identificar la ubicación del usuario actual si tiene faena asignada
        if (user && user.id_faena) {
          const faenaUsuario = faenas.find(f => f.id_faena === user.id_faena);
          if (faenaUsuario) {
            ubicacion = faenaUsuario.ubicacion;
            if (isMounted) setUbicacionUsuario(ubicacion);
          }
        }

        // 3. Obtener los usuarios del tipo seleccionado
        if (isMounted) {
          const todosUsuarios = await bomberoService.getPersonalPorTipo(tipoSolicitante);

          // 4. Filtrar por ubicación si es necesario
          const usuariosFiltrados = ubicacion
            ? bomberoService.filtrarPersonalPorUbicacion(todosUsuarios, ubicacion)
            : todosUsuarios;

          // 5. Establecer los estados de usuarios
          setTodosLosUsuarios(usuariosFiltrados);
          setUsuarios(usuariosFiltrados);
        }
      } catch (err) {
        console.error("Error al inicializar datos:", err);
        if (isMounted) {
          setError("No se pudieron cargar los datos. Intente nuevamente.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    inicializarDatos();

    // Limpieza al desmontar
    return () => {
      isMounted = false;
    };
  }, [user, tipoSolicitante]); // Solo se ejecuta cuando cambia el usuario o tipo de solicitante

  // Manejar búsqueda - separado para evitar recargas innecesarias
  useEffect(() => {
    const usuariosFiltrados = filtrarUsuarios(todosLosUsuarios, searchTerm);
    setUsuarios(usuariosFiltrados);
    // Resetear a la primera página cuando cambia la búsqueda
    setCurrentPage(1);
  }, [searchTerm, todosLosUsuarios, filtrarUsuarios]);

  // Formatear usuario para pasarlo al siguiente paso
  const formatearUsuarioParaSiguiente = (usuario) => {
    const personalData = usuario.personal_interno || usuario.personal_externo;

    return {
      id: personalData.id_personal_interno || personalData.id_personal_externo,
      nombre: personalData.nombre || "",
      apellido: personalData.apellido || "",
      rut: personalData.rut || "",
      cargo: personalData.cargo || "",
      ubicacion: personalData.ubicacion || "",
      faena: personalData.ubicacion || "", // Usamos ubicación como faena
      id_faena: user?.id_faena || null,
      tipo: tipoSolicitante,
      original: usuario
    };
  };

  // Manejar la limpieza del campo de búsqueda
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Manejar la selección de un usuario
  const handleSelectUser = (usuario) => {
    setSelectedUser(usuario);
    setShowUserDetails(true);

    const usuarioFormateado = formatearUsuarioParaSiguiente(usuario._original);
    onNext(usuarioFormateado);
  };

  // Preparar items para el componente List
  const prepareItems = useCallback(() => {
    if (!Array.isArray(usuarios)) return [];

    return usuarios.slice(
      (currentPage - 1) * usersPerPage,
      currentPage * usersPerPage
    ).map(item => {
      const personalData = item.personal_interno || item.personal_externo;
      return {
        id: personalData.id_personal_interno || personalData.id_personal_externo,
        nombre: `${personalData.nombre || ""} ${personalData.apellido || ""}`,
        descripcion: `${personalData.cargo || ""} - ${personalData.rut || ""}`,
        ubicacion: personalData.ubicacion || "",
        rut: personalData.rut || "",
        cargo: personalData.cargo || "",
        _original: item
      };
    });
  }, [usuarios, currentPage, usersPerPage]);

  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(usuarios.length / usersPerPage));
  const formattedItems = prepareItems();

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
              Seleccione Personal:{" "}
              <span className={`${tipoSolicitante === "interno" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"} rounded-full px-2 py-1 text-xs uppercase ml-1`}>
                {tipoSolicitante}
              </span>
            </h2>
          </div>

          {/* Indicador de ubicación actual */}
          {ubicacionUsuario && (
            <div className="bg-blue-100 text-blue-800 text-xs rounded-lg py-1 px-3 flex items-center">
              <FaMapMarkerAlt className="mr-1 text-blue-600" size={12} />
              <span className="mr-1">Ubicación actual:</span>
              <span className="font-medium">{ubicacionUsuario}</span>
            </div>
          )}

          {/* Contenedor principal con altura fija para evitar saltos */}
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[400px] md:min-h-[450px] flex flex-col relative z-0">
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

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Cargando usuarios...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    <p className="text-red-500">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : (
                <List
                  items={formattedItems}
                  onItemSelect={handleSelectUser}
                  buttonStyle={true}
                  tipoElemento="personal"
                  maxHeight="350px" // Altura fija para el contenedor de la lista
                />
              )}
            </div>
          </div>

          {/* Controles inferiores */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowLeft className="w-5 h-5 md:w-6 md:h-6" />}
              textColor="orange-500"
            />
            <div className="flex-1 flex justify-center">
              {!loading && !error && usuarios.length > 0 && (
                <PageControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>

            <div className="w-5 h-5 md:w-6 md:h-6"></div>
          </div>

          {/* Modal para mostrar detalles del usuario seleccionado */}
          {showUserDetails && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalles del personal seleccionado</h3>

                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                    </svg>
                    <span className="font-medium text-gray-700">{selectedUser.nombre}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">RUT:</div>
                    <div className="text-gray-800 font-medium">{selectedUser.rut}</div>

                    <div className="text-gray-600">Cargo:</div>
                    <div className="text-gray-800 font-medium">{selectedUser.cargo}</div>

                    <div className="text-gray-600">Ubicación:</div>
                    <div className="text-gray-800 font-medium">{selectedUser.ubicacion}</div>

                    <div className="text-gray-600">Tipo:</div>
                    <div className="text-gray-800 font-medium capitalize">{tipoSolicitante}</div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

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
                {ubicacionUsuario && (
                  <> (Solo se muestran usuarios de la ubicación {ubicacionUsuario})</>
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