import React, { useState, useEffect, useCallback, useMemo } from "react";
import StepHeader from "../../molecules/StepHeader";
import TabProgressBar from "../../molecules/TabProgressBar";
import Button from "../../atoms/Button/Button";
import PageControl from "../../molecules/PageControl";
import { 
  FaArrowLeft, 
  FaGasPump, 
  FaTruck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSave,
  FaSpinner,
  FaInfoCircle,
  FaExchangeAlt,
  FaClipboardCheck,
  FaCalculator,
  FaLayerGroup,
  FaBalanceScale,
  FaBars,
  FaPlus,
  FaMinus
} from "react-icons/fa";
import { GiGasPump } from "react-icons/gi";
import bomberoService from "../../../context/bomberoService";

const BomberoTransferenciaEstanqueMovil = ({ 
  tipoSolicitante,
  solicitante, 
  categoriaSeleccionada,
  onPrevious, 
  onComplete,
  resetFlow,
  userInfo,
  idFaena,
  preloadedEstanques
}) => {
  // Estados para los numerales y cálculo automático
  const [numeralInicial, setNumeralInicial] = useState('');
  const [numeralFinal, setNumeralFinal] = useState('');
  const [litrosCalculados, setLitrosCalculados] = useState(0);

  // Estados para estanques
  const [estanqueDestino, setEstanqueDestino] = useState(null);
  const [modoMultipleOrigen, setModoMultipleOrigen] = useState(false);
  const [estanqueOrigenSimple, setEstanqueOrigenSimple] = useState(null);
  const [estanquesOrigenDisponibles, setEstanquesOrigenDisponibles] = useState([]);
  const [distribucionLitros, setDistribucionLitros] = useState({});
  const [estanquesDestinoDisponibles, setEstanquesDestinoDisponibles] = useState([]);
  
  // Estados para carga
  const [cargandoEstanques, setCargandoEstanques] = useState(false);

  // Estados para el formulario
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  // Cálculo automático de litros cuando cambian los numerales
  useEffect(() => {
    const inicial = parseFloat(numeralInicial) || 0;
    const final = parseFloat(numeralFinal) || 0;
    const calculados = final > inicial ? final - inicial : 0;
    setLitrosCalculados(calculados);
    
    console.log(`🧮 Litros calculados: ${calculados} (${final} - ${inicial})`);
  }, [numeralInicial, numeralFinal]);

  // Función para cargar estanques
  const cargarEstanques = useCallback(async () => {
    if (!idFaena || cargandoEstanques) return;

    setCargandoEstanques(true);
    try {
      console.log("🔄 Cargando estanques para transferencia...");

      const response = await bomberoService.getEstanques(idFaena);

      let estanques = [];
      if (response && response.estanques && Array.isArray(response.estanques)) {
        estanques = response.estanques;
      } else if (response && Array.isArray(response)) {
        estanques = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        estanques = response.data;
      }

      console.log("✅ Estanques procesados:", estanques);

      // Separar estanques por tipo
      const estanquesFijos = estanques.filter(e => e.tipo_estanque === "fijo" || !e.tipo_estanque);
      const estanquesMoviles = estanques.filter(e => e.tipo_estanque === "movil");

      setEstanquesOrigenDisponibles(estanquesFijos); // Solo fijos para origen
      setEstanquesDestinoDisponibles(estanquesMoviles); // Solo móviles para destino

      console.log("🏗️ Estanques origen (fijos):", estanquesFijos.length);
      console.log("🚛 Estanques destino (móviles):", estanquesMoviles.length);
      
    } catch (error) {
      console.error("❌ Error cargando estanques:", error);
      setEstanquesOrigenDisponibles([]);
      setEstanquesDestinoDisponibles([]);
    } finally {
      setCargandoEstanques(false);
    }
  }, [idFaena, cargandoEstanques]);

  // Cargar estanques al montar el componente
  useEffect(() => {
    if (idFaena && estanquesOrigenDisponibles.length === 0 && !cargandoEstanques) {
      cargarEstanques();
    }
  }, [idFaena, estanquesOrigenDisponibles.length, cargandoEstanques, cargarEstanques]);

  // Auto-activar modo múltiple si es necesario
  const stockTotalOrigenDisponible = estanquesOrigenDisponibles.reduce(
    (total, est) => total + (est.stock_actual || 0),
    0
  );
  const estanqueOrigenConStockSuficiente = estanquesOrigenDisponibles.find(
    (est) => (est.stock_actual || 0) >= litrosCalculados
  );
  const necesitaMultipleOrigen =
    litrosCalculados > 0 &&
    !estanqueOrigenConStockSuficiente &&
    stockTotalOrigenDisponible >= litrosCalculados;

  useEffect(() => {
    if (necesitaMultipleOrigen && !modoMultipleOrigen && litrosCalculados > 0) {
      console.log("🔄 Auto-activando modo múltiple origen");
      setModoMultipleOrigen(true);
      setEstanqueOrigenSimple(null);
      setDistribucionLitros({});
    }
  }, [necesitaMultipleOrigen, modoMultipleOrigen, litrosCalculados]);

  // Calcular capacidad disponible del destino
  const capacidadDisponibleDestino = useMemo(() => {
    if (!estanqueDestino) return 0;
    return Math.max(0, estanqueDestino.capacidad - estanqueDestino.stock_actual);
  }, [estanqueDestino]);

  // Calcular suma de distribución actual
  const litrosDistribuidos = Object.values(distribucionLitros).reduce(
    (total, litros) => total + (parseFloat(litros) || 0),
    0
  );
  const distribucionCompleta = Math.abs(litrosDistribuidos - litrosCalculados) < 0.01;
  const tieneEstanquesOrigenSeleccionados = Object.keys(distribucionLitros).some(
    (key) => (distribucionLitros[key] || 0) > 0
  );
  const stockSuficienteMultiOrigen = Object.keys(distribucionLitros).every(
    (estanqueId) => {
      const litrosAsignados = distribucionLitros[estanqueId] || 0;
      if (litrosAsignados === 0) return true;
      const estanque = estanquesOrigenDisponibles.find(
        (e) => e.id_estanque === parseInt(estanqueId)
      );
      return estanque && (estanque.stock_actual || 0) >= litrosAsignados;
    }
  );

  // Validaciones completas
  const validaciones = useMemo(() => {
    const numeralesValidos = parseFloat(numeralFinal) > parseFloat(numeralInicial) && 
                           numeralInicial !== '' && numeralFinal !== '';
    
    const stockSuficienteOrigen = modoMultipleOrigen ? 
      distribucionCompleta && stockSuficienteMultiOrigen :
      estanqueOrigenSimple && litrosCalculados <= (estanqueOrigenSimple.stock_actual || 0);

    const capacidadSuficienteDestino = litrosCalculados <= capacidadDisponibleDestino;

    return {
      numeralesValidos,
      litrosCalculadosValidos: litrosCalculados > 0,
      estanqueDestinoSeleccionado: !!estanqueDestino,
      estanqueOrigenSeleccionado: modoMultipleOrigen ? tieneEstanquesOrigenSeleccionados : !!estanqueOrigenSimple,
      stockSuficienteOrigen,
      capacidadSuficienteDestino,
      distribucionValida: modoMultipleOrigen ? distribucionCompleta : true,
      solicitanteValido: !!solicitante
    };
  }, [
    numeralInicial, 
    numeralFinal, 
    litrosCalculados, 
    estanqueDestino, 
    estanqueOrigenSimple, 
    modoMultipleOrigen,
    distribucionCompleta,
    stockSuficienteMultiOrigen,
    tieneEstanquesOrigenSeleccionados,
    capacidadDisponibleDestino,
    solicitante
  ]);

  // Verificar si el formulario está completo
  const formularioCompleto = useMemo(() => {
    return Object.values(validaciones).every(v => v === true);
  }, [validaciones]);

  // Función para obtener el texto del tipo de solicitante con color
  const getTipoSolicitanteDisplay = useCallback(() => {
    if (tipoSolicitante === 'interno') {
      return <span className="text-blue-600 font-medium">Interno</span>;
    } else if (tipoSolicitante === 'externo') {
      return <span className="text-green-600 font-medium">Externo</span>;
    }
    return <span className="text-gray-600">No definido</span>;
  }, [tipoSolicitante]);

  // Manejar cambio de numerales
  const handleNumeralChange = useCallback((tipo, valor) => {
    if (valor === '' || (!isNaN(valor) && parseFloat(valor) >= 0)) {
      if (tipo === 'inicial') {
        setNumeralInicial(valor);
      } else {
        setNumeralFinal(valor);
      }
    }
  }, []);

  // Toggle modo múltiple origen
  const toggleModoMultipleOrigen = useCallback((activar) => {
    console.log("🔄 Cambiando modo múltiple origen a:", activar);
    setModoMultipleOrigen(activar);
    if (activar) {
      setEstanqueOrigenSimple(null);
      setDistribucionLitros({});
    } else {
      setDistribucionLitros({});
    }
  }, []);

  // Manejar distribución de litros
  const handleDistribucionChange = useCallback((estanqueId, valor) => {
    const estanque = estanquesOrigenDisponibles.find(e => e.id_estanque == estanqueId);
    const maxPermitido = Math.min(estanque?.stock_actual || 0, litrosCalculados);
    
    if (valor === '' || (!isNaN(valor) && parseFloat(valor) >= 0 && parseFloat(valor) <= maxPermitido)) {
      setDistribucionLitros(prev => ({
        ...prev,
        [estanqueId]: parseFloat(valor) || 0
      }));
    }
  }, [estanquesOrigenDisponibles, litrosCalculados]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async () => {
    setShowValidation(true);
    
    if (!formularioCompleto) {
      console.warn('⚠️ Formulario incompleto');
      return;
    }

    setIsSaving(true);
    setHasError(false);
    setErrorMessage('');

    try {
      console.log('📤 Enviando transferencia de estanque móvil...');

      const transferData = {
        tipo_solicitante: tipoSolicitante,
        id_dotacion: solicitante?.rut || solicitante?.id,
        categoria: categoriaSeleccionada,
        tipo_operacion: 'estanque_movil',
        
        // Datos de numerales y cálculos
        numeral_inicial: parseFloat(numeralInicial),
        numeral_final: parseFloat(numeralFinal),
        litros_calculados: litrosCalculados,
        
        // Datos de estanques
        estanque_destino: estanqueDestino.id_estanque,
        modo_multiple_origen: modoMultipleOrigen,
        
        // Datos de origen según modo
        ...(modoMultipleOrigen ? {
          estanques_origen: Object.keys(distribucionLitros)
            .filter(id => distribucionLitros[id] > 0)
            .map(id => parseInt(id)),
          distribucion_litros: distribucionLitros
        } : {
          estanque_origen: estanqueOrigenSimple.id_estanque,
          litros_transferir: litrosCalculados
        }),
        
        observaciones: observaciones.trim(),
        id_faena: idFaena,
        fecha_transferencia: new Date().toISOString(),
        
        // Información adicional para auditoría
        capacidad_disponible_destino: capacidadDisponibleDestino,
        stock_total_origen: stockTotalOrigenDisponible
      };

      console.log('📋 Datos de transferencia:', transferData);

      // Simular API call (reemplazar con tu endpoint real)
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Transferencia registrada exitosamente');
      setIsSaved(true);
      
      // Completar el flujo después de un breve delay
      setTimeout(() => {
        onComplete(transferData);
      }, 1500);

    } catch (error) {
      console.error('❌ Error registrando transferencia:', error);
      setHasError(true);
      setErrorMessage(error.response?.data?.message || 'Error al registrar la transferencia');
    } finally {
      setIsSaving(false);
    }
  }, [
    formularioCompleto, 
    tipoSolicitante, 
    solicitante, 
    categoriaSeleccionada, 
    numeralInicial,
    numeralFinal,
    litrosCalculados,
    estanqueDestino,
    modoMultipleOrigen,
    estanqueOrigenSimple,
    distribucionLitros,
    observaciones, 
    idFaena, 
    capacidadDisponibleDestino,
    stockTotalOrigenDisponible,
    onComplete
  ]);

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Función para obtener color de barra de progreso
  const getColorBarra = (nivel) => {
    if (nivel < 20) return "bg-red-500";
    if (nivel < 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-6">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="w-full">
            <StepHeader text="Transferencia Estanque Móvil" />
          </div>

          {/* Título */}
          <div className="w-full flex justify-center items-center">
            <h2 className="text-gray-700 font-medium text-sm sm:text-base md:text-lg flex items-center">
              <FaExchangeAlt className="mr-2 text-green-600" />
              Transferencia de Combustible para: {getTipoSolicitanteDisplay()}
            </h2>
          </div>

          {/* Información de contexto */}
          <div className="flex flex-wrap gap-2 justify-center items-center text-xs">
            <div className="bg-blue-100 text-blue-800 rounded-lg py-1 px-3">
              Solicitante: <span className="font-medium">{solicitante?.nombre || 'N/A'}</span>
            </div>
            <div className="bg-green-100 text-green-800 rounded-lg py-1 px-3">
              <FaGasPump className="inline mr-1" />
              Operación: Estanque Móvil
            </div>
            <div className="bg-purple-100 text-purple-800 rounded-lg py-1 px-3">
              Fecha: {formatDate(new Date())}
            </div>
            {litrosCalculados > 0 && (
              <div className="bg-orange-100 text-orange-800 rounded-lg py-1 px-3">
                <FaCalculator className="inline mr-1" />
                {litrosCalculados.toLocaleString()} L
              </div>
            )}
          </div>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[700px] md:min-h-[800px] flex flex-col">
            
            <TabProgressBar activeTab="transferencia" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              
              {/* Mensajes de estado */}
              {hasError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded flex items-start">
                  <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}

              {isSaved && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded flex items-start">
                  <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">Transferencia registrada correctamente</span>
                </div>
              )}

              {/* Grid layout para mostrar todo el contenido */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* COLUMNA IZQUIERDA: Datos de transferencia y destino */}
                <div className="space-y-4">
                  
                  {/* Datos de transferencia */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="mb-3">
                      <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
                        <GiGasPump className="text-gray-600 mr-2" />
                        Datos de transferencia
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Ingrese los datos que muestra la bomba después de la transferencia
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Fecha como campo de solo lectura */}
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                          Fecha y Hora de Registro
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-left text-sm text-gray-700 font-medium">
                          {formatDate(new Date())}
                        </div>
                      </div>

                      {/* Numeral Inicial */}
                      <div className="col-span-1">
                        <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                          Numeral Inicial <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={numeralInicial}
                          onChange={(e) => handleNumeralChange('inicial', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                            showValidation && !validaciones.numeralesValidos ? "border-red-500 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="Ej: 100.5"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Numeral Final */}
                      <div className="col-span-1">
                        <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                          Numeral Final <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={numeralFinal}
                          onChange={(e) => handleNumeralChange('final', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                            showValidation && !validaciones.numeralesValidos ? "border-red-500 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="Ej: 150.5"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Litros Calculados */}
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                          Litros a Transferir
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={litrosCalculados}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium cursor-not-allowed"
                            placeholder="Se calcula automáticamente"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">L</span>
                          </div>
                        </div>
                        <p className="text-left text-xs text-gray-500 mt-1">
                          Calculado automáticamente: Numeral Final - Numeral Inicial = {litrosCalculados}
                        </p>
                      </div>
                    </div>

                    {showValidation && !validaciones.numeralesValidos && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        El numeral final debe ser mayor que el inicial
                      </p>
                    )}
                  </div>

                  {/* Estanque Destino (móvil) */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="mb-3">
                      <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
                        <FaTruck className="text-green-600 mr-2" />
                        Estanque destino (móvil)
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Elija el estanque móvil que recibirá el combustible
                      </p>
                    </div>
                    
                    {/* Selector de estanque destino */}
                    {cargandoEstanques ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Cargando estanques móviles...</p>
                      </div>
                    ) : estanquesDestinoDisponibles.length === 0 ? (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
                        <FaInfoCircle className="inline mr-2" />
                        No hay estanques móviles disponibles en esta faena
                      </div>
                    ) : (
                      <div className="grid gap-3 grid-cols-1">
                        {estanquesDestinoDisponibles.map((estanque) => {
                          const stockActual = estanque.stock_actual || 0;
                          const capacidad = estanque.capacidad || 1000;
                          const porcentaje = Math.min(Math.round((stockActual / capacidad) * 100), 100);
                          const capacidadLibre = capacidad - stockActual;
                          const puedeRecibir = litrosCalculados <= capacidadLibre;
                          const esSeleccionado = estanqueDestino?.id_estanque === estanque.id_estanque;

                          return (
                            <div
                              key={estanque.id_estanque}
                              onClick={() => setEstanqueDestino(estanque)}
                              className={`cursor-pointer border rounded-lg overflow-hidden transition-all duration-200 ${
                                esSeleccionado
                                  ? "border-green-500 bg-green-50 shadow-md"
                                  : puedeRecibir
                                  ? "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                                  : "border-red-200 bg-red-50 opacity-75"
                              }`}
                            >
                              <div className="p-3 border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <h3 className="font-medium text-gray-800">{estanque.nombre}</h3>
                                    <FaTruck className="ml-2 text-amber-600" size={12} />
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    porcentaje < 20 ? "bg-red-100 text-red-800" :
                                    porcentaje < 50 ? "bg-yellow-100 text-yellow-800" :
                                    "bg-green-100 text-green-800"
                                  }`}>
                                    {porcentaje}%
                                  </span>
                                </div>
                              </div>

                              <div className="p-3">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-600">Capacidad: {capacidad.toLocaleString()} L</span>
                                  <span className="font-medium">{stockActual.toLocaleString()} L actuales</span>
                                </div>

                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-600">Disponible:</span>
                                  <span className={`font-medium ${puedeRecibir ? 'text-green-600' : 'text-red-600'}`}>
                                    {capacidadLibre.toLocaleString()} L
                                  </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div
                                    className={`h-2 rounded-full ${getColorBarra(porcentaje)}`}
                                    style={{ width: `${porcentaje}%` }}
                                  ></div>
                                </div>

                                {esSeleccionado && (
                                  <div className="text-xs text-green-600 flex items-center">
                                    <FaCheckCircle className="mr-1" />
                                    Seleccionado como destino
                                  </div>
                                )}

                                {!puedeRecibir && litrosCalculados > 0 && (
                                  <div className="text-xs text-red-600 flex items-center">
                                    <FaExclamationTriangle className="mr-1" />
                                    Capacidad insuficiente
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {showValidation && !validaciones.estanqueDestinoSeleccionado && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        Debe seleccionar un estanque de destino
                      </p>
                    )}

                    {showValidation && !validaciones.capacidadSuficienteDestino && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        El estanque destino no tiene capacidad suficiente
                      </p>
                    )}
                  </div>
                </div>

                {/* COLUMNA DERECHA: Estanques Origen */}
                <div className="space-y-4">
                  
                  {/* Estanques Origen (fijos) */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="mb-3">
                      <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
                        <FaGasPump className="text-blue-600 mr-2" />
                        Estanque(s) origen (fijos)
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {modoMultipleOrigen
                          ? "Configure múltiples estanques para completar la transferencia requerida"
                          : "Elija el estanque fijo del cual extraerá el combustible"}
                      </p>
                    </div>

                    {/* Alerta de stock insuficiente */}
                    {necesitaMultipleOrigen && (
                      <div className="mb-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 rounded">
                        <div className="flex items-start">
                          <FaExclamationTriangle className="text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium">Stock insuficiente en estanques individuales</p>
                            <p>
                              Se requieren {litrosCalculados.toLocaleString()}L. 
                              Ningún estanque individual tiene suficiente stock. Use múltiples estanques para completar la transferencia.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Toggle de modo */}
                    <div className="mb-4 flex items-center justify-between bg-white p-3 rounded border">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Modo de extracción</label>
                        <p className="text-xs text-gray-500">
                          {modoMultipleOrigen
                            ? "Extracción desde múltiples estanques origen"
                            : "Extracción desde un solo estanque origen"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleModoMultipleOrigen(false)}
                          disabled={necesitaMultipleOrigen}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            !modoMultipleOrigen
                              ? "bg-blue-600 text-white"
                              : necesitaMultipleOrigen
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          Simple
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleModoMultipleOrigen(true)}
                          className={`px-3 py-1 text-xs rounded transition-colors flex items-center ${
                            modoMultipleOrigen
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          <FaLayerGroup className="mr-1" />
                          Múltiple
                        </button>
                      </div>
                    </div>

                    {/* Contenido según modo */}
                    {cargandoEstanques ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Cargando estanques origen...</p>
                      </div>
                    ) : estanquesOrigenDisponibles.length === 0 ? (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
                        <FaInfoCircle className="inline mr-2" />
                        No hay estanques fijos disponibles en esta faena
                      </div>
                    ) : (
                      <>
                        {/* MODO SIMPLE */}
                        {!modoMultipleOrigen && (
                          <div className="grid gap-3 grid-cols-1">
                            {estanquesOrigenDisponibles.map((estanque) => {
                              const stockActual = estanque.stock_actual || 0;
                              const capacidad = estanque.capacidad || 1000;
                              const porcentaje = Math.min(Math.round((stockActual / capacidad) * 100), 100);
                              const tieneStock = stockActual >= litrosCalculados;
                              const esSeleccionado = estanqueOrigenSimple?.id_estanque === estanque.id_estanque;

                              return (
                                <div
                                  key={estanque.id_estanque}
                                  onClick={() => setEstanqueOrigenSimple(estanque)}
                                  className={`cursor-pointer border rounded-lg overflow-hidden transition-all duration-200 ${
                                    esSeleccionado
                                      ? "border-blue-500 bg-blue-50 shadow-md"
                                      : tieneStock
                                      ? "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                                      : "border-orange-200 bg-orange-50"
                                  }`}
                                >
                                  <div className="p-3 border-b bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <h3 className="font-medium text-gray-800">{estanque.nombre}</h3>
                                        <FaGasPump className="ml-2 text-blue-600" size={12} />
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        porcentaje < 20 ? "bg-red-100 text-red-800" :
                                        porcentaje < 50 ? "bg-yellow-100 text-yellow-800" :
                                        "bg-green-100 text-green-800"
                                      }`}>
                                        {porcentaje}%
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-3">
                                    <div className="flex justify-between text-sm mb-2">
                                      <span className="text-gray-600">Capacidad: {capacidad.toLocaleString()} L</span>
                                      <span className="font-medium">{stockActual.toLocaleString()} L disponibles</span>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                      <div
                                        className={`h-2 rounded-full ${getColorBarra(porcentaje)}`}
                                        style={{ width: `${porcentaje}%` }}
                                      ></div>
                                    </div>

                                    {esSeleccionado && (
                                      <div className="text-xs text-blue-600 flex items-center">
                                        <FaCheckCircle className="mr-1" />
                                        Seleccionado como origen
                                      </div>
                                    )}

                                    {!tieneStock && litrosCalculados > 0 && (
                                      <div className="text-xs text-orange-600 flex items-center">
                                        <FaExclamationTriangle className="mr-1" />
                                        Stock insuficiente. Considere modo múltiple.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* MODO MÚLTIPLE */}
                        {modoMultipleOrigen && (
                          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                            {/* Header */}
                            <div className="p-3 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                              <h3 className="font-medium text-gray-800 flex items-center">
                                <FaGasPump className="text-orange-500 mr-2" />
                                Distribución de Extracción
                              </h3>
                              <div className="text-xs text-gray-500">
                                {estanquesOrigenDisponibles.length} estanque{estanquesOrigenDisponibles.length !== 1 ? 's' : ''} disponible{estanquesOrigenDisponibles.length !== 1 ? 's' : ''}
                              </div>
                            </div>

                            {/* Lista de estanques con inputs */}
                            <div className="max-h-[400px] overflow-y-auto p-3 space-y-3">
                              {estanquesOrigenDisponibles.map((estanque) => {
                                const litrosAsignados = distribucionLitros[estanque.id_estanque] || 0;
                                const stockActual = estanque.stock_actual || 0;
                                const capacidad = estanque.capacidad || 1000;
                                const porcentaje = Math.min(Math.round((stockActual / capacidad) * 100), 100);
                                const excedeStock = litrosAsignados > stockActual;
                                const tieneAsignacion = litrosAsignados > 0;

                                return (
                                  <div
                                    key={estanque.id_estanque}
                                    className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                                      tieneAsignacion
                                        ? "border-orange-500 bg-orange-50 shadow-md"
                                        : "border-gray-200 bg-white"
                                    }`}
                                  >
                                    <div className="p-3 border-b bg-gray-50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <h3 className="font-medium text-gray-800">{estanque.nombre}</h3>
                                          <FaGasPump className="ml-2 text-blue-600" size={12} />
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          porcentaje < 20 ? "bg-red-100 text-red-800" :
                                          porcentaje < 50 ? "bg-yellow-100 text-yellow-800" :
                                          "bg-green-100 text-green-800"
                                        }`}>
                                          {porcentaje}%
                                        </span>
                                      </div>
                                    </div>

                                    <div className="p-3">
                                      <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600">Capacidad: {capacidad.toLocaleString()} L</span>
                                        <span className="font-medium">{stockActual.toLocaleString()} L disponibles</span>
                                      </div>

                                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div
                                          className={`h-2 rounded-full ${getColorBarra(porcentaje)}`}
                                          style={{ width: `${porcentaje}%` }}
                                        ></div>
                                      </div>

                                      {porcentaje < 20 && (
                                        <div className="mb-3 text-xs text-red-600 flex items-center">
                                          <FaExclamationTriangle className="mr-1" />
                                          <span>Nivel crítico</span>
                                        </div>
                                      )}

                                      {/* Input para litros a extraer */}
                                      <div className="mt-3 pt-3 border-t border-gray-100">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Litros a extraer:
                                        </label>
                                        <div className="relative">
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={stockActual}
                                            value={litrosAsignados || ""}
                                            onChange={(e) => handleDistribucionChange(estanque.id_estanque, e.target.value)}
                                            className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                              excedeStock ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                                            }`}
                                            placeholder="0.00"
                                            disabled={isSaving}
                                          />
                                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-xs">L</span>
                                          </div>
                                        </div>

                                        {excedeStock && (
                                          <p className="text-xs text-red-600 mt-1">
                                            Excede stock disponible
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Resumen */}
                            {litrosCalculados > 0 && (
                              <div className="p-3 border-t border-gray-200 bg-gray-50">
                                <div className="text-sm text-center">
                                  <span className="text-gray-700">Total distribuido: </span>
                                  <span className={`font-medium ${
                                    distribucionCompleta ? "text-green-600" : "text-red-600"
                                  }`}>
                                    {litrosDistribuidos.toLocaleString()}/{litrosCalculados.toLocaleString()}L
                                  </span>
                                  {distribucionCompleta && (
                                    <FaCheckCircle className="inline ml-1 text-green-600" />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Validaciones origen */}
                    {showValidation && !validaciones.estanqueOrigenSeleccionado && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        Debe seleccionar al menos un estanque de origen
                      </p>
                    )}

                    {showValidation && !validaciones.stockSuficienteOrigen && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        Stock insuficiente en el/los estanque(s) de origen
                      </p>
                    )}

                    {showValidation && !validaciones.distribucionValida && modoMultipleOrigen && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        La distribución debe sumar exactamente {litrosCalculados.toLocaleString()} L
                      </p>
                    )}
                  </div>

                  {/* Resumen final */}
                  {validaciones.numeralesValidos && validaciones.litrosCalculadosValidos && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center mb-3">
                        <FaCheckCircle className="text-green-600 mr-2" />
                        Resumen de la transferencia
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Cantidad:</span>
                          <span className="text-gray-600">{litrosCalculados.toLocaleString()} litros</span>
                        </div>
                        
                        {estanqueDestino && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Destino (móvil):</span>
                            <span className="text-gray-600">{estanqueDestino.nombre}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Origen (fijo):</span>
                          <span className="text-gray-600">
                            {modoMultipleOrigen ? 
                              `${Object.values(distribucionLitros).filter(v => v > 0).length} estanque(s) múltiples` : 
                              estanqueOrigenSimple?.nombre || 'No seleccionado'
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Modo:</span>
                          <span className="text-gray-600">
                            {modoMultipleOrigen ? 'Distribución múltiple' : 'Estanque único'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OBSERVACIONES - MOVIDO AL FINAL */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-6">
                <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center mb-3">
                  <FaClipboardCheck className="text-yellow-600 mr-2" />
                  Observaciones (opcional)
                </h3>
                
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Observaciones sobre la transferencia (opcional)"
                  rows="3"
                  disabled={isSaving}
                ></textarea>
              </div>

              {/* Botón de guardar */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || isSaved || !formularioCompleto}
                  className={`w-full px-6 py-3 rounded-lg flex items-center justify-center transition-colors text-lg font-medium ${
                    isSaved
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  } ${
                    isSaving || isSaved || !formularioCompleto
                      ? "opacity-80 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isSaving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      <span>Registrando Transferencia...</span>
                    </>
                  ) : isSaved ? (
                    <>
                      <FaCheckCircle className="mr-2" />
                      <span>Transferencia Registrada</span>
                    </>
                  ) : modoMultipleOrigen ? (
                    !tieneEstanquesOrigenSeleccionados ? (
                      <>
                        <FaLayerGroup className="mr-2" />
                        <span>Asigne litros a los estanques origen</span>
                      </>
                    ) : !distribucionCompleta ? (
                      <>
                        <FaBalanceScale className="mr-2" />
                        <span>Complete la distribución de litros</span>
                      </>
                    ) : !stockSuficienteMultiOrigen ? (
                      <>
                        <FaExclamationTriangle className="mr-2" />
                        <span>Stock insuficiente en algunos estanques</span>
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        <span>Registrar Transferencia Multi-Origen</span>
                      </>
                    )
                  ) : !estanqueDestino ? (
                    <>
                      <FaTruck className="mr-2" />
                      <span>Seleccione estanque destino primero</span>
                    </>
                  ) : !estanqueOrigenSimple ? (
                    <>
                      <FaGasPump className="mr-2" />
                      <span>Seleccione estanque origen</span>
                    </>
                  ) : !validaciones.capacidadSuficienteDestino ? (
                    <>
                      <FaExclamationTriangle className="mr-2" />
                      <span>Capacidad insuficiente en destino</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      <span>Registrar Transferencia</span>
                    </>
                  )}
                </button>

                {/* Ayuda adicional */}
                {modoMultipleOrigen ? (
                  <div className="mt-3 text-sm text-gray-500 text-center">
                    <p>
                      {!tieneEstanquesOrigenSeleccionados && "• Asigne litros a extraer de cada estanque origen"}
                      {tieneEstanquesOrigenSeleccionados && !distribucionCompleta && 
                        `• Faltan ${(litrosCalculados - litrosDistribuidos).toFixed(2)}L por distribuir`}
                      {tieneEstanquesOrigenSeleccionados && distribucionCompleta && stockSuficienteMultiOrigen && 
                        "✓ Transferencia multi-origen configurada correctamente"}
                    </p>
                  </div>
                ) : (
                  showValidation && !formularioCompleto && (
                    <p className="text-sm text-red-500 mt-3 text-center">
                      Complete todos los campos requeridos para continuar
                    </p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Controles de navegación */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />}
              textColor="orange-500"
              disabled={isSaving}
            />

            <div className="flex-1 flex justify-center">
              <PageControl
                currentPage={3}
                totalPages={3}
                onPageChange={() => {}}
              />
            </div>

            <div className="w-5 h-5 md:w-6 md:h-6"></div>
          </div>

          {/* Ayuda específica para transferencia */}
          <div className="bg-green-50 text-green-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-2xl">
            <p className="flex items-center justify-center">
              <FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="inline-block">
                {!validaciones.numeralesValidos ? 
                  'Complete los numerales inicial y final de la bomba para calcular los litros.' :
                  !estanqueDestino ?
                  'Seleccione el estanque móvil que recibirá el combustible.' :
                  !validaciones.estanqueOrigenSeleccionado ?
                  'Seleccione el/los estanque(s) fijos desde donde extraer el combustible.' :
                  !validaciones.distribucionValida && modoMultipleOrigen ?
                  'Ajuste la distribución de litros para que sume el total requerido.' :
                  'Todos los campos están completos. Puede proceder con la transferencia.'
                }
              </span>
            </p>
          </div>

          {/* Botón de reinicio (solo visible después de completar) */}
          {isSaved && (
            <div className="pt-2">
              <button
                onClick={resetFlow}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors text-sm"
              >
                <FaGasPump className="mr-2" />
                Nueva Operación
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default React.memo(BomberoTransferenciaEstanqueMovil); 