import React, { useState, useEffect, useCallback, useMemo } from "react";
import StepHeader from "../../molecules/StepHeader";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/OptionsFormBombero";
import Button from "../../atoms/Button/Button";
import {
  FaArrowLeft,
  FaCog,
  FaTruck,
  FaCar,
  FaShuttleVan,
  FaBus,
  FaMotorcycle,
  FaTractor,
  FaTools,
  FaIndustry,
  FaGasPump,
  FaSearch,
  FaTimes,
  FaTruckPickup,
  FaBolt,
  FaWind,
  FaBoxes,
  FaChargingStation
} from "react-icons/fa";
import { PiTruckTrailer } from "react-icons/pi";
import { GiPowerGenerator, GiForklift } from "react-icons/gi";
import { TbBulldozer } from "react-icons/tb";
import { MdFrontLoader } from "react-icons/md";
import bomberoService from "../../../context/bomberoService";

// 🎯 CONFIGURACIÓN DE ICONOS CON TAMAÑO UNIFORME
const ICON_SIZE = "w-8 h-8"; // Tamaño uniforme para todos los iconos
const ICON_CONFIG = {
  // Configuración específica por categoría
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
  estanque_movil: { icon: FaGasPump, color: "text-green-600" },

  // Fallbacks por tipo de medición
  horometro: { icon: FaCog, color: "text-orange-500" },
  kilometraje: { icon: FaTruck, color: "text-blue-500" },
  default: { icon: FaIndustry, color: "text-slate-600" }
};

// 🎨 COMPONENTE DE ICONO UNIFORME
const UniformIcon = ({ categoria }) => {
  const getIconConfig = () => {
    // Categoría especial para estanque móvil
    if (categoria.isEstanqueMovil || categoria.id === 'estanque_movil') {
      return ICON_CONFIG.estanque_movil;
    }

    const nombre = (categoria.nombre_categoria || categoria.nombre || '').toLowerCase();

    // Buscar coincidencia específica en el nombre
    for (const [key, config] of Object.entries(ICON_CONFIG)) {
      if (key !== 'horometro' && key !== 'kilometraje' && key !== 'default' && nombre.includes(key)) {
        return config;
      }
    }

    // Fallback por tipo de medición
    const tipoMedicion = (categoria.tipo_medicion || '').toLowerCase();
    if (tipoMedicion.includes('horometro')) return ICON_CONFIG.horometro;
    if (tipoMedicion.includes('kilometraje')) return ICON_CONFIG.kilometraje;

    return ICON_CONFIG.default;
  };

  const { icon: IconComponent, color } = getIconConfig();

  return <IconComponent className={`${ICON_SIZE} ${color}`} />;
};

// 🔍 COMPONENTE DE BÚSQUEDA
const SearchSection = ({
  filtroTexto,
  setFiltroTexto,
  ordenamiento,
  setOrdenamiento,
  totalCategorias,
  categoriasVisibles,
  onLimpiarFiltros
}) => (
  <div className="mb-4 space-y-3">
    {/* Búsqueda principal */}
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaSearch className={`${ICON_SIZE} text-gray-400`} />
      </div>
      <input
        type="text"
        placeholder="Buscar categoría... (ej: 'arrendada', 'kilometraje', 'dumper')"
        value={filtroTexto}
        onChange={(e) => setFiltroTexto(e.target.value)}
        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm"
      />
      {filtroTexto && (
        <button
          onClick={() => setFiltroTexto('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Limpiar búsqueda"
        >
          <FaTimes className={ICON_SIZE} />
        </button>
      )}
    </div>

    {/* Controles de filtro */}
    <div className="flex flex-wrap gap-2 justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium text-gray-600">Orden:</label>
          <select
            value={ordenamiento}
            onChange={(e) => setOrdenamiento(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="alfabetico">A-Z</option>
            <option value="relevancia">Por relevancia</option>
          </select>
        </div>
      </div>

      {/* Contador y limpiar */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="bg-gray-100 px-2 py-1 rounded-full">
          {categoriasVisibles} de {totalCategorias} categorías
        </span>
        {(filtroTexto || ordenamiento !== 'alfabetico') && (
          <button
            onClick={onLimpiarFiltros}
            className="text-orange-600 hover:text-orange-800 font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  </div>
);

// 📊 COMPONENTE DE ESTADO DE PRECARGA
const PreloadStatus = ({ preloadStatus }) => {
  if (!preloadStatus?.loading) return null;

  return (
    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 rounded-lg py-1 px-3">
      <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
      <span>Precargando máquinas...</span>
    </div>
  );
};

// 🏷️ COMPONENTE PRINCIPAL
const BomberoMaquinaria = ({
  tipoSolicitante,
  onNext,
  onPrevious,
  userFaena,
  preloadStatus
}) => {
  const DEBUG = false;

  // Estados principales
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Estados de filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('alfabetico');

  // 🆕 CATEGORÍA ESPECIAL PARA ESTANQUE MÓVIL
  const CATEGORIA_ESTANQUE_MOVIL = useMemo(() => ({
    id: 'estanque_movil_11',
    nombre: 'Estanque Móvil',
    tipo_medicion: 'N/A',
    descripcion: 'Transferencia de combustible a estanque móvil',
    horas_mantencion: 0,
    isEstanqueMovil: true
  }), []);

  // ✅ CARGAR CATEGORÍAS
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setLoading(true);
        DEBUG && console.log('🎯 Cargando tipos de camión + Estanque Móvil');

        const categoriasData = await bomberoService.getCategoriasMaquinaria();
        const categoriasConEstanqueMovil = [CATEGORIA_ESTANQUE_MOVIL, ...categoriasData];

        setCategorias(categoriasConEstanqueMovil);
        DEBUG && console.log(`✅ ${categoriasConEstanqueMovil.length} tipos cargados`);
      } catch (err) {
        DEBUG && console.error('❌ Error cargando categorías:', err);
        setError('Error al cargar tipos de camión');
      } finally {
        setLoading(false);
      }
    };

    cargarCategorias();
  }, [CATEGORIA_ESTANQUE_MOVIL]);

  // ✅ MANEJAR SELECCIÓN DE CATEGORÍA
  const handleCategoriaSelect = useCallback(async (categoria) => {
    DEBUG && console.log('🏷️ Tipo seleccionado:', categoria);
    setCategoriaSeleccionada(categoria);

    // Verificar si es estanque móvil
    if (categoria.original.isEstanqueMovil || categoria.original.id === 'estanque_movil') {
      DEBUG && console.log('🚛 BIFURCACIÓN: Estanque Móvil - Flujo de transferencia');

      const categoriaEspecial = {
        ...categoria.original,
        tipoOperacion: 'transferencia_estanque_movil',
        descripcion: 'Transferencia de combustible de estanque fijo a móvil'
      };

      onNext(categoriaEspecial);
      return;
    }

    // Flujo normal con precarga opcional
    const yaEstandPrecargadas = bomberoService.todasLasMaquinasPrecargadas(tipoSolicitante, userFaena);

    if (!yaEstandPrecargadas) {
      DEBUG && console.log('⚠️ Iniciando precarga en background...');
      bomberoService.preloadMaquinas(tipoSolicitante, categoria.original.id, userFaena)
        .then(() => DEBUG && console.log('✅ Precarga completada'))
        .catch((error) => DEBUG && console.warn('⚠️ Error en precarga:', error));
    }

    onNext(categoria.original);
  }, [tipoSolicitante, userFaena, onNext]);

  // 🔍 FILTRAR Y ORDENAR CATEGORÍAS
  const categoriasFiltradas = useMemo(() => {
    let resultado = [...categorias];

    // Aplicar filtro de texto
    if (filtroTexto.trim()) {
      const texto = filtroTexto.toLowerCase();
      resultado = resultado.filter(categoria => {
        const nombre = (categoria.nombre_categoria || categoria.nombre || '').toLowerCase();
        const tipoMedicion = (categoria.tipo_medicion || '').toLowerCase();
        const descripcion = (categoria.descripcion || '').toLowerCase();

        return nombre.includes(texto) ||
          tipoMedicion.includes(texto) ||
          descripcion.includes(texto) ||
          (texto.includes('arrenda') && nombre.includes('arrenda'));
      });
    }

    // Aplicar ordenamiento
    switch (ordenamiento) {
      case 'alfabetico':
        resultado.sort((a, b) => {
          const nombreA = a.nombre_categoria || a.nombre || '';
          const nombreB = b.nombre_categoria || b.nombre || '';
          return nombreA.localeCompare(nombreB);
        });
        break;
      case 'relevancia':
        resultado.sort((a, b) => {
          if (a.isEstanqueMovil && !b.isEstanqueMovil) return -1;
          if (!a.isEstanqueMovil && b.isEstanqueMovil) return 1;
          const nombreA = a.nombre_categoria || a.nombre || '';
          const nombreB = b.nombre_categoria || b.nombre || '';
          return nombreA.localeCompare(nombreB);
        });
        break;
    }

    return resultado;
  }, [categorias, filtroTexto, ordenamiento]);

  // 🎨 FORMATEAR CATEGORÍAS PARA LA LISTA
  const categoriasFormateadas = useMemo(() => {
    return categoriasFiltradas.map(categoria => {
      // Formateo especial para estanque móvil
      if (categoria.isEstanqueMovil || categoria.id === 'estanque_movil') {
        return {
          id: categoria.id,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
          icon: <UniformIcon categoria={categoria} />,
          isSpecial: true,
          original: categoria
        };
      }

      // Formateo normal
      return {
        id: categoria.id_categoria || categoria.id,
        nombre: categoria.nombre_categoria || categoria.nombre,
        descripcion: `Medición: ${categoria.tipo_medicion || 'N/A'}`,
        icon: <UniformIcon categoria={categoria} />,
        original: {
          id: categoria.id_categoria || categoria.id,
          nombre: categoria.nombre_categoria || categoria.nombre,
          tipo_medicion: categoria.tipo_medicion,
          horas_mantencion: categoria.horas_mantencion,
          descripcion: `Medición: ${categoria.tipo_medicion || 'N/A'}`,
          isEstanqueMovil: categoria.isEstanqueMovil || false
        }
      };
    });
  }, [categoriasFiltradas]);

  // 🎨 UTILIDADES DE VISUALIZACIÓN
  const getTipoSolicitanteDisplay = useCallback(() => {
    if (tipoSolicitante === 'interno') {
      return <span className="text-blue-600 font-medium">Interno</span>;
    } else if (tipoSolicitante === 'externo') {
      return <span className="text-green-600 font-medium">Externo</span>;
    }
    return <span className="text-gray-600">No definido</span>;
  }, [tipoSolicitante]);

  const limpiarFiltros = useCallback(() => {
    setFiltroTexto('');
    setOrdenamiento('alfabetico');
  }, []);

  // 🎭 RENDERIZADO
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-6">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">

          {/* Header */}
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>

          {/* Título */}
          <div className="w-full flex justify-center items-center">
            <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg flex items-center">
              <FaCog className={`mr-2 text-orange-500 ${ICON_SIZE}`} />
              Selecciona el Tipo de Maquinaria para: {getTipoSolicitanteDisplay()}
            </h2>
          </div>

          {/* Información de estado */}
          <div className="flex flex-wrap gap-2 justify-center items-center text-xs">
            <div className="bg-blue-100 text-blue-800 rounded-lg py-1 px-3">
              Tipo: <span className="font-medium">{tipoSolicitante}</span>
            </div>
            <PreloadStatus preloadStatus={preloadStatus} />
          </div>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">

            <TabProgressBar activeTab="maquinaria" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col justify-center">

              {/* Componente de búsqueda */}
              <SearchSection
                filtroTexto={filtroTexto}
                setFiltroTexto={setFiltroTexto}
                ordenamiento={ordenamiento}
                setOrdenamiento={setOrdenamiento}
                totalCategorias={categorias.length}
                categoriasVisibles={categoriasFormateadas.length}
                onLimpiarFiltros={limpiarFiltros}
              />

              {/* Contenido principal */}
              {loading ? (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Cargando tipos de operación...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="py-4 text-red-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="mb-2">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-orange-500 hover:text-orange-700 font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ) : categoriasFormateadas.length > 0 ? (
                <>
                  <List
                    items={categoriasFormateadas}
                    onItemSelect={handleCategoriaSelect}
                    buttonStyle={true}
                    tipoElemento="tipo de operación"
                    showIcons={true}
                    specialItemStyles={{
                      specialBg: "bg-gradient-to-r from-green-50 to-emerald-50",
                      specialBorder: "border-green-300",
                      specialText: "text-green-800",
                      specialHover: "hover:from-green-100 hover:to-emerald-100"
                    }}
                  />

                  {/* Información de resultados */}
                  <div className="mt-2 text-center text-gray-500 text-xs">
                    {categoriasFormateadas.length} tipo{categoriasFormateadas.length !== 1 ? 's' : ''} de operación disponible{categoriasFormateadas.length !== 1 ? 's' : ''}
                    {preloadStatus?.loaded && (
                      <span className="text-green-600 ml-2">
                        • Máquinas precargadas para navegación instantánea
                      </span>
                    )}
                  </div>

                  {/* Mensaje de ayuda para filtros */}
                  {filtroTexto && categoriasFormateadas.length === 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      <p className="font-medium">💡 Tip de búsqueda:</p>
                      <p>Prueba con: "arrendada", "kilometraje", "horometro", "camion", "excavadora"</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>No hay tipos de operación disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controles de navegación */}
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
    </div>
  );
};

export default React.memo(BomberoMaquinaria);