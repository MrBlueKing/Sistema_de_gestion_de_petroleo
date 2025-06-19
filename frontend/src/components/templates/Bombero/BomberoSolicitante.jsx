import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { UserContext } from "../../../context/userContext";
import SearchBar from "../../molecules/SearchBar";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/OptionsFormBombero";
import PageControl from "../../molecules/PageControl";
import Button from "../../atoms/Button/Button";
import StepHeader from "../../molecules/StepHeader";
import { FaArrowLeft, FaMapMarkerAlt, FaSpinner, FaUsers } from "react-icons/fa";
import bomberoService from "../../../context/bomberoService";
import axios from "../../../lib/axios";

const Solicitante = ({
  onNext,
  onPrevious,
  tipoSolicitante,
  userFaena,
  isPreloaded,
}) => {
  const { user } = useContext(UserContext);
  const DEBUG = false; // o true si estás depurando

  // Estados principales
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosOriginales, setUsuariosOriginales] = useState([]);
  const [solicitantes, setSolicitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ubicacionFaena, setUbicacionFaena] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [displayPerPage, setDisplayPerPage] = useState(8);

  // ✅ CACHE optimizado
  const [datosCache, setDatosCache] = useState({});
  const cacheKey = `${tipoSolicitante}-${userFaena}`;

  // ✅ RESPONSIVE: Ajustar elementos por página dinámicamente
  useEffect(() => {
    const calcularElementosPorPagina = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width < 640) {
        // Móvil pequeño
        setDisplayPerPage(6);
      } else if (width < 768) {
        // Móvil grande
        setDisplayPerPage(20);
      } else if (width < 1024) {
        // Tablet
        setDisplayPerPage(20);
      } else {
        // Desktop - mostrar más elementos
        setDisplayPerPage(20);
      }
    };

    calcularElementosPorPagina();
    window.addEventListener("resize", calcularElementosPorPagina);
    return () =>
      window.removeEventListener("resize", calcularElementosPorPagina);
  }, []);

  // ✅ CARGA OPTIMIZADA con mejor manejo de errores
  useEffect(() => {
    let isActive = true;

    const cargarDatos = async () => {
      if (!userFaena || !tipoSolicitante) {
        DEBUG && console.log("⏸️ No se puede cargar: faltan userFaena o tipoSolicitante");
        setLoading(false);
        return;
      }

      // ✅ VERIFICAR CACHE
      if (datosCache[cacheKey]) {
        DEBUG && console.log("📦 CACHE LOCAL HIT para:", cacheKey);
        const cached = datosCache[cacheKey];
        setUsuarios(cached.usuarios);
        setUsuariosOriginales(cached.usuarios);
        setSolicitantes(cached.solicitantes || []);
        setUbicacionFaena(cached.ubicacionFaena || "");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        DEBUG && console.log(`🎯 Cargando ${tipoSolicitante} para faena ${userFaena}`);

        const personalData = await bomberoService.getPersonalOptimizadoPorTipoYFaena(
          tipoSolicitante,
          userFaena
        );

        if (!isActive) return;

        DEBUG && console.log(`📊 Total usuarios cargados: ${personalData.length}`);

        const datosParaCache = {
          usuarios: personalData,
          solicitantes: [],
          ubicacionFaena: "Faena",
        };

        setDatosCache((prev) => ({
          ...prev,
          [cacheKey]: datosParaCache,
        }));

        setUsuarios(personalData);
        setUsuariosOriginales(personalData);
        setSolicitantes([]);
        setUbicacionFaena("Faena");

        DEBUG && console.log(`✅ ${personalData.length} registros cargados exitosamente`);
      } catch (err) {
        if (isActive) {
          DEBUG && console.error("❌ Error al cargar desde cache:", err);
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
  }, [userFaena, tipoSolicitante]);

  // ✅ FILTRO OPTIMIZADO con useMemo
  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return usuariosOriginales;

    const searchLower = searchTerm.toLowerCase();

    return usuariosOriginales.filter((usuario) => {
      const personalData = usuario.personal_interno || usuario.personal_externo;
      if (!personalData) return false;

      const campos = [
        personalData.nombre || "",
        personalData.apellido || "",
        personalData.rut || "",
        personalData.cargo || "",
        personalData.ubicacion || ""
      ].join(" ").toLowerCase();

      return campos.includes(searchLower);
    });
  }, [usuariosOriginales, searchTerm]);

  // ✅ ACTUALIZAR usuarios cuando cambien los filtrados
  useEffect(() => {
    setUsuarios(usuariosFiltrados);
    setCurrentPage(1); // Reset a primera página
  }, [usuariosFiltrados]);

  // ✅ MANEJAR BÚSQUEDA
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setIsSearching(value.length > 0);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setIsSearching(false);
  }, []);

  // ✅ FORMATEAR USUARIO para siguiente paso
  const formatearUsuarioParaSiguiente = useCallback(
    (usuario) => {
      const personalData = usuario.personal_interno || usuario.personal_externo;
      if (!personalData) {
        DEBUG && console.error("No se encontraron datos del personal", usuario);
        return {
          id: null,
          nombre: "",
          apellido: "",
          rut: "",
          cargo: "",
          ubicacion: "",
          faena: "",
          id_faena: userFaena || null,
          tipo: tipoSolicitante,
          original: usuario,
        };
      }

      return {
        id: personalData.rut || personalData.id_personal_interno || personalData.id_personal_externo,
        nombre: personalData.nombre || "",
        apellido: personalData.apellido || "",
        rut: personalData.rut || "",
        cargo: personalData.cargo || "",
        ubicacion: personalData.ubicacion || "",
        faena: personalData.ubicacion || "",
        id_faena: userFaena || null,
        tipo: tipoSolicitante,
        original: usuario,
      };
    },
    [userFaena, tipoSolicitante]
  );

  const handleSelectUser = useCallback(
    (usuario) => {
      if (!usuario || !usuario._original) {
        DEBUG && console.error("Usuario inválido seleccionado", usuario);
        return;
      }

      setSelectedUser(usuario);
      setShowUserDetails(true);
      const usuarioFormateado = formatearUsuarioParaSiguiente(usuario._original);
      onNext(usuarioFormateado);
    },
    [formatearUsuarioParaSiguiente, onNext]
  );

  // ✅ FORMATEAR ITEMS con paginación mejorada
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
          nombre: `${personalData.nombre || ""} ${personalData.apellido || ""}`.trim(),
          descripcion: `${personalData.cargo || ""} - ${personalData.rut || ""}`,
          ubicacion: personalData.ubicacion || "",
          rut: personalData.rut || "",
          cargo: personalData.cargo || "",
          _original: item,
        };
      })
      .filter(Boolean);
  }, [usuarios, currentPage, displayPerPage]);

  // ✅ CÁLCULOS de paginación
  const totalPages = Math.max(1, Math.ceil(usuarios.length / displayPerPage));
  const totalUsuarios = usuariosOriginales.length;
  const usuariosMostrados = usuarios.length;
  const rangoInicio = Math.min((currentPage - 1) * displayPerPage + 1, usuariosMostrados);
  const rangoFin = Math.min(currentPage * displayPerPage, usuariosMostrados);

  // ✅ FUNCIÓN para reintentar carga
  const handleReintentar = useCallback(() => {
    setDatosCache((prev) => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
    setError(null);
    setLoading(true);
    // Trigger reload
    window.location.reload();
  }, [cacheKey]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-6">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center relative z-0">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">

          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>

          {/* ✅ TÍTULO con contador mejorado */}
          <div className="w-full flex justify-center items-center">
            <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg flex items-center">
              Seleccione Personal:{" "}
              <span className={`${tipoSolicitante === "interno"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
                } rounded-full px-2 py-1 text-xs uppercase ml-1`}>
                {tipoSolicitante}
              </span>
              {!loading && (
                <span className="ml-2 bg-gray-100 text-gray-600 rounded-full px-2 py-1 text-xs flex items-center">
                  <FaUsers className="mr-1" />
                  {totalUsuarios}
                </span>
              )}
            </h2>
          </div>

          {/* ✅ CONTENEDOR principal */}
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[400px] md:min-h-[450px] flex flex-col relative z-0">

            <TabProgressBar activeTab="solicitante" />

            {/* ✅ BARRA de búsqueda */}
            <div className="flex items-center space-x-2">
              <div className="flex-grow relative">
                <SearchBar
                  searchTerm={searchTerm}
                  setSearchTerm={handleSearchChange}
                  placeholder="Buscar por nombre, RUT o cargo..."
                  onClear={handleClearSearch}
                />
              </div>
              {isSearching && (
                <div className="text-white text-xs bg-white bg-opacity-20 rounded px-2 py-1">
                  {usuariosMostrados} resultados
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col">

              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Cargando personal...</p>
                    <p className="text-gray-400 text-sm mt-1">Tipo: {tipoSolicitante}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                      onClick={handleReintentar}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-gray-500 mb-2">
                      {usuariosOriginales.length === 0
                        ? `No hay personal ${tipoSolicitante} disponible en esta faena`
                        : "No se encontraron resultados"}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="text-orange-500 hover:text-orange-700 font-medium"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <List
                  items={formattedItems}
                  onItemSelect={handleSelectUser}
                  buttonStyle={true}
                  tipoElemento="personal"
                  maxHeight="350px"
                />
              )}
            </div>

            {/* ✅ PAGINACIÓN INTEGRADA CON INFORMACIÓN */}
            {!loading && !error && usuarios.length > 0 && (
              <div className="space-y-3">
                {/* Información de resultados */}
                <div className="text-center text-white text-xs space-y-1">
                  <div>
                    Mostrando {rangoInicio}-{rangoFin} de {usuariosMostrados} personal
                    {searchTerm && ` para "${searchTerm}"`}
                  </div>
                  {usuariosMostrados < totalUsuarios && (
                    <div className="text-orange-200">
                      ({totalUsuarios - usuariosMostrados} filtrados)
                    </div>
                  )}
                </div>

                {/* PageControl integrado */}
                {totalPages > 1 && (
                  <PageControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            )}

          </div>
          {/* ✅ CONTROLES DE FLUJO - FUERA DEL CONTENEDOR NARANJA */}
          <div className="flex items-center justify-between w-full px-4 py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-2 shadow-none flex items-center justify-center group"
              icon={<FaArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />}
              textColor="orange-500"
            />
            <div className="w-20 h-10"></div> {/* Spacer para centrar */}
          </div>
        </div>
      </main>

      {/* ✅ MODAL de detalles mejorado */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Detalles del personal seleccionado
            </h3>

            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
                <span className="font-medium text-gray-700">
                  {selectedUser.nombre}
                </span>
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
    </div>
  );
};

export default React.memo(Solicitante);