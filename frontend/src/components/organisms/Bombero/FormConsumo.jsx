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
  FaLayerGroup
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
  resetFlow
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
  const [errorMessage, setErrorMessage] = useState('');

  // ===================================
  // FUNCIÓN PARA ENVIAR CONSUMO AL BACKEND
  // ===================================
  const enviarConsumoAlBackend = async (datosConsumo, modoMultiEstanque) => {
    try {
      console.log('📤 Enviando consumo al backend...', datosConsumo);
      console.log('🔍 Props disponibles:', {
        solicitante,
        patenteSeleccionada,
        categoriaSeleccionada,
        userInfo,
        idFaena,
        estanqueSeleccionado
      });

      // 🔧 VALIDAR DATOS CRÍTICOS ANTES DE ENVIAR
      const id_dotacion = datosConsumo.id_dotacion || solicitante?.rut;
      const id_equipo = datosConsumo.id_equipo || patenteSeleccionada?.id_maquina || categoriaSeleccionada?.id_maquina;
      const id_usuario = datosConsumo.id_usuario || userInfo?.id;
      const id_faena = datosConsumo.id_faena || userInfo?.faena || idFaena;

      // ❌ VERIFICAR QUE LOS DATOS CRÍTICOS EXISTAN
      if (!id_dotacion) {
        throw new Error('❌ No se encontró el RUT del solicitante. Datos: ' + JSON.stringify(solicitante));
      }
      if (!id_equipo) {
        throw new Error('❌ No se encontró el ID del equipo. Datos: ' + JSON.stringify({patenteSeleccionada, categoriaSeleccionada}));
      }
      if (!id_usuario) {
        throw new Error('❌ No se encontró el ID del usuario. Datos: ' + JSON.stringify(userInfo));
      }
      if (!id_faena) {
        throw new Error('❌ No se encontró el ID de la faena. Datos: ' + JSON.stringify({userInfo, idFaena}));
      }

      console.log('✅ Datos críticos validados:', {id_dotacion, id_equipo, id_usuario, id_faena});

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
        tipo_consumo: modoMultiEstanque ? 'multiple' : 'simple',
        tipo_operacion: 'normal',
        
        // Datos de la bomba
        numeral_inicial: parseFloat(datosConsumo.numeralInicial) || 0,
        numeral_final: parseFloat(datosConsumo.numeralFinal) || 0,
        precio_litro: parseFloat(datosConsumo.precio_litro) || 1500,
        observacion: datosConsumo.observacion || null,
        
        // Datos específicos según el modo
        ...(modoMultiEstanque ? {
          // MODO MÚLTIPLE
          estanques_multiples: datosConsumo.estanques_multiples || []
        } : {
          // MODO SIMPLE
          id_estanque: datosConsumo.id_estanque || estanqueSeleccionado?.id_estanque,
          medicion: parseFloat(datosConsumo.medicion || datosConsumo.horometro || datosConsumo.kilometraje || 0)
        })
      };

      console.log('📦 Datos preparados para envío:', consumoData);

      // Realizar petición POST al backend
      const response = await axios.post('/api/consumos/multi', consumoData);

      if (response.data.success) {
        console.log('✅ Consumo creado exitosamente:', response.data.data);
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Error desconocido');
      }

    } catch (error) {
      console.error('❌ Error enviando consumo:', error);
      
      let errorMessage = 'Error al guardar el consumo';
      
      if (error.response?.data?.errors) {
        // Errores de validación
        const errores = Object.values(error.response.data.errors).flat();
        errorMessage = errores.join(', ');
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
        errors: error.response?.data?.errors || null
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
      console.log('🔄 Cargando estanques usando la misma lógica que modo simple...');
      
      const response = await bomberoService.getEstanques(idFaena);
      
      let estanques = [];
      
      if (response && response.estanques && Array.isArray(response.estanques)) {
        estanques = response.estanques;
      } else if (response && Array.isArray(response)) {
        estanques = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        estanques = response.data;
      }

      console.log('📦 Respuesta del servicio getEstanques:', response);
      console.log('✅ Estanques procesados:', estanques);
      
      setEstanquesDisponibles(estanques);

    } catch (error) {
      console.error('❌ Error cargando estanques:', error);
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
  }, [modoMultiEstanque, estanquesDisponibles.length, cargarEstanquesIgualQueSimple]);

  useEffect(() => {
    if (idFaena && estanquesDisponibles.length === 0 && !cargandoEstanques) {
      cargarEstanquesIgualQueSimple();
    }
  }, [idFaena, estanquesDisponibles.length, cargandoEstanques, cargarEstanquesIgualQueSimple]);

  // Verificar si necesitamos modo multi-estanque
  const litrosTotalesRequeridos = parseFloat(formData.litros) || 0;
  const stockTotalDisponible = estanquesDisponibles.reduce((total, est) => total + (est.stock_actual || 0), 0);
  const estanqueConStockSuficiente = estanquesDisponibles.find(est => (est.stock_actual || 0) >= litrosTotalesRequeridos);
  const necesitaMultiEstanque = litrosTotalesRequeridos > 0 && !estanqueConStockSuficiente && stockTotalDisponible >= litrosTotalesRequeridos;

  // Auto-activar modo multi-estanque si es necesario
  useEffect(() => {
    if (necesitaMultiEstanque && !modoMultiEstanque && litrosTotalesRequeridos > 0) {
      console.log('🔄 Auto-activando modo multi-estanque');
      setModoMultiEstanque(true);
      onEstanqueSelect(null);
      setDistribucionLitros({});
    }
  }, [necesitaMultiEstanque, modoMultiEstanque, litrosTotalesRequeridos, onEstanqueSelect]);

  // Validaciones para multi-estanque
  const litrosDistribuidos = Object.values(distribucionLitros).reduce((total, litros) => total + (parseFloat(litros) || 0), 0);
  const distribucionCompleta = Math.abs(litrosDistribuidos - litrosTotalesRequeridos) < 0.01;
  const tieneEstanquesSeleccionados = Object.keys(distribucionLitros).some(key => (distribucionLitros[key] || 0) > 0);
  const stockSuficienteMulti = Object.keys(distribucionLitros).every(estanqueId => {
    const litrosAsignados = distribucionLitros[estanqueId] || 0;
    if (litrosAsignados === 0) return true;
    const estanque = estanquesDisponibles.find(e => e.id_estanque === parseInt(estanqueId));
    return estanque && (estanque.stock_actual || 0) >= litrosAsignados;
  });

  // Función para cambiar modo
  const toggleModoMultiEstanque = useCallback((activar) => {
    console.log('🔄 Cambiando modo multi-estanque a:', activar);
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
  }, [onEstanqueSelect, estanquesDisponibles.length, cargarEstanquesIgualQueSimple]);

  // ===================================
  // FUNCIÓN PRINCIPAL DE ENVÍO
  // ===================================
  const handleSubmitWrapper = useCallback(async () => {
    console.log('🚀 Iniciando envío de consumo...');
    console.log('🔍 Props del componente:', {
      solicitante,
      patenteSeleccionada,
      categoriaSeleccionada,
      userInfo,
      idFaena,
      estanqueSeleccionado,
      formData
    });
    
    // ❌ VALIDACIONES PREVIAS
    if (!solicitante?.rut) {
      setHasError(true);
      setErrorMessage('Error: No se encontró el solicitante. Por favor, vuelva al paso anterior.');
      return;
    }

    const equipoId = patenteSeleccionada?.id_maquina || categoriaSeleccionada?.id_maquina;
    if (!equipoId) {
      setHasError(true);
      setErrorMessage('Error: No se encontró el equipo seleccionado. Por favor, vuelva al paso anterior.');
      return;
    }

    if (!userInfo?.id) {
      setHasError(true);
      setErrorMessage('Error: Usuario no autenticado. Por favor, inicie sesión nuevamente.');
      return;
    }

    const faenaId = userInfo?.faena || idFaena;
    if (!faenaId) {
      setHasError(true);
      setErrorMessage('Error: No se encontró la faena. Por favor, contacte al administrador.');
      return;
    }

    // Validaciones específicas por modo
    if (modoMultiEstanque) {
      if (!tieneEstanquesSeleccionados || !distribucionCompleta || !stockSuficienteMulti) {
        setHasError(true);
        setErrorMessage('Error: Complete correctamente la distribución de estanques múltiples.');
        return;
      }
    } else {
      if (!estanqueSeleccionado) {
        setHasError(true);
        setErrorMessage('Error: Debe seleccionar un estanque.');
        return;
      }
    }

    // Cambiar estado a "guardando"
    setIsSaving(true);
    setHasError(false);
    setIsSaved(false);
    setErrorMessage('');

    try {
      let datosParaEnvio;

      if (modoMultiEstanque) {
        // PREPARAR DATOS PARA CONSUMO MÚLTIPLE
        const estanquesConLitros = estanquesDisponibles
          .filter(estanque => (distribucionLitros[estanque.id_estanque] || 0) > 0)
          .map(estanque => ({
            id_estanque: estanque.id_estanque,
            litros: distribucionLitros[estanque.id_estanque],
            nombre_estanque: estanque.nombre
          }));

        datosParaEnvio = {
          ...formData,
          // ✅ ASEGURAR QUE LOS DATOS CRÍTICOS ESTÉN PRESENTES
          id_dotacion: solicitante.rut,
          id_equipo: equipoId,
          id_usuario: userInfo.id,
          id_faena: faenaId,
          es_consumo_multiple: true,
          estanques_multiples: estanquesConLitros
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
          es_consumo_multiple: false
        };
      }

      console.log('📋 Datos finales a enviar:', datosParaEnvio);

      // ENVIAR AL BACKEND
      const resultado = await enviarConsumoAlBackend(datosParaEnvio, modoMultiEstanque);

      if (resultado.success) {
        // ✅ ÉXITO
        console.log('🎉 Consumo guardado exitosamente');
        setIsSaved(true);
        setHasError(false);
        
     // En handleSubmitWrapper, después de setIsSaved(true):
if (typeof onComplete === 'function') {
  onComplete(resultado);
}

      } else {
        // ❌ ERROR
        console.error('💥 Error al guardar consumo:', resultado.message);
        setHasError(true);
        setErrorMessage(resultado.message);
        setIsSaved(false);
      }

    } catch (error) {
      console.error('💥 Error inesperado:', error);
      setHasError(true);
      setErrorMessage(error.message || 'Error inesperado al guardar el consumo');
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
    resetFlow
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
    ? (stockSuficienteMulti && distribucionCompleta)
    : (estanqueSeleccionado && estanqueSeleccionado.stock_actual >= litrosTotalesRequeridos);

  // Verificar si el formulario está completo para habilitar el botón
  const formularioCompleto = (modoMultiEstanque 
    ? (tieneEstanquesSeleccionados && distribucionCompleta && stockSuficienteMulti)
    : estanqueSeleccionado) &&
    formData.numeralInicial &&
    formData.numeralFinal &&
    !hasNumeralError &&
    (showHorometro ? formData.horometro : true) &&
    (showKilometraje ? formData.kilometraje : true) &&
    parseFloat(formData.litros) > 0 &&
    tieneStockSuficiente;

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

      {/* PASO 2: Datos de consumo */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="mb-3">
          <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
            <GiGasPump className="text-gray-600 mr-2" />
            Paso 2: Registre los datos de consumo
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Ingrese los datos que muestra la bomba después del suministro de combustible
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
                hasNumeralError
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
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
            Paso 1: Seleccione el/los estanque(s) a utilizar
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {modoMultiEstanque 
              ? "Configure múltiples estanques para completar el consumo requerido"
              : "Elija el estanque del cual extraerá el combustible"
            }
          </p>
        </div>

        {/* Alerta de stock insuficiente */}
        {necesitaMultiEstanque && (
          <div className="mb-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 rounded">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Stock insuficiente en estanques individuales</p>
                <p>Se requieren {litrosTotalesRequeridos.toLocaleString()}L. Ningún estanque individual tiene suficiente stock. 
                   Use múltiples estanques para completar el consumo.</p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle de modo */}
        <div className="mb-4 flex items-center justify-between bg-white p-3 rounded border">
          <div>
            <label className="text-sm font-medium text-gray-700">Modo de consumo</label>
            <p className="text-xs text-gray-500">
              {modoMultiEstanque ? "Consumo desde múltiples estanques" : "Consumo desde un solo estanque"}
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

            {/* MODO MÚLTIPLE - MISMO FORMATO VISUAL que SelectorEstanques */}
            {modoMultiEstanque && (
              <div className="space-y-3">
                {/* Estado de carga */}
                {cargandoEstanques && (
                  <div className="flex items-center justify-center p-4 bg-white rounded border">
                    <FaSpinner className="animate-spin mr-2 text-blue-600" />
                    <span className="text-sm text-gray-600">Cargando estanques...</span>
                  </div>
                )}

                {/* Mensaje si no hay estanques */}
                {!cargandoEstanques && estanquesDisponibles.length === 0 && (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
                    <div className="flex items-start">
                      <FaInfoCircle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm">No hay estanques disponibles para esta faena.</span>
                    </div>
                  </div>
                )}

                {/* Header igual que SelectorEstanques */}
                {estanquesDisponibles.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaGasPump className="text-orange-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Seleccione Estanques</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600">{estanquesDisponibles.length} estanques disponibles</span>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-green-600 text-xs">Precargado</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid de estanques - MISMO FORMATO que el original */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {estanquesDisponibles.map((estanque) => {
                        const litrosAsignados = distribucionLitros[estanque.id_estanque] || 0;
                        const stockActual = estanque.stock_actual || 0;
                        const capacidad = estanque.capacidad || 1000;
                        const porcentajeStock = Math.round((stockActual / capacidad) * 100);
                        const excedeStock = litrosAsignados > stockActual;
                        const tieneAsignacion = litrosAsignados > 0;
                        
                        return (
                          <div 
                            key={estanque.id_estanque} 
                            className={`relative border-2 rounded-lg p-4 transition-all ${
                              tieneAsignacion
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                          >
                            {/* Header del estanque igual que el original */}
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-800">
                                {estanque.nombre}
                              </h3>
                              <div className="text-right">
                                <div className={`text-sm font-medium ${stockActual > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {porcentajeStock}%
                                </div>
                              </div>
                            </div>

                            {/* Info de capacidad y stock - formato original */}
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                              <div>
                                <span className="text-gray-500">Capacidad:</span>
                                <span className="ml-1 text-gray-700">{capacidad.toLocaleString()} L</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Stock Actual:</span>
                                <span className={`ml-1 font-medium ${stockActual > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {stockActual.toLocaleString()} L disponibles
                                </span>
                              </div>
                            </div>

                            {/* Barra de progreso igual que el original */}
                            <div className="mb-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(porcentajeStock, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* INPUT PARA LITROS - LA ÚNICA DIFERENCIA */}
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Litros a extraer:
                              </label>
                              <div className="relative w-full">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={stockActual}
                                  value={litrosAsignados || ""}
                                  onChange={(e) => {
                                    const valor = parseFloat(e.target.value) || 0;
                                    setDistribucionLitros(prev => ({
                                      ...prev,
                                      [estanque.id_estanque]: valor
                                    }));
                                  }}
                                  className={`w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                    excedeStock 
                                      ? 'border-red-500 bg-red-50' 
                                      : 'border-gray-300 bg-white'
                                  }`}
                                  placeholder="0.00"
                                  disabled={isSaving}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 text-xs">L</span>
                                </div>
                              </div>
                              
                              {/* Solo mostrar error si excede stock */}
                              {excedeStock && (
                                <p className="text-xs text-red-500 mt-1">
                                  Excede stock disponible
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Resumen compacto estilo el original */}
                    {litrosTotalesRequeridos > 0 && (
                      <div className="bg-blue-50 border border-blue-300 rounded p-3">
                        <div className="text-sm text-center">
                          <span className="text-gray-700">Total distribuido: </span>
                          <span className={`font-medium ${distribucionCompleta ? 'text-green-600' : 'text-red-600'}`}>
                            {litrosDistribuidos.toLocaleString()}/{litrosTotalesRequeridos.toLocaleString()}L
                          </span>
                          {distribucionCompleta && <FaCheckCircle className="inline ml-1 text-green-600" />}
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
                    <p className="text-sm font-medium text-gray-800">
                      Estanque seleccionado: {estanqueSeleccionado.nombre}
                    </p>
                    <p className="text-xs text-gray-600">
                      Stock disponible:{" "}
                      {estanqueSeleccionado.stock_actual.toLocaleString()} litros
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
              {!tieneEstanquesSeleccionados && "• Asigne litros a extraer de cada estanque"}
              {tieneEstanquesSeleccionados && !distribucionCompleta && 
                `• Faltan ${(litrosTotalesRequeridos - litrosDistribuidos).toFixed(2)}L por distribuir`}
              {tieneEstanquesSeleccionados && distribucionCompleta && stockSuficienteMulti && 
                "✓ Multi-estanque configurado correctamente"}
            </p>
          </div>
        ) : (
          !estanqueSeleccionado && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Debe seleccionar un estanque antes de registrar los datos de consumo
            </p>
          )
        )}
      </div>

      {/* Panel de depuración (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded border text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info Multi-Estanque</summary>
            <div className="mt-2 space-y-1 font-mono">
              <div>Modo Multi: {modoMultiEstanque ? 'SÍ' : 'NO'}</div>
              <div>Necesita Multi: {necesitaMultiEstanque ? 'SÍ' : 'NO'}</div>
              <div>Litros Requeridos: {litrosTotalesRequeridos}</div>
              <div>Litros Distribuidos: {litrosDistribuidos}</div>
              <div>Distribución Completa: {distribucionCompleta ? 'SÍ' : 'NO'}</div>
              <div>Tiene Estanques Seleccionados: {tieneEstanquesSeleccionados ? 'SÍ' : 'NO'}</div>
              <div>Stock Suficiente Multi: {stockSuficienteMulti ? 'SÍ' : 'NO'}</div>
              <div>Formulario Completo: {formularioCompleto ? 'SÍ' : 'NO'}</div>
              <div>Estanques Disponibles: {estanquesDisponibles.length}</div>
              <div>Cargando Estanques: {cargandoEstanques ? 'SÍ' : 'NO'}</div>
              <div>ID Faena: {idFaena}</div>
              <div>isSaving: {isSaving ? 'SÍ' : 'NO'}</div>
              <div>isSaved: {isSaved ? 'SÍ' : 'NO'}</div>
              <div>hasError: {hasError ? 'SÍ' : 'NO'}</div>
              <div>Solicitante RUT: {solicitante?.rut || 'No disponible'}</div>
              <div>ID Usuario: {userInfo?.id || 'No disponible'}</div>
              <div>ID Equipo: {patenteSeleccionada?.id_maquina || categoriaSeleccionada?.id_maquina || 'No disponible'}</div>
              {estanquesDisponibles.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">Estanques cargados:</div>
                  {estanquesDisponibles.map(est => (
                    <div key={est.id_estanque} className="ml-2 text-xs">
                      {est.nombre}: {est.stock_actual}L (ID: {est.id_estanque})
                    </div>
                  ))}
                </div>
              )}
              {modoMultiEstanque && Object.keys(distribucionLitros).length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">Distribución detallada:</div>
                  {Object.entries(distribucionLitros).map(([estanqueId, litros]) => {
                    if (litros > 0) {
                      const estanque = estanquesDisponibles.find(e => e.id_estanque === parseInt(estanqueId));
                      return (
                        <div key={estanqueId} className="ml-2 text-xs">
                          {estanque?.nombre || `Estanque ${estanqueId}`}: {litros}L
                          {estanque && ` (Stock: ${estanque.stock_actual}L)`}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default ConsumoFormMultiEstanque;