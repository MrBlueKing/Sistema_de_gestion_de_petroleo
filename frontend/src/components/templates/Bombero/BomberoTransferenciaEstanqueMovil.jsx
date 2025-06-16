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
  FaMinus,
  FaUndo,
} from "react-icons/fa";
import { GiGasPump } from "react-icons/gi";
import SelectorEstanque from "../../molecules/SelectorEstanque";
import bomberoService from "../../../context/bomberoService";
// 🆕 IMPORTAR EL NUEVO SERVICIO
import transferenciaService from "../../../context/transferenciaService";

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

  // Estados para estanques usando el patrón del SelectorEstanque
  const [estanqueDestino, setEstanqueDestino] = useState(null);
  const [estanqueOrigenSimple, setEstanqueOrigenSimple] = useState(null);
  const [modoMultipleOrigen, setModoMultipleOrigen] = useState(false);
  const [distribucionLitrosOrigen, setDistribucionLitrosOrigen] = useState({});

  // Estados para el formulario
  const [observaciones, setObservaciones] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  // 🆕 ESTADOS ADICIONALES PARA FEEDBACK
  const [progressMessage, setProgressMessage] = useState("");
  const [transferenciaCompletada, setTransferenciaCompletada] = useState(null);

  // Cálculo automático de litros cuando cambian los numerales
  useEffect(() => {
    const inicial = parseFloat(numeralInicial) || 0;
    const final = parseFloat(numeralFinal) || 0;
    const calculados = final > inicial ? final - inicial : 0;
    setLitrosCalculados(calculados);

    console.log(`🧮 Litros calculados: ${calculados} (${final} - ${inicial})`);
  }, [numeralInicial, numeralFinal]);

  // Calcular capacidad disponible del destino
  const capacidadDisponibleDestino = useMemo(() => {
    if (!estanqueDestino) return 0;
    return Math.max(
      0,
      estanqueDestino.capacidad - estanqueDestino.stock_actual
    );
  }, [estanqueDestino]);

  // Calcular suma de distribución actual para modo múltiple origen
  const litrosDistribuidos = Object.values(distribucionLitrosOrigen).reduce(
    (total, litros) => total + (parseFloat(litros) || 0),
    0
  );
  const distribucionCompleta =
    Math.abs(litrosDistribuidos - litrosCalculados) < 0.01;
  const tieneEstanquesOrigenSeleccionados = Object.keys(
    distribucionLitrosOrigen
  ).some((key) => (distribucionLitrosOrigen[key] || 0) > 0);

  // Validaciones completas
  const validaciones = useMemo(() => {
    const numeralesValidos =
      parseFloat(numeralFinal) > parseFloat(numeralInicial) &&
      numeralInicial !== "" &&
      numeralFinal !== "";

    const stockSuficienteOrigen = modoMultipleOrigen
      ? distribucionCompleta && tieneEstanquesOrigenSeleccionados
      : estanqueOrigenSimple &&
        litrosCalculados <= (estanqueOrigenSimple.stock_actual || 0);

    const capacidadSuficienteDestino =
      litrosCalculados <= capacidadDisponibleDestino;

    return {
      numeralesValidos,
      litrosCalculadosValidos: litrosCalculados > 0,
      estanqueDestinoSeleccionado: !!estanqueDestino,
      estanqueOrigenSeleccionado: modoMultipleOrigen
        ? tieneEstanquesOrigenSeleccionados
        : !!estanqueOrigenSimple,
      stockSuficienteOrigen,
      capacidadSuficienteDestino,
      distribucionValida: modoMultipleOrigen ? distribucionCompleta : true,
      solicitanteValido: !!solicitante,
    };
  }, [
    numeralInicial,
    numeralFinal,
    litrosCalculados,
    estanqueDestino,
    estanqueOrigenSimple,
    modoMultipleOrigen,
    distribucionCompleta,
    tieneEstanquesOrigenSeleccionados,
    capacidadDisponibleDestino,
    solicitante,
  ]);

  // Verificar si el formulario está completo
  const formularioCompleto = useMemo(() => {
    return Object.values(validaciones).every((v) => v === true);
  }, [validaciones]);

  // Función para obtener el texto del tipo de solicitante con color
  const getTipoSolicitanteDisplay = useCallback(() => {
    if (tipoSolicitante === "interno") {
      return <span className="text-blue-600 font-medium">Interno</span>;
    } else if (tipoSolicitante === "externo") {
      return <span className="text-green-600 font-medium">Externo</span>;
    }
    return <span className="text-gray-600">No definido</span>;
  }, [tipoSolicitante]);

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

  // Handlers para el selector de origen (usando el patrón del SelectorEstanque)
  const handleOrigenModoChange = useCallback((nuevoModo) => {
    console.log("🔄 Cambiando modo origen a:", nuevoModo);
    setModoMultipleOrigen(nuevoModo);
    if (nuevoModo) {
      setEstanqueOrigenSimple(null);
      setDistribucionLitrosOrigen({});
    } else {
      setDistribucionLitrosOrigen({});
    }
  }, []);

  const handleOrigenDistribucionChange = useCallback((nuevaDistribucion) => {
    console.log("📊 Nueva distribución origen:", nuevaDistribucion);
    setDistribucionLitrosOrigen(nuevaDistribucion);
  }, []);

  const handleOrigenSelect = useCallback((estanque) => {
    console.log("🎯 Estanque origen seleccionado:", estanque);
    setEstanqueOrigenSimple(estanque);
  }, []);

  // Handler para el selector de destino
  const handleDestinoSelect = useCallback((estanque) => {
    console.log("🎯 Estanque destino seleccionado:", estanque);
    setEstanqueDestino(estanque);
  }, []);

  const handleSubmit = useCallback(async () => {
    setShowValidation(true);

    if (!formularioCompleto) {
      console.warn("⚠️ Formulario incompleto");
      return;
    }

    setIsSaving(true);
    setHasError(false);
    setErrorMessage("");
    setProgressMessage("Preparando transferencia...");

    try {
      // 🔍 PREPARAR DATOS PARA EL SERVICIO
      const transferData = {
        tipo_solicitante: tipoSolicitante,
        id_dotacion: solicitante?.rut || solicitante?.id,
        categoria: categoriaSeleccionada,
        tipo_operacion: "estanque_movil",

        // 🆕 ENVIAR NUMERALES COMO ESTÁN (el servicio los convertirá)
        numeral_inicial: numeralInicial,
        numeral_final: numeralFinal,
        litros_calculados: litrosCalculados,

        // Datos de estanques
        estanque_destino: estanqueDestino.id_estanque,
        modo_multiple_origen: modoMultipleOrigen,

        // Datos de origen según modo
        ...(modoMultipleOrigen
          ? {
              estanques_origen: Object.keys(distribucionLitrosOrigen)
                .filter((id) => distribucionLitrosOrigen[id] > 0)
                .map((id) => parseInt(id)),
              distribucion_litros: distribucionLitrosOrigen,
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
        userInfo: userInfo,
      };

      console.log(
        "📋 Datos de transferencia preparados para servicio:",
        transferData
      );

      // 🔍 VALIDACIÓN CON EL SERVICIO
      const validacionLocal =
        transferenciaService.validarTransferencia(transferData);
      if (!validacionLocal.valido) {
        throw new Error(validacionLocal.errores.join(", "));
      }

      setProgressMessage("Enviando al servidor...");

      // 🚀 ENVÍO USANDO EL SERVICIO
      let resultado;
      if (modoMultipleOrigen) {
        console.log("📤 Enviando transferencia múltiple...");
        resultado = await transferenciaService.registrarMultipleFijoAMovil(
          transferData
        );
      } else {
        console.log("📤 Enviando transferencia simple...");
        resultado = await transferenciaService.registrarFijoAMovil(
          transferData
        );
      }

      console.log("✅ Transferencia registrada exitosamente:", resultado);

      setProgressMessage("Transferencia completada exitosamente");
      setIsSaved(true);
      setTransferenciaCompletada(resultado);

      // 🔄 LIMPIAR CACHE DE ESTANQUES PARA REFLEJAR NUEVOS STOCKS
      if (bomberoService?.clearEstanquesCache) {
        bomberoService.clearEstanquesCache();
      }

      // Completar el flujo después de un breve delay para mostrar el éxito
      setTimeout(() => {
        onComplete({
          ...transferData,
          resultado: resultado,
          success: true,
        });
      }, 2000);
    } catch (error) {
      console.error("❌ Error registrando transferencia:", error);
      setHasError(true);
      setErrorMessage(
        error.message || "Error desconocido al registrar la transferencia"
      );
      setProgressMessage("");
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
    distribucionLitrosOrigen,
    observaciones,
    idFaena,
    capacidadDisponibleDestino,
    userInfo,
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

  // Asegurarse de que idFaena sea un valor numérico
  const faenaIdForSelector =
    idFaena !== undefined && idFaena !== null ? Number(idFaena) : null;

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

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[700px] md:min-h-[800px] flex flex-col">
            <TabProgressBar activeTab="transferencia" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Mensajes de estado */}
              {hasError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded flex items-start">
                  <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">
                      Error en la transferencia:
                    </span>
                    <p className="text-sm mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {isSaved && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded flex items-start">
                  <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">
                      Transferencia registrada correctamente
                    </span>
                    {transferenciaCompletada && (
                      <p className="text-xs mt-1">
                        ID:{" "}
                        {transferenciaCompletada.data?.trasvasije
                          ?.id_trasvasije ||
                          transferenciaCompletada.data?.id_trasvasije ||
                          "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 🆕 MENSAJE DE PROGRESO */}
              {isSaving && progressMessage && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 rounded flex items-start">
                  <FaSpinner className="animate-spin text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{progressMessage}</span>
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
                        Ingrese los datos que muestra la bomba después de la
                        transferencia
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
                          Numeral Inicial{" "}
                          <span className="text-red-500">*</span>
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

                      {/* Numeral Final */}
                      <div className="col-span-1">
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
                          Calculado automáticamente: Numeral Final - Numeral
                          Inicial = {litrosCalculados}
                        </p>
                      </div>
                    </div>

                    {showValidation && !validaciones.numeralesValidos && (
                      <p className="text-left text-xs text-red-500 mt-2">
                        El numeral final debe ser mayor que el inicial
                      </p>
                    )}
                  </div>

                  {/* Estanque Destino (móvil) usando SelectorEstanque */}
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

                    {faenaIdForSelector ? (
                      <SelectorEstanque
                        idFaena={faenaIdForSelector}
                        onEstanqueSelect={handleDestinoSelect}
                        estanqueSeleccionado={estanqueDestino}
                        litrosRequeridos={litrosCalculados}
                        disabled={isSaving}
                        preloadedEstanques={preloadedEstanques}
                        tipoEstanque="movil"
                        selectorId="destino-movil"
                        modoMultiple={false}
                        mostrarToggle={false}
                        showTitle={false}
                        className=""
                      />
                    ) : (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
                        <div className="flex items-start">
                          <FaInfoCircle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm">
                            No se ha podido determinar la faena para cargar los
                            estanques móviles disponibles.
                          </span>
                        </div>
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
                </div>

                {/* COLUMNA DERECHA: Estanques Origen */}
                <div className="space-y-4">
                  {/* Estanques Origen (fijos) usando SelectorEstanque */}
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

                    {faenaIdForSelector ? (
                      <SelectorEstanque
                        idFaena={faenaIdForSelector}
                        onEstanqueSelect={handleOrigenSelect}
                        estanqueSeleccionado={estanqueOrigenSimple}
                        litrosRequeridos={litrosCalculados}
                        disabled={isSaving}
                        preloadedEstanques={preloadedEstanques}
                        tipoEstanque="fijo"
                        selectorId="origen-fijo"
                        modoMultiple={modoMultipleOrigen}
                        distribucionLitros={distribucionLitrosOrigen}
                        onDistribucionChange={handleOrigenDistribucionChange}
                        mostrarToggle={true}
                        onModoChange={handleOrigenModoChange}
                        showTitle={false}
                        className=""
                      />
                    ) : (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
                        <div className="flex items-start">
                          <FaInfoCircle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm">
                            No se ha podido determinar la faena para cargar los
                            estanques origen disponibles.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Validaciones origen */}
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
                      modoMultipleOrigen && (
                        <p className="text-left text-xs text-red-500 mt-2">
                          La distribución debe sumar exactamente{" "}
                          {litrosCalculados.toLocaleString()} L
                        </p>
                      )}
                  </div>

                  {/* Resumen final */}
                  {validaciones.numeralesValidos &&
                    validaciones.litrosCalculadosValidos && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center mb-3">
                          <FaCheckCircle className="text-green-600 mr-2" />
                          Resumen de la transferencia
                        </h3>

                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                              Cantidad:
                            </span>
                            <span className="text-gray-600">
                              {litrosCalculados.toLocaleString()} litros
                            </span>
                          </div>

                          {estanqueDestino && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">
                                Destino (móvil):
                              </span>
                              <span className="text-gray-600">
                                {estanqueDestino.nombre}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                              Origen (fijo):
                            </span>
                            <span className="text-gray-600">
                              {modoMultipleOrigen
                                ? `${
                                    Object.values(
                                      distribucionLitrosOrigen
                                    ).filter((v) => v > 0).length
                                  } estanque(s) múltiples`
                                : estanqueOrigenSimple?.nombre ||
                                  "No seleccionado"}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">
                              Modo:
                            </span>
                            <span className="text-gray-600">
                              {modoMultipleOrigen
                                ? "Distribución múltiple"
                                : "Estanque único"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* OBSERVACIONES - AL FINAL */}
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

              {/* Botones de acción */}
              <div className="pt-4 border-t border-gray-200 flex flex-col md:flex-row gap-4 justify-between">
                {/* Botón de retroceder */}
                <button
                  onClick={onPrevious}
                  disabled={isSaving}
                  className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaArrowLeft className="mr-2" />
                  Volver
                </button>

                {/* Botón de reiniciar flujo */}
                <button
                  onClick={resetFlow}
                  disabled={isSaving}
                  className="flex items-center justify-center px-6 py-3 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaUndo className="mr-2" />
                  Reiniciar
                </button>

                {/* Botón principal de guardar */}
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || isSaved || !formularioCompleto}
                  className={`flex items-center justify-center px-8 py-3 rounded-lg text-lg font-medium transition-colors ${
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
                      <span>Procesando transferencia...</span>
                    </>
                  ) : isSaved ? (
                    <>
                      <FaCheckCircle className="mr-2" />
                      <span>Transferencia completada</span>
                    </>
                  ) : !estanqueDestino ? (
                    <>
                      <FaTruck className="mr-2" />
                      <span>Seleccione estanque destino</span>
                    </>
                  ) : !validaciones.estanqueOrigenSeleccionado ? (
                    <>
                      <FaGasPump className="mr-2" />
                      <span>Seleccione estanque(s) origen</span>
                    </>
                  ) : !validaciones.numeralesValidos ? (
                    <>
                      <FaCalculator className="mr-2" />
                      <span>Complete numerales válidos</span>
                    </>
                  ) : !validaciones.stockSuficienteOrigen ? (
                    <>
                      <FaExclamationTriangle className="mr-2" />
                      <span>Stock insuficiente en origen</span>
                    </>
                  ) : !validaciones.capacidadSuficienteDestino ? (
                    <>
                      <FaExclamationTriangle className="mr-2" />
                      <span>Capacidad insuficiente en destino</span>
                    </>
                  ) : !validaciones.distribucionValida && modoMultipleOrigen ? (
                    <>
                      <FaBalanceScale className="mr-2" />
                      <span>
                        Complete distribución ({litrosDistribuidos.toFixed(1)}/
                        {litrosCalculados.toFixed(1)} L)
                      </span>
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      <span>Guardar Transferencia</span>
                    </>
                  )}
                </button>
              </div>

              {/* Ayuda contextual */}
              {!formularioCompleto && showValidation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="text-left text-blue-800 font-medium text-sm flex items-center mb-2">
                    <FaInfoCircle className="mr-2" />
                    Para completar la transferencia necesita:
                  </h4>
                  <ul className="text-left text-blue-700 text-xs space-y-1">
                    {!validaciones.numeralesValidos && (
                      <li>
                        • Ingresar numerales válidos (final mayor que inicial)
                      </li>
                    )}
                    {!validaciones.estanqueDestinoSeleccionado && (
                      <li>• Seleccionar un estanque de destino (móvil)</li>
                    )}
                    {!validaciones.estanqueOrigenSeleccionado && (
                      <li>
                        • Seleccionar al menos un estanque de origen (fijo)
                      </li>
                    )}
                    {!validaciones.stockSuficienteOrigen && (
                      <li>
                        • Verificar que hay stock suficiente en el/los
                        estanque(s) de origen
                      </li>
                    )}
                    {!validaciones.capacidadSuficienteDestino && (
                      <li>
                        • Verificar que el estanque destino tiene capacidad
                        suficiente
                      </li>
                    )}
                    {!validaciones.distribucionValida && modoMultipleOrigen && (
                      <li>
                        • Completar la distribución para que sume exactamente{" "}
                        {litrosCalculados.toLocaleString()} L
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Información de estado del sistema */}
              {formularioCompleto && !isSaved && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center text-green-700">
                    <FaCheckCircle className="mr-2 text-green-600" />
                    <span className="text-sm font-medium">
                      Formulario completo. Listo para procesar la transferencia.
                    </span>
                  </div>
                </div>
              )}

              {/* 🆕 INFORMACIÓN DE TRANSFERENCIA COMPLETADA */}
              {isSaved && transferenciaCompletada && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="text-left text-green-800 font-medium text-sm flex items-center mb-3">
                    <FaCheckCircle className="mr-2 text-green-600" />
                    Detalles de la transferencia completada
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {transferenciaCompletada.data?.trasvasije && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">
                            ID Transferencia:
                          </span>
                          <span className="text-gray-600">
                            #
                            {
                              transferenciaCompletada.data.trasvasije
                                .id_trasvasije
                            }
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">
                            Litros transferidos:
                          </span>
                          <span className="text-gray-600">
                            {
                              transferenciaCompletada.data.trasvasije
                                .litros_bombeados_total
                            }
                            L
                          </span>
                        </div>

                        {transferenciaCompletada.data.estanques && (
                          <>
                            <div className="col-span-1 md:col-span-2 border-t border-gray-200 pt-2 mt-2">
                              <span className="font-medium text-gray-700 text-sm">
                                Stocks actualizados:
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {
                                  transferenciaCompletada.data.estanques.fijo
                                    ?.nombre
                                }{" "}
                                (origen):
                              </span>
                              <span className="text-gray-600">
                                {
                                  transferenciaCompletada.data.estanques.fijo
                                    ?.stock_actual
                                }
                                L
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {
                                  transferenciaCompletada.data.estanques.movil
                                    ?.nombre
                                }{" "}
                                (destino):
                              </span>
                              <span className="text-gray-600">
                                {
                                  transferenciaCompletada.data.estanques.movil
                                    ?.stock_actual
                                }
                                L
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control de página inferior */}
          <div className="w-full">
            <PageControl
              onPrevious={onPrevious}
              onNext={null}
              showNext={false}
              showPrevious={!isSaving}
              previousText="Volver"
              className="justify-center"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BomberoTransferenciaEstanqueMovil;
