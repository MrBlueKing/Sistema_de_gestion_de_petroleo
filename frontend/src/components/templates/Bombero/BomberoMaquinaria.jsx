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
  FaIndustry    // Para maquinaria industrial
} from "react-icons/fa";
import bomberoService from "../../../context/bomberoService";

const BomberoMaquinaria = ({ 
  tipoSolicitante, 
  onNext, 
  onPrevious, 
  userFaena,
  preloadStatus 
}) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
 
  
    // ✅ CARGAR CATEGORÍAS DESDE CACHE
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setLoading(true);
        console.log('🎯 SOLO CACHE: Obteniendo tipos de camión');
        
        const categoriasData = await bomberoService.getCategoriasMaquinaria();
        setCategorias(categoriasData);
        
        console.log(`✅ SOLO CACHE: ${categoriasData.length} tipos de camión cargados sin requests adicionales`);
      } catch (err) {
        console.error('❌ Error cargando categorías:', err);
        setError('Error al cargar tipos de camión');
      } finally {
        setLoading(false);
      }
    };

    cargarCategorias();
  }, []);

  // ✅ MANEJAR SELECCIÓN DE CATEGORÍA - AVANCE INSTANTÁNEO MEJORADO
  const handleCategoriaSelect = useCallback(async (categoria) => {
    console.log('🏷️ Tipo de maquinaria seleccionado:', categoria);
    setCategoriaSeleccionada(categoria);
    
    // 🚀 VERIFICAR SI LAS MÁQUINAS YA ESTÁN PRECARGADAS
    const yaEstandPrecargadas = bomberoService.todasLasMaquinasPrecargadas(tipoSolicitante, userFaena);
    
    if (yaEstandPrecargadas) {
      console.log('🎉 MÁQUINAS YA PRECARGADAS - Avance instantáneo sin delays');
    } else {
      console.log('⚠️ Máquinas no precargadas, iniciando precarga en background...');
      
      // Ejecutar en background sin await para no bloquear
      bomberoService.preloadMaquinas(tipoSolicitante, categoria.original.id, userFaena)
        .then(() => {
          console.log('✅ Máquinas específicas precargadas en background');
        })
        .catch((error) => {
          console.warn('⚠️ Error en precarga específica:', error);
        });
    }
    
    // 🚀 AVANZAR INMEDIATAMENTE (sin esperar nada)
    onNext(categoria.original);
  }, [tipoSolicitante, userFaena, onNext]);

  // 🎨 FORMATEAR CATEGORÍAS CON ICONOS PERSONALIZADOS
  const categoriasFormateadas = useMemo(() => {
    return categorias.map(categoria => ({
      id: categoria.id_categoria,
      nombre: categoria.nombre_categoria,
      descripcion: categoria.tipo_medicion,
      tipo_elemento: categoria.tipo_medicion,
     
      original: {
        id: categoria.id_categoria,
        nombre: categoria.nombre_categoria,
        tipo_medicion: categoria.tipo_medicion,
        horas_mantencion: categoria.horas_mantencion,
        descripcion: `Medición: ${categoria.tipo_medicion}`
        

      }
    }));
  }, [categorias]);

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
              Selecciona el Tipo de maquina para: {getTipoSolicitanteDisplay()}
            </h2>
          </div>

      
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">
            
            <TabProgressBar activeTab="maquinaria" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col justify-center">
              {loading ? (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Cargando tipos de Maquinas...</p>
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
                  {/* 🎨 LISTA CON ICONOS PERSONALIZADOS */}
                  <List
                    items={categoriasFormateadas}
                    onItemSelect={handleCategoriaSelect}
                    buttonStyle={true}
                    tipoElemento= "maquinaria"
                                    
                  />
                  
                 
                </>
              ) : (
                <div className="py-4 text-gray-500 flex-grow flex items-center justify-center">
                  
                </div>
              )}
            </div>
          </div>



          {/* Controles de navegación */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />}
              textColor="orange-500"
            />

            <div className="flex-1 flex justify-center">
              <PageControl
                currentPage={2}
                totalPages={4}
                onPageChange={() => {}}
              />
            </div>

            <div className="w-5 h-5 md:w-6 md:h-6"></div>
          </div>

          {/* Ayuda - Mensaje mejorado */}
          <div className="bg-blue-50 text-blue-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm">
            <p className="flex items-center justify-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              <span className="inline-block">
                {preloadStatus?.loaded 
                  ? "Seleccione un tipo para navegación instantánea."
                  : "Seleccione un tipo de maquinaria para continuar."
                }
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(BomberoMaquinaria);