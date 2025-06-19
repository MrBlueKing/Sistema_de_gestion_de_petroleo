import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from "react";

import StepHeader from "../../molecules/StepHeader";
import TabProgressBar from "../../molecules/TabProgressBar";
import SearchBar from "../../molecules/SearchBar";
import List from "../../molecules/OptionsFormBombero";
import Button from "../../atoms/Button/Button";
import PageControl from "../../molecules/PageControl";
import { FaArrowLeft, FaCar, FaCheck } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import bomberoService from "../../../context/bomberoService";

// ✅ CACHE GLOBAL PARA MÁQUINAS - PERSISTENTE ENTRE NAVEGACIONES
const maquinasCache = new Map();

const Patente = ({
  categoriaSeleccionada,
  onNext,
  onPrevious,
  solicitante,
  tipoSolicitante,
  userFaena,
}) => {
  const DEBUG = false; // o true si estás depurando
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // ✅ Cambio: iniciar en página 1
  const [seleccion, setSeleccion] = useState(null);
  const [maquinas, setMaquinas] = useState([]);
  const [maquinasOriginales, setMaquinasOriginales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ NUEVO: Estados para paginación funcional
  const [displayPerPage, setDisplayPerPage] = useState(8);
  const [paginatedMaquinas, setPaginatedMaquinas] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useContext(UserContext);

  // ✅ RESPONSIVE: Ajustar elementos por página dinámicamente
  useEffect(() => {
    const calcularElementosPorPagina = () => {
      const width = window.innerWidth;

      if (width < 640) {
        // Móvil pequeño
        setDisplayPerPage(6);
      } else if (width < 768) {
        // Móvil grande
        setDisplayPerPage(8);
      } else if (width < 1024) {
        // Tablet
        setDisplayPerPage(12);
      } else {
        // Desktop - mostrar más elementos
        setDisplayPerPage(16);
      }
    };

    calcularElementosPorPagina();
    window.addEventListener("resize", calcularElementosPorPagina);
    return () =>
      window.removeEventListener("resize", calcularElementosPorPagina);
  }, []);

  // ✅ CREAR CLAVE DE CACHE ÚNICA
  const cacheKey = useMemo(
    () =>
      `maquinas-${tipoSolicitante}-${categoriaSeleccionada?.id}-${userFaena || user?.id_faena
      }`,
    [tipoSolicitante, categoriaSeleccionada?.id, userFaena, user?.id_faena]
  );

  // Extraer información de la categoría de forma segura
  const categoriaInfo = useMemo(() => {
    if (!categoriaSeleccionada) return null;

    // Si es un objeto, extraer la información
    if (typeof categoriaSeleccionada === "object") {
      return {
        id: categoriaSeleccionada.id,
        nombre: categoriaSeleccionada.nombre,
        tipo_medicion: categoriaSeleccionada.tipo_medicion,
      };
    }

    // Si es un string o número, crear objeto básico
    return {
      id: categoriaSeleccionada,
      nombre: "Categoría seleccionada",
      tipo_medicion: "Por definir",
    };
  }, [categoriaSeleccionada]);

  // ✅ FUNCIÓN PARA CARGAR MÁQUINAS
  const cargarMaquinas = useCallback(async () => {
    if (!tipoSolicitante || !categoriaInfo?.id) {
      DEBUG && console.log("⏸️ No se puede cargar: faltan datos necesarios");
      setLoading(false);
      return;
    }

    // ✅ VERIFICAR CACHE PRIMERO
    if (maquinasCache.has(cacheKey)) {
      DEBUG && console.log("💾 Cargando máquinas desde cache:", cacheKey);
      const cachedData = maquinasCache.get(cacheKey);
      setMaquinasOriginales(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      DEBUG && console.log("🔄 Cargando máquinas desde API:", {
        tipoSolicitante,
        categoriaId: categoriaInfo.id,
        userFaena: userFaena || user?.id_faena,
      });

      // ✅ USAR EL MÉTODO CORRECTO DEL SERVICIO
      const maquinasData = await bomberoService.getMaquinas(
        tipoSolicitante,
        categoriaInfo.id,
        userFaena || user?.id_faena
      );

      if (Array.isArray(maquinasData)) {
        DEBUG && console.log("✅ Máquinas cargadas:", maquinasData.length);

        // ✅ GUARDAR EN CACHE
        maquinasCache.set(cacheKey, maquinasData);
        setMaquinasOriginales(maquinasData);
      } else {
        DEBUG && console.warn("⚠️ Respuesta vacía o inválida");
        setMaquinasOriginales([]);
      }
    } catch (err) {
      DEBUG && console.error("❌ Error al cargar máquinas:", err);

      let errorMessage = "Error al conectar con el servidor";

      if (err.response?.status === 404) {
        errorMessage = `No se encontraron máquinas ${tipoSolicitante}s disponibles`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tipoSolicitante, categoriaInfo?.id, userFaena, user?.id_faena, cacheKey]);

  useEffect(() => {
    // Solo cargar si tenemos los datos necesarios
    if (tipoSolicitante && categoriaInfo) {
      cargarMaquinas();
    } else {
      setError("Faltan datos del solicitante o categoría");
      setLoading(false);
    }
  }, [tipoSolicitante, categoriaInfo]);

  // ✅ FILTRO OPTIMIZADO CON useMemo
  const maquinasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return maquinasOriginales;

    return maquinasOriginales.filter((maquina) => {
      // Para máquinas internas
      if (tipoSolicitante === "interno") {
        return (
          maquina.patente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          maquina.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      // Para máquinas externas
      else if (tipoSolicitante === "externo") {
        return (
          maquina.nombre_maquina
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          maquina.patente?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return false;
    });
  }, [maquinasOriginales, searchTerm, tipoSolicitante]);

  // ✅ PAGINACIÓN: Calcular páginas totales y datos paginados
  useEffect(() => {
    const totalItems = maquinasFiltradas.length;
    const pages = Math.ceil(totalItems / displayPerPage) || 1;
    setTotalPages(pages);

    // Si la página actual es mayor que el total de páginas, resetear
    if (currentPage > pages) {
      setCurrentPage(1);
    }
  }, [maquinasFiltradas.length, displayPerPage, currentPage]);

  // ✅ CALCULAR DATOS DE LA PÁGINA ACTUAL
  useEffect(() => {
    const startIndex = (currentPage - 1) * displayPerPage;
    const endIndex = startIndex + displayPerPage;
    const paginatedData = maquinasFiltradas.slice(startIndex, endIndex);

    // ✅ DEBUG: Log para identificar problemas de datos
    DEBUG && console.log("🔍 Debug Paginación:", {
      maquinasFiltradas: maquinasFiltradas.length,
      currentPage,
      displayPerPage,
      startIndex,
      endIndex,
      paginatedData: paginatedData.length,
      isArray: Array.isArray(paginatedData)
    });

    setPaginatedMaquinas(paginatedData);
  }, [maquinasFiltradas, currentPage, displayPerPage]);

  // ✅ ACTUALIZAR maquinas CUANDO CAMBIEN LOS PAGINADOS
  useEffect(() => {
    setMaquinas(paginatedMaquinas);
  }, [paginatedMaquinas]);

  // Formatear las máquinas para el componente List
  const formatearMaquinas = useMemo(() => {
    // ✅ VALIDACIÓN: Asegurar que maquinas sea un array válido
    if (!Array.isArray(maquinas) || maquinas.length === 0) {
      return [];
    }

    return maquinas.map((maquina) => {
      if (tipoSolicitante === "interno") {
        // Formato para máquinas internas
        return {
          id: maquina.id_maquina_interna || maquina.id_maquina,
          nombre: maquina.nombre || "Sin patente",
          descripcion: maquina.patente || "Sin descripción",
          original: maquina,
        };
      } else {
        // Formato para máquinas externas
        return {
          id: maquina.id_maquina,
          nombre: maquina.patente || maquina.nombre_maquina || "Sin patente",
          descripcion: maquina.nombre_maquina || "Máquina Externa",
          original: maquina,
        };
      }
    });
  }, [maquinas, tipoSolicitante]);

  // ✅ HANDLERS OPTIMIZADOS
  const handleSelectPatente = useCallback(
    async (maquina) => {
      setSeleccion(maquina.nombre);

      // Formatear los datos de la máquina según el tipo
      let maquinaFormateada;

      if (tipoSolicitante === "interno") {
        maquinaFormateada = {
          id_maquina:
            maquina.original.id_maquina_interna || maquina.original.id_maquina,
          patente: maquina.original.patente,
          nombre: maquina.original.nombre,
          categoria: maquina.original.categoria,
          tipo: "interna",
        };
      } else {
        maquinaFormateada = {
          id_maquina: maquina.original.id_maquina,
          patente: maquina.original.patente || maquina.original.nombre_maquina,
          nombre: maquina.original.nombre_maquina,
          categoria: maquina.original.id_categoria,
          tipo: "externa",
        };
      }

      DEBUG && console.log("🚗 Máquina seleccionada:", maquinaFormateada);

      // ✅ AVANZAR DIRECTAMENTE - Los estanques se cargan en el componente Consumo
      onNext(maquinaFormateada);
    },
    [tipoSolicitante, onNext]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setCurrentPage(1); // ✅ Resetear a la primera página al limpiar búsqueda
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1); // ✅ Resetear a la primera página al buscar
  }, []);

  // ✅ HANDLER PARA CAMBIO DE PÁGINA
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Función para obtener el texto del tipo de solicitante con color
  const getTipoSolicitanteDisplay = useCallback(() => {
    if (tipoSolicitante === "interno") {
      return <span className="text-blue-600 font-medium">Interno</span>;
    } else if (tipoSolicitante === "externo") {
      return <span className="text-green-600 font-medium">Externo</span>;
    }
    return <span className="text-gray-600">No definido</span>;
  }, [tipoSolicitante]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-6">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>
          <div className="w-full flex justify-center items-center">
            <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg flex items-center">
              <FaCar className="mr-2 text-orange-500" />
              Selecciona una Máquina para {categoriaInfo?.nombre} (
              {getTipoSolicitanteDisplay()})
            </h2>
          </div>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">
            <TabProgressBar activeTab="patente" />

            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={handleSearchChange}
              placeholder={
                tipoSolicitante === "interno"
                  ? "Buscar por patente o nombre"
                  : "Buscar máquina externa"
              }
              onClear={handleClearSearch}
            />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col justify-center">
              {loading ? (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Cargando máquinas {tipoSolicitante}s...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="py-4 text-red-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <p className="mb-2">{error}</p>
                    <button
                      onClick={cargarMaquinas}
                      className="text-orange-500 hover:text-orange-700 font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : Array.isArray(formatearMaquinas) && formatearMaquinas.length > 0 ? (
                <div className="flex flex-col h-full">
                  {/* ✅ LISTA DE MÁQUINAS */}
                  <div className="flex-grow">
                    <List
                      items={formatearMaquinas}
                      onItemSelect={handleSelectPatente}
                      seleccionActual={seleccion}
                      loading={loading}
                      buttonStyle={true}
                      tipoElemento="máquina"
                    />
                  </div>

                  {/* ✅ PAGECONTROL - Solo mostrar si hay más de 1 página */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <PageControl
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <p className="mb-2">
                      {maquinasOriginales.length === 0
                        ? `No hay máquinas ${tipoSolicitante}s disponibles para esta categoría`
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
              )}
            </div>

            {/* ✅ INFORMACIÓN DE PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="text-center text-white/80 text-xs">
                Mostrando {((currentPage - 1) * displayPerPage) + 1} - {Math.min(currentPage * displayPerPage, maquinasFiltradas.length)} de {maquinasFiltradas.length} máquinas
              </div>
            )}
          </div>

          {/* ✅ CONTROLES INFERIORES - Similar al componente Solicitante */}
          <div className="flex items-center justify-between w-full px-4 py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-2 shadow-none flex items-center justify-center group"
              icon={
                <FaArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              }
              textColor="orange-500"
            />
            <div className="w-10 h-10"></div> {/* Spacer para centrar */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(Patente);