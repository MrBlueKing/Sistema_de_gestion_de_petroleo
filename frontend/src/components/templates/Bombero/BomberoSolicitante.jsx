import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { UserContext } from "../../../context/userContext";
import SearchBar from "../../molecules/SearchBar";
import Header from "../../organisms/Bombero/Header";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/OptionsFormBombero";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import StepHeader from "../../molecules/StepHeader";
import { FaArrowLeft, FaMapMarkerAlt, FaSpinner } from "react-icons/fa";
import bomberoService from "../../../context/bomberoService";
import axios from "../../../lib/axios";

const Solicitante = ({ onNext, onPrevious, tipoSolicitante }) => {
  const { user } = useContext(UserContext);

  // Estados principales
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [solicitantes, setSolicitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ubicacionFaena, setUbicacionFaena] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [displayPerPage, setDisplayPerPage] = useState(8);

  // ✅ CACHE de datos para evitar re-cargas innecesarias
  const [datosCache, setDatosCache] = useState({});
  const cacheKey = `${tipoSolicitante}-${user?.id_faena}`;

  // Ajustar elementos por página
  useEffect(() => {
    const calcularElementosPorPagina = () => {
      if (window.innerWidth < 640) {
        setDisplayPerPage(4);
      } else if (window.innerWidth < 768) {
        setDisplayPerPage(6);
      } else {
        setDisplayPerPage(8);
      }
    };

    calcularElementosPorPagina();
    window.addEventListener('resize', calcularElementosPorPagina);
    return () => window.removeEventListener('resize', calcularElementosPorPagina);
  }, []);

  // ✅ OPTIMIZACIÓN PRINCIPAL: Cargar datos solo UNA VEZ y usar cache
  useEffect(() => {
    let isActive = true;

    const cargarDatos = async () => {
      // Verificar condiciones necesarias
      if (!user?.id_faena || !tipoSolicitante) {
        console.log('⏸️ No se puede cargar: faltan user.id_faena o tipoSolicitante');
        setLoading(false);
        return;
      }

      // ✅ VERIFICAR CACHE PRIMERO
      if (datosCache[cacheKey]) {
        console.log('📦 Usando datos del cache para:', cacheKey);
        const cached = datosCache[cacheKey];
        setUsuarios(cached.usuarios);
        setSolicitantes(cached.solicitantes);
        setUbicacionFaena(cached.ubicacionFaena);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`🚀 Cargando datos ÚNICOS para: ${tipoSolicitante} en faena ${user.id_faena}`);

        // ✅ Cargar SOLO lo necesario, SIN Promise.all para evitar cancelaciones
        
        // 1. Obtener personal optimizado (LA LLAMADA PRINCIPAL)
        const personalData = await bomberoService.getPersonalOptimizadoPorTipoYFaena(
          tipoSolicitante, 
          user.id_faena
        );

        if (!isActive) return;

        // 2. Obtener solicitantes solo si no los tenemos
        let solicitantesData = solicitantes;
        if (solicitantesData.length === 0) {
          try {
            const solicitantesResponse = await axios.get('/api/solicitantes');
            if (solicitantesResponse.data?.solicitantes) {
              solicitantesData = solicitantesResponse.data.solicitantes;
            }
          } catch (err) {
            console.warn("Error al cargar solicitantes (no crítico):", err.message);
            solicitantesData = [];
          }
        }

        if (!isActive) return;

        // 3. Obtener ubicación de faena solo si no la tenemos
        let ubicacion = ubicacionFaena;
        if (!ubicacion) {
          try {
            const faenas = await bomberoService.getAllFaenas();
            const faenaUsuario = faenas.find(f => f.id_faena === user.id_faena);
            ubicacion = faenaUsuario?.ubicacion || "";
          } catch (err) {
            console.warn("Error al cargar faenas:", err.message);
            ubicacion = "";
          }
        }

        if (!isActive) return;

        // ✅ GUARDAR EN CACHE
        const datosParaCache = {
          usuarios: personalData,
          solicitantes: solicitantesData,
          ubicacionFaena: ubicacion
        };

        setDatosCache(prev => ({
          ...prev,
          [cacheKey]: datosParaCache
        }));

        // Actualizar estados
        setUsuarios(personalData);
        setSolicitantes(solicitantesData);
        setUbicacionFaena(ubicacion);
        
        console.log(`✅ Datos cargados y guardados en cache: ${personalData.length} registros`);

      } catch (err) {
        if (isActive) {
          console.error("❌ Error al cargar datos:", err);
          setError("No se pudieron cargar los datos. Intente nuevamente.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    cargarDatos();

    return () => {
      isActive = false;
    };
  }, [user?.id_faena, tipoSolicitante, cacheKey]); // ✅ Dependencias mínimas

  // ✅ Búsqueda optimizada con debounce (SIN useEffect para evitar bucles)
  const buscarPersonal = useCallback(
    async (termino) => {
      if (!user?.id_faena || !tipoSolicitante) return;

      try {
        setIsSearching(true);

        if (!termino.trim()) {
          // Usar datos del cache o recargar
          if (datosCache[cacheKey]) {
            setUsuarios(datosCache[cacheKey].usuarios);
          } else {
            const personalData = await bomberoService.getPersonalOptimizadoPorTipoYFaena(
              tipoSolicitante, 
              user.id_faena
            );
            setUsuarios(personalData);
          }
          setCurrentPage(1);
        } else {
          // Búsqueda en el cliente (más rápido para pocos registros)
          const todosLosUsuarios = datosCache[cacheKey]?.usuarios || usuarios;
          const resultadosFiltrados = bomberoService.buscarPersonal(todosLosUsuarios, termino);
          setUsuarios(resultadosFiltrados);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("❌ Error en búsqueda:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [user?.id_faena, tipoSolicitante, datosCache, cacheKey, usuarios]
  );

  // ✅ Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarPersonal(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, buscarPersonal]);

  // Funciones memoizadas
  const formatearUsuarioParaSiguiente = useCallback((usuario) => {
    const personalData = usuario.personal_interno || usuario.personal_externo;
    if (!personalData) {
      console.error("No se encontraron datos del personal", usuario);
      return {
        id: null,
        nombre: "",
        apellido: "",
        rut: "",
        cargo: "",
        ubicacion: "",
        faena: "",
        id_faena: user?.id_faena || null,
        tipo: tipoSolicitante,
        original: usuario
      };
    }
    
    const rut = personalData.rut;
    const solicitanteEncontrado = solicitantes.find(s => s && s.rut === rut);
    const idSolicitante = solicitanteEncontrado ? solicitanteEncontrado.id : null;
    
    return {
      id: idSolicitante || personalData.rut || personalData.id_personal_externo,
      nombre: personalData.nombre || "",
      apellido: personalData.apellido || "",
      rut: personalData.rut || "",
      cargo: personalData.cargo || "",
      ubicacion: personalData.ubicacion || "",
      faena: personalData.ubicacion || "",
      id_faena: user?.id_faena || null,
      tipo: tipoSolicitante,
      original: usuario
    };
  }, [solicitantes, user?.id_faena, tipoSolicitante]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleSelectUser = useCallback((usuario) => {
    if (!usuario || !usuario._original) {
      console.error("Usuario inválido seleccionado", usuario);
      return;
    }
    
    setSelectedUser(usuario);
    setShowUserDetails(true);
    const usuarioFormateado = formatearUsuarioParaSiguiente(usuario._original);
    onNext(usuarioFormateado);
  }, [formatearUsuarioParaSiguiente, onNext]);

  // Preparar items para mostrar
  const formattedItems = useMemo(() => {
    if (!Array.isArray(usuarios)) return [];

    const startIndex = (currentPage - 1) * displayPerPage;
    const endIndex = startIndex + displayPerPage;

    return usuarios
      .slice(startIndex, endIndex)
      .map((item) => {
        const personalData = item.personal_interno || item.personal_externo;
        if (!personalData) return null;
        
        return {
          id: personalData.id_personal_interno || personalData.id_personal_externo,
          nombre: `${personalData.nombre || ""} ${personalData.apellido || ""}`,
          descripcion: `${personalData.cargo || ""} - ${personalData.rut || ""}`,
          ubicacion: personalData.ubicacion || "",
          rut: personalData.rut || "",
          cargo: personalData.cargo || "",
          _original: item
        };
      })
      .filter(Boolean);
  }, [usuarios, currentPage, displayPerPage]);

  const totalPages = Math.max(1, Math.ceil(usuarios.length / displayPerPage));

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center relative z-0">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>

          {/* Título optimizado */}
          <div className="w-full flex justify-center items-center">
            <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg flex items-center">
              {isSearching && (
                <FaSpinner className="animate-spin mr-2 text-orange-500" />
              )}
              Seleccione Personal:{" "}
              <span
                className={`${
                  tipoSolicitante === "interno"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                } rounded-full px-2 py-1 text-xs uppercase ml-1`}
              >
                {tipoSolicitante}
              </span>
              <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                💾 Con Cache
              </span>
            </h2>
          </div>

          {/* Indicadores */}
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            {ubicacionFaena && (
              <div className="bg-blue-100 text-blue-800 text-xs rounded-lg py-1 px-3 flex items-center">
                <FaMapMarkerAlt className="mr-1 text-blue-600" size={12} />
                <span className="mr-1">Faena:</span>
                <span className="font-medium">{ubicacionFaena}</span>
              </div>
            )}
            
            {usuarios.length > 0 && (
              <div className="bg-orange-100 text-orange-800 text-xs rounded-lg py-1 px-3">
                <span className="font-medium">{usuarios.length}</span> resultado{usuarios.length !== 1 ? 's' : ''}
                {searchTerm && <span> para "{searchTerm}"</span>}
              </div>
            )}
          </div>

          {/* Contenedor principal */}
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[400px] md:min-h-[450px] flex flex-col relative z-0">
            <TabProgressBar activeTab="solicitante" />

            {/* Barra de búsqueda */}
            <div className="flex items-center space-x-2">
              <div className="flex-grow relative">
                <SearchBar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  placeholder="Búsqueda inteligente con cache"
                  onClear={handleClearSearch}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <FaSpinner className="animate-spin text-gray-400" size={16} />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="animate-spin h-10 w-10 text-orange-500 mx-auto mb-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="text-gray-500">Cargando una sola vez con cache...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-10 h-10 text-red-500 mx-auto mb-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <p className="text-red-500">{error}</p>
                    <button
                      onClick={() => {
                        // Limpiar cache y recargar
                        setDatosCache(prev => {
                          const newCache = { ...prev };
                          delete newCache[cacheKey];
                          return newCache;
                        });
                        window.location.reload();
                      }}
                      className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : formattedItems.length > 0 ? (
                <List
                  items={formattedItems}
                  onItemSelect={handleSelectUser}
                  buttonStyle={true}
                  tipoElemento="personal"
                  maxHeight="350px"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-10 h-10 mx-auto mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <p className="text-gray-500">
                      {searchTerm 
                        ? `No se encontraron resultados para "${searchTerm}"` 
                        : `No hay personal ${tipoSolicitante} disponible en esta faena`
                      }
                    </p>
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
              icon={<FaArrowLeft className="w-5 h-5 md:w-6 md:h-6" />}
              textColor="orange-500"
            />
            <div className="flex-1 flex justify-center">
              {!loading && !error && formattedItems.length > 0 && totalPages > 1 && (
                <PageControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
            <div className="w-5 h-5 md:w-6 md:h-6"></div>
          </div>

          {/* Modal de detalles */}
          {showUserDetails && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Detalles del personal seleccionado
                </h3>

                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <div className="flex items-center mb-2">
                    <svg
                      className="w-6 h-6 text-blue-600 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span className="font-medium text-gray-700">
                      {selectedUser.nombre}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">RUT:</div>
                    <div className="text-gray-800 font-medium">
                      {selectedUser.rut}
                    </div>

                    <div className="text-gray-600">Cargo:</div>
                    <div className="text-gray-800 font-medium">
                      {selectedUser.cargo}
                    </div>

                    <div className="text-gray-600">Ubicación:</div>
                    <div className="text-gray-800 font-medium">
                      {selectedUser.ubicacion}
                    </div>

                    <div className="text-gray-600">Tipo:</div>
                    <div className="text-gray-800 font-medium capitalize">
                      {tipoSolicitante}
                    </div>
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
          <div className="bg-emerald-50 text-emerald-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm">
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
                💾 Con cache - Carga rápida
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Solicitante;