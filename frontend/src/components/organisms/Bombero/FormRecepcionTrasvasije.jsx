import React, { useContext, useState, useEffect } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import EstanquesModal from "./EstanquesModal";
import SelectorEstanque from "../../molecules/SelectorEstanque";
import {
  FaHome,
  FaExclamationTriangle,
  FaCheck,
  FaFileAlt,
  FaGasPump,
  FaArrowRight,
  FaInfoCircle,
  FaSync,
  FaTruck,
  FaBuilding,
  FaExchangeAlt,
  FaCheckCircle,
  FaRuler,
  FaCalculator,
  FaOilCan
} from "react-icons/fa";
import { RiOilFill } from "react-icons/ri";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";

// Función de utilidad para formatear números
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0,00";
  }
  return parseFloat(num).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatNumberWithSeparators = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0,00";
  }
  return parseFloat(num).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// COMPONENTE MODAL DE ÉXITO
const ModalExitoTrasvasije = ({ isOpen, onConfirm, datosTrasvasije }) => {
  if (!isOpen) return null;

  const {
    litrosTransferidos,
    estanqueMovil,
    estanquesFijos,
    diferenciaMedicion,
    verificado
  } = datosTrasvasije;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm bg-opacity-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeInScale">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 text-white">
          <div className="flex items-center justify-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <FaCheckCircle className="text-2xl" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">
                ¡Trasvasije Registrado Exitosamente!
              </h2>
              <p className="text-green-100 text-sm mt-1">
                Móvil → Fijo
              </p>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-3">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <FaTruck className="text-white text-sm" />
                </div>
                <h3 className="font-semibold text-blue-800">Estanque Móvil</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700 text-sm">Origen:</span>
                  <span className="font-bold text-blue-900 text-sm">
                    {estanqueMovil}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center mb-3">
                <div className="bg-green-500 p-2 rounded-lg mr-3">
                  <FaOilCan className="text-white text-sm" />
                </div>
                <h3 className="font-semibold text-green-800">Trasvasije</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 text-sm">Litros:</span>
                  <span className="font-bold text-green-900">
                    {formatNumberWithSeparators(litrosTransferidos)} L
                  </span>
                </div>
                {diferenciaMedicion !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-green-700 text-sm">Diferencia:</span>
                    <span className={`font-bold text-sm ${Math.abs(diferenciaMedicion) <= 2 ? 'text-green-600' : Math.abs(diferenciaMedicion) <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatNumberWithSeparators(Math.abs(diferenciaMedicion))} L
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 mb-4">
            <h4 className="font-medium text-orange-800 mb-2 flex items-center">
              <FaBuilding className="mr-2 text-orange-600" />
              Estanques Fijos Destino
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {estanquesFijos.map((estanque, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="text-orange-700 text-sm">{estanque.nombre}:</span>
                  <span className="font-bold text-orange-900 text-sm">
                    {formatNumberWithSeparators(estanque.litros)} L
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <FaGasPump className="mr-2 text-gray-500" />
              Estado del Trasvasije
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className="ml-2 font-medium text-green-600">✓ Completado</span>
              </div>
              <div>
                <span className="text-gray-600">Verificación:</span>
                <span className={`ml-2 font-medium ${verificado ? 'text-green-600' : 'text-amber-600'}`}>
                  {verificado ? '✓ Verificado' : '⏳ Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onConfirm}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-sm"
            >
              <span>Continuar</span>
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE PRINCIPAL
const FormularioTrasvasije = () => {
  const { user, loading } = useContext(UserContext);

  // Estados principales del formulario
  const [formData, setFormData] = useState({
    id_usuario: '',
    id_faena: '',
    id_estanque_movil: '',
    litrosDocumentados: '',
    observacion: ''
  });

  // Estados para estanques disponibles
  const [estanquesMoviles, setEstanquesMoviles] = useState([]);
  const [estanquesFijos, setEstanquesFijos] = useState([]);
  const [estanqueMovilSeleccionado, setEstanqueMovilSeleccionado] = useState(null);

  // Estados para el cálculo
  const [calculoPetroleo, setCalculoPetroleo] = useState({
    litrosMedidos: 0,
    diferencia: 0,
    calculoRealizado: false,
  });

  const [alturasEstanques, setAlturasEstanques] = useState({});
  const [distribucionLitros, setDistribucionLitros] = useState({});
  const [stockInicial, setStockInicial] = useState(0);
  const [capacidadDisponible, setCapacidadDisponible] = useState(0);

  // Estados de UI
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [modalAlert, setModalAlert] = useState({ show: false, message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCalculo, setLoadingCalculo] = useState(false);

  // Estados para modales
  const [showEstanquesModal, setShowEstanquesModal] = useState(false);
  const [showExitoModal, setShowExitoModal] = useState(false);
  const [datosExito, setDatosExito] = useState(null);

  // ✅ VALIDACIÓN ADICIONAL: Asegurar que user.id existe antes de cualquier operación
  useEffect(() => {
    if (user?.id_faena && user?.id) {
      setFormData(prev => ({
        ...prev,
        id_faena: user.id_faena,
        id_usuario: user.id  // ← Asegurar que se guarde
      }));
      cargarEstanquesDisponibles(user.id_faena);
    }
  }, [user]);

  // Función para seleccionar estanque móvil
  const handleEstanqueMovilSelect = (estanque) => {
    console.log("🚛 Estanque móvil seleccionado:", estanque);
    setEstanqueMovilSeleccionado(estanque);

    setFormData(prev => ({
      ...prev,
      id_estanque_movil: estanque ? estanque.id_estanque : '',
      litrosDocumentados: estanque ? estanque.stock_actual.toString() : ''
    }));

    // Limpiar cálculo previo
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });
  };


  // 🔧 FUNCIÓN DE RESETEO COMPLETO MEJORADA
  const resetearFormularioCompleto = () => {
    console.log("🔄 Iniciando reseteo completo del formulario");

    // 1. Resetear datos del formulario (mantener usuario y faena)
    setFormData({
      id_usuario: user?.id || '',
      id_faena: user?.id_faena || '',
      id_estanque_movil: '',
      litrosDocumentados: '',
      observacion: ''
    });

    // 2. Limpiar selección de estanque móvil
    setEstanqueMovilSeleccionado(null);

    // 3. Resetear estados de cálculo
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });

    // 4. Limpiar alturas y distribución
    setAlturasEstanques({});
    setDistribucionLitros({});
    setStockInicial(0);

    // 5. Limpiar errores y estados de UI
    setErrors({});
    setTouched({});
    setAlert({ show: false, message: "", type: "" });
    setModalAlert({ show: false, message: "", type: "" });

    // 6. Cerrar modales si están abiertos
    setShowEstanquesModal(false);

    // 7. Reinicializar distribución para estanques fijos (si existen)
    if (estanquesFijos.length > 0) {
      const initialAlturas = {};
      const initialDistribucion = {};
      estanquesFijos.forEach((estanque) => {
        initialAlturas[estanque.id_estanque] = {
          inicial: "",
          final: "",
        };
        initialDistribucion[estanque.id_estanque] = "";
      });
      setAlturasEstanques(initialAlturas);
      setDistribucionLitros(initialDistribucion);
    }

    console.log("✅ Reseteo completo finalizado");
  };

  // ✅ REEMPLAZAR TU FUNCIÓN ACTUAL DEL MODAL POR ESTA:
  const handleModalConfirm = () => {
    console.log("✅ Trasvasije completado exitosamente, preparando nuevo formulario");

    // 1. Cerrar modal
    setShowExitoModal(false);
    setDatosExito(null);

    // 2. Mostrar loading temporal para mejor UX
    setLoading(true);

    // 3. Resetear formulario completo
    resetearFormularioCompleto();

    // 4. Recargar datos frescos (importante para stocks actualizados)
    if (user?.id_faena) {
      cargarEstanquesDisponibles(user.id_faena);
    }

    // 5. Mostrar confirmación y quitar loading
    setTimeout(() => {
      setLoading(false);
      mostrarAlerta("success", "📝 Formulario listo para un nuevo trasvasije");

      // 6. Scroll hacia arriba para mejor UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500); // Dar tiempo para que se carguen los datos
  };

  // Inicializar alturas cuando se cargan los estanques fijos
  useEffect(() => {
    if (estanquesFijos.length > 0) {
      const initialAlturas = {};
      const initialDistribucion = {};
      estanquesFijos.forEach((estanque) => {
        initialAlturas[estanque.id_estanque] = {
          inicial: "",
          final: "",
        };
        initialDistribucion[estanque.id_estanque] = "";
      });
      setAlturasEstanques(initialAlturas);
      setDistribucionLitros(initialDistribucion);
    }
  }, [estanquesFijos]);

  // Calcular capacidad disponible cuando se selecciona estanque móvil
  useEffect(() => {
    if (formData.id_estanque_movil) {
      const estanqueSeleccionado = estanquesMoviles.find(e => e.id_estanque == formData.id_estanque_movil);
      if (estanqueSeleccionado) {
        setFormData(prev => ({
          ...prev,
          litrosDocumentados: estanqueSeleccionado.stock_actual.toString()
        }));
      }
    }

    const totalCapacidadDisponible = estanquesFijos.reduce((total, estanque) => {
      return total + (estanque.capacidad - estanque.stock_actual);
    }, 0);
    setCapacidadDisponible(totalCapacidadDisponible);
  }, [formData.id_estanque_movil, estanquesMoviles, estanquesFijos]);

  // Cargar estanques disponibles
  const cargarEstanquesDisponibles = async (idFaena) => {
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      const response = await axios.get(`/api/trasvasijes/datos-formulario?id_faena=${idFaena}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const estanquesMovilesDisponibles = response.data.data.estanques_moviles.filter(e =>
          e.disponible_para_trasvasije && e.stock_actual > 0
        );

        setEstanquesMoviles(estanquesMovilesDisponibles);
        setEstanquesFijos(response.data.data.estanques_fijos);
      }
    } catch (error) {
      console.error("Error al cargar estanques:", error);
      mostrarAlerta("error", "Error al cargar los estanques disponibles.");
    }
  };

  // Mostrar alertas
  const mostrarAlerta = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const mostrarModalAlerta = (type, message) => {
    setModalAlert({ show: true, type, message });
    setTimeout(() => setModalAlert({ show: false, message: "", type: "" }), 4000);
  };

  // Manejar cambios en campos
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'litrosDocumentados' || field === 'id_estanque_movil') {
      setCalculoPetroleo({
        litrosMedidos: 0,
        diferencia: 0,
        calculoRealizado: false,
      });
    }
  };

  // Manejar cambios en alturas
  const handleAlturaChange = (estanqueId, value) => {
    setAlturasEstanques((prevState) => {
      if (
        typeof value === "object" &&
        (value.inicial !== undefined || value.final !== undefined)
      ) {
        return {
          ...prevState,
          [estanqueId]: {
            inicial:
              value.inicial !== undefined
                ? value.inicial
                : prevState[estanqueId]?.inicial || "",
            final:
              value.final !== undefined
                ? value.final
                : prevState[estanqueId]?.final || "",
          },
        };
      } else {
        console.warn("Formato de altura no estándar para estanque", estanqueId);
        return {
          ...prevState,
          [estanqueId]: {
            inicial: value || "",
            final: prevState[estanqueId]?.final || "",
          },
        };
      }
    });
    resetearCalculo();
  };

  // Manejar cambios en distribución - CORREGIDO PARA UN SOLO ESTANQUE
  // Manejar cambios en distribución - CORREGIDO PARA UN SOLO ESTANQUE
  const handleDistribucionChange = (nuevaDistribucionCompleta) => {
    console.log("🔄 Actualizando distribución:", nuevaDistribucionCompleta);
    setDistribucionLitros(nuevaDistribucionCompleta);
    resetearCalculo(); // ← Permitir recalcular

    // Validar que solo haya un estanque con litros asignados
    const estanquesConLitros = Object.entries(nuevaDistribucionCompleta)
      .filter(([id, litros]) => parseFloat(litros) > 0);

    if (estanquesConLitros.length > 1) {
      // Si hay más de un estanque, mantener solo el último modificado
      const ultimoEstanque = estanquesConLitros[estanquesConLitros.length - 1];
      const distribucionLimpia = {};

      estanquesFijos.forEach((estanque) => {
        distribucionLimpia[estanque.id_estanque] =
          estanque.id_estanque == ultimoEstanque[0] ? ultimoEstanque[1] : "";
      });

      setDistribucionLitros(distribucionLimpia);
      mostrarAlerta("warning", "⚠️ Solo puede trasvasijar a UN estanque fijo a la vez. Se ha limpiado la selección anterior.");
    } else {
      // Si hay 0 o 1 estanque, actualizar normalmente
      setDistribucionLitros(nuevaDistribucionCompleta);
      resetearCalculo(); // ← Permitir recalcular
    }

    // Limpiar cálculo previo cuando cambia la distribución
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });
  };

  // Función para obtener el estanque fijo seleccionado
  const obtenerEstanqueFijoSeleccionado = () => {
    const estanquesConDistribucion = Object.keys(distribucionLitros).filter(estanqueId => {
      const distribucion = parseFloat(distribucionLitros[estanqueId]) || 0;
      return distribucion > 0;
    });

    if (estanquesConDistribucion.length === 1) {
      return estanquesFijos.find(e => e.id_estanque == estanquesConDistribucion[0]);
    }
    return null;
  };

  // 🔧 FUNCIÓN CALCULAR LITROS CORREGIDA:
  const calcularLitrosPetroleo = async () => {
    console.log("🧮 Iniciando cálculo de litros de petróleo...");

    if (loadingCalculo) {
      console.log("⚠️ Cálculo en progreso, evitando duplicado");
      return;
    }

    // Validar que el usuario esté disponible
    if (!user || !user.id) {
      console.log("❌ Error: Usuario no identificado");
      mostrarModalAlerta("error", "No se puede identificar al usuario actual.");
      return;
    }

    if (!formData.litrosDocumentados || parseFloat(formData.litrosDocumentados) <= 0) {
      console.log("❌ Error: Faltan litros documentados");
      mostrarModalAlerta("error", "Debe ingresar los litros del estanque móvil.");
      return;
    }

    const totalDistribucion = Object.values(distribucionLitros).reduce((sum, val) => {
      return sum + (parseFloat(val) || 0);
    }, 0);

    if (totalDistribucion <= 0) {
      console.log("❌ Error: No hay distribución");
      mostrarModalAlerta("error", "Debe distribuir los litros en al menos un estanque fijo.");
      return;
    }

    if (Math.abs(totalDistribucion - parseFloat(formData.litrosDocumentados)) > 0.01) {
      console.log("❌ Error: Distribución no coincide");
      mostrarModalAlerta("error",
        `La distribución total (${formatNumber(totalDistribucion)} L) debe coincidir con los litros del móvil (${formatNumber(parseFloat(formData.litrosDocumentados))} L).`
      );
      return;
    }

    console.log("✅ Validaciones pasadas, preparando alturas...");
    setLoadingCalculo(true);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      // Preparar datos de alturas inicial y final
      const datosAlturasInicial = prepararDatosAlturas("inicial");
      const datosAlturasFinal = prepararDatosAlturas("final");

      console.log("📊 Datos para API:", {
        alturasInicial: datosAlturasInicial,
        alturasFinal: datosAlturasFinal,
        usuario: user.id
      });

      if (hayAlturasIncompletas(datosAlturasInicial)) {
        throw new Error("Faltan alturas iniciales");
      }

      if (hayAlturasIncompletas(datosAlturasFinal)) {
        throw new Error("Faltan alturas finales");
      }

      // ✅ CORREGIDO (con id_usuario):
      const payloadInicial = {
        id_faena: formData.id_faena,
        id_usuario: user.id,  // ← ¡ESTO FALTABA!
        tipo_movimiento: "ingreso",
        alturas: datosAlturasInicial,
      };

      const payloadFinal = {
        id_faena: formData.id_faena,
        id_usuario: user.id,        // ← AGREGADO
        tipo_movimiento: "ingreso",
        alturas: datosAlturasFinal,
      };

      console.log("📤 Enviando payloads corregidos:", { payloadInicial, payloadFinal });

      // Llamadas a la API
      const [responseInicial, responseFinal] = await Promise.all([
        axios.post("/api/calcular-litros-petroleo", payloadInicial, {
          headers: { Authorization: `Bearer ${token}` },
        }),

        axios.post("/api/calcular-litros-petroleo", payloadFinal, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      console.log("📊 Respuestas de API:", {
        inicial: responseInicial.data,
        final: responseFinal.data
      });

      if (responseInicial.data.success && responseFinal.data.success) {
        const resultado = procesarResultadosCalculo(responseInicial, responseFinal);
        console.log("✅ Cálculo completado:", resultado);
        return resultado;
      } else {
        console.log("❌ Alguna API falló");
        throw new Error("Error en el cálculo de volúmenes");
      }
    } catch (error) {
      console.error("❌ Error al calcular volumen:", error);

      // Mostrar el error específico de validación si está disponible
      let errorMessage = "Error al calcular el volumen. Intente nuevamente.";

      if (error.response?.data?.errors) {
        // Mostrar errores de validación específicos
        const errores = Object.values(error.response.data.errors).flat();
        errorMessage = `Errores de validación: ${errores.join(', ')}`;
        console.log("🔍 Errores de validación:", error.response.data.errors);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      mostrarModalAlerta("error", errorMessage);

      // Limpiar estado en caso de error
      setCalculoPetroleo({
        litrosMedidos: 0,
        diferencia: 0,
        calculoRealizado: false,
      });

      return null;
    } finally {
      setLoadingCalculo(false);
    }
  };


  // ✅ FUNCIÓN PARA RESETEAR CÁLCULO CUANDO SEA NECESARIO
  const resetearCalculo = () => {
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });
    console.log("🔄 Cálculo reseteado, se puede volver a calcular");
  };

  // ✅ ASEGURAR QUE prepararDatosAlturas DEVUELVE EL FORMATO CORRECTO:
  const prepararDatosAlturas = (tipoAltura) => {
    return Object.keys(alturasEstanques)
      .filter(estanqueId => {
        const distribucion = parseFloat(distribucionLitros[estanqueId]) || 0;
        return distribucion > 0;
      })
      .map(estanqueId => {
        const altura = alturasEstanques[estanqueId]?.[tipoAltura];
        const alturaNum = altura !== "" ? parseFloat(altura) : null;

        // ✅ VERIFICAR QUE NO SEA NULL O NaN
        if (alturaNum === null || isNaN(alturaNum)) {
          console.warn(`⚠️ Altura ${tipoAltura} inválida para estanque ${estanqueId}:`, altura);
          return null;
        }

        return {
          id_estanque: parseInt(estanqueId),
          altura: alturaNum,
        };
      })
      .filter(item => item !== null); // Filtrar elementos nulos
  };

  // Verificar alturas incompletas
  const hayAlturasIncompletas = (datosAlturas) => {
    return datosAlturas.some((item) => {
      return (
        item.altura === undefined ||
        item.altura === null ||
        Number.isNaN(item.altura)
      );
    });
  };

  // Procesar resultados del cálculo
  const procesarResultadosCalculo = (responseInicial, responseFinal) => {

    console.log("📊 Procesando resultados del cálculo...");

    const stockInicial = responseInicial.data.litros_totales || 0;
    const stockFinal = responseFinal.data.litros_totales || 0;
    const litrosIngresados = stockFinal - stockInicial;
    const litrosMovil = parseFloat(formData.litrosDocumentados);
    const diferencia = litrosIngresados - litrosMovil;

    console.log("📋 Datos calculados:", {
      stockInicial,
      stockFinal,
      litrosIngresados,
      litrosMovil,
      diferencia
    });

    setCalculoPetroleo({
      litrosMedidos: litrosIngresados,
      diferencia: diferencia,
      calculoRealizado: true,
    });

    console.log("✅ Estado calculoPetroleo actualizado");

    setFormData((prevFormData) => ({
      ...prevFormData,
      observacion: generarObservacionDiferencia(litrosMovil, litrosIngresados),
    }));

    setStockInicial(stockInicial);

    return {
      volInicial: stockInicial,
      volFinal: stockFinal,
      discrepanciaIni: stockInicial - 200,
      discrepanciaCam: diferencia,
    };
  };

  // Generar observación de diferencia
  const generarObservacionDiferencia = (litrosMovil, litrosMedidos) => {
    const diferencia = litrosMedidos - litrosMovil;
    return `Según cálculo de alturas, se detecta una diferencia de ${formatNumber(
      Math.abs(diferencia)
    )} litros ${diferencia > 0 ? "de más" : "de menos"
      } en el trasvasije. Litros del móvil: ${formatNumber(
        litrosMovil
      )}. Litros medidos: ${formatNumber(litrosMedidos)}.`;
  };

  // Validaciones actualizadas - SOLO UN ESTANQUE FIJO
  // ✅ VALIDACIONES MEJORADAS PARA FORMULARIO TRASVASIJE

  const validarFormularioCompleto = () => {
    const newErrors = {};

    console.log("🔍 Validando formulario completo:", {
      estanque_movil: formData.id_estanque_movil,
      litros_documentados: formData.litrosDocumentados,
      calculoRealizado: calculoPetroleo.calculoRealizado,
      distribucion: distribucionLitros
    });

    // Validar usuario
    if (!user || !user.id) {
      newErrors.usuario = "Error: Usuario no identificado";
      console.log("❌ Usuario no identificado:", user);
    }

    // Validar faena
    if (!formData.id_faena) {
      newErrors.faena = "Error: Faena no identificada";
      console.log("❌ Faena no identificada");
    }

    // ✅ 1. VALIDAR ESTANQUE MÓVIL
    if (!formData.id_estanque_movil) {
      console.log("❌ Falta estanque móvil");
      newErrors.estanque_movil = "Debe seleccionar un estanque móvil";
    }

    // ✅ 2. VALIDAR LITROS DEL ESTANQUE MÓVIL (CORREGIDO)
    if (!formData.litrosDocumentados || formData.litrosDocumentados.trim() === "") {
      console.log("❌ Falta litros documentados");
      newErrors.litros_documentados = "Debe ingresar los litros del estanque móvil a trasvasijar";
    } else {
      const litros = parseFloat(formData.litrosDocumentados);

      if (isNaN(litros) || litros <= 0) {
        console.log("❌ Litros inválidos");
        newErrors.litros_documentados = "Los litros deben ser un número mayor a 0";
      } else if (litros < 1) {
        console.log("❌ Litros muy bajos");
        newErrors.litros_documentados = "Debe trasvasijar al menos 1 litro";
      } else {
        // ✅ VALIDAR CONTRA STOCK DISPONIBLE EN EL ESTANQUE MÓVIL
        const estanqueSeleccionado = estanquesMoviles.find(e => e.id_estanque == formData.id_estanque_movil);
        if (estanqueSeleccionado && litros > estanqueSeleccionado.stock_actual) {
          console.log("❌ Litros exceden stock disponible");
          newErrors.litros_documentados = `El estanque móvil solo tiene ${estanqueSeleccionado.stock_actual.toLocaleString()} L disponibles`;
        }
      }
    }

    // ✅ 3. VALIDAR DISTRIBUCIÓN
    const estanquesConDistribucion = Object.keys(distribucionLitros).filter(estanqueId => {
      const distribucion = parseFloat(distribucionLitros[estanqueId]) || 0;
      return distribucion > 0;
    });

    console.log("🔍 Estanques con distribución:", estanquesConDistribucion);

    if (estanquesConDistribucion.length === 0) {
      console.log("❌ No hay distribución");
      newErrors.distribucion = "Debe seleccionar un estanque fijo destino y distribuir los litros";
    } else if (estanquesConDistribucion.length > 1) {
      console.log("❌ Múltiples estanques");
      newErrors.distribucion = "Solo puede trasvasijar a UN estanque fijo a la vez";
    } else {
      // ✅ VALIDAR QUE LA DISTRIBUCIÓN COINCIDA
      const litrosDistribuidos = parseFloat(distribucionLitros[estanquesConDistribucion[0]]) || 0;
      const litrosDocumentados = parseFloat(formData.litrosDocumentados) || 0;

      if (Math.abs(litrosDistribuidos - litrosDocumentados) > 0.01) {
        newErrors.distribucion = `Los litros distribuidos (${litrosDistribuidos.toLocaleString()}) deben coincidir con los litros del móvil (${litrosDocumentados.toLocaleString()})`;
      }
    }

    // ✅ 4. VALIDAR CAPACIDAD DEL ESTANQUE DESTINO
    if (estanquesConDistribucion.length === 1) {
      const idEstanque = estanquesConDistribucion[0];
      const litrosDistribuidos = parseFloat(distribucionLitros[idEstanque]) || 0;
      const estanque = estanquesFijos.find(e => e.id_estanque == idEstanque);

      if (estanque) {
        const capacidadDisponible = estanque.capacidad - estanque.stock_actual;
        if (litrosDistribuidos > capacidadDisponible) {
          newErrors.capacidad = `El estanque ${estanque.nombre} no tiene capacidad suficiente. Disponible: ${capacidadDisponible.toLocaleString()}L`;
        }
      }
    }

    console.log("🔍 Errores encontrados:", newErrors);
    console.log("🔍 Es válido:", Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ VALIDACIÓN EN TIEMPO REAL PARA EL CAMPO DE LITROS
  const handleLitrosChange = (value) => {
    setFormData(prev => ({
      ...prev,
      litrosDocumentados: value
    }));

    // Validar en tiempo real
    if (errors.litros_documentados) {
      const litros = parseFloat(value);
      if (!isNaN(litros) && litros > 0) {
        const estanqueSeleccionado = estanquesMoviles.find(e => e.id_estanque == formData.id_estanque_movil);
        if (!estanqueSeleccionado || litros <= estanqueSeleccionado.stock_actual) {
          // Limpiar error si ahora es válido
          setErrors(prev => ({
            ...prev,
            litros_documentados: null
          }));
        }
      }
    }

    // Limpiar cálculo previo cuando cambian los litros
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });
  };

  // ✅ VALIDAR CUANDO SE SELECCIONA UN ESTANQUE MÓVIL
  const handleEstanqueMovilChange = (idEstanque) => {
    const estanqueSeleccionado = estanquesMoviles.find(e => e.id_estanque == idEstanque);

    setFormData(prev => ({
      ...prev,
      id_estanque_movil: idEstanque,
      litrosDocumentados: estanqueSeleccionado ? estanqueSeleccionado.stock_actual.toString() : ''
    }));

    // Limpiar errores relacionados
    setErrors(prev => ({
      ...prev,
      estanque_movil: null,
      litros_documentados: null
    }));

    // Limpiar cálculo previo
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });

    // Limpiar distribución anterior
    const nuevaDistribucion = {};
    estanquesFijos.forEach(estanque => {
      nuevaDistribucion[estanque.id_estanque] = "";
    });
  };

  // Verificar alturas completas - SOLO PARA EL ESTANQUE SELECCIONADO
  const verificarAlturasCompletas = () => {
    const estanquesConDistribucion = Object.keys(distribucionLitros).filter(estanqueId => {
      const distribucion = parseFloat(distribucionLitros[estanqueId]) || 0;
      return distribucion > 0;
    });

    console.log("🔍 Verificando alturas completas:", {
      estanquesConDistribucion,
      alturasEstanques
    });

    if (estanquesConDistribucion.length !== 1) {
      console.log("❌ No hay exactamente 1 estanque con distribución");
      return false;
    }

    const idEstanqueSeleccionado = estanquesConDistribucion[0];
    const alturas = alturasEstanques[idEstanqueSeleccionado];

    console.log("🔍 Alturas del estanque seleccionado:", alturas);

    if (!alturas || typeof alturas !== "object") {
      console.log("❌ No hay alturas o formato incorrecto");
      return false;
    }

    return alturas.inicial && alturas.final &&
      parseFloat(alturas.inicial) >= 0 &&
      parseFloat(alturas.final) > parseFloat(alturas.inicial);
  };

  // Enviar trasvasije - VERSIÓN CORREGIDA PARA API SIMPLE
  const handleSubmit = async () => {

    // ✅ AGREGAR DEBUG:
    console.log("🔍 DEBUG Trasvasije - Estados actuales:", {
      formData,
      distribucionLitros,
      alturasEstanques,
      calculoPetroleo,
      estanqueMovilSeleccionado,
      errors
    });

    setTouched({
      litrosDocumentados: true,
      estanque_movil: true,
    });

    if (loading || !user) {
      mostrarAlerta("error", "No se ha podido acceder a la información del usuario.");
      return;
    }

    if (!validarFormularioCompleto()) {
      mostrarAlerta("error", "Por favor, complete todos los campos obligatorios correctamente.");
      return;
    }

    if (!calculoPetroleo.calculoRealizado) {
      mostrarAlerta("error", "Debe ingresar las alturas de los estanques y calcular la diferencia.");
      setShowEstanquesModal(true);
      return;
    }

    if (!verificarAlturasCompletas()) {
      mostrarAlerta("error", "Debe ingresar todas las alturas iniciales y finales de los estanques.");
      setShowEstanquesModal(true);
      return;
    }

    setIsSubmitting(true);

    console.log("✅ Validaciones pasadas, enviando a API...");

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      console.log("🔑 Token obtenido:", !!token);

      // Obtener el PRIMER estanque fijo con distribución
      const estanquesFijosConDistribucion = Object.keys(distribucionLitros).filter(estanqueId => {
        const distribucion = parseFloat(distribucionLitros[estanqueId]) || 0;
        return distribucion > 0;
      });

      if (estanquesFijosConDistribucion.length === 0) {
        mostrarAlerta("error", "Debe distribuir los litros en al menos un estanque fijo.");
        return;
      }

      if (estanquesFijosConDistribucion.length > 1) {
        mostrarAlerta("error", "Para esta versión, solo puede trasvasijar a UN estanque fijo a la vez.");
        return;
      }

      const idEstanqueFijoSeleccionado = estanquesFijosConDistribucion[0];
      const litrosDistribuidos = parseFloat(distribucionLitros[idEstanqueFijoSeleccionado]);
      const alturasEstanqueFijo = alturasEstanques[idEstanqueFijoSeleccionado];

      // Validar que las alturas estén completas
      if (!alturasEstanqueFijo || !alturasEstanqueFijo.inicial || !alturasEstanqueFijo.final) {
        mostrarAlerta("error", "Debe ingresar altura inicial y final del estanque fijo.");
        return;
      }

      // Preparar datos en el formato que espera la API
      const datosEnvio = {
        id_usuario: formData.id_usuario,
        id_faena: formData.id_faena,
        id_estanque_movil: parseInt(formData.id_estanque_movil),
        id_estanque_fijo: parseInt(idEstanqueFijoSeleccionado),

        // Datos del móvil - FORMATO CORRECTO
        litros_movil_inicial: parseFloat(formData.litrosDocumentados),
        litros_movil_final: parseFloat(formData.litrosDocumentados) - litrosDistribuidos,

        // Alturas del fijo - FORMATO CORRECTO  
        altura_fijo_inicial: parseFloat(alturasEstanqueFijo.inicial),
        altura_fijo_final: parseFloat(alturasEstanqueFijo.final),

        observaciones: formData.observacion || null
      };

      console.log("📤 Enviando datos a API:", datosEnvio);

      const response = await axios.post('/api/trasvasijes/movil-a-fijo', datosEnvio, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Preparar datos para modal de éxito
        const estanqueMovil = estanquesMoviles.find(e => e.id_estanque == formData.id_estanque_movil);
        const estanqueFijo = estanquesFijos.find(e => e.id_estanque == idEstanqueFijoSeleccionado);

        setDatosExito({
          litrosTransferidos: litrosDistribuidos,
          estanqueMovil: estanqueMovil?.nombre || 'Desconocido',
          estanquesFijos: [{
            nombre: estanqueFijo?.nombre || 'Desconocido',
            litros: litrosDistribuidos
          }],
          diferenciaMedicion: response.data.data.diferencia_medicion || 0,
          verificado: response.data.data.trasvasije?.verificado !== false
        });

        setShowExitoModal(true);
        mostrarAlerta("success", "Trasvasije registrado exitosamente.");
      }
    } catch (error) {
      console.error("Error al registrar trasvasije:", error);

      let errorMessage = "Error al registrar el trasvasije.";

      // Mostrar errores específicos de validación
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      mostrarAlerta("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetear formulario
  const resetearFormulario = () => {
    setFormData({
      id_usuario: user?.id || '',
      id_faena: user?.id_faena || '',
      id_estanque_movil: '',
      litrosDocumentados: '',
      observacion: ''
    });

    setTouched({});
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });

    setDistribucionLitros({});
    setStockInicial(0);

    const initialAlturas = {};
    const initialDistribucion = {};
    estanquesFijos.forEach((estanque) => {
      initialAlturas[estanque.id_estanque] = {
        inicial: "",
        final: "",
      };
      initialDistribucion[estanque.id_estanque] = "";
    });
    setAlturasEstanques(initialAlturas);
    setDistribucionLitros(initialDistribucion);
    setErrors({});
  };

  // Función para obtener litros disponibles
  const obtenerLitrosDisponibles = () => {
    return parseFloat(formData.litrosDocumentados) || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // ===== RENDER CON DISEÑO ORDENADO =====
  return (
    <>
      <div className="flex flex-col space-y-4 bg-gray-50 p-5 rounded-lg shadow-sm">
        {/* Mostrar alertas */}
        {alert.show && (
          <div
            className={`flex items-center p-3 rounded-lg ${alert.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : alert.type === "info"
                ? "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
                : "bg-red-100 text-red-800 border-l-4 border-red-500"
              }`}
          >
            {alert.type === "error" && <FaExclamationTriangle className="mr-2" />}
            {alert.type === "info" && <FaInfoCircle className="mr-2" />}
            {alert.message}
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">
          Registro de Trasvasije: Móvil → Fijos
        </h2>

        {/* SECCIÓN 1: ESTANQUE MÓVIL DE ORIGEN */}
        <div className="text-left space-y-4">
          <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
            <RiOilFill className="mr-2 text-orange-600" />
            1. Seleccione el Estanque Móvil de Origen
          </h3>

          <div className="pl-4 space-y-4">
            <p className="text-sm text-gray-600">
              Seleccione el estanque móvil que contiene el combustible a trasvasijar:
            </p>

            <SelectorEstanque
              idFaena={formData.id_faena}
              tipoEstanque="movil"
              onEstanqueSelect={handleEstanqueMovilSelect}
              estanqueSeleccionado={estanqueMovilSeleccionado}
              disabled={isSubmitting}
              selectorId="estanque-movil-trasvasije"
              showTitle={false}
              className="mt-2"
            />

            {errors.estanque_movil && (
              <span className="text-red-500 text-xs">{errors.estanque_movil}</span>
            )}
          </div>
        </div>

        {/* Información del estanque móvil seleccionado */}
        {estanqueMovilSeleccionado && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-500 p-2 rounded-lg mr-3">
                  <FaTruck className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">
                    ✅ {estanqueMovilSeleccionado.nombre}
                  </h4>
                  <p className="text-sm text-gray-600">Estanque móvil seleccionado como origen</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Combustible disponible</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatNumberWithSeparators(estanqueMovilSeleccionado.stock_actual)} L
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: LITROS A TRASVASIJAR */}
        {formData.id_estanque_movil && (
          <div className="text-left space-y-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
              <FaOilCan className="mr-2 text-green-600" />
              2. Cantidad de Combustible a Trasvasijar
            </h3>

            <div className="pl-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Litros del Estanque Móvil a Trasvasijar *
                  <span className="text-xs text-gray-500 ml-1">(se completa automáticamente con el stock disponible)</span>
                </label>
                <InputField
                  type="number"
                  step="0.01"
                  placeholder="Litros disponibles en el estanque móvil"
                  value={formData.litrosDocumentados}
                  onChange={(e) => handleChange("litrosDocumentados", e.target.value)}
                  disabled={false}  // ✅ CAMBIAR: Siempre deshabilitado
                  className={`${errors.litros_documentados ? 'border-red-500' : 'border-gray-300'} ${!formData.id_estanque_movil ? 'bg-gray-100' : 'bg-white'
                    }`}
                />
                {errors.litros_documentados && (
                  <span className="text-red-500 text-xs mt-1">{errors.litros_documentados}</span>
                )}
                {formData.id_estanque_movil && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Los litros se cargan automáticamente según el stock del estanque móvil seleccionado
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 3: DISTRIBUCIÓN Y MEDICIÓN */}
        {formData.litrosDocumentados && parseFloat(formData.litrosDocumentados) > 0 && (
          <div className="text-left space-y-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
              <FaRuler className="mr-2 text-blue-600" />
              3. Configurar Distribución y Medición en Estanques Fijos
            </h3>

            <div className="pl-4 space-y-4">
              <p className="text-sm text-gray-600">
                Configure cómo se distribuirá el combustible entre los estanques fijos
                e ingrese las mediciones antes y después del trasvasije:
              </p>

              <button
                onClick={() => setShowEstanquesModal(true)}
                className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                <FaRuler className="mr-2" />
                <span>Configurar Estanques Fijos y Medición</span>
              </button>

              {/* Mostrar resultados del cálculo si existen */}
              {calculoPetroleo.calculoRealizado && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                    <FaCalculator className="mr-2" />
                    Resultados del Cálculo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Litros del Móvil:</span>
                      <p className="text-blue-800 font-bold">
                        {formatNumberWithSeparators(formData.litrosDocumentados)} L
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Litros Medidos:</span>
                      <p className="text-blue-800 font-bold">
                        {formatNumberWithSeparators(calculoPetroleo.litrosMedidos)} L
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Diferencia:</span>
                      <p className={`font-bold ${calculoPetroleo.diferencia === 0
                        ? "text-gray-600"
                        : calculoPetroleo.diferencia > 0
                          ? "text-green-600"
                          : "text-red-600"
                        }`}>
                        {formatNumberWithSeparators(Math.abs(calculoPetroleo.diferencia))} L
                        <span className="text-sm ml-1">
                          ({calculoPetroleo.diferencia > 0 ? "de más" : calculoPetroleo.diferencia < 0 ? "de menos" : "exacto"})
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 flex items-center justify-center">
                    <FaSync className="mr-1" />
                    Cálculo completado correctamente
                  </div>
                </div>
              )}

              {/* Mostrar distribución configurada */}
              {Object.values(distribucionLitros).some(valor => parseFloat(valor) > 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center">
                    <FaBuilding className="mr-2" />
                    Distribución Configurada
                  </h4>
                  <div className="space-y-2 text-sm">
                    {Object.keys(distribucionLitros).map(estanqueId => {
                      const litros = parseFloat(distribucionLitros[estanqueId]) || 0;
                      if (litros > 0) {
                        return (
                          <div key={estanqueId} className="flex justify-between">
                            <span className="text-green-600">Estanque {estanqueId}:</span>
                            <span className="font-bold text-green-800">
                              {formatNumberWithSeparators(litros)} L
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                    <div className="border-t border-green-300 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-green-600">Total distribuido:</span>
                        <span className="text-green-800">
                          {formatNumberWithSeparators(
                            Object.values(distribucionLitros).reduce((total, valor) => {
                              return total + (parseFloat(valor) || 0);
                            }, 0)
                          )} L
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN 4: OBSERVACIONES Y CONFIRMACIÓN */}
        <div className="text-left space-y-4">
          <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
            <FaCheckCircle className="mr-2 text-purple-600" />
            4. Observaciones y Confirmación
          </h3>

          <div className="pl-4 space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Observaciones (Opcional)
                <span className="text-xs text-gray-500 ml-1">(comentarios sobre el trasvasije)</span>
              </label>
              <InputField
                placeholder="Ej: Trasvasije realizado sin inconvenientes..."
                isTextarea={true}
                value={formData.observacion}
                onChange={(e) => handleChange("observacion", e.target.value)}
                className="bg-white rounded-md px-3 py-2 min-h-[80px] text-gray-800 border-gray-300"
              />
            </div>

            {/* Resumen final antes de enviar */}
            {estanqueMovilSeleccionado && formData.litrosDocumentados && calculoPetroleo.calculoRealizado && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                  <FaCheckCircle className="mr-2" />
                  Resumen del Trasvasije
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-purple-600 font-medium">Origen:</span>
                    <p className="text-purple-800">{estanqueMovilSeleccionado.nombre}</p>
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Litros a transferir:</span>
                    <p className="text-purple-800">{formatNumberWithSeparators(formData.litrosDocumentados)} L</p>
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Estanques destino:</span>
                    <p className="text-purple-800">
                      {Object.keys(distribucionLitros).filter(id => parseFloat(distribucionLitros[id]) > 0).length} estanques
                    </p>
                  </div>
                  <div>
                    <span className="text-purple-600 font-medium">Estado:</span>
                    <p className="text-purple-800 font-bold">✓ Listo para registrar</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center mt-6 pt-4 border-t space-y-reverse space-y-3 sm:space-y-0">
          <Button
            to="/Bombero"
            className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-3 sm:py-2 rounded-md w-full sm:w-auto"
            icon={<FaHome className="mr-2 text-white" />}
            text="Volver"
          />

          <Button
            text={isSubmitting ? "Procesando..." : "Registrar Trasvasije"}
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.id_estanque_movil || !calculoPetroleo.calculoRealizado}
            className={`bg-orange-600 hover:bg-orange-700 text-white text-sm px-8 py-3 rounded-lg transition-colors shadow-sm w-full sm:w-auto sm:ml-auto ${isSubmitting ? "opacity-70 cursor-wait" : ""
              }`}
            icon={!isSubmitting && <FaExchangeAlt className="mr-2 text-white" />}
          />
        </div>

        <div className="text-xs text-gray-500 text-center">
          Los campos marcados con * son obligatorios
        </div>

        {/* Modal de estanques fijos */}
        <EstanquesModal
          isOpen={showEstanquesModal}
          onClose={(stockSistema = null) => {
            if (stockSistema !== null) {
              setStockInicial(stockSistema);
            }
            setShowEstanquesModal(false);
          }}
          estanques={estanquesFijos}
          alturasEstanques={alturasEstanques}
          handleAlturaChange={handleAlturaChange}
          calcularLitrosPetroleo={calcularLitrosPetroleo}
          modalAlert={modalAlert}
          capacidadDisponible={capacidadDisponible}
          litrosRecibidos={obtenerLitrosDisponibles()}
          distribucionLitros={distribucionLitros}
          onDistribucionChange={handleDistribucionChange}
          loadingCalculo={loadingCalculo}
          esTrasvasije={true} // 🆕 ESTA ES LA LÍNEA CLAVE
        />
      </div>

      {/* Modal de éxito */}
      {datosExito && (
        <ModalExitoTrasvasije
          isOpen={showExitoModal}
          onConfirm={() => {
            setShowExitoModal(false);
            setDatosExito(null);
            resetearFormulario();
            // Recargar estanques para actualizar stocks
            if (user?.id_faena) {
              cargarEstanquesDisponibles(user.id_faena);
            }
          }}
          datosTrasvasije={datosExito}
        />
      )}
    </>
  );
};

export default FormularioTrasvasije;