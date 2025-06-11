import React, { useState, useEffect, useCallback } from "react";
import {
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaTachometerAlt,
  FaGasPump,
  FaInfoCircle,
  FaBalanceScale,
  FaLayerGroup,
  FaTruck,
} from "react-icons/fa";
import { GiGasPump } from "react-icons/gi";
import SelectorEstanques from "../../molecules/SelectorEstanque";
import bomberoService from "../../../context/bomberoService";
import axios from "../../../lib/axios"; // Tu instancia de axios configurada

const ConsumoFormMultiEstanque = ({
  formData,
  handleChange,
  tipoMedicion = "Kilometraje",
  idFaena,
  estanqueSeleccionado,
  onEstanqueSelect,
  preloadedEstanques,
  // Props del flujo anterior
  solicitante,
  categoriaSeleccionada,
  patenteSeleccionada,
  userInfo,
  onComplete,
  resetFlow,
}) => {
  const showHorometro = tipoMedicion === "Horometro";
  const showKilometraje = tipoMedicion === "Kilometraje";

  // Estados para multi-estanques
  const [modoMultiEstanque, setModoMultiEstanque] = useState(false);
  const [distribucionLitros, setDistribucionLitros] = useState({});
  const [estanquesDisponibles, setEstanquesDisponibles] = useState([]);
  const [cargandoEstanques, setCargandoEstanques] = useState(false);

  // Estados para el manejo del envío
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ===================================
  // FUNCIÓN PARA DETERMINAR TIPO DE OPERACIÓN
  // ===================================
  const determinarTipoOperacion = useCallback(
    (modoMultiple, estanquesUsados) => {
      let tipoOperacion = "normal"; // Valor por defecto

      if (modoMultiple) {
        // Para modo múltiple, revisar todos los estanques con litros asignados
        const estanquesConLitros = estanquesDisponibles.filter(
          (estanque) => (distribucionLitros[estanque.id_estanque] || 0) > 0
        );

        // Si hay algún estanque móvil, es estanque_movil
        const tieneEstanqueMovil = estanquesConLitros.some(
          (estanque) => estanque.tipo_estanque === "movil"
        );

        tipoOperacion = tieneEstanqueMovil ? "estanque_movil" : "normal";

        console.log("🔍 Determinando tipo_operacion (MÚLTIPLE):", {
          estanques_con_litros: estanquesConLitros.map((e) => ({
            nombre: e.nombre,
            tipo: e.tipo_estanque,
            litros: distribucionLitros[e.id_estanque],
          })),
          tiene_movil: tieneEstanqueMovil,
          tipo_operacion: tipoOperacion,
        });
      } else {
        // Para modo simple, revisar el estanque seleccionado
        if (estanqueSeleccionado) {
          tipoOperacion =
            estanqueSeleccionado.tipo_estanque === "movil"
              ? "estanque_movil"
              : "normal";

          console.log("🔍 Determinando tipo_operacion (SIMPLE):", {
            estanque: estanqueSeleccionado.nombre,
            tipo_estanque: estanqueSeleccionado.tipo_estanque,
            tipo_operacion: tipoOperacion,
          });
        }
      }

      return tipoOperacion;
    },
    [
      modoMultiEstanque,
      distribucionLitros,
      estanquesDisponibles,
      estanqueSeleccionado,
    ]
  );

  // ===================================
  // FUNCIÓN PARA ENVIAR CONSUMO AL BACKEND
  // ===================================
  const enviarConsumoAlBackend = async (datosConsumo, modoMultiEstanque) => {
    try {
      console.log("📤 Enviando consumo al backend...", datosConsumo);
      console.log("🔍 Props disponibles:", {
        solicitante,
        patenteSeleccionada,
        categoriaSeleccionada,
        userInfo,
        idFaena,
        estanqueSeleccionado,
      });

      // 🔧 VALIDAR DATOS CRÍTICOS ANTES DE ENVIAR
      const id_dotacion = datosConsumo.id_dotacion || solicitante?.rut;
      const id_equipo =
        datosConsumo.id_equipo ||
        patenteSeleccionada?.id_maquina ||
        categoriaSeleccionada?.id_maquina;
      const id_usuario = datosConsumo.id_usuario || userInfo?.id;
      const id_faena = datosConsumo.id_faena || userInfo?.faena || idFaena;

      // ❌ VERIFICAR QUE LOS DATOS CRÍTICOS EXISTAN
      if (!id_dotacion) {
        throw new Error(
          "❌ No se encontró el RUT del solicitante. Datos: " +
            JSON.stringify(solicitante)
        );
      }
      if (!id_equipo) {
        throw new Error(
          "❌ No se encontró el ID del equipo. Datos: " +
            JSON.stringify({ patenteSeleccionada, categoriaSeleccionada })
        );
      }
      if (!id_usuario) {
        throw new Error(
          "❌ No se encontró el ID del usuario. Datos: " +
            JSON.stringify(userInfo)
        );
      }
      if (!id_faena) {
        throw new Error(
          "❌ No se encontró el ID de la faena. Datos: " +
            JSON.stringify({ userInfo, idFaena })
        );
      }

      console.log("✅ Datos críticos validados:", {
        id_dotacion,
        id_equipo,
        id_usuario,
        id_faena,
      });

      // 🆕 DETERMINAR TIPO DE OPERACIÓN AUTOMÁTICAMENTE
      const tipoOperacion = determinarTipoOperacion(
        modoMultiEstanque,
        datosConsumo.estanques_multiples
      );

      // Preparar datos base del consumo
      const consumoData = {
        // Datos del solicitante y equipo - YA VALIDADOS
        id_dotacion,
        id_equipo,
        id_usuario,
        id_faena,

        // Datos del consumo
        fecha_consumo: datosConsumo.fechaHora,
        litros_consumidos: parseFloat(datosConsumo.litros) || 0,
        tipo_consumo: modoMultiEstanque ? "multiple" : "simple",
        tipo_operacion: tipoOperacion, // 🆕 AUTO-DETERMINADO

        // Datos de la bomba
        numeral_inicial: parseFloat(datosConsumo.numeralInicial) || 0,
        numeral_final: parseFloat(datosConsumo.numeralFinal) || 0,
        precio_litro: parseFloat(datosConsumo.precio_litro) || 1500,
        observacion: datosConsumo.observacion || null,

        // Datos específicos según el modo
        ...(modoMultiEstanque
          ? {
              // MODO MÚLTIPLE
              estanques_multiples: datosConsumo.estanques_multiples || [],
            }
          : {
              // MODO SIMPLE
              id_estanque:
                datosConsumo.id_estanque || estanqueSeleccionado?.id_estanque,
              medicion: parseFloat(
                datosConsumo.medicion ||
                  datosConsumo.horometro ||
                  datosConsumo.kilometraje ||
                  0
              ),
            }),
      };

      console.log("📦 Datos preparados para envío:", consumoData);
      console.log("🚛 Tipo de operación determinado:", tipoOperacion);

      // Realizar petición POST al backend
      const response = await axios.post("/api/consumos/multi", consumoData);

      if (response.data.success) {
        console.log("✅ Consumo creado exitosamente:", response.data.data);
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data.message || "Error desconocido");
      }
    } catch (error) {
      console.error("❌ Error enviando consumo:", error);

      let errorMessage = "Error al guardar el consumo";

      if (error.response?.data?.errors) {
        // Errores de validación
        const errores = Object.values(error.response.data.errors).flat();
        errorMessage = errores.join(", ");
      } else if (error.response?.data?.message) {
        // Error del servidor
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Error de red o cliente
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        errors: error.response?.data?.errors || null,
      };
    }
  };

  // ===================================
  // FUNCIÓN PARA CARGAR ESTANQUES
  // ===================================
  const cargarEstanquesIgualQueSimple = useCallback(async () => {
    if (!idFaena || cargandoEstanques) return;

    setCargandoEstanques(true);
    try {
      console.log(
        "🔄 Cargando estanques usando la misma lógica que modo simple..."
      );

      const response = await bomberoService.getEstanques(idFaena);

      let estanques = [];

      if (response && response.estanques && Array.isArray(response.estanques)) {
        estanques = response.estanques;
      } else if (response && Array.isArray(response)) {
        estanques = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        estanques = response.data;
      }

      console.log("📦 Respuesta del servicio getEstanques:", response);
      console.log("✅ Estanques procesados:", estanques);

      // 🆕 Log para verificar tipos de estanque
      estanques.forEach((estanque) => {
        console.log(
          `🏷️ Estanque: ${estanque.nombre} - Tipo: ${
            estanque.tipo_estanque || "no definido"
          }`
        );
      });

      setEstanquesDisponibles(estanques);
    } catch (error) {
      console.error("❌ Error cargando estanques:", error);
      setEstanquesDisponibles([]);
    } finally {
      setCargandoEstanques(false);
    }
  }, [idFaena, cargandoEstanques]);

  // Cargar estanques cuando se activa el modo múltiple O cuando el componente se monta
  useEffect(() => {
    if (modoMultiEstanque && estanquesDisponibles.length === 0) {
      cargarEstanquesIgualQueSimple();
    }
  }, [
    modoMultiEstanque,
    estanquesDisponibles.length,
    cargarEstanquesIgualQueSimple,
  ]);

  useEffect(() => {
    if (idFaena && estanquesDisponibles.length === 0 && !cargandoEstanques) {
      cargarEstanquesIgualQueSimple();
    }
  }, [
    idFaena,
    estanquesDisponibles.length,
    cargandoEstanques,
    cargarEstanquesIgualQueSimple,
  ]);

  // Verificar si necesitamos modo multi-estanque
  const litrosTotalesRequeridos = parseFloat(formData.litros) || 0;
  const stockTotalDisponible = estanquesDisponibles.reduce(
    (total, est) => total + (est.stock_actual || 0),
    0
  );
  const estanqueConStockSuficiente = estanquesDisponibles.find(
    (est) => (est.stock_actual || 0) >= litrosTotalesRequeridos
  );
  const necesitaMultiEstanque =
    litrosTotalesRequeridos > 0 &&
    !estanqueConStockSuficiente &&
    stockTotalDisponible >= litrosTotalesRequeridos;

  // Auto-activar modo multi-estanque si es necesario
  useEffect(() => {
    if (
      necesitaMultiEstanque &&
      !modoMultiEstanque &&
      litrosTotalesRequeridos > 0
    ) {
      console.log("🔄 Auto-activando modo multi-estanque");
      setModoMultiEstanque(true);
      onEstanqueSelect(null);
      setDistribucionLitros({});
    }
  }, [
    necesitaMultiEstanque,
    modoMultiEstanque,
    litrosTotalesRequeridos,
    onEstanqueSelect,
  ]);

  // Validaciones para multi-estanque
  const litrosDistribuidos = Object.values(distribucionLitros).reduce(
    (total, litros) => total + (parseFloat(litros) || 0),
    0
  );
  const distribucionCompleta =
    Math.abs(litrosDistribuidos - litrosTotalesRequeridos) < 0.01;
  const tieneEstanquesSeleccionados = Object.keys(distribucionLitros).some(
    (key) => (distribucionLitros[key] || 0) > 0
  );
  const stockSuficienteMulti = Object.keys(distribucionLitros).every(
    (estanqueId) => {
      const litrosAsignados = distribucionLitros[estanqueId] || 0;
      if (litrosAsignados === 0) return true;
      const estanque = estanquesDisponibles.find(
        (e) => e.id_estanque === parseInt(estanqueId)
      );
      return estanque && (estanque.stock_actual || 0) >= litrosAsignados;
    }
  );

  // 🆕 FUNCIÓN PARA OBTENER INFORMACIÓN DEL TIPO DE OPERACIÓN
  const obtenerInfoTipoOperacion = useCallback(() => {
    const tipoOperacion = determinarTipoOperacion(modoMultiEstanque);

    if (modoMultiEstanque) {
      const estanquesConLitros = estanquesDisponibles.filter(
        (estanque) => (distribucionLitros[estanque.id_estanque] || 0) > 0
      );

      const tiposFijos = estanquesConLitros.filter(
        (e) => e.tipo_estanque === "fijo"
      ).length;
      const tiposMoviles = estanquesConLitros.filter(
        (e) => e.tipo_estanque === "movil"
      ).length;

      return {
        tipoOperacion,
        estanquesFijos: tiposFijos,
        estanquesMoviles: tiposMoviles,
        total: estanquesConLitros.length,
        esMixto: tiposFijos > 0 && tiposMoviles > 0,
      };
    } else if (estanqueSeleccionado) {
      return {
        tipoOperacion,
        tipo_estanque: estanqueSeleccionado.tipo_estanque,
        nombre: estanqueSeleccionado.nombre,
      };
    }

    return { tipoOperacion: "normal" };
  }, [
    modoMultiEstanque,
    estanquesDisponibles,
    distribucionLitros,
    estanqueSeleccionado,
    determinarTipoOperacion,
  ]);

  // Función para cambiar modo
  const toggleModoMultiEstanque = useCallback(
    (activar) => {
      console.log("🔄 Cambiando modo multi-estanque a:", activar);
      setModoMultiEstanque(activar);
      if (activar) {
        onEstanqueSelect(null);
        setDistribucionLitros({});
        if (estanquesDisponibles.length === 0) {
          cargarEstanquesIgualQueSimple();
        }
      } else {
        setDistribucionLitros({});
      }
    },
    [
      onEstanqueSelect,
      estanquesDisponibles.length,
      cargarEstanquesIgualQueSimple,
    ]
  );

  // ===================================
  // FUNCIÓN PRINCIPAL DE ENVÍO
  // ===================================
  const handleSubmitWrapper = useCallback(async () => {
    console.log("🚀 Iniciando envío de consumo...");
    console.log("🔍 Props del componente:", {
      solicitante,
      patenteSeleccionada,
      categoriaSeleccionada,
      userInfo,
      idFaena,
      estanqueSeleccionado,
      formData,
    });

    // ❌ VALIDACIONES PREVIAS
    if (!solicitante?.rut) {
      setHasError(true);
      setErrorMessage(
        "Error: No se encontró el solicitante. Por favor, vuelva al paso anterior."
      );
      return;
    }

    const equipoId =
      patenteSeleccionada?.id_maquina || categoriaSeleccionada?.id_maquina;
    if (!equipoId) {
      setHasError(true);
      setErrorMessage(
        "Error: No se encontró el equipo seleccionado. Por favor, vuelva al paso anterior."
      );
      return;
    }

    if (!userInfo?.id) {
      setHasError(true);
      setErrorMessage(
        "Error: Usuario no autenticado. Por favor, inicie sesión nuevamente."
      );
      return;
    }

    const faenaId = userInfo?.faena || idFaena;
    if (!faenaId) {
      setHasError(true);
      setErrorMessage(
        "Error: No se encontró la faena. Por favor, contacte al administrador."
      );
      return;
    }

    // Validaciones específicas por modo
    if (modoMultiEstanque) {
      if (
        !tieneEstanquesSeleccionados ||
        !distribucionCompleta ||
        !stockSuficienteMulti
      ) {
        setHasError(true);
        setErrorMessage(
          "Error: Complete correctamente la distribución de estanques múltiples."
        );
        return;
      }
    } else {
      if (!estanqueSeleccionado) {
        setHasError(true);
        setErrorMessage("Error: Debe seleccionar un estanque.");
        return;
      }
    }

    // Cambiar estado a "guardando"
    setIsSaving(true);
    setHasError(false);
    setIsSaved(false);
    setErrorMessage("");

    try {
      let datosParaEnvio;

      if (modoMultiEstanque) {
        // PREPARAR DATOS PARA CONSUMO MÚLTIPLE
        const estanquesConLitros = estanquesDisponibles
          .filter(
            (estanque) => (distribucionLitros[estanque.id_estanque] || 0) > 0
          )
          .map((estanque) => ({
            id_estanque: estanque.id_estanque,
            litros: distribucionLitros[estanque.id_estanque],
            nombre_estanque: estanque.nombre,
          }));

        datosParaEnvio = {
          ...formData,
          // ✅ ASEGURAR QUE LOS DATOS CRÍTICOS ESTÉN PRESENTES
          id_dotacion: solicitante.rut,
          id_equipo: equipoId,
          id_usuario: userInfo.id,
          id_faena: faenaId,
          es_consumo_multiple: true,
          estanques_multiples: estanquesConLitros,
        };
      } else {
        // PREPARAR DATOS PARA CONSUMO SIMPLE
        datosParaEnvio = {
          ...formData,
          // ✅ ASEGURAR QUE LOS DATOS CRÍTICOS ESTÉN PRESENTES
          id_dotacion: solicitante.rut,
          id_equipo: equipoId,
          id_usuario: userInfo.id,
          id_faena: faenaId,
          id_estanque: estanqueSeleccionado.id_estanque,
          es_consumo_multiple: false,
        };
      }

      console.log("📋 Datos finales a enviar:", datosParaEnvio);

      // ENVIAR AL BACKEND
      const resultado = await enviarConsumoAlBackend(
        datosParaEnvio,
        modoMultiEstanque
      );

      if (resultado.success) {
        // ✅ ÉXITO
        console.log("🎉 Consumo guardado exitosamente");
        setIsSaved(true);
        setHasError(false);

        // En handleSubmitWrapper, después de setIsSaved(true):
        if (typeof onComplete === "function") {
          onComplete(resultado);
        }
      } else {
        // ❌ ERROR
        console.error("💥 Error al guardar consumo:", resultado.message);
        setHasError(true);
        setErrorMessage(resultado.message);
        setIsSaved(false);
      }
    } catch (error) {
      console.error("💥 Error inesperado:", error);
      setHasError(true);
      setErrorMessage(
        error.message || "Error inesperado al guardar el consumo"
      );
      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  }, [
    modoMultiEstanque,
    formData,
    estanquesDisponibles,
    distribucionLitros,
    estanqueSeleccionado,
    userInfo,
    solicitante,
    categoriaSeleccionada,
    patenteSeleccionada,
    idFaena,
    tieneEstanquesSeleccionados,
    distribucionCompleta,
    stockSuficienteMulti,
    onComplete,
    resetFlow,
    determinarTipoOperacion,
  ]);

  // Formatea la fecha para mostrarla en formato legible
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

  // Determina si hay un error en el numeral final
  const hasNumeralError =
    parseFloat(formData.numeralFinal) <= parseFloat(formData.numeralInicial) &&
    formData.numeralFinal &&
    formData.numeralInicial;

  // Asegurarse de que idFaena sea un valor numérico
  const faenaIdForSelector =
    idFaena !== undefined && idFaena !== null ? Number(idFaena) : null;

  // Verificar si tenemos stock suficiente
  const tieneStockSuficiente = modoMultiEstanque
    ? stockSuficienteMulti && distribucionCompleta
    : estanqueSeleccionado &&
      estanqueSeleccionado.stock_actual >= litrosTotalesRequeridos;

  // Verificar si el formulario está completo para habilitar el botón
  const formularioCompleto =
    (modoMultiEstanque
      ? tieneEstanquesSeleccionados &&
        distribucionCompleta &&
        stockSuficienteMulti
      : estanqueSeleccionado) &&
    formData.numeralInicial &&
    formData.numeralFinal &&
    !hasNumeralError &&
    (showHorometro ? formData.horometro : true) &&
    (showKilometraje ? formData.kilometraje : true) &&
    parseFloat(formData.litros) > 0 &&
    tieneStockSuficiente;

  // 🆕 Obtener info del tipo de operación para mostrar
  const infoTipoOperacion = obtenerInfoTipoOperacion();

  return (
    <div className="space-y-4">
      {/* Mensajes de estado */}
      {hasError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 rounded flex items-start">
          <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 rounded flex items-start">
          <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">Consumo guardado correctamente</span>
        </div>
      )}

      {/* 🆕 INDICADOR DE TIPO DE OPERACIÓN */}
      {(estanqueSeleccionado ||
        (modoMultiEstanque && tieneEstanquesSeleccionados)) && (
        <div
          className={`rounded-lg p-3 border ${
            infoTipoOperacion.tipoOperacion === "estanque_movil"
              ? "bg-amber-50 border-amber-300"
              : "bg-blue-50 border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {infoTipoOperacion.tipoOperacion === "estanque_movil" ? (
                <FaTruck className="text-amber-600 mr-2" />
              ) : (
                <FaGasPump className="text-blue-600 mr-2" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Tipo de operación:{" "}
                  {infoTipoOperacion.tipoOperacion === "estanque_movil"
                    ? "Estanque Móvil"
                    : "Normal (Fijo)"}
                </p>
                {modoMultiEstanque && infoTipoOperacion.total > 0 && (
                  <p className="text-xs text-gray-600">
                    {infoTipoOperacion.estanquesFijos > 0 &&
                      `${infoTipoOperacion.estanquesFijos} fijo(s)`}
                    {infoTipoOperacion.esMixto && ", "}
                    {infoTipoOperacion.estanquesMoviles > 0 &&
                      `${infoTipoOperacion.estanquesMoviles} móvil(es)`}
                  </p>
                )}
                {!modoMultiEstanque && estanqueSeleccionado && (
                  <p className="text-xs text-gray-600">
                    {estanqueSeleccionado.nombre} -{" "}
                    {estanqueSeleccionado.tipo_estanque}
                  </p>
                )}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                infoTipoOperacion.tipoOperacion === "estanque_movil"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {infoTipoOperacion.tipoOperacion === "estanque_movil"
                ? "🚛 Móvil"
                : "🏗️ Fijo"}
            </span>
          </div>
        </div>
      )}

      {/* PASO 2: Datos de consumo */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="mb-3">
          <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
            <GiGasPump className="text-gray-600 mr-2" />
            Paso 1: Registre los datos de consumo
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Ingrese los datos que muestra la bomba después del suministro de
            combustible
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Fecha como campo de solo lectura */}
          <div className="col-span-1">
            <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
              Fecha y Hora de Registro
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-left text-sm text-gray-700 font-medium">
              {formatDate(formData.fechaHora)}
            </div>
          </div>

          {/* Campo de medición específico según tipo */}
          {showHorometro && (
            <div className="col-span-1">
              <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                <span className="flex items-center">
                  <FaClock className="text-gray-500 mr-1" size={14} />
                  Horómetro Actual <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.horometro}
                onChange={(e) => handleChange("horometro", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ej: 1234"
              />
            </div>
          )}

          {showKilometraje && (
            <div className="col-span-1">
              <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                <span className="flex items-center">
                  <FaTachometerAlt className="text-gray-500 mr-1" size={14} />
                  Kilometraje Actual <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.kilometraje}
                onChange={(e) => handleChange("kilometraje", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ej: 1234"
              />
            </div>
          )}

          {/* Numeral Inicial */}
          <div className="col-span-1">
            <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
              Numeral Inicial <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.numeralInicial}
              onChange={(e) => handleChange("numeralInicial", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ej: 100.5"
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
              value={formData.numeralFinal}
              onChange={(e) => handleChange("numeralFinal", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                hasNumeralError ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              placeholder="Ej: 150.5"
            />
            {hasNumeralError && (
              <p className="text-left text-xs text-red-500 mt-1">
                El numeral final debe ser mayor que el inicial
              </p>
            )}
          </div>

          {/* Litros - Calculado automáticamente */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
              Litros Consumidos
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.litros}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium cursor-not-allowed"
                placeholder="Se calcula automáticamente"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">L</span>
              </div>
            </div>
            <p className="text-left text-xs text-gray-500 mt-1">
              Calculado automáticamente: Numeral Final - Numeral Inicial
            </p>

            {/* Validación de stock suficiente */}
            {formData.litros && estanqueSeleccionado && !modoMultiEstanque && (
              <div className="mt-2">
                {tieneStockSuficiente ? (
                  <div className="flex items-center text-green-600 text-xs">
                    <FaCheckCircle className="mr-1" />
                    Stock suficiente en el estanque seleccionado
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 text-xs">
                    <FaExclamationTriangle className="mr-1" />
                    Stock insuficiente. Disponible:{" "}
                    {estanqueSeleccionado.stock_actual.toLocaleString()} L
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        <div className="mt-4">
          <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
            Observaciones
          </label>
          <textarea
            value={formData.observacion}
            onChange={(e) => handleChange("observacion", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Observaciones adicionales (opcional)"
            rows="3"
          />
        </div>
      </div>

      {/* PASO 1: Selector de Estanques */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="mb-3">
          <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
            <FaGasPump className="text-blue-600 mr-2" />
            Paso 2: Seleccione el/los estanque(s) a utilizar
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {modoMultiEstanque
              ? "Configure múltiples estanques para completar el consumo requerido"
              : "Elija el estanque del cual extraerá el combustible"}
          </p>
        </div>

        {/* Alerta de stock insuficiente */}
        {necesitaMultiEstanque && (
          <div className="mb-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 rounded">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">
                  Stock insuficiente en estanques individuales
                </p>
                <p>
                  Se requieren {litrosTotalesRequeridos.toLocaleString()}L.
                  Ningún estanque individual tiene suficiente stock. Use
                  múltiples estanques para completar el consumo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle de modo */}
        <div className="mb-4 flex items-center justify-between bg-white p-3 rounded border">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Modo de consumo
            </label>
            <p className="text-xs text-gray-500">
              {modoMultiEstanque
                ? "Consumo desde múltiples estanques"
                : "Consumo desde un solo estanque"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => toggleModoMultiEstanque(false)}
              disabled={necesitaMultiEstanque}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                !modoMultiEstanque
                  ? "bg-blue-600 text-white"
                  : necesitaMultiEstanque
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => toggleModoMultiEstanque(true)}
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center ${
                modoMultiEstanque
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              <FaLayerGroup className="mr-1" />
              Múltiple
            </button>
          </div>
        </div>

        {faenaIdForSelector ? (
          <>
            {/* MODO SIMPLE - Usando el SelectorEstanques original */}
            {!modoMultiEstanque && (
              <SelectorEstanques
                idFaena={faenaIdForSelector}
                onEstanqueSelect={onEstanqueSelect}
                estanqueSeleccionado={estanqueSeleccionado}
                litrosRequeridos={parseFloat(formData.litros) || 0}
                disabled={isSaving}
                preloadedEstanques={preloadedEstanques}
              />
            )}

            {/* MODO MÚLTIPLE - EXACTAMENTE igual al SelectorEstanques */}
            {modoMultiEstanque && (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                {/* Header idéntico al SelectorEstanques */}
                <div className="p-3 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                  <h3 className="font-medium text-gray-800 flex items-center">
                    <FaGasPump className="text-orange-500 mr-2" />
                    Seleccione Estanques
                  </h3>
                  <div className="flex items-center space-x-3 text-sm">
                    {/* Segmentador por tipo de estanque */}
                    {estanquesDisponibles.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {estanquesDisponibles.filter(
                          (e) => e.tipo_estanque === "fijo" || !e.tipo_estanque
                        ).length > 0 && (
                          <div className="flex items-center">
                            <FaGasPump
                              className="text-blue-600 mr-1"
                              size={12}
                            />
                            <span className="text-blue-600 text-xs font-medium">
                              {
                                estanquesDisponibles.filter(
                                  (e) =>
                                    e.tipo_estanque === "fijo" ||
                                    !e.tipo_estanque
                                ).length
                              }{" "}
                              Fijo(s)
                            </span>
                          </div>
                        )}
                        {estanquesDisponibles.filter(
                          (e) => e.tipo_estanque === "movil"
                        ).length > 0 && (
                          <div className="flex items-center">
                            <FaTruck
                              className="text-amber-600 mr-1"
                              size={12}
                            />
                            <span className="text-amber-600 text-xs font-medium">
                              {
                                estanquesDisponibles.filter(
                                  (e) => e.tipo_estanque === "movil"
                                ).length
                              }{" "}
                              Móvil(es)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Separador visual */}
                    {estanquesDisponibles.length > 0 && (
                      <div className="h-4 w-px bg-gray-300"></div>
                    )}

                    {/* Info total */}
                    {estanquesDisponibles.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {estanquesDisponibles.length} estanque
                        {estanquesDisponibles.length !== 1 ? "s" : ""}{" "}
                        disponible
                        {estanquesDisponibles.length !== 1 ? "s" : ""}
                      </div>
                    )}

                    {/* Indicador de precargado */}
                    <div className="text-xs text-green-600 flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Precargado
                    </div>
                  </div>
                </div>

                {/* Estado de carga idéntico */}
                {cargandoEstanques ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">
                      Cargando estanques...
                    </p>
                  </div>
                ) : estanquesDisponibles.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <FaInfoCircle className="text-yellow-500 text-xl" />
                    </div>
                    <p className="text-yellow-600">
                      No hay estanques disponibles para esta faena.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Lista de estanques con layout idéntico */}
                    <div className="max-h-[300px] overflow-y-auto p-3 grid gap-3 grid-cols-1 md:grid-cols-2">
                      {estanquesDisponibles.map((estanque) => {
                        const litrosAsignados =
                          distribucionLitros[estanque.id_estanque] || 0;
                        const stockActual = estanque.stock_actual || 0;
                        const capacidad = estanque.capacidad || 1000;
                        const porcentaje = Math.min(
                          Math.round((stockActual / capacidad) * 100),
                          100
                        );
                        const excedeStock = litrosAsignados > stockActual;
                        const tieneAsignacion = litrosAsignados > 0;
                        const esMovil = estanque.tipo_estanque === "movil";

                        // Función para color de barra idéntica al SelectorEstanques
                        const getColorBarra = (nivel) => {
                          if (nivel < 20) return "bg-red-500";
                          if (nivel < 50) return "bg-yellow-500";
                          return "bg-green-500";
                        };

                        return (
                          <div
                            key={estanque.id_estanque}
                            className={`w-full text-left border rounded-lg overflow-hidden transition-all duration-200 ${
                              tieneAsignacion
                                ? "border-orange-500 bg-orange-50 shadow-md"
                                : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            {/* Header idéntico al SelectorEstanques */}
                            <div className="p-3 border-b bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <h3 className="font-medium text-gray-800">
                                    {estanque.nombre}
                                  </h3>
                                  {/* Icono de tipo de estanque */}
                                  {esMovil && (
                                    <FaTruck
                                      className="ml-2 text-amber-600"
                                      size={12}
                                      title="Estanque Móvil"
                                    />
                                  )}
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    porcentaje < 20
                                      ? "bg-red-100 text-red-800"
                                      : porcentaje < 50
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {porcentaje}%
                                </span>
                              </div>
                            </div>

                            {/* Contenido idéntico al SelectorEstanques */}
                            <div className="p-3">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">
                                  Capacidad: {capacidad.toLocaleString()} L
                                </span>
                                <span className="font-medium">
                                  {stockActual.toLocaleString()} L disponibles
                                </span>
                              </div>

                              {/* Badge de tipo si es móvil */}
                              {esMovil && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    <FaTruck className="mr-1" size={8} />
                                    Móvil
                                  </span>
                                </div>
                              )}

                              {/* Barra de progreso idéntica */}
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                <div
                                  className={`h-2 rounded-full ${getColorBarra(
                                    porcentaje
                                  )}`}
                                  style={{ width: `${porcentaje}%` }}
                                ></div>
                              </div>

                              {/* Alerta de nivel crítico */}
                              {porcentaje < 20 && (
                                <div className="mb-3 text-xs text-red-600 flex items-center">
                                  <FaExclamationTriangle className="mr-1" />
                                  <span>Nivel crítico</span>
                                </div>
                              )}

                              {/* 🆕 ÚNICA DIFERENCIA: Input para litros */}
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
                                    onChange={(e) => {
                                      const valor =
                                        parseFloat(e.target.value) || 0;
                                      setDistribucionLitros((prev) => ({
                                        ...prev,
                                        [estanque.id_estanque]: valor,
                                      }));
                                    }}
                                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                      excedeStock
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-300 bg-white"
                                    }`}
                                    placeholder="0.00"
                                    disabled={isSaving}
                                  />
                                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-xs">
                                      L
                                    </span>
                                  </div>
                                </div>

                                {/* Mensaje de error simple */}
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

                    {/* Resumen simple al final */}
                    {litrosTotalesRequeridos > 0 && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-center">
                          <span className="text-gray-700">
                            Total distribuido:{" "}
                          </span>
                          <span
                            className={`font-medium ${
                              distribucionCompleta
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {litrosDistribuidos.toLocaleString()}/
                            {litrosTotalesRequeridos.toLocaleString()}L
                          </span>
                          {distribucionCompleta && (
                            <FaCheckCircle className="inline ml-1 text-green-600" />
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Información del estanque seleccionado (modo simple) */}
            {!modoMultiEstanque && estanqueSeleccionado && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-blue-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 flex items-center">
                      Estanque seleccionado: {estanqueSeleccionado.nombre}
                      {estanqueSeleccionado.tipo_estanque === "movil" && (
                        <FaTruck
                          className="ml-2 text-amber-600"
                          size={14}
                          title="Estanque Móvil"
                        />
                      )}
                    </p>
                    <p className="text-xs text-gray-600">
                      Stock disponible:{" "}
                      {estanqueSeleccionado.stock_actual.toLocaleString()}{" "}
                      litros
                      {estanqueSeleccionado.tipo_estanque && (
                        <span
                          className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            estanqueSeleccionado.tipo_estanque === "movil"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {estanqueSeleccionado.tipo_estanque === "movil"
                            ? "Móvil"
                            : "Fijo"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Seleccionado
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
            <div className="flex items-start">
              <FaInfoCircle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm">
                No se ha podido determinar la faena para cargar los estanques
                disponibles. Por favor, contacte al administrador del sistema.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botón de guardar */}
      <div className="pt-2">
        <button
          onClick={handleSubmitWrapper}
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
              <span>Guardando...</span>
            </>
          ) : isSaved ? (
            <>
              <FaCheckCircle className="mr-2" />
              <span>Guardado</span>
            </>
          ) : modoMultiEstanque ? (
            !tieneEstanquesSeleccionados ? (
              <>
                <FaLayerGroup className="mr-2" />
                <span>Asigne litros a los estanques</span>
              </>
            ) : !distribucionCompleta ? (
              <>
                <FaBalanceScale className="mr-2" />
                <span>Complete la distribución de litros</span>
              </>
            ) : !stockSuficienteMulti ? (
              <>
                <FaExclamationTriangle className="mr-2" />
                <span>Stock insuficiente en algunos estanques</span>
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                <span>Guardar Consumo Multi-Estanque</span>
              </>
            )
          ) : !estanqueSeleccionado ? (
            <>
              <FaGasPump className="mr-2" />
              <span>Seleccione un estanque primero</span>
            </>
          ) : !tieneStockSuficiente && formData.litros ? (
            <>
              <FaExclamationTriangle className="mr-2" />
              <span>Stock insuficiente</span>
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              <span>Guardar Consumo</span>
            </>
          )}
        </button>

        {/* Ayuda adicional */}
        {modoMultiEstanque ? (
          <div className="mt-2 text-xs text-gray-500 text-center">
            <p>
              {!tieneEstanquesSeleccionados &&
                "• Asigne litros a extraer de cada estanque"}
              {tieneEstanquesSeleccionados &&
                !distribucionCompleta &&
                `• Faltan ${(
                  litrosTotalesRequeridos - litrosDistribuidos
                ).toFixed(2)}L por distribuir`}
              {tieneEstanquesSeleccionados &&
                distribucionCompleta &&
                stockSuficienteMulti &&
                "✓ Multi-estanque configurado correctamente"}
            </p>
          </div>
        ) : (
          !estanqueSeleccionado && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Debe seleccionar un estanque antes de registrar los datos de
              consumo
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default ConsumoFormMultiEstanque;
