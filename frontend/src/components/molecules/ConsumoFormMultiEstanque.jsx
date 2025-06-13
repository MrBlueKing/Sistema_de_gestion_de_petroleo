import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import SelectorEstanquesConModos from "../../molecules/SelectorEstanquesConModos"; // Nuevo componente
import bomberoService from "../../../context/bomberoService";
import axios from "../../../lib/axios";

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

  // Estados para multi-estanques (ahora manejados por el componente hijo)
  const [modoMultiEstanque, setModoMultiEstanque] = useState(false);
  const [distribucionLitros, setDistribucionLitros] = useState({});
  const [estanquesDisponibles, setEstanquesDisponibles] = useState([]);

  // Estados para el manejo del envío
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handlers para el componente de selección de estanques
  const handleModoChange = useCallback((nuevoModo) => {
    setModoMultiEstanque(nuevoModo);
  }, []);

  const handleDistribucionChange = useCallback((nuevaDistribucion) => {
    setDistribucionLitros(nuevaDistribucion);
  }, []);

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
            tipo: estanqueSeleccionado.tipo_estanque,
            tipo_operacion: tipoOperacion,
          });
        }
      }

      return tipoOperacion;
    },
    [modoMultiEstanque, estanquesDisponibles, distribucionLitros, estanqueSeleccionado]
  );

  // Calcular valores para validaciones
  const litrosTotalesRequeridos = parseFloat(formData.litros) || 0;
  const litrosDistribuidos = Object.values(distribucionLitros).reduce(
    (suma, litros) => suma + (parseFloat(litros) || 0),
    0
  );

  const tieneEstanquesSeleccionados = Object.values(distribucionLitros).some(
    (litros) => (parseFloat(litros) || 0) > 0
  );

  const distribucionCompleta =
    Math.abs(litrosDistribuidos - litrosTotalesRequeridos) < 0.01;

  const stockSuficienteMulti = Object.entries(distribucionLitros).every(
    ([estanqueId, litros]) => {
      const estanque = estanquesDisponibles.find(
        (e) => e.id_estanque.toString() === estanqueId.toString()
      );
      return !estanque || (estanque.stock_actual || 0) >= (parseFloat(litros) || 0);
    }
  );

  const tieneStockSuficiente =
    !estanqueSeleccionado ||
    !formData.litros ||
    (estanqueSeleccionado.stock_actual || 0) >= parseFloat(formData.litros);

  // ===================================
  // FUNCIÓN PRINCIPAL DE ENVÍO
  // ===================================
  const handleSubmitWrapper = useCallback(async () => {
    console.log("🚀 Iniciando envío de consumo...");

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

      // ✅ AGREGAR TIPO DE OPERACIÓN
      const tipoOperacion = determinarTipoOperacion(modoMultiEstanque);
      datosParaEnvio.tipo_operacion = tipoOperacion;

      console.log("📤 Datos finales para envío:", datosParaEnvio);

      // ENVÍO AL SERVIDOR
      const response = await axios.post("/consumo", datosParaEnvio);

      console.log("✅ Respuesta del servidor:", response.data);

      // Marcar como guardado exitoso
      setIsSaved(true);
      setHasError(false);

      // Llamar al callback de completado si existe
      if (onComplete) {
        setTimeout(() => {
          onComplete(response.data);
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Error al guardar el consumo:", error);

      setHasError(true);
      setIsSaved(false);

      let mensajeError = "Error inesperado al guardar el consumo.";

      if (error.response) {
        const { status, data } = error.response;
        console.error("📋 Detalles del error:", { status, data });

        if (status === 400 && data?.message) {
          mensajeError = `Error de validación: ${data.message}`;
        } else if (status === 409 && data?.message) {
          mensajeError = `Conflicto: ${data.message}`;
        } else if (status >= 500) {
          mensajeError = "Error del servidor. Intente nuevamente.";
        } else if (data?.message) {
          mensajeError = data.message;
        }
      } else if (error.request) {
        mensajeError =
          "No se pudo conectar con el servidor. Verifique su conexión.";
      } else {
        mensajeError = error.message || "Error inesperado.";
      }

      setErrorMessage(mensajeError);
    } finally {
      setIsSaving(false);
    }
  }, [
    solicitante,
    patenteSeleccionada,
    categoriaSeleccionada,
    userInfo,
    idFaena,
    formData,
    modoMultiEstanque,
    tieneEstanquesSeleccionados,
    distribucionCompleta,
    stockSuficienteMulti,
    estanqueSeleccionado,
    estanquesDisponibles,
    distribucionLitros,
    determinarTipoOperacion,
    onComplete,
  ]);

  // ===================================
  // RESUMEN DE OPERACIÓN
  // ===================================
  const resumenOperacion = useMemo(() => {
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

  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header del formulario */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
        <h2 className="text-lg font-bold text-center flex items-center justify-center">
          <GiGasPump className="mr-2 text-xl" />
          Formulario de Consumo
        </h2>
        <p className="text-sm text-center mt-1 opacity-90">
          Complete los datos del consumo de combustible
        </p>
      </div>

      {/* Mensaje de error global */}
      {hasError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 m-4 rounded">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Error al procesar</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {isSaved && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 m-4 rounded">
          <div className="flex items-start">
            <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">¡Consumo guardado exitosamente!</p>
              <p>Los datos han sido registrados correctamente.</p>
            </div>
          </div>
        </div>
      )}

      {/* PASO 1: Datos del Consumo */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base mb-3 flex items-center">
          <FaInfoCircle className="text-orange-600 mr-2" />
          Paso 1: Datos del Consumo
        </h3>

        {/* Litros */}
        <div className="mb-4">
          <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
            Litros *
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.litros}
            onChange={(e) => handleChange("litros", e.target.value)}
            disabled={isSaving || isSaved}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ingrese la cantidad de litros"
          />
        </div>

        {/* Condicional: Mostrar Horómetro o Kilometraje */}
        <div className="grid grid-cols-1 gap-4">
          {showHorometro && (
            <div>
              <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                <FaClock className="inline mr-1 text-orange-600" />
                Horómetro Inicial *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.horometro_inicial}
                onChange={(e) =>
                  handleChange("horometro_inicial", e.target.value)
                }
                disabled={isSaving || isSaved}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Horómetro inicial"
              />
            </div>
          )}

          {showKilometraje && (
            <div>
              <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                <FaTachometerAlt className="inline mr-1 text-orange-600" />
                Kilometraje Inicial *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.kilometraje_inicial}
                onChange={(e) =>
                  handleChange("kilometraje_inicial", e.target.value)
                }
                disabled={isSaving || isSaved}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Kilometraje inicial"
              />
            </div>
          )}
        </div>

        {/* Validación de stock para modo simple */}
        <div className="mt-3">
          <div className="mb-2">
            {!modoMultiEstanque && estanqueSeleccionado && formData.litros && (
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
            disabled={isSaving || isSaved}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Observaciones adicionales (opcional)"
            rows="3"
          />
        </div>
      </div>

      {/* PASO 2: Selector de Estanques - AHORA USANDO EL COMPONENTE REUTILIZABLE */}
      <SelectorEstanquesConModos
        idFaena={idFaena}
        formData={formData}
        estanqueSeleccionado={estanqueSeleccionado}
        onEstanqueSelect={onEstanqueSelect}
        preloadedEstanques={preloadedEstanques}
        disabled={isSaving || isSaved}
        onModoChange={handleModoChange}
        onDistribucionChange={handleDistribucionChange}
        showTitle={true}
        className=""
      />

      {/* Botón de envío */}
      <div className="p-4 bg-gray-50">
        <button
          onClick={handleSubmitWrapper}
          disabled={
            isSaving ||
            isSaved ||
            (modoMultiEstanque
              ? !tieneEstanquesSeleccionados ||
                !distribucionCompleta ||
                !stockSuficienteMulti
              : !estanqueSeleccionado || (!tieneStockSuficiente && formData.litros))
          }
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${
            isSaved
              ? "bg-green-600 text-white cursor-not-allowed"
              : isSaving
              ? "bg-orange-400 text-white cursor-not-allowed"
              : modoMultiEstanque
              ? !tieneEstanquesSeleccionados ||
                !distribucionCompleta ||
                !stockSuficienteMulti
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
              : !estanqueSeleccionado ||
                (!tieneStockSuficiente && formData.litros)
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
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