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
  FaToggleOff,
  FaToggleOn,
  FaLayerGroup,
  FaBars,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import SelectorEstanques from "../../molecules/SelectorEstanque";

const BomberoTransferenciaEstanqueMovil = ({
  tipoSolicitante,
  solicitante,
  categoriaSeleccionada,
  onPrevious,
  onComplete,
  resetFlow,
  userInfo,
  idFaena,
  preloadedEstanques,
}) => {
  // Estados para los numerales y cálculo automático
  const [numeralInicial, setNumeralInicial] = useState("");
  const [numeralFinal, setNumeralFinal] = useState("");
  const [litrosCalculados, setLitrosCalculados] = useState(0);

  // Estados para estanques
  const [estanqueDestino, setEstanqueDestino] = useState(null);
  const [modoMultiple, setModoMultiple] = useState(false);
  const [estanqueOrigenSimple, setEstanqueOrigenSimple] = useState(null);
  const [estanquesOrigenMultiple, setEstanquesOrigenMultiple] = useState([]);
  const [distribucionLitros, setDistribucionLitros] = useState({});

  // Estados para el formulario
  const [observaciones, setObservaciones] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  // Cálculo automático de litros cuando cambian los numerales
  useEffect(() => {
    const inicial = parseFloat(numeralInicial) || 0;
    const final = parseFloat(numeralFinal) || 0;
    const calculados = final > inicial ? final - inicial : 0;
    setLitrosCalculados(calculados);

    console.log(`🧮 Litros calculados: ${calculados} (${final} - ${inicial})`);
  }, [numeralInicial, numeralFinal]);

  // Auto-activar modo múltiple si el estanque simple no tiene stock suficiente
  useEffect(() => {
    if (!modoMultiple && estanqueOrigenSimple && litrosCalculados > 0) {
      const stockDisponible = estanqueOrigenSimple.stock_actual || 0;
      if (litrosCalculados > stockDisponible) {
        console.log("🔄 Auto-activando modo múltiple por stock insuficiente");
        setModoMultiple(true);
        // Agregar el estanque actual a la lista múltiple
        setEstanquesOrigenMultiple([estanqueOrigenSimple]);
        setDistribucionLitros({
          [estanqueOrigenSimple.id_estanque]: Math.min(
            stockDisponible,
            litrosCalculados
          ),
        });
      }
    }
  }, [litrosCalculados, estanqueOrigenSimple, modoMultiple]);

  // Función para obtener el texto del tipo de solicitante con color
  const getTipoSolicitanteDisplay = useCallback(() => {
    if (tipoSolicitante === "interno") {
      return <span className="text-blue-600 font-medium">Interno</span>;
    } else if (tipoSolicitante === "externo") {
      return <span className="text-green-600 font-medium">Externo</span>;
    }
    return <span className="text-gray-600">No definido</span>;
  }, [tipoSolicitante]);

  // Calcular capacidad disponible del destino
  const capacidadDisponibleDestino = useMemo(() => {
    if (!estanqueDestino) return 0;
    return Math.max(
      0,
      estanqueDestino.capacidad - estanqueDestino.stock_actual
    );
  }, [estanqueDestino]);

  // Calcular stock total disponible en origen (simple o múltiple)
  const stockTotalOrigen = useMemo(() => {
    if (modoMultiple) {
      return estanquesOrigenMultiple.reduce(
        (total, est) => total + (est.stock_actual || 0),
        0
      );
    } else {
      return estanqueOrigenSimple?.stock_actual || 0;
    }
  }, [modoMultiple, estanqueOrigenSimple, estanquesOrigenMultiple]);

  // Calcular suma de distribución actual
  const sumaDistribucion = useMemo(() => {
    return Object.values(distribucionLitros).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
  }, [distribucionLitros]);

  // Validaciones completas
  const validaciones = useMemo(() => {
    const numeralesValidos =
      parseFloat(numeralFinal) > parseFloat(numeralInicial) &&
      numeralInicial !== "" &&
      numeralFinal !== "";

    const stockSuficienteOrigen = modoMultiple
      ? sumaDistribucion <= stockTotalOrigen &&
        sumaDistribucion === litrosCalculados
      : litrosCalculados <= stockTotalOrigen;

    const capacidadSuficienteDestino =
      litrosCalculados <= capacidadDisponibleDestino;

    const distribucionValida = modoMultiple
      ? sumaDistribucion === litrosCalculados &&
        Object.entries(distribucionLitros).every(([estanqueId, litros]) => {
          const estanque = estanquesOrigenMultiple.find(
            (e) => e.id_estanque == estanqueId
          );
          return litros <= (estanque?.stock_actual || 0);
        })
      : true;

    return {
      numeralesValidos,
      litrosCalculadosValidos: litrosCalculados > 0,
      estanqueDestinoSeleccionado: !!estanqueDestino,
      estanqueOrigenSeleccionado: modoMultiple
        ? estanquesOrigenMultiple.length > 0
        : !!estanqueOrigenSimple,
      stockSuficienteOrigen,
      capacidadSuficienteDestino,
      distribucionValida,
      solicitanteValido: !!solicitante,
    };
  }, [
    numeralInicial,
    numeralFinal,
    litrosCalculados,
    estanqueDestino,
    estanqueOrigenSimple,
    estanquesOrigenMultiple,
    distribucionLitros,
    sumaDistribucion,
    stockTotalOrigen,
    capacidadDisponibleDestino,
    modoMultiple,
    solicitante,
  ]);

  // Verificar si el formulario está completo
  const formularioCompleto = useMemo(() => {
    return Object.values(validaciones).every((v) => v === true);
  }, [validaciones]);

  // Manejar cambio de numerales
  const handleNumeralChange = useCallback((tipo, valor) => {
    if (valor === "" || (!isNaN(valor) && parseFloat(valor) >= 0)) {
      if (tipo === "inicial") {
        setNumeralInicial(valor);
      } else {
        setNumeralFinal(valor);
      }
    }
  }, []);

  // Manejar selección de estanque destino
  const handleEstanqueDestinoSelect = useCallback((estanque) => {
    console.log("🚛 Estanque DESTINO seleccionado:", estanque);
    setEstanqueDestino(estanque);
  }, []);

  // Manejar selección de estanque origen simple
  const handleEstanqueOrigenSimpleSelect = useCallback((estanque) => {
    console.log("🏠 Estanque ORIGEN SIMPLE seleccionado:", estanque);
    setEstanqueOrigenSimple(estanque);
  }, []);

  // Manejar toggle de modo múltiple
  const handleToggleModoMultiple = useCallback(() => {
    const nuevoModo = !modoMultiple;
    console.log(`🔄 Cambiando a modo ${nuevoModo ? "múltiple" : "simple"}`);

    setModoMultiple(nuevoModo);

    if (nuevoModo) {
      // Cambiar a modo múltiple
      if (estanqueOrigenSimple) {
        setEstanquesOrigenMultiple([estanqueOrigenSimple]);
        setDistribucionLitros({
          [estanqueOrigenSimple.id_estanque]: Math.min(
            estanqueOrigenSimple.stock_actual,
            litrosCalculados
          ),
        });
      }
    } else {
      // Cambiar a modo simple
      if (estanquesOrigenMultiple.length > 0) {
        setEstanqueOrigenSimple(estanquesOrigenMultiple[0]);
      }
      setEstanquesOrigenMultiple([]);
      setDistribucionLitros({});
    }
  }, [
    modoMultiple,
    estanqueOrigenSimple,
    estanquesOrigenMultiple,
    litrosCalculados,
  ]);

  // Agregar estanque en modo múltiple
  const handleAgregarEstanque = useCallback(
    (estanque) => {
      if (
        !estanquesOrigenMultiple.find(
          (e) => e.id_estanque === estanque.id_estanque
        )
      ) {
        console.log("➕ Agregando estanque:", estanque.nombre);
        const nuevosEstanques = [...estanquesOrigenMultiple, estanque];
        setEstanquesOrigenMultiple(nuevosEstanques);

        // Inicializar distribución
        const litrosRestantes = litrosCalculados - sumaDistribucion;
        const litrosParaEsteEstanque = Math.min(
          estanque.stock_actual,
          litrosRestantes
        );

        setDistribucionLitros((prev) => ({
          ...prev,
          [estanque.id_estanque]: litrosParaEsteEstanque,
        }));
      }
    },
    [estanquesOrigenMultiple, litrosCalculados, sumaDistribucion]
  );

  // Remover estanque en modo múltiple
  const handleRemoverEstanque = useCallback((estanqueId) => {
    console.log("➖ Removiendo estanque ID:", estanqueId);
    setEstanquesOrigenMultiple((prev) =>
      prev.filter((e) => e.id_estanque !== estanqueId)
    );
    setDistribucionLitros((prev) => {
      const nueva = { ...prev };
      delete nueva[estanqueId];
      return nueva;
    });
  }, []);

  // Manejar cambio en distribución de litros
  const handleDistribucionChange = useCallback(
    (estanqueId, valor) => {
      const estanque = estanquesOrigenMultiple.find(
        (e) => e.id_estanque == estanqueId
      );
      const maxPermitido = Math.min(
        estanque?.stock_actual || 0,
        litrosCalculados
      );

      if (
        valor === "" ||
        (!isNaN(valor) &&
          parseFloat(valor) >= 0 &&
          parseFloat(valor) <= maxPermitido)
      ) {
        setDistribucionLitros((prev) => ({
          ...prev,
          [estanqueId]: valor,
        }));
      }
    },
    [estanquesOrigenMultiple, litrosCalculados]
  );

  // Manejar envío del formulario
  const handleSubmit = useCallback(async () => {
    setShowValidation(true);

    if (!formularioCompleto) {
      console.warn("⚠️ Formulario incompleto");
      return;
    }

    setIsSaving(true);
    setHasError(false);
    setErrorMessage("");

    try {
      console.log("📤 Enviando transferencia de estanque móvil...");

      const transferData = {
        tipo_solicitante: tipoSolicitante,
        id_dotacion: solicitante?.rut || solicitante?.id,
        categoria: categoriaSeleccionada,
        tipo_operacion: "estanque_movil",

        // Datos de numerales y cálculos
        numeral_inicial: parseFloat(numeralInicial),
        numeral_final: parseFloat(numeralFinal),
        litros_calculados: litrosCalculados,

        // Datos de estanques
        estanque_destino: estanqueDestino.id_estanque,
        modo_multiple: modoMultiple,

        // Datos de origen según modo
        ...(modoMultiple
          ? {
              estanques_origen: estanquesOrigenMultiple.map(
                (e) => e.id_estanque
              ),
              distribucion_litros: distribucionLitros,
            }
          : {
              estanque_origen: estanqueOrigenSimple.id_estanque,
              litros_transferir: litrosCalculados,
            }),

        observaciones: observaciones.trim(),
        id_faena: idFaena,
        fecha_transferencia: new Date().toISOString(),

        // Información adicional para auditoría
        capacidad_disponible_destino: capacidadDisponibleDestino,
        stock_total_origen: stockTotalOrigen,
      };

      console.log("📋 Datos de transferencia:", transferData);

      // Simular API call (reemplazar con tu endpoint real)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("✅ Transferencia registrada exitosamente");
      setIsSaved(true);

      // Completar el flujo después de un breve delay
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error("❌ Error registrando transferencia:", error);
      setHasError(true);
      setErrorMessage(
        error.response?.data?.message || "Error al registrar la transferencia"
      );
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
    modoMultiple,
    estanqueOrigenSimple,
    estanquesOrigenMultiple,
    distribucionLitros,
    observaciones,
    idFaena,
    capacidadDisponibleDestino,
    stockTotalOrigen,
    onComplete,
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-6">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-5xl mx-auto">
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
              Solicitante:{" "}
              <span className="font-medium">
                {solicitante?.nombre || "N/A"}
              </span>
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

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[500px] md:min-h-[600px] flex flex-col">
            <TabProgressBar activeTab="transferencia" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
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
                  <span className="text-sm">
                    Transferencia registrada correctamente
                  </span>
                </div>
              )}

              {/* PASO 1: Numerales y Cálculo */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center mb-3">
                  <FaCalculator className="text-blue-600 mr-2" />
                  Paso 1: Ingrese los numerales de la bomba
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                      Numeral Inicial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={numeralInicial}
                      onChange={(e) =>
                        handleNumeralChange("inicial", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        showValidation && !validaciones.numeralesValidos
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Ej: 100.5"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                      Numeral Final <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={numeralFinal}
                      onChange={(e) =>
                        handleNumeralChange("final", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        showValidation && !validaciones.numeralesValidos
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Ej: 150.5"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                      Litros Calculados
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-left text-sm font-medium text-gray-700">
                      {litrosCalculados.toLocaleString()} L
                    </div>
                    <p className="text-left text-xs text-gray-500 mt-1">
                      Final - Inicial = {litrosCalculados}
                    </p>
                  </div>
                </div>

                {showValidation && !validaciones.numeralesValidos && (
                  <p className="text-left text-xs text-red-500 mt-2">
                    El numeral final debe ser mayor que el inicial
                  </p>
                )}
              </div>

              {/* PASO 2: Estanque Destino */}
              {litrosCalculados > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center mb-3">
                    <FaTruck className="text-green-600 mr-2" />
                    Paso 2: Seleccione estanque destino (móvil)
                  </h3>

                  {idFaena ? (
                    <div key="selector-destino">
                      <SelectorEstanques
                        idFaena={Number(idFaena)}
                        onEstanqueSelect={handleEstanqueDestinoSelect}
                        estanqueSeleccionado={estanqueDestino}
                        disabled={isSaving}
                        preloadedEstanques={preloadedEstanques}
                        tipoEstanque="movil"
                        placeholder="Seleccione el estanque móvil destino"
                        selectorId="destino"
                      />
                    </div>
                  ) : (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
                      <FaInfoCircle className="inline mr-2" />
                      No se pudo determinar la faena para cargar estanques
                    </div>
                  )}

                  {/* Información del estanque destino */}
                  {estanqueDestino && (
                    <div className="mt-3 bg-white rounded-lg p-3 border border-green-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            ✅ Destino: {estanqueDestino.nombre}
                          </p>
                          <p className="text-xs text-gray-600">
                            Capacidad total:{" "}
                            {estanqueDestino.capacidad.toLocaleString()} L
                          </p>
                          <p className="text-xs text-gray-600">
                            Stock actual:{" "}
                            {estanqueDestino.stock_actual.toLocaleString()} L
                          </p>
                          <p className="text-xs font-medium text-green-600">
                            Disponible:{" "}
                            {capacidadDisponibleDestino.toLocaleString()} L
                          </p>
                        </div>
                        <FaTruck className="text-green-500" />
                      </div>

                      {/* Validación de capacidad */}
                      {litrosCalculados > capacidadDisponibleDestino && (
                        <div className="mt-2 bg-red-100 border border-red-300 rounded p-2">
                          <p className="text-xs text-red-600 flex items-center">
                            <FaExclamationTriangle className="mr-1" />
                            ⚠️ Capacidad insuficiente: necesita{" "}
                            {litrosCalculados.toLocaleString()} L, disponible{" "}
                            {capacidadDisponibleDestino.toLocaleString()} L
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {showValidation &&
                    !validaciones.estanqueDestinoSeleccionado && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        Debe seleccionar un estanque de destino
                      </p>
                    )}

                  {showValidation &&
                    !validaciones.capacidadSuficienteDestino && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        El estanque destino no tiene capacidad suficiente
                      </p>
                    )}
                </div>
              )}

              {/* PASO 3: Estanques Origen */}
              {litrosCalculados > 0 &&
                estanqueDestino &&
                validaciones.capacidadSuficienteDestino && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
                        <FaGasPump className="text-gray-600 mr-2" />
                        Paso 3: Seleccione estanque(s) origen
                      </h3>

                      {/* Toggle modo múltiple */}
                      <button
                        onClick={handleToggleModoMultiple}
                        disabled={isSaving}
                        className="flex items-center space-x-2 px-3 py-1 rounded-lg border transition-colors hover:bg-gray-100"
                      >
                        {modoMultiple ? (
                          <FaToggleOn className="text-green-500 text-lg" />
                        ) : (
                          <FaToggleOff className="text-gray-400 text-lg" />
                        )}
                        <span className="text-xs font-medium">
                          {modoMultiple ? "Múltiple" : "Simple"}
                        </span>
                      </button>
                    </div>

                    {/* Modo Simple */}
                    {!modoMultiple && (
                      <div>
                        <SelectorEstanques
                          idFaena={Number(idFaena)}
                          onEstanqueSelect={handleEstanqueOrigenSimpleSelect}
                          estanqueSeleccionado={estanqueOrigenSimple}
                          disabled={isSaving}
                          preloadedEstanques={preloadedEstanques}
                          tipoEstanque="fijo"
                          placeholder="Seleccione el estanque de origen"
                          selectorId="origen-simple"
                        />

                        {estanqueOrigenSimple && (
                          <div className="mt-3 bg-white rounded-lg p-3 border border-gray-300">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  ✅ Origen: {estanqueOrigenSimple.nombre}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Stock disponible:{" "}
                                  {estanqueOrigenSimple.stock_actual.toLocaleString()}{" "}
                                  L
                                </p>
                                {litrosCalculados >
                                  estanqueOrigenSimple.stock_actual && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Stock insuficiente. Considere modo
                                    múltiple.
                                  </p>
                                )}
                              </div>
                              <FaGasPump className="text-blue-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modo Múltiple */}
                    {modoMultiple && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            <FaLayerGroup className="inline mr-1" />
                            Distribución entre múltiples estanques
                          </p>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {sumaDistribucion.toLocaleString()} /{" "}
                            {litrosCalculados.toLocaleString()} L
                          </span>
                        </div>

                        {/* Selector para agregar estanques */}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <SelectorEstanques
                            idFaena={Number(idFaena)}
                            onEstanqueSelect={handleAgregarEstanque}
                            estanqueSeleccionado={null}
                            disabled={isSaving}
                            preloadedEstanques={preloadedEstanques}
                            tipoEstanque="fijo"
                            placeholder="Agregar estanque origen"
                            selectorId="origen-multiple"
                          />
                        </div>

                        {/* Lista de estanques seleccionados */}
                        {estanquesOrigenMultiple.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              <FaBars className="mr-2" />
                              Estanques seleccionados (
                              {estanquesOrigenMultiple.length})
                            </h4>

                            {estanquesOrigenMultiple.map((estanque, index) => (
                              <div
                                key={estanque.id_estanque}
                                className="bg-white rounded-lg p-3 border border-gray-300"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-sm font-medium text-gray-800">
                                        {estanque.nombre}
                                      </p>
                                      <button
                                        onClick={() =>
                                          handleRemoverEstanque(
                                            estanque.id_estanque
                                          )
                                        }
                                        disabled={isSaving}
                                        className="text-red-500 hover:text-red-700 p-1"
                                      >
                                        <FaMinus className="text-xs" />
                                      </button>
                                    </div>

                                    <p className="text-xs text-gray-600 mb-2">
                                      Stock disponible:{" "}
                                      {estanque.stock_actual.toLocaleString()} L
                                    </p>

                                    <div className="flex items-center space-x-2">
                                      <label className="text-xs font-medium text-gray-700">
                                        Litros a extraer:
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={Math.min(
                                          estanque.stock_actual,
                                          litrosCalculados
                                        )}
                                        value={
                                          distribucionLitros[
                                            estanque.id_estanque
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleDistribucionChange(
                                            estanque.id_estanque,
                                            e.target.value
                                          )
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                                        placeholder="0"
                                        disabled={isSaving}
                                      />
                                      <span className="text-xs text-gray-500">
                                        L
                                      </span>
                                    </div>

                                    {/* Validaciones por estanque */}
                                    {showValidation &&
                                      distribucionLitros[
                                        estanque.id_estanque
                                      ] &&
                                      parseFloat(
                                        distribucionLitros[estanque.id_estanque]
                                      ) > estanque.stock_actual && (
                                        <p className="text-xs text-red-500 mt-1">
                                          ⚠️ Excede el stock disponible
                                        </p>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Resumen de distribución */}
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700">
                                  Total distribuido:
                                </span>
                                <span
                                  className={`font-bold ${
                                    sumaDistribucion === litrosCalculados
                                      ? "text-green-600"
                                      : "text-orange-600"
                                  }`}
                                >
                                  {sumaDistribucion.toLocaleString()} L
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  Requerido:
                                </span>
                                <span className="text-gray-800">
                                  {litrosCalculados.toLocaleString()} L
                                </span>
                              </div>
                              {sumaDistribucion !== litrosCalculados && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    Diferencia:
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      sumaDistribucion < litrosCalculados
                                        ? "text-red-600"
                                        : "text-orange-600"
                                    }`}
                                  >
                                    {sumaDistribucion < litrosCalculados
                                      ? "-"
                                      : "+"}
                                    {Math.abs(
                                      sumaDistribucion - litrosCalculados
                                    ).toLocaleString()}{" "}
                                    L
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Validaciones de origen */}
                    {showValidation &&
                      !validaciones.estanqueOrigenSeleccionado && (
                        <p className="text-left text-xs text-red-500 mt-2">
                          Debe seleccionar al menos un estanque de origen
                        </p>
                      )}

                    {showValidation && !validaciones.stockSuficienteOrigen && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        Stock insuficiente en el/los estanque(s) de origen
                      </p>
                    )}

                    {showValidation &&
                      !validaciones.distribucionValida &&
                      modoMultiple && (
                        <p className="text-left text-xs text-red-500 mt-2">
                          La distribución debe sumar exactamente{" "}
                          {litrosCalculados.toLocaleString()} L
                        </p>
                      )}
                  </div>
                )}

              {/* PASO 4: Observaciones */}
              {formularioCompleto && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center mb-3">
                    <FaClipboardCheck className="text-yellow-600 mr-2" />
                    Paso 4: Observaciones (opcional)
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
              )}

              {/* Resumen final */}
              {validaciones.numeralesValidos &&
                validaciones.litrosCalculadosValidos && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center mb-3">
                      <FaCheckCircle className="text-green-600 mr-2" />
                      Resumen de la transferencia
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Cantidad:</p>
                        <p className="text-gray-600">
                          {litrosCalculados.toLocaleString()} litros
                        </p>
                      </div>

                      {estanqueDestino && (
                        <div>
                          <p className="font-medium text-gray-700">Destino:</p>
                          <p className="text-gray-600">
                            {estanqueDestino.nombre}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-gray-700">Origen:</p>
                        <p className="text-gray-600">
                          {modoMultiple
                            ? `${estanquesOrigenMultiple.length} estanque(s) múltiples`
                            : estanqueOrigenSimple?.nombre || "No seleccionado"}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-gray-700">Modo:</p>
                        <p className="text-gray-600">
                          {modoMultiple
                            ? "Distribución múltiple"
                            : "Estanque único"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Botón de guardar */}
              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || isSaved || !formularioCompleto}
                  className={`w-full md:w-auto px-6 py-2.5 rounded-lg flex items-center justify-center transition-colors ${
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
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      <span>Registrar Transferencia</span>
                    </>
                  )}
                </button>

                {showValidation && !formularioCompleto && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    Complete todos los pasos para continuar
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Controles de navegación */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={
                <FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />
              }
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
          <div className="bg-green-50 text-green-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-lg">
            <p className="flex items-center justify-center">
              <FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="inline-block">
                {!validaciones.numeralesValidos
                  ? "Ingrese los numerales inicial y final de la bomba."
                  : !estanqueDestino
                  ? "Seleccione el estanque destino móvil."
                  : !validaciones.estanqueOrigenSeleccionado
                  ? "Seleccione el/los estanque(s) de origen."
                  : !validaciones.distribucionValida && modoMultiple
                  ? "Ajuste la distribución de litros."
                  : "Revise y confirme la transferencia."}
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
