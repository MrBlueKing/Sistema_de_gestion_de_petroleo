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
import { UserContext } from "../../../context/userContext";
import bomberoService from "../../../context/bomberoService";

import {
  FaArrowLeft,
  FaCar,
  FaCheck,
  // 🆕 ICONOS PARA CONSISTENCIA
  FaTruck,
  FaShuttleVan,
  FaBus,
  FaMotorcycle,
  FaTractor,
  FaTools,
  FaIndustry,
  FaGasPump,
  FaTruckPickup,
  FaChargingStation,
  FaCog
} from "react-icons/fa";
import { PiTruckTrailer } from "react-icons/pi";
import { GiPowerGenerator, GiForklift } from "react-icons/gi";
import { TbBulldozer } from "react-icons/tb";
import { MdFrontLoader } from "react-icons/md";

// ✅ CACHE GLOBAL PARA MÁQUINAS - PERSISTENTE ENTRE NAVEGACIONES
const maquinasCache = new Map();

// 🎯 CONFIGURACIÓN DE ICONOS
const ICON_SIZE = "w-5 h-5"; // Tamaño uniforme

const ICON_CONFIG = {
  microbus: { icon: FaBus, color: "text-blue-600" },
  'camion tolva': { icon: PiTruckTrailer, color: "text-purple-600" },
  camioneta: { icon: FaTruckPickup, color: "text-blue-500" },
  excavadora: { icon: TbBulldozer, color: "text-red-600" },
  pala: { icon: MdFrontLoader, color: "text-orange-600" },
  dumper: { icon: FaTruck, color: "text-gray-600" },
  compresor: { icon: GiPowerGenerator, color: "text-cyan-600" },
  'grupo electrogeno': { icon: FaChargingStation, color: "text-yellow-500" },
  electrógeno: { icon: FaChargingStation, color: "text-yellow-500" },
  manitou: { icon: GiForklift, color: "text-indigo-600" },
  taller: { icon: FaTools, color: "text-gray-600" },

  // Fallbacks por tipo de medición
  horometro: { icon: FaTractor, color: "text-orange-500" },
  kilometraje: { icon: FaTruck, color: "text-blue-500" },
  default: { icon: FaCar, color: "text-slate-600" }
};

// 🎨 FUNCIÓN PARA OBTENER ICONO DE MÁQUINA
const getIconForMaquina = (maquina, categoriaSeleccionada) => {
  let nombreCategoria = '';

  if (categoriaSeleccionada) {
    nombreCategoria = (categoriaSeleccionada.nombre || categoriaSeleccionada.nombre_categoria || '').toLowerCase();
  } else if (maquina) {
    nombreCategoria = (maquina.nombre_categoria || maquina.categoria_nombre || '').toLowerCase();
  }

  // Buscar coincidencia específica
  for (const [key, config] of Object.entries(ICON_CONFIG)) {
    if (key !== 'horometro' && key !== 'kilometraje' && key !== 'default' && nombreCategoria.includes(key)) {
      const IconComponent = config.icon;
      return <IconComponent className={`${ICON_SIZE} ${config.color}`} />;
    }
  }

  // Fallback por tipo de medición
  const tipoMedicion = (categoriaSeleccionada?.tipo_medicion || '').toLowerCase();
  if (tipoMedicion.includes('horometro')) {
    const IconComponent = ICON_CONFIG.horometro.icon;
    return <IconComponent className={`${ICON_SIZE} ${ICON_CONFIG.horometro.color}`} />;
  }
  if (tipoMedicion.includes('kilometraje')) {
    const IconComponent = ICON_CONFIG.kilometraje.icon;
    return <IconComponent className={`${ICON_SIZE} ${ICON_CONFIG.kilometraje.color}`} />;
  }

  // Icono por defecto
  const IconComponent = ICON_CONFIG.default.icon;
  return <IconComponent className={`${ICON_SIZE} ${ICON_CONFIG.default.color}`} />;
};

const Patente = ({
  categoriaSeleccionada,
  onNext,
  onPrevious,
  solicitante,
  tipoSolicitante,
  userFaena,
}) => {
  const DEBUG = false; // o true si estás depurando
  
  // 🎯 ESTADOS EXACTOS COMO SOLICITANTE
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [maquinas, setMaquinas] = useState([]);
  const [maquinasOriginales, setMaquinasOriginales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaquina, setSelectedMaquina] = useState(null);
  const [showMaquinaDetails, setShowMaquinaDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [displayPerPage, setDisplayPerPage] = useState(8);

  // ✅ CACHE optimizado igual que Solicitante
  const [datosCache, setDatosCache] = useState({});
  
  const { user } = useContext(UserContext);

  // 🎯 CACHE KEY IGUAL QUE SOLICITANTE
  const cacheKey = `${tipoSolicitante}-${categoriaSeleccionada?.id}-${userFaena}`;

  // ✅ RESPONSIVE: Ajustar elementos por página igual que Solicitante
  useEffect(() => {
    const calcularElementosPorPagina = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setDisplayPerPage(20); // Menos que Solicitante porque son máquinas
      } else if (width < 768) {
        setDisplayPerPage(10);
      } else if (width < 1024) {
        setDisplayPerPage(12);
      } else {
        setDisplayPerPage(16);
      }
    };

    calcularElementosPorPagina();
    window.addEventListener("resize", calcularElementosPorPagina);
    return () =>
      window.removeEventListener("resize", calcularElementosPorPagina);
  }, []);

  // Extraer información de la categoría de forma segura
  const categoriaInfo = useMemo(() => {
    if (!categoriaSeleccionada) return null;

    if (typeof categoriaSeleccionada === "object") {
      return {
        id: categoriaSeleccionada.id,
        nombre: categoriaSeleccionada.nombre,
        tipo_medicion: categoriaSeleccionada.tipo_medicion,
      };
    }

    return {
      id: categoriaSeleccionada,
      nombre: "Categoría seleccionada",
      tipo_medicion: "Por definir",
    };
  }, [categoriaSeleccionada]);

  // 🎯 CARGA OPTIMIZADA EXACTA COMO SOLICITANTE
  useEffect(() => {
    let isActive = true;

    const cargarDatos = async () => {
      if (!userFaena || !tipoSolicitante || !categoriaInfo?.id) {
        DEBUG && console.log("⏸️ No se puede cargar: faltan datos necesarios");
        setLoading(false);
        return;
      }

      // ✅ VERIFICAR CACHE igual que Solicitante
      if (datosCache[cacheKey]) {
        DEBUG && console.log("📦 CACHE LOCAL HIT para:", cacheKey);
        const cached = datosCache[cacheKey];
        setMaquinas(cached.maquinas);
        setMaquinasOriginales(cached.maquinas);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        DEBUG && console.log(`🎯 Cargando máquinas ${tipoSolicitante} para categoría ${categoriaInfo.id}`);

        const maquinasData = await bomberoService.getMaquinas(
          tipoSolicitante,
          categoriaInfo.id,
          userFaena || user?.id_faena
        );

        if (!isActive) return;

        DEBUG && console.log(`📊 Total máquinas cargadas: ${maquinasData.length}`);

        const datosParaCache = {
          maquinas: Array.isArray(maquinasData) ? maquinasData : [],
        };

        setDatosCache((prev) => ({
          ...prev,
          [cacheKey]: datosParaCache,
        }));

        setMaquinas(datosParaCache.maquinas);
        setMaquinasOriginales(datosParaCache.maquinas);

        DEBUG && console.log(`✅ ${datosParaCache.maquinas.length} máquinas cargadas exitosamente`);
      } catch (err) {
        if (isActive) {
          DEBUG && console.error("❌ Error al cargar máquinas:", err);
          setError("No se pudieron cargar las máquinas. Intente nuevamente.");
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
  }, [userFaena, tipoSolicitante, categoriaInfo?.id, cacheKey]);

  // 🎯 FILTRO OPTIMIZADO EXACTO COMO SOLICITANTE
  const maquinasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return maquinasOriginales;

    const searchLower = searchTerm.toLowerCase();

    return maquinasOriginales.filter((maquina) => {
      if (tipoSolicitante === "interno") {
        const campos = [
          maquina.patente || "",
          maquina.nombre || "",
          maquina.marca || "",
          maquina.modelo || ""
        ].join(" ").toLowerCase();
        return campos.includes(searchLower);
      } else if (tipoSolicitante === "externo") {
        const campos = [
          maquina.nombre_maquina || "",
          maquina.patente || "",
          maquina.marca || "",
          maquina.modelo || ""
        ].join(" ").toLowerCase();
        return campos.includes(searchLower);
      }
      return false;
    });
  }, [maquinasOriginales, searchTerm, tipoSolicitante]);

  // 🎯 ACTUALIZAR maquinas CUANDO CAMBIEN LOS FILTRADOS - IGUAL QUE SOLICITANTE
  useEffect(() => {
    setMaquinas(maquinasFiltradas);
    setCurrentPage(1); // Reset a primera página
  }, [maquinasFiltradas]);

  // 🎯 MANEJAR BÚSQUEDA IGUAL QUE SOLICITANTE
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setIsSearching(value.length > 0);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setIsSearching(false);
  }, []);

  // 🎯 FORMATEAR MÁQUINA PARA SIGUIENTE PASO
  const formatearMaquinaParaSiguiente = useCallback(
    (maquina) => {
      if (tipoSolicitante === "interno") {
        return {
          id_maquina: maquina.id_maquina,
          patente: maquina.patente,
          nombre: maquina.nombre,
          categoria: maquina.categoria,
          tipo: "interna",
          original: maquina,
        };
      } else {
        return {
          id_maquina: maquina.id_maquina,
          patente: maquina.patente || maquina.nombre_maquina,
          nombre: maquina.nombre_maquina,
          categoria: maquina.id_categoria,
          tipo: "externa",
          original: maquina,
        };
      }
    },
    [tipoSolicitante]
  );

  const handleSelectMaquina = useCallback(
    (maquinaFormatted) => {
      if (!maquinaFormatted || !maquinaFormatted._original) {
        DEBUG && console.error("Máquina inválida seleccionada", maquinaFormatted);
        return;
      }

      setSelectedMaquina(maquinaFormatted);
      setShowMaquinaDetails(true);
      const maquinaFormateada = formatearMaquinaParaSiguiente(maquinaFormatted._original);
      onNext(maquinaFormateada);
    },
    [formatearMaquinaParaSiguiente, onNext]
  );

  // 🎯 FORMATEAR ITEMS CON PAGINACIÓN EXACTA COMO SOLICITANTE
  const formattedItems = useMemo(() => {
    if (!Array.isArray(maquinas)) return [];

    const startIndex = (currentPage - 1) * displayPerPage;
    const endIndex = startIndex + displayPerPage;

    return maquinas
      .slice(startIndex, endIndex)
      .map((maquina) => {
        if (tipoSolicitante === "interno") {
          return {
            id: maquina.id_maquina_interna || maquina.id_maquina,
            nombre: maquina.nombre || "Sin nombre",
            descripcion: `${maquina.patente || "Sin patente"} - ${maquina.marca || ""} ${maquina.modelo || ""}`.trim(),
            icon: getIconForMaquina(maquina, categoriaSeleccionada),
            _original: maquina,
          };
        } else {
          return {
            id: maquina.id_maquina,
            nombre: maquina.patente || maquina.nombre_maquina || "Sin patente",
            descripcion: `${maquina.nombre_maquina || "Máquina Externa"} - ${maquina.marca || ""} ${maquina.modelo || ""}`.trim(),
            icon: getIconForMaquina(maquina, categoriaSeleccionada),
            _original: maquina,
          };
        }
      })
      .filter(Boolean);
  }, [maquinas, currentPage, displayPerPage, tipoSolicitante, categoriaSeleccionada]);

  // 🎯 CÁLCULOS DE PAGINACIÓN EXACTOS COMO SOLICITANTE
  const totalPages = Math.max(1, Math.ceil(maquinas.length / displayPerPage));
  const totalMaquinas = maquinasOriginales.length;
  const maquinasMostradas = maquinas.length;
  const rangoInicio = Math.min((currentPage - 1) * displayPerPage + 1, maquinasMostradas);
  const rangoFin = Math.min(currentPage * displayPerPage, maquinasMostradas);

  // 🎯 FUNCIÓN PARA REINTENTAR CARGA IGUAL QUE SOLICITANTE
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

          {/* 🎯 TÍTULO EXACTO COMO SOLICITANTE */}
          <div className="w-full flex justify-center items-center">
            <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg flex items-center">
              Seleccione Máquina:{" "}
              <span className={`${tipoSolicitante === "interno"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
                } rounded-full px-2 py-1 text-xs uppercase ml-1`}>
                {categoriaInfo?.nombre}
              </span>
              {!loading && (
                <span className="ml-2 bg-gray-100 text-gray-600 rounded-full px-2 py-1 text-xs flex items-center">
                  <FaCog className="mr-1" />
                  {totalMaquinas}
                </span>
              )}
            </h2>
          </div>

          {/* 🎯 CONTENEDOR PRINCIPAL EXACTO COMO SOLICITANTE */}
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[400px] md:min-h-[450px] flex flex-col relative z-0">

            <TabProgressBar activeTab="patente" />

            {/* 🎯 BARRA DE BÚSQUEDA EXACTA COMO SOLICITANTE */}
            <div className="flex items-center space-x-2">
              <div className="flex-grow relative">
                <SearchBar
                  searchTerm={searchTerm}
                  setSearchTerm={handleSearchChange}
                  placeholder={
                    tipoSolicitante === "interno"
                      ? "Buscar por patente, nombre o marca..."
                      : "Buscar máquina externa..."
                  }
                  onClear={handleClearSearch}
                />
              </div>
              {isSearching && (
                <div className="text-white text-xs bg-white bg-opacity-20 rounded px-2 py-1">
                  {maquinasMostradas} resultados
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
                    <p className="text-gray-500">Cargando máquinas...</p>
                    <p className="text-gray-400 text-sm mt-1">Categoría: {categoriaInfo?.nombre}</p>
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
              ) : maquinas.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-gray-500 mb-2">
                      {maquinasOriginales.length === 0
                        ? `No hay máquinas ${tipoSolicitante}s disponibles para ${categoriaInfo?.nombre}`
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
                  onItemSelect={handleSelectMaquina}
                  buttonStyle={true}
                  tipoElemento="máquina"
                  maxHeight="350px"
                  showIcons={true}
                />
              )}
            </div>

            {/* 🎯 PAGINACIÓN EXACTA COMO SOLICITANTE */}
            {!loading && !error && maquinas.length > 0 && (
              <div className="space-y-3">
                {/* Información de resultados */}
                <div className="text-center text-white text-xs space-y-1">
                  <div>
                    Mostrando {rangoInicio}-{rangoFin} de {maquinasMostradas} máquinas
                    {searchTerm && ` para "${searchTerm}"`}
                  </div>
                  {maquinasMostradas < totalMaquinas && (
                    <div className="text-orange-200">
                      ({totalMaquinas - maquinasMostradas} filtradas)
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

          {/* 🎯 CONTROLES DE FLUJO EXACTOS COMO SOLICITANTE */}
          <div className="flex items-center justify-between w-full px-4 py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-2 shadow-none flex items-center justify-center group"
              icon={<FaArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />}
              textColor="orange-500"
            />
            <div className="w-20 h-10"></div>
          </div>
        </div>
      </main>

      {/* 🎯 MODAL DE DETALLES IGUAL QUE SOLICITANTE */}
      {showMaquinaDetails && selectedMaquina && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Detalles de la máquina seleccionada
            </h3>

            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <div className="flex items-center mb-2">
                <FaCar className="w-6 h-6 text-blue-600 mr-2" />
                <span className="font-medium text-gray-700">
                  {selectedMaquina.nombre}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Patente:</div>
                <div className="text-gray-800 font-medium">
                  {selectedMaquina._original?.patente || selectedMaquina._original?.nombre_maquina || "Sin patente"}
                </div>

                <div className="text-gray-600">Marca:</div>
                <div className="text-gray-800 font-medium">
                  {selectedMaquina._original?.marca || "Sin marca"}
                </div>

                <div className="text-gray-600">Modelo:</div>
                <div className="text-gray-800 font-medium">
                  {selectedMaquina._original?.modelo || "Sin modelo"}
                </div>

                <div className="text-gray-600">Tipo:</div>
                <div className="text-gray-800 font-medium capitalize">{tipoSolicitante}</div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMaquinaDetails(false)}
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

export default React.memo(Patente);