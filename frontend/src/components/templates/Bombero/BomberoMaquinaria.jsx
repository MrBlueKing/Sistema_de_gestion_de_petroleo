import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../../organisms/Bombero/Header";
import StepHeader from "../../molecules/StepHeader";
import TabProgressBar from "../../molecules/TabProgressBar";
import List from "../../molecules/OptionsFormBombero";
import Button from "../../atoms/Button/Button";
import PageControl from "../../molecules/PageControl";
import {
  FaArrowLeft,
  FaCog,
  FaCheck,
  FaRocket,
  FaTruck,      // Para Dumper/Camiones
  FaCar,        // Para Camionetas
  FaShuttleVan, // Para vehículos medianos
  FaBus,        // Para vehículos grandes
  FaMotorcycle, // Para motos/vehículos pequeños
  FaTractor,    // Para maquinaria pesada
  FaTools,      // Para equipos de trabajo
  FaIndustry,   // Para maquinaria industrial
  FaGasPump     // Para Estanque Móvil
} from "react-icons/fa";
import bomberoService from "../../../context/bomberoService";

const BomberoMaquinaria = ({
  tipoSolicitante,
  onNext,
  onPrevious,
  userFaena,
  preloadStatus
}) => {
  const DEBUG = false; // o true si estás depurando
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // 🆕 CATEGORÍA ESPECIAL PARA ESTANQUE MÓVIL
  const CATEGORIA_ESTANQUE_MOVIL = {
    id: 'estanque_movil 11',
    nombre: 'Estanque Móvil',
    tipo_medicion: 'N/A',
    descripcion: 'Transferencia de combustible a estanque móvil',
    horas_mantencion: 0,
    isEstanqueMovil: true // Flag especial para identificar esta categoría
  };

  // 🎨 MAPEO DE ICONOS POR TIPO DE MEDICIÓN
  const getIconForCategory = useCallback((categoria) => {
    // 🆕 ICONO ESPECIAL PARA ESTANQUE MÓVIL
    if (categoria.isEstanqueMovil || categoria.id === 'estanque_movil') {
      return <FaGasPump className="text-green-600" />;
    }

    const tipoMedicion = categoria.tipo_medicion;

    // Mapeo específico por tipo de medición
    if (tipoMedicion === 'Horometro') {
      return <FaTruck className="text-orange-500" />;
    }
    if (tipoMedicion === 'Kilometraje') {
      return <FaTruck className="text-blue-500" />;
    }
    // 🏭 Para categorías sin tipo de medición definido (N/A)
    if (!tipoMedicion || tipoMedicion === 'N/A' || tipoMedicion === '') {
      return <FaIndustry className="text-slate-600" />;
    }

    // Icono por defecto
    return <FaCog className="text-gray-500" />;
  }, []);

  // ✅ CARGAR CATEGORÍAS DESDE CACHE + AGREGAR ESTANQUE MÓVIL
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setLoading(true);
        DEBUG && console.log('🎯 SOLO CACHE: Obteniendo tipos de camión + Estanque Móvil');

        const categoriasData = await bomberoService.getCategoriasMaquinaria();

        // 🆕 AGREGAR CATEGORÍA ESTANQUE MÓVIL AL INICIO DE LA LISTA
        const categoriasConEstanqueMovil = [CATEGORIA_ESTANQUE_MOVIL, ...categoriasData];

        setCategorias(categoriasConEstanqueMovil);

        DEBUG && console.log(`✅ SOLO CACHE: ${categoriasConEstanqueMovil.length} tipos de camión cargados (incluyendo Estanque Móvil)`);
      } catch (err) {
        DEBUG && console.error('❌ Error cargando categorías:', err);
        setError('Error al cargar tipos de camión');
      } finally {
        setLoading(false);
      }
    };

    cargarCategorias();
  }, []);

  // ✅ MANEJAR SELECCIÓN DE CATEGORÍA - BIFURCACIÓN MEJORADA
  const handleCategoriaSelect = useCallback(async (categoria) => {
    DEBUG && console.log('🏷️ Tipo de maquinaria seleccionado:', categoria);
    setCategoriaSeleccionada(categoria);

    // 🆕 VERIFICAR SI ES ESTANQUE MÓVIL PARA BIFURCACIÓN
    if (categoria.original.isEstanqueMovil || categoria.original.id === 'estanque_movil') {
      DEBUG && console.log('🚛 BIFURCACIÓN: Estanque Móvil seleccionado - Flujo de transferencia');

      // Marcar el tipo de operación especial
      const categoriaEspecial = {
        ...categoria.original,
        tipoOperacion: 'transferencia_estanque_movil',
        descripcion: 'Transferencia de combustible de estanque fijo a móvil'
      };

      // 🚀 AVANZAR INMEDIATAMENTE AL FLUJO DE TRANSFERENCIA
      onNext(categoriaEspecial);
      return;
    }

    // 🚀 FLUJO NORMAL: VERIFICAR SI LAS MÁQUINAS YA ESTÁN PRECARGADAS
    const yaEstandPrecargadas = bomberoService.todasLasMaquinasPrecargadas(tipoSolicitante, userFaena);

    if (yaEstandPrecargadas) {
      DEBUG && console.log('🎉 MÁQUINAS YA PRECARGADAS - Avance instantáneo sin delays');
    } else {
      DEBUG && console.log('⚠️ Máquinas no precargadas, iniciando precarga en background...');

      // Ejecutar en background sin await para no bloquear
      bomberoService.preloadMaquinas(tipoSolicitante, categoria.original.id, userFaena)
        .then(() => {
          DEBUG && console.log('✅ Máquinas específicas precargadas en background');
        })
        .catch((error) => {
          DEBUG && console.warn('⚠️ Error en precarga específica:', error);
        });
    }

    // 🚀 AVANZAR INMEDIATAMENTE (sin esperar nada)
    onNext(categoria.original);
  }, [tipoSolicitante, userFaena, onNext]);

  // 🎨 FORMATEAR CATEGORÍAS CON ICONOS BASADOS EN TIPO_MEDICION + ESTANQUE MÓVIL
  const categoriasFormateadas = useMemo(() => {
    return categorias.map(categoria => {
      // 🆕 FORMATEO ESPECIAL PARA ESTANQUE MÓVIL
      if (categoria.isEstanqueMovil || categoria.id === 'estanque_movil') {
        return {
          id: categoria.id,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
          icon: <FaGasPump className="text-green-600" />,
          isSpecial: true, // Marcar como especial para estilos diferentes
          original: categoria
        };
      }

      // FORMATEO NORMAL PARA OTRAS CATEGORÍAS
      return {
        id: categoria.id_categoria || categoria.id,
        nombre: categoria.nombre_categoria || categoria.nombre,
        descripcion: `Medición: ${categoria.tipo_medicion || 'N/A'}`,
        icon: getIconForCategory(categoria),
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
  }, [categorias, getIconForCategory]);

  // Función para obtener el texto del tipo de solicitante con color
  const getTipoSolicitanteDisplay = useCallback(() => {
    if (tipoSolicitante === 'interno') {
      return <span className="text-blue-600 font-medium">Interno</span>;
    } else if (tipoSolicitante === 'externo') {
      return <span className="text-green-600 font-medium">Externo</span>;
    }
    return <span className="text-gray-600">No definido</span>;
  }, [tipoSolicitante]);

  // 🆕 FUNCIÓN PARA MOSTRAR ESTADO DE PRECARGA MASIVA
  const getPreloadStatusDisplay = useCallback(() => {
    const estaCompleta = preloadStatus?.loaded;
    const estaCargando = preloadStatus?.loading;

    if (estaCargando) {
      return (
        <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 rounded-lg py-1 px-3">
          <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Precargando máquinas...</span>
        </div>
      );
    }
  }, [preloadStatus]);

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
              <FaCog className="mr-2 text-orange-500" />
              Selecciona el Tipo de Maquinaria para : {getTipoSolicitanteDisplay()}
            </h2>
          </div>

          {/* Información de estado - MEJORADA con estado de precarga */}
          <div className="flex flex-wrap gap-2 justify-center items-center text-xs">
            <div className="bg-blue-100 text-blue-800 rounded-lg py-1 px-3">
              Tipo: <span className="font-medium">{tipoSolicitante}</span>
            </div>

            {/* 🆕 MOSTRAR ESTADO DE PRECARGA DINÁMICO */}
            {getPreloadStatusDisplay()}

          </div>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">

            <TabProgressBar activeTab="maquinaria" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col justify-center">
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
                  {/* 🎨 LISTA CON ICONOS PERSONALIZADOS + ESTANQUE MÓVIL DESTACADO */}
                  <List
                    items={categoriasFormateadas}
                    onItemSelect={handleCategoriaSelect}
                    buttonStyle={true}
                    tipoElemento="tipo de operación"
                    showIcons={true}
                    specialItemStyles={{
                      // Estilos especiales para Estanque Móvil
                      specialBg: "bg-gradient-to-r from-green-50 to-emerald-50",
                      specialBorder: "border-green-300",
                      specialText: "text-green-800",
                      specialHover: "hover:from-green-100 hover:to-emerald-100"
                    }}
                  />

                  {/* Información de resultados MEJORADA */}
                  <div className="mt-2 text-center text-gray-500 text-xs">
                    {categoriasFormateadas.length} tipo{categoriasFormateadas.length !== 1 ? 's' : ''} de operación disponible{categoriasFormateadas.length !== 1 ? 's' : ''}
                    {preloadStatus?.loaded && (
                      <span className="text-green-600 ml-2">
                        • Máquinas precargadas para navegación instantánea
                      </span>
                    )}
                  </div>

                  {/* 🆕 NOTA INFORMATIVA SOBRE ESTANQUE MÓVIL
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                    <div className="flex items-start space-x-2">
                      <FaGasPump className="text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-medium mb-1">Transferencia a Estanque Móvil</p>
                        <p className="text-green-600">
                          Seleccione "Estanque Móvil" para realizar transferencias de combustible desde estanques fijos hacia estanques móviles (camiones cisterna).
                        </p>
                      </div>
                    </div>
                  </div> */}
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
    </div>
  );
};

export default React.memo(BomberoMaquinaria);