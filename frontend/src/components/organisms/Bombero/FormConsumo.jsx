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
  FaTimes, // <-- AGREGAR
  FaExclamationCircle, // <-- AGREGAR
} from "react-icons/fa";
import { GiGasPump } from "react-icons/gi";
import SelectorEstanque from "../../molecules/SelectorEstanque";
import bomberoService from "../../../context/bomberoService";
import axios from "../../../lib/axios";


// 🎨 COMPONENTE MODAL BONITO - VERSIÓN CORREGIDA
// 📱 MODAL DE VALIDACIÓN OPTIMIZADO - CON BOTONES Y SIN SCROLL
const ModalValidacion = ({ isOpen, onClose, onContinue, validacion }) => {
  // 🔒 PREVENIR SCROLL DEL BODY CUANDO EL MODAL ESTÁ ABIERTO
  React.useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;

      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restaurar scroll cuando se cierre el modal
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !validacion) return null;

  const esError = validacion.severidad === 'error';
  const esWarning = validacion.severidad === 'warning';

  // 🔒 PREVENIR CIERRE DEL MODAL AL HACER CLICK EN OVERLAY PARA ERRORES CRÍTICOS
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !esError) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* 📱 OVERLAY MÓVIL OPTIMIZADO */}
      <div
        className={`fixed inset-0 transition-all duration-300 ease-in-out ${isOpen
          ? 'bg-transparent bg-opacity-70 backdrop-blur-sm'
          : 'bg-transparent'
          }`}
        onClick={handleOverlayClick}
        style={{ touchAction: 'none' }}
      />

      {/* 📱 CONTENEDOR MODAL CENTRADO */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">

        {/* 📱 MODAL SIN SCROLL INTERNO */}
        <div
          className={`relative w-full max-w-md transform transition-all duration-300 ease-out ${isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4'
            } 
          bg-white rounded-2xl shadow-2xl overflow-hidden`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >

          {/* 🎨 BARRA SUPERIOR NARANJA */}
          <div className={`h-1 ${esError ? 'bg-red-500' : 'bg-orange-400'}`} />

          {/* 📱 CONTENIDO PRINCIPAL */}
          <div className="px-4 py-5 sm:px-6">

            {/* 🎨 HEADER */}
            <div className="flex items-start space-x-3 mb-5">

              {/* 🎨 ICONO NARANJA */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${esError ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                {esError ? (
                  <FaExclamationCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <FaExclamationTriangle className="w-6 h-6 text-orange-600" />
                )}
              </div>

              <div className="flex-1 text-left min-w-0">
                <h3
                  id="modal-headline"
                  className={`text-lg font-semibold leading-tight ${esError ? 'text-red-900' : 'text-orange-900'
                    }`}
                >
                  {esError ? '🚫 Error en Medición' : ' Advertencia de Medición'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {esError
                    ? 'Se detectó un valor incorrecto'
                    : 'Se detectó un valor anómalo, pero puedes continuar.'
                  }
                </p>
              </div>

              {/* 🔒 BOTÓN CERRAR SOLO PARA WARNINGS */}
              {!esError && (
                <button
                  onClick={onClose}
                  className="flex-shrink-0 rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 📱 CONTENIDO PRINCIPAL CON COLORES NARANJAS */}
            <div className={`p-4 mb-5 rounded-xl border border-l-4 ${esError
              ? 'bg-red-50 border-red-200 border-l-red-400'
              : 'bg-orange-50 border-orange-200 border-l-orange-400'
              }`}>

              {/* 📱 MENSAJE PRINCIPAL */}
              <div className="mb-4">
                <p className={`text-sm font-medium ${esError ? 'text-red-800' : 'text-orange-800'
                  }`}>
                  {validacion.mensaje}
                </p>
              </div>

              {/* 📱 DETALLES NUMÉRICOS */}
              {validacion.detalles && (
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {validacion.tipo === 'numeral_inicial' ? 'Numeral Ingresado' : 'Valor Ingresado'}
                        </p>
                        <p className={`text-xl font-bold ${esError ? 'text-red-600' : 'text-orange-600'
                          }`}>
                          {validacion.detalles.valorActual?.toLocaleString()}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {validacion.tipo === 'horometro' ? 'hrs' : validacion.tipo === 'numeral_inicial' ? 'L' : 'km'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {validacion.tipo === 'numeral_inicial' ? 'Numeral Sugerido' : 'Última Medición'}
                        </p>
                        <p className="text-xl font-bold text-gray-600">
                          {(validacion.detalles.valorAnterior || validacion.detalles.valorMinimo)?.toLocaleString()}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {validacion.tipo === 'horometro' ? 'hrs' : validacion.tipo === 'numeral_inicial' ? 'L' : 'km'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 📱 DIFERENCIA CALCULADA */}
                  {validacion.detalles.diferencia !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {validacion.tipo === 'horometro' ? 'Tiempo Transcurrido' : 'Distancia Recorrida'}
                        </p>
                        <p className={`text-lg font-bold ${validacion.detalles.diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                          {Math.abs(validacion.detalles.diferencia).toLocaleString()}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {validacion.tipo === 'horometro' ? 'hrs' : validacion.tipo === 'numeral_inicial' ? 'L' : 'km'}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📱 SUGERENCIA */}
              {validacion.detalles?.sugerencia && (
                <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-start gap-2">
                    <FaInfoCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />

                    <div>
                      <p className="mb-1 text-lg font-semibold text-blue-800">Sugerencia</p>
                      <p className="text-sm text-blue-700">{validacion.detalles.sugerencia}</p>
                    </div>
                  </div>
                </div>

              )}
            </div>

            {/* 📱 NOTA PARA ERRORES CRÍTICOS */}
            {esError && (
              <div className="mb-5 p-3 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <FaExclamationCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium text-center">
                    <strong>Corrección requerida:</strong> Este valor debe ser corregido antes de continuar.
                  </p>
                </div>
              </div>
            )}

            {/* 📱 BOTONES MÓVILES OPTIMIZADOS */}
            <div className="flex gap-3">

              {/* 🚫 BOTÓN CANCELAR/CORREGIR */}
              <button
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                style={{ minHeight: '48px' }}
              >
                <span className="mr-2">✏️</span>
                {esError ? 'Corregir Valor' : 'Cancelar'}
              </button>

              {/* ✅ BOTÓN CONTINUAR - Solo para warnings CON COLORES NARANJAS */}
              {!esError && (
                <button
                  onClick={onContinue}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  style={{ minHeight: '48px' }}
                >
                  <span className="mr-2">✅</span>
                  Continuar Igual
                </button>
              )}

              {/* ✅ BOTÓN PARA ERRORES CRÍTICOS */}
              {esError && (
                <button
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  style={{ minHeight: '48px' }}
                >
                  <span className="mr-2">🔧</span>
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const FormConsumo = ({
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

  // 🆕 NUEVAS PROPS del hook de última medición
  numeralInicialSugerido,
  loadingNumeralSugerido = false,
  errorNumeralSugerido = null,
  tieneConsumo = false,
  medicionFormateada = "0 km",

  // 🆕 PROP ADICIONAL: datos completos del hook para validaciones
  datosUltimaMedicion = null,
}) => {
  const DEBUG = false;
  const showHorometro = tipoMedicion === "Horometro";
  const showKilometraje = tipoMedicion === "Kilometraje";

  // Estados simplificados - ahora el selector maneja su propio estado
  const [modoMultiEstanque, setModoMultiEstanque] = useState(false);
  const [distribucionLitros, setDistribucionLitros] = useState({});
  const [estanquesDisponibles, setEstanquesDisponibles] = useState([]);

  // Estados para el manejo del envío
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🆕 Estado para controlar si ya se estableció el numeral inicial sugerido
  const [numeralInicialEstablecido, setNumeralInicialEstablecido] = useState(false);

  // 🆕 ESTADOS PARA VALIDACIONES DE MEDICIÓN
  const [validacionesMedicion, setValidacionesMedicion] = useState({
    kilometraje: { valido: true, mensaje: '', puedeIgnorar: false },
    horometro: { valido: true, mensaje: '', puedeIgnorar: false }
  });
  const [ignorarValidaciones, setIgnorarValidaciones] = useState({
    kilometraje: false,
    horometro: false
  });

  // 🆕 NUEVOS ESTADOS PARA EL MODAL
  const [modalValidacion, setModalValidacion] = useState({
    isOpen: false,
    validacion: null
  });

  // 🎯 ESTABLECER NUMERAL INICIAL INMEDIATAMENTE (backend ya maneja la lógica)
  useEffect(() => {
    if (!formData.numeralInicial && !numeralInicialEstablecido && !isSaving && !isSaved && numeralInicialSugerido) {
      console.log('🎯 Estableciendo numeral inicial sugerido desde backend:', numeralInicialSugerido);
      handleChange("numeralInicial", numeralInicialSugerido);
      setNumeralInicialEstablecido(true);
    }
  }, [
    numeralInicialSugerido, // 🎯 PRINCIPAL DEPENDENCIA
    formData.numeralInicial,
    numeralInicialEstablecido,
    isSaving,
    isSaved,
    handleChange
  ]);

  // 🆕 FUNCIÓN PARA VALIDAR MEDICIONES (KILOMETRAJE Y HORÓMETRO)
  const validarMedicion = useCallback((valor, tipo) => {
    if (!datosUltimaMedicion || !datosUltimaMedicion.tiene_consumo || !valor) {
      return { valido: true, mensaje: '', puedeIgnorar: false };
    }

    const valorActual = parseFloat(valor);
    const ultimaMedicion = datosUltimaMedicion.ultimo_consumo_maquina?.medicion || 0;

    if (tipo === 'kilometraje') {
      // ❌ ERROR CRÍTICO: No puede ser menor
      if (valorActual < ultimaMedicion) {
        return {
          valido: false,
          mensaje: `Menor que última medición (${ultimaMedicion.toLocaleString()} km)`,
          puedeIgnorar: false
        };
      }

      // ❌ ERROR CRÍTICO: No puede ser igual (mismo valor)
      if (valorActual === ultimaMedicion) {
        return {
          valido: false,
          mensaje: `Mismo valor que última medición (${ultimaMedicion.toLocaleString()} km)`,
          puedeIgnorar: false
        };
      }

      // ⚠️ ADVERTENCIA: Valor alto - necesita confirmación
      const limiteCuidadoKm = ultimaMedicion + 500;
      if (valorActual > limiteCuidadoKm) {
        return {
          valido: false,
          mensaje: `Recorrido alto (${(valorActual - ultimaMedicion).toLocaleString()} km) - Confirmar al guardar`,
          puedeIgnorar: true
        };
      }

    } else if (tipo === 'horometro') {
      // ❌ ERROR CRÍTICO: No puede ser menor
      if (valorActual < ultimaMedicion) {
        return {
          valido: false,
          mensaje: `Menor que última medición (${ultimaMedicion.toLocaleString()} hrs)`,
          puedeIgnorar: false
        };
      }

      // ❌ ERROR CRÍTICO: No puede ser igual (mismo valor)
      if (valorActual === ultimaMedicion) {
        return {
          valido: false,
          mensaje: `Mismo valor que última medición (${ultimaMedicion.toLocaleString()} hrs)`,
          puedeIgnorar: false
        };
      }

      // ⚠️ ADVERTENCIA: Valor alto - necesita confirmación
      const limiteCuidado = ultimaMedicion + 12;
      if (valorActual > limiteCuidado) {
        return {
          valido: false,
          mensaje: `Tiempo alto (${(valorActual - ultimaMedicion).toFixed(1)} hrs) - Confirmar al guardar`,
          puedeIgnorar: true
        };
      }
    }

    return { valido: true, mensaje: '', puedeIgnorar: false };
  }, [datosUltimaMedicion]);

  // 🆕 VALIDAR MEDICIONES CUANDO CAMBIEN LOS VALORES
  useEffect(() => {
    if (showKilometraje && formData.kilometraje) {
      const validacion = validarMedicion(formData.kilometraje, 'kilometraje');
      setValidacionesMedicion(prev => ({
        ...prev,
        kilometraje: validacion
      }));
    }
  }, [formData.kilometraje, showKilometraje, validarMedicion]);

  // 🆕 ESTABLECER AUTOMÁTICAMENTE VALORES SEGÚN TIPO DE ESTANQUE
  useEffect(() => {
    if (estanqueSeleccionado?.tipo_estanque === "movil" && formData.numeralInicial !== "0") {
      console.log('🚛 Estableciendo numeral inicial en 0 para estanque móvil');
      handleChange("numeralInicial", "0");
    } 
  }, [estanqueSeleccionado?.tipo_estanque, numeralInicialSugerido, formData.numeralInicial, handleChange]);

  useEffect(() => {
    if (showHorometro && formData.horometro) {
      const validacion = validarMedicion(formData.horometro, 'horometro');
      setValidacionesMedicion(prev => ({
        ...prev,
        horometro: validacion
      }));
    }
  }, [formData.horometro, showHorometro, validarMedicion]);

  // 🆕 FUNCIÓN PARA IGNORAR VALIDACIONES
  const handleIgnorarValidacion = (tipo) => {
    setIgnorarValidaciones(prev => ({
      ...prev,
      [tipo]: true
    }));
  };

  // ===================================
  // HANDLERS PARA EL SELECTOR EXTENDIDO
  // ===================================
  const handleModoChange = useCallback((nuevoModo) => {
    console.log("🔄 Cambiando modo a:", nuevoModo);
    setModoMultiEstanque(nuevoModo);
    if (nuevoModo) {
      setDistribucionLitros({});
    }
  }, []);

  const handleDistribucionChange = useCallback((nuevaDistribucion) => {
    console.log("📊 Nueva distribución:", nuevaDistribucion);
    setDistribucionLitros(nuevaDistribucion);
  }, []);

  // ===================================
  // FUNCIÓN PARA DETERMINAR TIPO DE OPERACIÓN
  // ===================================
  const determinarTipoOperacion = useCallback(
    (modoMultiple, estanquesUsados) => {
      let tipoOperacion = "normal";

      if (modoMultiple) {
        const estanquesConLitros = estanquesDisponibles.filter(
          (estanque) => (distribucionLitros[estanque.id_estanque] || 0) > 0
        );

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

      const id_dotacion = datosConsumo.id_dotacion || solicitante?.rut;
      const id_equipo =
        datosConsumo.id_equipo ||
        patenteSeleccionada?.id_maquina ||
        categoriaSeleccionada?.id_maquina;
      const id_usuario = datosConsumo.id_usuario || userInfo?.id;
      const id_faena = datosConsumo.id_faena || userInfo?.faena || idFaena;

      if (!id_dotacion) {
        throw new Error("❌ No se encontró el RUT del solicitante.");
      }
      if (!id_equipo) {
        throw new Error("❌ No se encontró el ID del equipo.");
      }
      if (!id_usuario) {
        throw new Error("❌ No se encontró el ID del usuario.");
      }
      if (!id_faena) {
        throw new Error("❌ No se encontró el ID de la faena.");
      }

      const tipoOperacion = determinarTipoOperacion(modoMultiEstanque);

      const consumoData = {
        id_dotacion,
        id_equipo,
        id_usuario,
        id_faena,
        fecha_consumo: datosConsumo.fecha_consumo || new Date().toISOString(),
        litros_consumidos: parseFloat(datosConsumo.litros) || 0,
        tipo_consumo: modoMultiEstanque ? "multiple" : "simple",
        tipo_operacion: tipoOperacion,

        medicion: parseFloat(
          datosConsumo.medicion ||
          datosConsumo.horometro ||
          datosConsumo.kilometraje ||
          0
        ),
        horometro: parseFloat(datosConsumo.horometro || 0),
        kilometraje: parseFloat(datosConsumo.kilometraje || 0),

        numeral_inicial: parseFloat(datosConsumo.numeralInicial) || 0,
        numeral_final: parseFloat(datosConsumo.numeralFinal) || 0,
        precio_litro: parseFloat(datosConsumo.precio_litro),
        observacion: datosConsumo.observacion || null,

        ...(modoMultiEstanque
          ? {
            estanques_multiples: datosConsumo.estanques_multiples || [],
          }
          : {
            id_estanque:
              datosConsumo.id_estanque || estanqueSeleccionado?.id_estanque,
          }),
      };

      console.log("📦 Datos preparados para envío:", consumoData);

      const endpoint = "/api/consumos/multi";
      const response = await axios.post(endpoint, consumoData);

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
        const errores = Object.values(error.response.data.errors).flat();
        errorMessage = errores.join(", ");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // ===================================
  // FUNCIÓN PARA CARGAR ESTANQUES
  // ===================================
  const cargarEstanquesIgualQueSimple = useCallback(async () => {
    if (!idFaena) return;

    try {
      console.log("🔄 Cargando estanques...");

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

      estanques.forEach((estanque) => {
        DEBUG && console.log(`🏷️ Estanque: ${estanque.nombre} - Tipo: ${estanque.tipo_estanque || "no definido"}`);
      });

      setEstanquesDisponibles(estanques);
    } catch (error) {
      console.error("❌ Error cargando estanques:", error);
      setEstanquesDisponibles([]);
    }
  }, [idFaena]);

  useEffect(() => {
    if (idFaena && estanquesDisponibles.length === 0) {
      cargarEstanquesIgualQueSimple();
    }
  }, [idFaena, estanquesDisponibles.length, cargarEstanquesIgualQueSimple]);

  // ===================================
  // CÁLCULOS Y VALIDACIONES
  // ===================================
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

  // ===================================
  // FUNCIÓN PRINCIPAL DE ENVÍO
  // ===================================
  const handleSubmitWrapper = useCallback(async () => {
    console.log("🚀 Iniciando envío de consumo...");

    // 🔧 VALIDACIONES PREVIAS (sin setear isSaving todavía)
    if (!solicitante?.rut) {
      setHasError(true);
      setErrorMessage("Error: No se encontró el solicitante. Por favor, vuelva al paso anterior.");
      return;
    }

    const equipoId = patenteSeleccionada?.id_maquina || categoriaSeleccionada?.id_maquina;
    if (!equipoId) {
      setHasError(true);
      setErrorMessage("Error: No se encontró el equipo seleccionado. Por favor, vuelva al paso anterior.");
      return;
    }

    if (!userInfo?.id) {
      setHasError(true);
      setErrorMessage("Error: Usuario no autenticado. Por favor, inicie sesión nuevamente.");
      return;
    }

    const faenaId = userInfo?.faena || idFaena;
    if (!faenaId) {
      setHasError(true);
      setErrorMessage("Error: No se encontró la faena. Por favor, contacte al administrador.");
      return;
    }

    if (modoMultiEstanque) {
      if (!tieneEstanquesSeleccionados || !distribucionCompleta || !stockSuficienteMulti) {
        setHasError(true);
        setErrorMessage("Error: Complete correctamente la distribución de estanques múltiples.");
        return;
      }
    } else {
      if (!estanqueSeleccionado) {
        setHasError(true);
        setErrorMessage("Error: Debe seleccionar un estanque.");
        return;
      }
    }

    // 🔧 FUNCIÓN DE VALIDACIÓN MEJORADA
    const validarMedicion = (datosUltimaMedicion, tipoMedicion, formData) => {
      console.log("🔍 Ejecutando validarMedicion con datos:", {
        datosUltimaMedicion,
        tipoMedicion,
        horometro: formData.horometro,
        kilometraje: formData.kilometraje
      });

      // ✅ Verificar si hay datos de última medición
      if (!datosUltimaMedicion || !datosUltimaMedicion.tiene_consumo) {
        console.log("ℹ️ No hay datos de última medición para validar");
        return { valido: true, mensaje: '', severidad: 'info' };
      }

      // ✅ Extraer la medición numérica del último consumo
      const ultimaMedicion = datosUltimaMedicion.ultimo_consumo_maquina?.medicion || 0;
      console.log("📊 Última medición extraída:", ultimaMedicion);

      // 🔧 VALIDACIÓN PARA HORÓMETRO
      if (tipoMedicion === "Horometro" && formData.horometro) {
        const horasActual = parseFloat(formData.horometro);
        console.log("⏰ Validando horómetro:", { horasActual, ultimaMedicion });

        // ❌ ERROR CRÍTICO: Horómetro menor que última medición
        if (horasActual < ultimaMedicion) {
          console.log("❌ Horómetro menor que última medición - ERROR CRÍTICO");
          return {
            valido: false,
            severidad: 'error',
            tipo: 'horometro',
            mensaje: `El horómetro no puede retroceder. El valor actual (${horasActual.toLocaleString()} hrs) es menor que la última medición registrada.`,
            detalles: {
              valorActual: horasActual,
              valorAnterior: ultimaMedicion,
              diferencia: ultimaMedicion - horasActual,
              sugerencia: `Verifique el horómetro. Debe ser mayor que ${ultimaMedicion.toLocaleString()} hrs.`
            }
          };
        }

        // ❌ ERROR CRÍTICO: Horómetro igual que última medición
        if (horasActual === ultimaMedicion) {
          console.log("❌ Horómetro igual que última medición - ERROR CRÍTICO");
          return {
            valido: false,
            severidad: 'error',
            tipo: 'horometro',
            mensaje: `El horómetro no puede tener el mismo valor que la última medición registrada (${ultimaMedicion.toLocaleString()} hrs).`,
            detalles: {
              valorActual: horasActual,
              valorAnterior: ultimaMedicion,
              diferencia: 0,
              sugerencia: `El horómetro debe haber avanzado. Ingrese un valor mayor que ${ultimaMedicion.toLocaleString()} hrs.`
            }
          };
        }

        // ⚠️ WARNING: Horómetro excesivo (MÁS DE 12 horas)
        const maximoEsperado = ultimaMedicion + 12;
        if (horasActual > maximoEsperado) {
          console.log("⚠️ Horómetro mayor que límite esperado - WARNING");
          return {
            valido: false,
            severidad: 'warning',
            tipo: 'horometro',
            mensaje: `El horómetro indica ${(horasActual - ultimaMedicion).toFixed(1)} horas de trabajo desde la última medición. ¿Está seguro de que es correcto?`,
            detalles: {
              valorActual: horasActual,
              valorAnterior: ultimaMedicion,
              diferencia: horasActual - ultimaMedicion,
              sugerencia: `Normalmente se esperan máximo 12 horas de trabajo. Verifique si ${horasActual.toLocaleString()} hrs es correcto.`
            }
          };
        }

        // ⚠️ WARNING: Horómetro alto pero razonable (6-12 horas)
        const limiteCuidado = ultimaMedicion + 12;
        if (horasActual > limiteCuidado) {
          console.log("⚠️ Horómetro en rango alto - WARNING");
          return {
            valido: false,
            severidad: 'warning',
            tipo: 'horometro',
            mensaje: `El horómetro indica ${(horasActual - ultimaMedicion).toFixed(1)} horas de trabajo. ¿Es correcto?`,
            detalles: {
              valorActual: horasActual,
              valorAnterior: ultimaMedicion,
              diferencia: horasActual - ultimaMedicion,
              sugerencia: `Se detectaron más de 12 horas de trabajo. Confirme si es correcto.`
            }
          };
        }
      }

      // 🔧 VALIDACIÓN PARA KILOMETRAJE
      if (tipoMedicion === "Kilometraje" && formData.kilometraje) {
        const kmActual = parseFloat(formData.kilometraje);
        console.log("🚗 Validando kilometraje:", { kmActual, ultimaMedicion });

        // ❌ ERROR CRÍTICO: Kilometraje menor que última medición
        if (kmActual < ultimaMedicion) {
          console.log("❌ Kilometraje menor que última medición - ERROR CRÍTICO");
          return {
            valido: false,
            severidad: 'error',
            tipo: 'kilometraje',
            mensaje: `El kilometraje no puede retroceder. El valor actual (${kmActual.toLocaleString()} km) es menor que la última medición registrada.`,
            detalles: {
              valorActual: kmActual,
              valorAnterior: ultimaMedicion,
              diferencia: ultimaMedicion - kmActual,
              sugerencia: `Verifique el odómetro. Debe ser mayor que ${ultimaMedicion.toLocaleString()} km.`
            }
          };
        }

        // ❌ ERROR CRÍTICO: Kilometraje igual que última medición
        if (kmActual === ultimaMedicion) {
          console.log("❌ Kilometraje igual que última medición - ERROR CRÍTICO");
          return {
            valido: false,
            severidad: 'error',
            tipo: 'kilometraje',
            mensaje: `El kilometraje no puede tener el mismo valor que la última medición registrada (${ultimaMedicion.toLocaleString()} km).`,
            detalles: {
              valorActual: kmActual,
              valorAnterior: ultimaMedicion,
              diferencia: 0,
              sugerencia: `El vehículo debe haber recorrido alguna distancia. Ingrese un valor mayor que ${ultimaMedicion.toLocaleString()} km.`
            }
          };
        }

        // ⚠️ WARNING: Kilometraje muy alto (+10,000 km)
        const limiteMuyAlto = ultimaMedicion + 10000;
        if (kmActual > limiteMuyAlto) {
          console.log("⚠️ Kilometraje muy alto - WARNING");
          return {
            valido: false,
            severidad: 'warning',
            tipo: 'kilometraje',
            mensaje: `El vehículo habría recorrido ${(kmActual - ultimaMedicion).toLocaleString()} km desde la última medición. ¿Está seguro?`,
            detalles: {
              valorActual: kmActual,
              valorAnterior: ultimaMedicion,
              diferencia: kmActual - ultimaMedicion,
              sugerencia: `Un recorrido de más de 10,000 km es inusual. Verifique si ${kmActual.toLocaleString()} km es correcto.`
            }
          };
        }

        // ⚠️ WARNING: Kilometraje alto pero razonable (1,000-10,000 km)
        const limiteCuidadoKm = ultimaMedicion + 500;
        if (kmActual > limiteCuidadoKm) {
          console.log("⚠️ Kilometraje en rango alto - WARNING");
          return {
            valido: false,
            severidad: 'warning',
            tipo: 'kilometraje',
            mensaje: `El vehículo habría recorrido ${(kmActual - ultimaMedicion).toLocaleString()} km. ¿Es correcto?`,
            detalles: {
              valorActual: kmActual,
              valorAnterior: ultimaMedicion,
              diferencia: kmActual - ultimaMedicion,
              sugerencia: `Se detectó un recorrido superior a 500 km. Confirme si es correcto.`
            }
          };
        }
      }
      // 🆕 VALIDACIÓN PARA NUMERAL INICIAL MODIFICADO
      if (estanqueSeleccionado?.tipo_estanque === "fijo" && numeralInicialSugerido && formData.numeralInicial) {
        const numeralIngresado = parseFloat(formData.numeralInicial);
        const numeralSugerido = parseFloat(numeralInicialSugerido);

        if (numeralIngresado !== numeralSugerido) {
          console.log("⚠️ Numeral inicial modificado - WARNING");
          return {
            valido: false,
            severidad: 'warning',
            tipo: 'numeral_inicial',
            mensaje: `Has modificado el numeral inicial de ${numeralSugerido.toLocaleString()} a ${numeralIngresado.toLocaleString()}. ¿Confirmas continuar?`,
            detalles: {
              valorActual: numeralIngresado,
              valorSugerido: numeralSugerido,
              diferencia: numeralIngresado - numeralSugerido,
              sugerencia: `El sistema sugiere ${numeralSugerido.toLocaleString()} basado en el último registro de la faena.`
            }
          };
        }
      }
      console.log("✅ Validación pasó correctamente");
      return { valido: true, mensaje: '', severidad: 'success' };
    };

    // 🔧 LIMPIAR ESTADOS ANTES DE VALIDAR
    setHasError(false);
    setErrorMessage("");

    // Ejecutar validación
    console.log("🎯 A punto de ejecutar validación...");
    const validacion = validarMedicion(datosUltimaMedicion, tipoMedicion, formData);
    console.log("🎯 Resultado de validación:", validacion);

    if (!validacion.valido) {
      console.log("⚠️ Validación falló, mostrando modal...");

      // 🎨 MOSTRAR MODAL EN LUGAR DE CONFIRM
      setModalValidacion({
        isOpen: true,
        validacion: validacion
      });

      // 🔧 NO SETEAR isSaving AQUÍ - el modal maneja su propio estado
      return; // Parar aquí y esperar respuesta del modal
    }

    // ✅ EJECUTAR EL ENVÍO REAL
    await ejecutarEnvioConsumo();
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
    datosUltimaMedicion,
    tipoMedicion,
  ]);

  // 🔧 FUNCIÓN SEPARADA PARA EL ENVÍO REAL
  // 🔧 FUNCIÓN SEPARADA PARA EL ENVÍO REAL - AGREGAR DESPUÉS DE handleSubmitWrapper
  const ejecutarEnvioConsumo = useCallback(async () => {
    // 🔧 SETEAR isSaving AL INICIO
    setIsSaving(true);
    try {
      let datosParaEnvio;

      if (modoMultiEstanque) {
        const estanquesConLitros = estanquesDisponibles
          .filter((estanque) => (distribucionLitros[estanque.id_estanque] || 0) > 0)
          .map((estanque) => ({
            id_estanque: estanque.id_estanque,
            litros: distribucionLitros[estanque.id_estanque],
            nombre_estanque: estanque.nombre,
          }));

        datosParaEnvio = {
          ...formData,
          id_dotacion: solicitante.rut,
          id_equipo: patenteSeleccionada?.id_maquina || categoriaSeleccionada?.id_maquina,
          id_usuario: userInfo.id,
          id_faena: userInfo?.faena || idFaena,
          es_consumo_multiple: true,
          estanques_multiples: estanquesConLitros,
          medicion: parseFloat(formData.horometro || formData.kilometraje || formData.medicion || 0),
          horometro: parseFloat(formData.horometro || 0),
          kilometraje: parseFloat(formData.kilometraje || 0),
        };
      } else {
        datosParaEnvio = {
          ...formData,
          id_dotacion: solicitante.rut,
          id_equipo: patenteSeleccionada?.id_maquina || categoriaSeleccionada?.id_maquina,
          id_usuario: userInfo.id,
          id_faena: userInfo?.faena || idFaena,
          id_estanque: estanqueSeleccionado.id_estanque,
          es_consumo_multiple: false,
        };
      }

      console.log("📋 Datos finales a enviar:", datosParaEnvio);

      const resultado = await enviarConsumoAlBackend(datosParaEnvio, modoMultiEstanque);

      if (resultado.success) {
        console.log("🎉 Consumo guardado exitosamente");
        setIsSaved(true);
        setHasError(false);

        if (typeof onComplete === "function") {
          onComplete(resultado);
        }
      } else {
        console.error("💥 Error al guardar consumo:", resultado.message);
        setHasError(true);
        setErrorMessage(resultado.message);
        setIsSaved(false);
      }
    } catch (error) {
      console.error("💥 Error inesperado:", error);
      setHasError(true);
      setErrorMessage(error.message || "Error inesperado al guardar el consumo");
      setIsSaved(false);
    } finally {
      // 🔧 CRÍTICO: SIEMPRE resetear isSaving en el finally
      setIsSaving(false);
    }
  }, [
    modoMultiEstanque,
    formData,
    estanquesDisponibles,
    distribucionLitros,
    estanqueSeleccionado,
    solicitante,
    categoriaSeleccionada,
    patenteSeleccionada,
    userInfo,
    idFaena,
    enviarConsumoAlBackend,
    onComplete
  ]);

  // 🎯 FUNCIONES PARA MANEJAR EL MODAL - CORREGIDAS
  const handleModalClose = () => {
    console.log("🚪 Cerrando modal");
    setModalValidacion({
      isOpen: false,
      validacion: null
    });
    // 🔧 NO resetear isSaving aquí porque nunca se seteó
  };

  // 🎯 SOLUCIÓN DEFINITIVA - handleModalContinue SIN setear isSaving
  const handleModalContinue = async () => {
    console.log("✅ Usuario decidió continuar desde modal");

    // 🔧 CERRAR EL MODAL PRIMERO
    setModalValidacion({
      isOpen: false,
      validacion: null
    });

    // 🔧 LIMPIAR ERRORES PREVIOS
    setHasError(false);
    setErrorMessage("");

    // 🔧 SOLO EJECUTAR - ejecutarEnvioConsumo maneja su propio isSaving
    await ejecutarEnvioConsumo();
  };

  // Funciones auxiliares
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

  const hasNumeralError =
    parseFloat(formData.numeralFinal) <= parseFloat(formData.numeralInicial) &&
    formData.numeralFinal &&
    formData.numeralInicial;

  const faenaIdForSelector =
    idFaena !== undefined && idFaena !== null ? Number(idFaena) : null;

  const tieneStockSuficiente = modoMultiEstanque
    ? stockSuficienteMulti && distribucionCompleta
    : estanqueSeleccionado &&
    estanqueSeleccionado.stock_actual >= litrosTotalesRequeridos;

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
    tieneStockSuficiente &&
    // 🎯 SOLO BLOQUEAR ERRORES CRÍTICOS (puedeIgnorar = false)
    (!showKilometraje || validacionesMedicion.kilometraje.valido || validacionesMedicion.kilometraje.puedeIgnorar) &&
    (!showHorometro || validacionesMedicion.horometro.valido || validacionesMedicion.horometro.puedeIgnorar);

  console.log("🔍 DEBUG Validaciones del formulario:", {
    estanqueSeleccionado: !!estanqueSeleccionado,
    numeralInicial: !!formData.numeralInicial,
    numeralFinal: !!formData.numeralFinal,
    hasNumeralError,
    showHorometro,
    horometro: formData.horometro,
    showKilometraje,
    kilometraje: formData.kilometraje,
    litros: parseFloat(formData.litros),
    tieneStockSuficiente,
    formularioCompleto
  });

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

      {/* 🆕 INDICADOR DE INFORMACIÓN DE ÚLTIMA MEDICIÓN */}
      {(tieneConsumo || medicionFormateada !== "0 km") && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <div className="flex items-center">
            <FaInfoCircle className="text-blue-500 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">
                Última medición registrada: <span className="font-bold">{medicionFormateada}</span>
              </p>
              {/* 🎯 MENSAJES CONDICIONALES SEGÚN TIPO DE ESTANQUE */}
              {estanqueSeleccionado?.tipo_estanque === "movil" && formData.numeralInicial === "0" && (
                <p className="text-left text-xs text-amber-600 mt-1 flex items-center">
                  <FaTruck className="mr-1" size={10} />
                  🚛 Extracción desde Estanque Móvil - Contador reinicia en 0
                </p>
              )}

              {estanqueSeleccionado?.tipo_estanque === "fijo" && numeralInicialSugerido && formData.numeralInicial === numeralInicialSugerido && (
                <p className="text-left text-xs text-green-600 mt-1 flex items-center">
                  <FaGasPump className="mr-1" size={10} />
                  ✓ Valor Extraído de Estanque Fijo: {parseFloat(numeralInicialSugerido).toLocaleString()}
                </p>
              )}

              {!estanqueSeleccionado && (
                <p className="text-left text-xs text-gray-500 mt-1">
                  💡 Seleccione un estanque para establecer el numeral inicial
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ModalValidacion
        isOpen={modalValidacion.isOpen}
        onClose={handleModalClose}
        onContinue={handleModalContinue}
        validacion={modalValidacion.validacion}
      />

      {/* 🆕 INDICADOR DE TIPO DE OPERACIÓN */}
      {(estanqueSeleccionado ||
        (modoMultiEstanque && tieneEstanquesSeleccionados)) && (
          <div
            className={`rounded-lg p-3 border ${infoTipoOperacion.tipoOperacion === "estanque_movil"
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
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${infoTipoOperacion.tipoOperacion === "estanque_movil"
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

      {/* PASO 1: Datos de consumo */}
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
                onBlur={() => {
                  if (formData.horometro) {
                    const validacion = validarMedicion(formData.horometro, 'horometro');
                    setValidacionesMedicion(prev => ({
                      ...prev,
                      horometro: validacion
                    }));
                  }
                }}
                disabled={isSaving || isSaved}
                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${!validacionesMedicion.horometro.valido
                  ? validacionesMedicion.horometro.puedeIgnorar
                    ? "border-yellow-400 bg-yellow-50"  // Advertencia (amarillo)
                    : "border-red-400 bg-red-50"        // Error crítico (rojo)
                  : "border-gray-300"
                  }`}
                placeholder="Ej: 1234"
              />
              {/* 🎨 MENSAJE MEJORADO CON COLORES SEGÚN SEVERIDAD */}
              {!validacionesMedicion.horometro.valido && (
                <p className={`text-xs mt-1 flex items-center ${validacionesMedicion.horometro.puedeIgnorar
                  ? "text-yellow-700"  // Advertencia
                  : "text-red-600"     // Error crítico
                  }`}>
                  {validacionesMedicion.horometro.puedeIgnorar ? (
                    <FaInfoCircle className="mr-1" size={10} />
                  ) : (
                    <FaExclamationTriangle className="mr-1" size={10} />
                  )}
                  {validacionesMedicion.horometro.mensaje}
                </p>
              )}
            </div>
          )}

          {showKilometraje && (
            <div className="col-span-1">
              <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
                <span className="flex items-center">
                  Kilometraje Actual <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.kilometraje}
                onChange={(e) => handleChange("kilometraje", e.target.value)}
                onBlur={() => {
                  if (formData.kilometraje) {
                    const validacion = validarMedicion(formData.kilometraje, 'kilometraje');
                    setValidacionesMedicion(prev => ({
                      ...prev,
                      kilometraje: validacion
                    }));
                  }
                }}
                disabled={isSaving || isSaved}
                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${!validacionesMedicion.kilometraje.valido
                  ? validacionesMedicion.kilometraje.puedeIgnorar
                    ? "border-yellow-400 bg-yellow-50"  // Advertencia (amarillo)
                    : "border-red-400 bg-red-50"        // Error crítico (rojo)
                  : "border-gray-300"
                  }`}
                placeholder="Ej: 12345"
              />
              {/* 🎨 MENSAJE MEJORADO CON COLORES SEGÚN SEVERIDAD */}
              {!validacionesMedicion.kilometraje.valido && (
                <p className={`text-xs mt-1 flex items-center ${validacionesMedicion.kilometraje.puedeIgnorar
                  ? "text-yellow-700"  // Advertencia
                  : "text-red-600"     // Error crítico
                  }`}>
                  {validacionesMedicion.kilometraje.puedeIgnorar ? (
                    <FaInfoCircle className="mr-1" size={10} />
                  ) : (
                    <FaExclamationTriangle className="mr-1" size={10} />
                  )}
                  {validacionesMedicion.kilometraje.mensaje}
                </p>
              )}
            </div>
          )}

          {/* 🆕 NUMERAL INICIAL CON INTEGRACIÓN DEL HOOK */}
          <div className="col-span-1">
            <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
              <span className="flex items-center">
                Numeral Inicial <span className="text-red-500">*</span>
                {loadingNumeralSugerido && (
                  <FaSpinner className="animate-spin ml-2 text-gray-400" size={12} />
                )}
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.numeralInicial}
                onChange={(e) => {
                  handleChange("numeralInicial", e.target.value);
                  // Marcar que el usuario modificó manualmente el valor
                  if (e.target.value !== numeralInicialSugerido) {
                    setNumeralInicialEstablecido(true);
                  }
                }}
                disabled={isSaving || isSaved}
                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${estanqueSeleccionado?.tipo_estanque === "movil"
                  ? "border-amber-300 bg-amber-50"  // 🚛 Estilo para móvil
                  : estanqueSeleccionado?.tipo_estanque === "fijo" && numeralInicialSugerido && formData.numeralInicial === numeralInicialSugerido
                    ? "border-green-300 bg-green-50"  // 🏗️ Estilo para fijo con sugerencia aplicada
                    : numeralInicialSugerido && !estanqueSeleccionado
                      ? "border-blue-300 bg-blue-50"   // 💡 Estilo cuando hay sugerencia pero no estanque
                      : "border-gray-300"              // 📝 Estilo normal
                  }`}
                placeholder="Ej: 100.5"
              />

              {/* 🎯 ICONOS CONDICIONALES MEJORADOS */}
              {estanqueSeleccionado?.tipo_estanque === "movil" && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaTruck className="text-amber-500" size={14} />
                </div>
              )}

              {estanqueSeleccionado?.tipo_estanque === "fijo" && numeralInicialSugerido && formData.numeralInicial === numeralInicialSugerido && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaCheckCircle className="text-green-500" size={14} />
                </div>
              )}

              {numeralInicialSugerido && !estanqueSeleccionado && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaInfoCircle className="text-blue-500" size={14} />
                </div>
              )}
            </div>

            {/* 🎯 MENSAJES INFORMATIVOS MEJORADOS */}
            {/* Mensaje cuando hay sugerencia pero no hay estanque seleccionado */}
            {numeralInicialSugerido && !estanqueSeleccionado && (
              <p className="text-left text-xs text-blue-600 mt-1 flex items-center">
                <FaInfoCircle className="mr-1" size={10} />
                Último consumo de la faena: {parseFloat(numeralInicialSugerido).toLocaleString()}L (se aplicará al seleccionar estanque fijo)
              </p>
            )}

            {/* Mensaje para estanque fijo con valor aplicado */}
            {estanqueSeleccionado?.tipo_estanque === "fijo" && numeralInicialSugerido && (
              <p className="text-left text-xs text-green-600 mt-1 flex items-center">
                <FaGasPump className="mr-1" size={10} />
                ✓ Valor aplicado del último registro de faena: {parseFloat(numeralInicialSugerido).toLocaleString()}L
                {formData.numeralInicial === numeralInicialSugerido && (
                  <span className="ml-2 text-green-700 font-medium">(Sugerido)</span>
                )}
              </p>
            )}

            {/* Mensaje para estanque móvil */}
            {estanqueSeleccionado?.tipo_estanque === "movil" && (
              <p className="text-left text-xs text-amber-600 mt-1 flex items-center">
                <FaTruck className="mr-1" size={10} />
                Estanque móvil - Contador automático en 0
              </p>
            )}

            {/* Error si existe */}
            {errorNumeralSugerido && (
              <p className="text-left text-xs text-red-500 mt-1">
                {errorNumeralSugerido}
              </p>
            )}
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
              disabled={isSaving || isSaved}
              className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${hasNumeralError ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
              placeholder="Ej: 150"
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
            disabled={isSaving || isSaved}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Observaciones adicionales (opcional)"
            rows="3"
          />
        </div>
      </div>

      {/* PASO 2: Selector de Estanques */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <SelectorEstanque
          idFaena={faenaIdForSelector}
          onEstanqueSelect={onEstanqueSelect}
          estanqueSeleccionado={estanqueSeleccionado}
          litrosRequeridos={parseFloat(formData.litros) || 0}
          disabled={isSaving || isSaved}
          preloadedEstanques={preloadedEstanques}
          tipoEstanque="todos"
          selectorId="form-consumo"
          // Props para modo múltiple
          modoMultiple={modoMultiEstanque}
          distribucionLitros={distribucionLitros}
          onDistribucionChange={handleDistribucionChange}
          mostrarToggle={true}
          onModoChange={handleModoChange}
          showTitle={true}
          className=""
        />

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
                      className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estanqueSeleccionado.tipo_estanque === "movil"
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
      </div>

      {/* Botón de guardar */}
      <div className="pt-2">
        <button
          onClick={handleSubmitWrapper}
          disabled={isSaving || isSaved || !formularioCompleto}
          className={`w-full md:w-auto px-6 py-2.5 rounded-lg flex items-center justify-center transition-colors ${isSaved
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
            } ${isSaving || isSaved || !formularioCompleto
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

export default FormConsumo;