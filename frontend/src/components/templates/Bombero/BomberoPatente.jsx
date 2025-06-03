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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(3);
  const [seleccion, setSeleccion] = useState(null);
  const [maquinas, setMaquinas] = useState([]);
  const [maquinasOriginales, setMaquinasOriginales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const totalPages = 4;
  const { user } = useContext(UserContext);

  // ✅ CREAR CLAVE DE CACHE ÚNICA
  const cacheKey = useMemo(
    () =>
      `maquinas-${tipoSolicitante}-${categoriaSeleccionada?.id}-${
        userFaena || user?.id_faena
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
        descripcion: categoriaSeleccionada.descripcion,
      };
    }

    // Si es un string o número, crear estructura básica
    return {
      id: categoriaSeleccionada,
      nombre: categoriaSeleccionada.toString(),
      tipo_medicion: "Kilometraje",
      descripcion: "Categoría básica",
    };
  }, [categoriaSeleccionada]);

  // ✅ CARGA ULTRA-OPTIMIZADA - CACHE GLOBAL PERSISTENTE
  const cargarMaquinas = useCallback(async () => {
    if (!tipoSolicitante || !categoriaInfo) {
      return;
    }

    // ✅ VERIFICAR CACHE GLOBAL PRIMERO
    if (maquinasCache.has(cacheKey)) {
      console.log("📦 CACHE GLOBAL HIT para máquinas:", cacheKey);
      const cached = maquinasCache.get(cacheKey);
      setMaquinas(cached.maquinas);
      setMaquinasOriginales(cached.maquinas);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Usar userFaena si está disponible, si no usar del contexto
      const idFaena = userFaena || user?.id_faena;

      if (!idFaena) {
        throw new Error("No se pudo determinar la faena del usuario");
      }

      console.log(
        `🎯 REQUEST ÚNICO: máquinas ${tipoSolicitante} desde cache o API`
      );

      // 🚀 USAR EL MÉTODO DEL SERVICIO QUE YA TIENE CACHE
      const maquinasFiltradas = await bomberoService.getMaquinas(
        tipoSolicitante,
        categoriaInfo.id,
        idFaena
      );

      // ✅ GUARDAR EN CACHE GLOBAL PERSISTENTE
      maquinasCache.set(cacheKey, {
        maquinas: maquinasFiltradas,
        timestamp: Date.now(),
      });

      setMaquinas(maquinasFiltradas);
      setMaquinasOriginales(maquinasFiltradas);

      console.log(
        `✅ CACHE GLOBAL: ${maquinasFiltradas.length} máquinas cacheadas para ${tipoSolicitante}`
      );
    } catch (err) {
      console.error("❌ Error al cargar máquinas:", err);

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

  // ✅ ACTUALIZAR maquinas CUANDO CAMBIEN LOS FILTRADOS
  useEffect(() => {
    setMaquinas(maquinasFiltradas);
  }, [maquinasFiltradas]);

  // Formatear las máquinas para el componente List
  const formatearMaquinas = useMemo(() => {
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

      console.log("🚗 Máquina seleccionada:", maquinaFormateada);

      // ✅ AVANZAR DIRECTAMENTE - Los estanques se cargan en el componente Consumo
      onNext(maquinaFormateada);
    },
    [tipoSolicitante, onNext]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
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
                    <svg
                      className="w-10 h-10 mx-auto mb-2 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <p className="mb-2">{error}</p>
                    <button
                      onClick={() => {
                        // Limpiar cache global y recargar
                        maquinasCache.delete(cacheKey);
                        cargarMaquinas();
                      }}
                      className="text-orange-500 hover:text-orange-700 font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : formatearMaquinas.length > 0 ? (
                <>
                  <List
                    items={formatearMaquinas}
                    onItemSelect={handleSelectPatente}
                    buttonStyle={true}
                    tipoElemento="patente"
                  />

                  {/* Información de resultados */}
                  <div className="mt-2 text-center text-gray-500 text-xs">
                    {formatearMaquinas.length} máquina
                    {formatearMaquinas.length !== 1 ? "s" : ""} disponible
                    {formatearMaquinas.length !== 1 ? "s" : ""}
                    {searchTerm && ` para "${searchTerm}"`}
                  </div>
                </>
              ) : (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-10 h-10 mx-auto mb-2 text-gray-400"
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
          </div>

          {/* Controles inferiores */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={
                <FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />
              }
              textColor="orange-500"
            />

            <div className="flex-1 flex justify-center">
              <PageControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>

            <div className="w-5 h-5 md:w-6 md:h-6"></div>
          </div>

          {/* Ayuda mejorada */}
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
                Seleccione una máquina {tipoSolicitante} para continuar
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(Patente);
