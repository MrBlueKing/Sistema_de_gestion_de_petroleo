import React, { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaCalculator,
  FaInfoCircle,
  FaRuler,
  FaCheck,
  FaGasPump,
  FaExclamationTriangle,
  FaArrowRight,
  FaQuestionCircle,
  FaWater,
  FaChartLine,
  FaClipboardCheck,
  FaOilCan,
  FaExclamationCircle,
} from "react-icons/fa";

// Componentes auxiliares
const InputNivel = ({
  value,
  onChange,
  label,
  placeholder,
  disabled,
  unidad = "cm",
}) => (
  <div className="mb-3">
    <label className="text-sm font-medium text-gray-700 block mb-1.5">
      {label}
    </label>
    <div className="relative group">
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border ${
          disabled ? "bg-gray-100" : "bg-white"
        } rounded-lg p-3 pr-14 text-base md:text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm ${
          !disabled && "group-hover:border-orange-300"
        } appearance-none`}
        style={{
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-gray-500 text-sm mr-1 font-medium">{unidad}</span>
        <FaRuler className="text-gray-400" />
      </div>
      <div className="absolute inset-0 border-2 border-transparent rounded-lg pointer-events-none transition-all group-hover:border-orange-200"></div>
    </div>
  </div>
);

// Componente para distribución de litros (más simple)
const InputLitros = ({
  value,
  onChange,
  placeholder,
  disabled,
  error,
}) => (
  <div className="mb-3">
    <label className="text-sm font-medium text-gray-700 block mb-1.5">
      Litros a Ingresar
    </label>
    <div className="relative group">
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min="0"
        step="0.01"
        className={`w-full border ${
          disabled ? "bg-gray-100" : "bg-white"
        } ${
          error ? "border-red-500 focus:border-red-500" : "border-gray-300"
        } rounded-lg p-3 pr-14 text-base md:text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm ${
          !disabled && "group-hover:border-orange-300"
        } appearance-none`}
        style={{
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-gray-500 text-sm mr-1 font-medium">L</span>
        <FaGasPump className="text-gray-400" />
      </div>
      {error && (
        <div className="absolute inset-0 border-2 border-red-300 rounded-lg pointer-events-none"></div>
      )}
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center">
        <FaExclamationCircle className="mr-1" />
        {error}
      </p>
    )}
  </div>
);

// Componente de notificación/alerta optimizado
const InfoBox = ({ type, message }) => (
  <div
    className={`p-4 rounded-lg mb-4 flex items-start ${
      type === "info"
        ? "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
        : type === "error"
        ? "bg-red-50 text-red-800 border-l-4 border-red-500"
        : type === "warning"
        ? "bg-amber-50 text-amber-800 border-l-4 border-amber-500"
        : "bg-green-50 text-green-800 border-l-4 border-green-500"
    }`}
  >
    <div className="flex-shrink-0 mr-3 mt-0.5">
      {type === "info" ? (
        <FaInfoCircle className="text-blue-600" size={20} />
      ) : type === "error" ? (
        <FaExclamationTriangle className="text-red-600" size={20} />
      ) : type === "warning" ? (
        <FaExclamationTriangle className="text-amber-600" size={20} />
      ) : (
        <FaCheck className="text-green-600" size={20} />
      )}
    </div>
    <div className="text-sm md:text-base">{message}</div>
  </div>
);

// Componente de tarjeta de estadísticas con diseño responsive
const StatCard = ({
  icon,
  title,
  value,
  colorClass,
  iconBgClass,
  unit = "litros",
}) => (
  <div
    className={`bg-white rounded-lg p-4 border shadow-sm hover:shadow transition-shadow ${colorClass}`}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4 ${iconBgClass}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-xs sm:text-sm text-gray-600 font-medium">{title}</p>
        <p className="font-bold text-base sm:text-lg text-gray-800 mt-0.5 flex items-baseline">
          {value}
          <span className="text-xs text-gray-500 ml-1 font-medium">{unit}</span>
        </p>
      </div>
    </div>
  </div>
);

const EstanquesModal = ({
  isOpen,
  onClose,
  estanques = [],
  alturasEstanques = {},
  handleAlturaChange,
  calcularLitrosPetroleo,
  modalAlert = { show: false, message: "", type: "" },
  capacidadDisponible = 0,
  litrosRecibidos = 0,
  // Nuevas props para distribución
  distribucionLitros = {},
  onDistribucionChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [resultadoCalculo, setResultadoCalculo] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const errorRef = useRef(null);
  const modalRef = useRef(null);

  // Estado para controlar el paso actual (inicial o final)
  const [paso, setPaso] = useState("inicial"); // 'inicial' o 'final'

  // Estado para controlar la visualización de la ayuda
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  // Estado local para la distribución si no se proporciona desde el padre
  const [distribucionLocal, setDistribucionLocal] = useState({});

  // Estado para errores de validación de distribución
  const [erroresDistribucion, setErroresDistribucion] = useState({});

  // Estado para controlar qué estanques tienen la info expandida (solo móvil)
  const [estanquesExpandidos, setEstanquesExpandidos] = useState({});

  // Estado para controlar si se muestran los consejos de medición en móvil
  const [mostrarConsejos, setMostrarConsejos] = useState(false);

  // Función para toggle del estado expandido
  const toggleEstanqueExpandido = (estanqueId) => {
    setEstanquesExpandidos(prev => ({
      ...prev,
      [estanqueId]: !prev[estanqueId]
    }));
  };

  // Detectar si el dispositivo es móvil basado en el ancho de pantalla
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setResultadoCalculo(null);
      setPaso("inicial");
      setMostrarAyuda(false);
      setErroresDistribucion({});
      setEstanquesExpandidos({});
      setMostrarConsejos(false);

      // Inicializar distribución local si no hay una externa
      if (!distribucionLitros || Object.keys(distribucionLitros).length === 0) {
        const distribucionInicial = {};
        estanques.forEach((estanque) => {
          distribucionInicial[estanque.id_estanque] = "";
        });
        setDistribucionLocal(distribucionInicial);
      }

      // Scroll al inicio cuando se abre el modal (para móviles)
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, estanques, distribucionLitros]);

  // Desplazamiento automático al error cuando aparece
  useEffect(() => {
    if (
      modalAlert &&
      modalAlert.show &&
      modalAlert.type === "error" &&
      errorRef.current
    ) {
      if (isMobile) {
        errorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [modalAlert, isMobile]);

  // Función para obtener la distribución actual (externa o local)
  const getDistribucionActual = () => {
    return distribucionLitros && Object.keys(distribucionLitros).length > 0
      ? distribucionLitros
      : distribucionLocal;
  };

  // Función para actualizar la distribución
  const actualizarDistribucion = (estanqueId, valor) => {
    const nuevaDistribucion = {
      ...getDistribucionActual(),
      [estanqueId]: valor,
    };

    if (onDistribucionChange) {
      onDistribucionChange(nuevaDistribucion);
    } else {
      setDistribucionLocal(nuevaDistribucion);
    }

    // Limpiar error específico del estanque
    if (erroresDistribucion[estanqueId]) {
      setErroresDistribucion(prev => ({
        ...prev,
        [estanqueId]: null
      }));
    }
  };

  // Función para calcular el total distribuido
  const getTotalDistribuido = () => {
    const distribucion = getDistribucionActual();
    return Object.values(distribucion).reduce((total, valor) => {
      const num = parseFloat(valor) || 0;
      return total + num;
    }, 0);
  };

  // Función para validar la distribución (opcional, solo si hay valores)
  const validarDistribucion = () => {
    const distribucion = getDistribucionActual();
    const valoresIngresados = Object.values(distribucion).filter(valor => valor && parseFloat(valor) > 0);
    
    // Si no hay valores ingresados, permitir continuar (distribución opcional)
    if (valoresIngresados.length === 0) {
      return true;
    }

    // Si hay valores, verificar que la suma no exceda los litros recibidos
    const totalDistribuido = getTotalDistribuido();
    return totalDistribuido <= litrosRecibidos;
  };

  // Verificar si se han ingresado todos los niveles iniciales
  const nivelesInicialesCompletos = () => {
    if (!Array.isArray(estanques) || estanques.length === 0) return false;

    return estanques.every((estanque) => {
      const alturas = alturasEstanques[estanque.id_estanque] || {};
      return alturas.inicial && alturas.inicial !== "";
    });
  };

  // Verificar si se han ingresado todos los niveles finales
  const nivelesFinalesCompletos = () => {
    if (!Array.isArray(estanques) || estanques.length === 0) return false;

    return estanques.every((estanque) => {
      const alturas = alturasEstanques[estanque.id_estanque] || {};
      return alturas.final && alturas.final !== "";
    });
  };

  // Avanzar al paso de niveles finales
  const avanzarANivelesFinales = () => {
    if (nivelesInicialesCompletos() && validarDistribucion()) {
      setPaso("final");
      if (isMobile && modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
    }
  };

  // Manejar el cálculo de diferencia
  const handleCalcular = async () => {
    if (!nivelesFinalesCompletos()) {
      console.log("Debe completar todos los niveles finales antes de calcular");
      return;
    }

    setLoading(true);
    try {
      const resultado = await calcularLitrosPetroleo();

      if (resultado) {
        setResultadoCalculo(resultado);

        if (isMobile && modalRef.current) {
          setTimeout(() => {
            modalRef.current.scrollTop = 0;
          }, 300);
        }
      }
    } catch (error) {
      console.error("Error al calcular los litros de petróleo:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(parseFloat(num))) {
      return "0,00";
    }
    return parseFloat(num).toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calcular el stock total del sistema
  const stockTotalSistema = Array.isArray(estanques)
    ? estanques.reduce((total, estanque) => {
        const stockActual =
          estanque.stock_actual !== undefined && estanque.stock_actual !== null
            ? parseFloat(estanque.stock_actual)
            : 0;
        return total + stockActual;
      }, 0)
    : 0;

  // Calcular el porcentaje de capacidad utilizada
  const getCapacidadPorcentaje = (estanque) => {
    if (!estanque || !estanque.capacidad) return 0;
    const stock = estanque.stock_actual || 0;
    return Math.min(100, Math.round((stock / estanque.capacidad) * 100));
  };

  // Determinar el paso actual basado en el estado
  const getCurrentStep = () => {
    if (resultadoCalculo) return 2; // Paso 3: Resultados
    if (paso === "final") return 1; // Paso 2: Niveles Finales
    return 0; // Paso 1: Niveles Iniciales
  };

  // Función para manejar el cierre del modal
  const handleModalClose = (passStockSistema = false) => {
    if (passStockSistema && typeof onClose === "function") {
      onClose(stockTotalSistema);
    } else if (typeof onClose === "function") {
      onClose();
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  const currentStep = getCurrentStep();
  const isResultadosStep = currentStep === 2;
  const totalDistribuido = getTotalDistribuido();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-transparent bg-opacity-60 backdrop-blur-sm flex items-start md:items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-full md:max-w-7xl max-h-[100vh] md:max-h-[90vh] flex flex-col animate-fadeInScale overflow-hidden"
        style={{ height: isMobile ? "100vh" : "auto" }}
      >
        {/* Encabezado del modal */}
        <div className="bg-orange-600 px-4 py-3 md:px-8 md:py-5 sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-white text-sm md:text-xl font-semibold tracking-tight truncate">
                {isResultadosStep
                  ? "Panel de Control de Combustible"
                  : paso === "inicial"
                  ? "Registro de Niveles Iniciales y Distribución"
                  : "Registro de Niveles Finales"}
              </h2>
              {!isResultadosStep && (
                <p className="text-orange-100 text-xs md:text-sm opacity-90 mt-1">
                  {paso === "inicial"
                    ? "Ingrese los litros y alturas iniciales de cada estanque"
                    : "Ingrese las alturas finales después de la recepción"}
                </p>
              )}
            </div>

            {/* Controles del header */}
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              {/* Tooltip de ayuda - Solo en desktop y pasos de medición */}
              {!isResultadosStep && !isMobile && (
                <div className="relative">
                  <button
                    onClick={() => setMostrarAyuda(!mostrarAyuda)}
                    onMouseEnter={() => setMostrarAyuda(true)}
                    className="text-white opacity-80 hover:opacity-100 focus:outline-none p-2 hover:bg-orange-700 rounded-lg transition-all"
                    aria-label="Ayuda"
                  >
                    <FaQuestionCircle size={16} />
                  </button>

                  {/* Tooltip flotante */}
                  {mostrarAyuda && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMostrarAyuda(false)}
                      />
                      <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                          <h4 className="font-medium text-orange-800 flex items-center text-sm">
                            <FaInfoCircle className="text-orange-600 mr-2" />
                            Cómo medir el nivel de combustible
                          </h4>
                        </div>
                        <div className="p-4 max-h-64 overflow-y-auto">
                          <div className="text-sm text-gray-700 space-y-2">
                            <p className="font-medium text-gray-800">
                              Siga estos pasos para una medición precisa:
                            </p>
                            <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                              <li>Localice la varilla calibrada del estanque</li>
                              <li>Asegúrese de que esté completamente seca</li>
                              <li>Inserte verticalmente hasta tocar el fondo</li>
                              <li>Retire y observe la marca del combustible</li>
                              <li>Mida la distancia en centímetros desde el fondo</li>
                            </ol>
                            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
                              <div className="flex">
                                <FaExclamationTriangle className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                                <p>
                                  Una diferencia de pocos milímetros puede representar cientos de litros en estanques grandes.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Indicador de progreso */}
              <div className="flex items-center space-x-1 md:space-x-2">
                {["1", "2", "3"].map((step, index) => {
                  const isActive = index <= currentStep;
                  const isCurrentStep = index === currentStep;

                  return (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <div
                          className={`h-0.5 w-2 md:w-4 rounded-full transition-colors ${
                            isActive
                              ? "bg-orange-200"
                              : "bg-orange-800 opacity-30"
                          }`}
                        />
                      )}
                      <div className="relative group">
                        <div
                          className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                            isActive
                              ? "bg-white text-orange-600"
                              : "bg-orange-800 text-orange-300 opacity-50"
                          } ${isCurrentStep ? "ring-2 ring-orange-200" : ""}`}
                        >
                          {isActive ? (
                            index < currentStep ? (
                              <FaCheck className="w-2 h-2 md:w-2.5 md:h-2.5" />
                            ) : (
                              step
                            )
                          ) : (
                            step
                          )}
                        </div>
                        {!isMobile && (
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-transparent bg-opacity-75 text-white text-xs rounded px-2 py-1 pointer-events-none">
                            {["Inicial", "Final", "Resultados"][index]}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={() => handleModalClose(false)}
                className="text-white opacity-80 hover:opacity-100 focus:outline-none p-1.5 md:p-2 hover:bg-orange-700 rounded-lg transition-all"
                aria-label="Cerrar"
              >
                <FaTimes size={isMobile ? 14 : 16} />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="overflow-y-auto flex-grow bg-gray-50 p-4 md:p-6">
          {/* Alertas */}
          {modalAlert && modalAlert.show && (
            <div ref={errorRef}>
              <InfoBox type={modalAlert.type} message={modalAlert.message} />
            </div>
          )}

          {/* DISEÑO PARA RESULTADOS */}
          {isResultadosStep && resultadoCalculo ? (
            <div className="space-y-4">
              {/* Dashboard Principal */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-3 space-y-4">
                  {/* Fila superior - Métricas clave */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Stock Sistema */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-3 md:p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">
                            Stock Sistema
                          </p>
                          <p className="text-lg md:text-2xl font-bold mt-1">
                            {formatNumber(stockTotalSistema)}
                          </p>
                          <p className="text-blue-200 text-xs">Litros totales</p>
                        </div>
                        <FaGasPump className="text-blue-200 text-xl md:text-2xl opacity-80" />
                      </div>
                    </div>

                    {/* Medición Inicial */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 md:p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                            Medición Inicial
                          </p>
                          <p className="text-lg md:text-2xl font-bold mt-1">
                            {formatNumber(resultadoCalculo.volInicial)}
                          </p>
                          <p className="text-orange-200 text-xs">Antes recepción</p>
                        </div>
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-400 rounded-full flex items-center justify-center">
                          <span className="text-orange-900 font-bold text-xs md:text-sm">1</span>
                        </div>
                      </div>
                    </div>

                    {/* Litros Guía */}
                    <div className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl p-3 md:p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">
                            Litros Según Guía
                          </p>
                          <p className="text-lg md:text-2xl font-bold mt-1">
                            {formatNumber(litrosRecibidos)}
                          </p>
                          <p className="text-amber-200 text-xs">Litros Guía</p>
                        </div>
                        <FaOilCan className="text-amber-200 text-xl md:text-2xl opacity-80" />
                      </div>
                    </div>

                    {/* Medición Final */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 md:p-4 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-xs font-medium uppercase tracking-wide">
                            Medición Final
                          </p>
                          <p className="text-lg md:text-2xl font-bold mt-1">
                            {formatNumber(resultadoCalculo.volFinal)}
                          </p>
                          <p className="text-green-200 text-xs">Después recepción</p>
                        </div>
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-green-400 rounded-full flex items-center justify-center">
                          <span className="text-green-900 font-bold text-xs md:text-sm">2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Análisis detallado */}
                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                      <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center">
                        <FaCalculator className="mr-2 text-orange-500" />
                        Detalles del Cálculo
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* Volúmenes medidos */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Volúmenes Inicial</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-600">Volumen inicial:</span>
                            <span className="font-semibold">
                              {formatNumber(resultadoCalculo.volInicial)} L
                            </span>
                          </div>
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-600">Litros según guía:</span>
                            <span className="font-semibold">
                              {formatNumber(litrosRecibidos)} L
                            </span>
                          </div>
                          <div className="flex justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                            <span className="text-blue-700 font-medium">Volumen esperado:</span>
                            <span className="font-bold text-blue-800">
                              {formatNumber(resultadoCalculo.volInicial + litrosRecibidos)} L
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cálculos derivados */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Volúmenes Finales</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-600">Volumen final:</span>
                            <span className="font-semibold">
                              {formatNumber(resultadoCalculo.volFinal)} L
                            </span>
                          </div>
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-600">Litros ingresados (medido):</span>
                            <span className="font-semibold">
                              {formatNumber(resultadoCalculo.volFinal - resultadoCalculo.volInicial)} L
                            </span>
                          </div>
                          <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-600">Diferencia:</span>
                            <span
                              className={`font-semibold flex items-center ${(() => {
                                const litrosMedidos = resultadoCalculo.volFinal - resultadoCalculo.volInicial;
                                const diferencia = litrosMedidos - litrosRecibidos;

                                if (Math.abs(diferencia) <= 0.5) {
                                  return "text-gray-600";
                                } else if (diferencia > 0) {
                                  return "text-green-600";
                                } else {
                                  return "text-red-600";
                                }
                              })()}`}
                            >
                              {(() => {
                                const litrosMedidos = resultadoCalculo.volFinal - resultadoCalculo.volInicial;
                                const diferencia = litrosMedidos - litrosRecibidos;
                                const esExcedente = diferencia > 0;

                                return (
                                  <>
                                    {Math.abs(diferencia) > 0.5 && (
                                      <span className="mr-1">
                                        {esExcedente ? "📈" : "📉"}
                                      </span>
                                    )}
                                    {formatNumber(Math.abs(diferencia))} L (
                                    {esExcedente ? "Excedente" : "Faltante"})
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Diseño original para pasos 1 y 2 */}
              {!resultadoCalculo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
                  <div className={`bg-white rounded-lg p-3 border shadow-sm hover:shadow transition-shadow border-orange-100`}>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 bg-orange-100`}>
                        <FaGasPump className="text-orange-600" size={isMobile ? 16 : 18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium">Stock Sistema</p>
                        <p className="font-bold text-sm md:text-base text-gray-800 mt-0.5 flex items-baseline">
                          {formatNumber(stockTotalSistema)}
                          <span className="text-xs text-gray-500 ml-1 font-medium">litros</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`bg-white rounded-lg p-3 border shadow-sm hover:shadow transition-shadow border-amber-100`}>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 bg-amber-100`}>
                        <FaOilCan className="text-amber-600" size={isMobile ? 16 : 18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium">Litros Guía</p>
                        <p className="font-bold text-sm md:text-base text-gray-800 mt-0.5 flex items-baseline">
                          {formatNumber(litrosRecibidos)}
                          <span className="text-xs text-gray-500 ml-1 font-medium">litros</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel de resumen de distribución - solo en paso inicial si hay distribución */}
              {paso === "inicial" && totalDistribuido > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-blue-800 font-semibold text-sm">Distribución Total</h3>
                      <p className="text-blue-600 text-xs">Litros asignados a estanques</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-900 font-bold text-lg">{formatNumber(totalDistribuido)} L</p>
                      <p className={`text-xs ${
                        Math.abs(totalDistribuido - litrosRecibidos) <= 0.01 
                          ? "text-green-600" 
                          : "text-amber-600"
                      }`}>
                        de {formatNumber(litrosRecibidos)} L
                      </p>
                    </div>
                  </div>
                  {Math.abs(totalDistribuido - litrosRecibidos) > 0.01 && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-100 rounded px-2 py-1">
                      ⚠️ La suma no coincide con los litros de la guía
                    </div>
                  )}
                </div>
              )}

              {/* Sección de ingreso de alturas */}
              {!isResultadosStep && (
                <>
                  {/* Ayuda móvil - Solo se muestra en móviles */}
                  {isMobile && (
                    <div className="mb-4">
                      <button
                        onClick={() => setMostrarConsejos(!mostrarConsejos)}
                        className="w-full bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <FaInfoCircle className="text-orange-600 mr-2 flex-shrink-0" size={16} />
                          <span className="text-sm font-medium text-orange-800">
                            Consejos de medición
                          </span>
                        </div>
                        <FaArrowRight 
                          className={`text-orange-600 transition-transform ${mostrarConsejos ? 'rotate-90' : ''}`} 
                          size={12} 
                        />
                      </button>
                      
                      {mostrarConsejos && (
                        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 border-t-0 rounded-t-none">
                          <div className="text-sm text-orange-800">
                            <p className="font-medium mb-2">Siga estos pasos para una medición precisa:</p>
                            <ol className="list-decimal pl-4 space-y-1 text-xs">
                              <li>Localice la varilla calibrada del estanque</li>
                              <li>Asegúrese de que esté completamente seca</li>
                              <li>Inserte verticalmente hasta tocar el fondo</li>
                              <li>Retire y observe la marca del combustible</li>
                              <li>Mida la distancia en centímetros desde el fondo</li>
                            </ol>
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800 text-xs">
                              <div className="flex">
                                <FaExclamationTriangle className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" size={12} />
                                <p>
                                  Una diferencia de pocos milímetros puede representar cientos de litros.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Estanques para el paso actual */}
                  <div className={`space-y-6 ${isMobile ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`}>
                    {Array.isArray(estanques) &&
                      estanques.map((estanque, index) => {
                        const alturas = alturasEstanques[estanque.id_estanque] || {};
                        const capacidadPorcentaje = getCapacidadPorcentaje(estanque);
                        const distribucion = getDistribucionActual();
                        const litrosAsignados = distribucion[estanque.id_estanque] || "";
                        const errorDistribucion = erroresDistribucion[estanque.id_estanque];

                        // Nueva paleta de colores con variaciones sutiles de naranja
                        const coloresEstanque = [
                          { bg: "from-orange-500 to-orange-600", solid: "bg-orange-500", border: "border-orange-300", text: "text-orange-50", darkText: "text-orange-800", light: "bg-orange-50", hex: "#F67029" },
                          { bg: "from-orange-400 to-orange-500", solid: "bg-orange-400", border: "border-orange-300", text: "text-orange-50", darkText: "text-orange-700", light: "bg-orange-50", hex: "#FF8C42" },
                          { bg: "from-orange-600 to-orange-700", solid: "bg-orange-600", border: "border-orange-400", text: "text-orange-50", darkText: "text-orange-800", light: "bg-orange-50", hex: "#E55D26" },
                          { bg: "from-amber-500 to-amber-600", solid: "bg-amber-500", border: "border-amber-300", text: "text-amber-50", darkText: "text-amber-800", light: "bg-amber-50", hex: "#F59E0B" },
                          { bg: "from-yellow-500 to-orange-500", solid: "bg-yellow-500", border: "border-yellow-300", text: "text-yellow-50", darkText: "text-yellow-800", light: "bg-yellow-50", hex: "#F97316" },
                          { bg: "from-red-500 to-orange-600", solid: "bg-red-500", border: "border-red-300", text: "text-red-50", darkText: "text-red-800", light: "bg-red-50", hex: "#EF4444" },
                        ];
                        
                        const colorEstanque = coloresEstanque[index % coloresEstanque.length];

                        return (
                          <div
                            key={estanque.id_estanque}
                            className={`bg-white border-2 ${colorEstanque.border} rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl transform hover:scale-[1.01] duration-200 ${isMobile ? 'mb-6' : 'h-full flex flex-col'}`}
                          >
                            {/* CABECERA ÚNICA CON COLOR DEL ESTANQUE */}
                            <div className={`bg-gradient-to-r ${colorEstanque.bg} ${isMobile ? 'p-3' : 'p-4'} relative overflow-hidden`}>
                              {/* Patrón sutil de fondo */}
                              <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-white transform -translate-x-16 -translate-y-16"></div>
                                <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-white transform translate-x-12 translate-y-12"></div>
                              </div>
                              
                              <div className="relative z-10">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center flex-1">
                                    <div className={`bg-white bg-opacity-20 ${isMobile ? 'p-2' : 'p-3'} rounded-xl mr-3`}>
                                      <FaGasPump className={`${colorEstanque.text} ${isMobile ? 'text-lg' : 'text-xl'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'} ${colorEstanque.text} truncate`}>
                                        {estanque.nombre}
                                      </h3>
                                      <div className={`${colorEstanque.text} opacity-80 ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>
                                        Estanque #{estanque.id_estanque} • {formatNumber(estanque.capacidad)} L
                                      </div>
                                    </div>
                                  </div>

                                 
                                                                 </div>

                              {/* Información del stock - siempre visible en móvil */}
                                <div className="space-y-2">
                                  {/* Información del stock expandible/fija según el dispositivo */}
                                  {(!isMobile || estanquesExpandidos[estanque.id_estanque]) && (
                                    <div className={`flex justify-between ${colorEstanque.text} opacity-90 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                      <span>Stock Actual</span>
                                      <span className="font-semibold">
                                        {formatNumber(estanque.stock_actual || 0)} L ({capacidadPorcentaje}%)
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Barra de progreso - siempre visible */}
                                  <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                                    <div
                                      className="h-3 bg-white rounded-full transition-all duration-500 shadow-sm"
                                      style={{ width: `${Math.min(100, capacidadPorcentaje)}%` }}
                                    ></div>
                                  </div>
                                  
                                  {/* Información condensada para móvil cuando está colapsado */}
                                  {isMobile && !estanquesExpandidos[estanque.id_estanque] && (
                                    <div className={`text-center ${colorEstanque.text} opacity-80 text-xs`}>
                                      {formatNumber(estanque.stock_actual || 0)} L • {capacidadPorcentaje}%
                                    </div>
                                  )}
                                </div>

                              
                              </div>
                            </div>

                            {/* CONTENIDO PRINCIPAL CON SECCIONES CLARAS */}
                            <div className={`p-6 ${!isMobile ? 'flex-1' : ''}`}>
                              
                              {/* SECCIÓN 1: DISTRIBUCIÓN DE COMBUSTIBLE (solo en paso inicial) */}
                              {paso === "inicial" && (
                                <>
                                  <div className="mb-6">
                                    <div className="flex items-center mb-4">
                                      <div className={`${colorEstanque.solid} p-2 rounded-lg mr-3`}>
                                        <FaGasPump className="text-white text-sm" />
                                      </div>
                                      <div>
                                        <h4 className={`font-semibold ${colorEstanque.darkText} text-base`}>
                                          Distribución de Combustible
                                        </h4>
                                        
                                      </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                      <InputLitros
                                        value={litrosAsignados}
                                        onChange={(e) => actualizarDistribucion(estanque.id_estanque, e.target.value)}
                                        placeholder="0.00"
                                        disabled={loading}
                                        error={errorDistribucion}
                                      />
                                      
                                     
                                    </div>
                                  </div>

                                  {/* SEPARADOR ELEGANTE */}
                                  <div className="mb-6">
                                    <div className="flex items-center">
                                      <div className="flex-grow border-t border-gray-300"></div>
                                      <div className="flex-shrink mx-4 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                                        <span className="text-gray-600 text-sm font-medium flex items-center">
                                          <FaRuler className="mr-2 text-gray-500" />
                                          MEDICIÓN DE ALTURA
                                        </span>
                                      </div>
                                      <div className="flex-grow border-t border-gray-300"></div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* SECCIÓN 2: MEDICIÓN DE ALTURA */}
                              <div>
                                <div className="flex items-center mb-4">
                                  <div className={`${colorEstanque.solid} p-2 rounded-lg mr-3`}>
                                    <FaRuler className="text-white text-sm" />
                                  </div>
                                  <div>
                                    <h4 className={`font-semibold ${colorEstanque.darkText} text-base`}>
                                      {paso === "inicial" ? "Altura Inicial" : "Altura Final"}
                                    </h4>
                                    <p className="text-gray-600 text-sm">
                                      {paso === "inicial" ? "Antes de la recepción" : "Después de la recepción"}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <InputNivel
                                    label=""
                                    value={
                                      paso === "inicial"
                                        ? alturas.inicial || ""
                                        : alturas.final || ""
                                    }
                                    onChange={(e) => {
                                      if (paso === "inicial") {
                                        handleAlturaChange(estanque.id_estanque, {
                                          inicial: e.target.value,
                                          final: alturas.final || "",
                                        });
                                      } else {
                                        handleAlturaChange(estanque.id_estanque, {
                                          inicial: alturas.inicial || "",
                                          final: e.target.value,
                                        });
                                      }
                                    }}
                                    placeholder="Ingrese altura en centímetros"
                                    disabled={loading}
                                  />
                                </div>
                              </div>

                              {/* INFORMACIÓN ADICIONAL EN PASO FINAL */}
                              {paso === "final" && litrosAsignados && (
                                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center">
                                    <div className={`${colorEstanque.solid} p-2 rounded-lg mr-3`}>
                                      <FaGasPump className="text-white text-sm" />
                                    </div>
                                    <div>
                                      <h6 className="font-semibold text-gray-800 text-sm">
                                        Combustible Asignado Previamente
                                      </h6>
                                      <p className={`${colorEstanque.darkText} font-bold text-lg`}>
                                        {formatNumber(litrosAsignados)} L
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Pie del modal */}
        <div className="border-t border-gray-200 px-4 py-3 md:px-8 md:py-5 flex justify-between items-center bg-white sticky bottom-0 z-10 shadow-lg">
          {isResultadosStep ? (
            // Botones para el paso de resultados
            <>
              <button
                onClick={() => {
                  setResultadoCalculo(null);
                  setPaso("final");
                }}
                className="px-3 py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all font-medium text-sm shadow-sm"
              >
                <span className="flex items-center">
                  <FaArrowRight className="mr-1 md:mr-2 transform rotate-180" size={isMobile ? 12 : 14} />
                  <span className="hidden sm:inline">Volver a Editar</span>
                  <span className="sm:hidden">Volver</span>
                </span>
              </button>
              <button
                onClick={() => handleModalClose(true)}
                className="flex items-center px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-white font-medium text-sm shadow-sm bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                <FaCheck className="mr-1 md:mr-2" size={isMobile ? 12 : 14} />
                <span>Confirmar</span>
              </button>
            </>
          ) : paso === "inicial" ? (
            // Botones para el paso inicial
            <>
              <button
                onClick={() => handleModalClose(false)}
                className="px-3 py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all font-medium text-sm shadow-sm"
              >
                Cancelar
              </button>

              <button
                onClick={avanzarANivelesFinales}
                disabled={!nivelesInicialesCompletos() || !validarDistribucion() || loading}
                className={`flex items-center px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-white font-medium text-sm shadow-sm transition-all ${
                  !nivelesInicialesCompletos() || !validarDistribucion() || loading
                    ? "bg-orange-400 cursor-not-allowed opacity-70"
                    : "bg-orange-600 hover:bg-orange-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 md:mr-3 h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="hidden sm:inline">Procesando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <FaArrowRight className="ml-1 md:ml-2" size={isMobile ? 12 : 14} />
                  </>
                )}
              </button>
            </>
          ) : (
            // Botones para el paso final
            <>
              <button
                onClick={() => setPaso("inicial")}
                className="px-3 py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all font-medium text-sm shadow-sm"
              >
                <span className="flex items-center">
                  <FaArrowRight className="mr-1 md:mr-2 transform rotate-180" size={isMobile ? 12 : 14} />
                  <span className="hidden sm:inline">Volver a Niveles Iniciales</span>
                  <span className="sm:hidden">Volver</span>
                </span>
              </button>

              <button
                onClick={handleCalcular}
                disabled={!nivelesFinalesCompletos() || loading}
                className={`flex items-center px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-white font-medium text-sm shadow-sm ${
                  loading || !nivelesFinalesCompletos()
                    ? "bg-orange-400 cursor-not-allowed opacity-70"
                    : "bg-orange-600 hover:bg-orange-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 md:mr-3 h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="hidden sm:inline">Calculando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <FaCalculator className="mr-1 md:mr-2" size={isMobile ? 12 : 14} />
                    <span className="hidden sm:inline">Calcular Diferencia</span>
                    <span className="sm:hidden">Calcular</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstanquesModal;