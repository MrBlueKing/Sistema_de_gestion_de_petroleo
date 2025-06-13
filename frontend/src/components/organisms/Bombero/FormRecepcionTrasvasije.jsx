import React, { useContext, useState, useEffect } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import {
  FaHome,
  FaExclamationTriangle,
  FaRuler,
  FaCheck,
  FaFileAlt,
  FaGasPump,
  FaCalculator,
  FaDollarSign,
  FaArrowRight,
  FaInfoCircle,
  FaSync,
  FaTruck,
  FaBuilding,
} from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";
import EstanquesModal from "./EstanquesModal";
import SelectorEstanque from "../../molecules/SelectorEstanque"; // Componente extendido

registerLocale("es", es);

// Función de utilidad para formatear números a 2 decimales
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0.00";
  }
  return parseFloat(num).toFixed(2);
};

// Función para formatear números con separadores de miles
const formatNumberWithSeparators = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0,00";
  }
  return parseFloat(num).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Función para formatear moneda
const formatCurrency = (amount) => {
  return parseFloat(amount).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
  });
};

// COMPONENTE MODAL DE CONFIRMACIÓN PARA REINICIAR
const ModalConfirmacionReinicio = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeInScale">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white rounded-t-xl">
          <div className="flex items-center">
            <div className="bg-blue-400 bg-opacity-20 p-2 rounded-full mr-3">
              <FaSync className="text-lg" />
            </div>
            <h2 className="text-lg font-bold">Actualizar Cálculos</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FaCalculator className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ¿Actualizar los cálculos automáticamente?
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Los cálculos de diferencia se actualizarán automáticamente con el
              nuevo valor de litros documentados.
              <strong className="text-blue-600">
                {" "}
                Las alturas ingresadas se mantendrán.
              </strong>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FaInfoCircle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Se actualizará automáticamente:</p>
                <ul className="text-xs space-y-1">
                  <li>• El cálculo de la diferencia</li>
                  <li>• La observación generada</li>
                  <li>• El total estimado</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              Sí, Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE MODAL DE ÉXITO
const ModalExitoRecepcion = ({ isOpen, onConfirm, datosRecepcion }) => {
  if (!isOpen) return null;

  const {
    litrosDocumentados,
    litrosMedidos,
    diferencia,
    stockInicial,
  } = datosRecepcion;

  const diferenciaMagnitud = Math.abs(diferencia);
  const esDiferenciaSignificativa = diferenciaMagnitud > 0.5;
  const esExcedente = diferencia > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeInScale">
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white">
          <div className="flex items-center justify-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <FaCheck className="text-2xl" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">
                ¡Trasvasije Registrado Exitosamente!
              </h2>
            </div>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Resumen de datos en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Información de los datos */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-3">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <FaFileAlt className="text-white text-sm" />
                </div>
                <h3 className="font-semibold text-blue-800">Información del Trasvasije</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700 text-sm">Litros Documentados:</span>
                  <span className="font-bold text-blue-900">
                    {formatNumberWithSeparators(litrosDocumentados)} L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 text-sm">Stock Inicial:</span>
                  <span className="font-bold text-blue-900">
                    {formatNumberWithSeparators(stockInicial)} L
                  </span>
                </div>
              </div>
            </div>

            {/* Cálculos Realizados */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center mb-3">
                <div className="bg-orange-500 p-2 rounded-lg mr-3">
                  <FaCalculator className="text-white text-sm" />
                </div>
                <h3 className="font-semibold text-orange-800">Mediciones</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-orange-700 text-sm">Litros Medidos:</span>
                  <span className="font-bold text-orange-900">
                    {formatNumberWithSeparators(litrosMedidos)} L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700 text-sm">Diferencia:</span>
                  <span
                    className={`font-bold ${esDiferenciaSignificativa
                      ? esExcedente
                        ? "text-green-600"
                        : "text-red-600"
                      : "text-gray-600"
                      }`}
                  >
                    {formatNumberWithSeparators(diferenciaMagnitud)} L
                    <span className="text-xs ml-1">
                      ({esExcedente ? "Excedente" : "Faltante"})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <FaGasPump className="mr-2 text-gray-500" />
              Información Adicional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Estado del Registro:</span>
                <span className="ml-2 font-medium text-orange-600">✓ Completado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botón */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onConfirm}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all shadow-sm"
            >
              <span>Volver</span>
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormRecepcionTrasvasije = () => {
  // Acceder al contexto de usuario
  const { user, loading } = useContext(UserContext);

  // Estados para datos del formulario (SIMPLIFICADO - sin guía ni precio)
  const [formData, setFormData] = useState({
    litrosDocumentados: "",
    observacion: "",
    id_faena: "",
  });

  // Estados para controlar el modal de actualización
  const [showModalActualizacion, setShowModalActualizacion] = useState(false);
  const [nuevoValorLitros, setNuevoValorLitros] = useState("");
  const [valorOriginalLitros, setValorOriginalLitros] = useState("");

  // Estados para estanques móviles
  const [estanqueMovilSeleccionado, setEstanqueMovilSeleccionado] = useState(null);
  const [distribucionEstanquesMoviles, setDistribucionEstanquesMoviles] = useState({});
  const [modoMultiMovil, setModoMultiMovil] = useState(false);

  // Estados para distribución de combustible (estanques fijos)
  const [distribucionLitros, setDistribucionLitros] = useState({});

  // Estados para UI
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEstanquesModal, setShowEstanquesModal] = useState(false);
  const [modalAlert, setModalAlert] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Estados para el modal de éxito
  const [showExitoModal, setShowExitoModal] = useState(false);
  const [datosRecepcionExitosa, setDatosRecepcionExitosa] = useState(null);

  // Estados para datos de combustible
  const [estanques, setEstanques] = useState([]);
  const [alturasEstanques, setAlturasEstanques] = useState({});
  const [capacidadDisponible, setCapacidadDisponible] = useState();

  // Estado del cálculo
  const [calculoPetroleo, setCalculoPetroleo] = useState({
    litrosMedidos: 0,
    diferencia: 0,
    calculoRealizado: false,
  });

  const [stockInicial, setStockInicial] = useState(0);

  // HANDLERS para el selector de estanques móviles
  const handleEstanqueMovilSelect = (estanque) => {
    console.log("🚛 Estanque móvil seleccionado:", estanque);
    setEstanqueMovilSeleccionado(estanque);
  };

  const handleModoMultiMovilChange = (nuevoModo) => {
    console.log("🔄 Cambiando modo multi-móvil a:", nuevoModo);
    setModoMultiMovil(nuevoModo);
    if (nuevoModo) {
      // Al activar modo múltiple, limpiar selección individual
      setEstanqueMovilSeleccionado(null);
      setDistribucionEstanquesMoviles({});
    } else {
      // Al desactivar modo múltiple, limpiar distribución
      setDistribucionEstanquesMoviles({});
    }
  };

  const handleDistribucionEstanquesMovilesChange = (nuevaDistribucion) => {
    console.log("📊 Nueva distribución estanques móviles:", nuevaDistribucion);
    setDistribucionEstanquesMoviles(nuevaDistribucion);
  };

  // Función para manejar cambios en la distribución (estanques fijos)
  const handleDistribucionChange = (nuevaDistribucion) => {
    setDistribucionLitros(nuevaDistribucion);
    console.log('Nueva distribución estanques fijos:', nuevaDistribucion);
  };

  // Función para validar distribución TOTAL (fijos + móviles)
  const validarDistribucionTotal = () => {
    const litrosGuia = parseFloat(formData.litrosDocumentados) || 0;
    
    // Calcular total de estanques fijos
    const totalFijos = Object.values(distribucionLitros).reduce((total, valor) => {
      return total + (parseFloat(valor) || 0);
    }, 0);

    // Calcular total de estanques móviles
    const totalMoviles = modoMultiMovil 
      ? Object.values(distribucionEstanquesMoviles).reduce((total, valor) => {
          return total + (parseFloat(valor) || 0);
        }, 0)
      : 0; // En modo simple no hay distribución múltiple

    const totalDistribuido = totalFijos + totalMoviles;

    // Si no hay distribución, permitir continuar
    if (totalDistribuido === 0) return { valido: true, mensaje: "" };

    // Si hay distribución, debe coincidir exactamente con litros guía
    if (Math.abs(totalDistribuido - litrosGuia) > 0.01) {
      return {
        valido: false,
        mensaje: `La distribución total (${formatNumberWithSeparators(totalDistribuido)} L) debe coincidir exactamente con los litros documentados (${formatNumberWithSeparators(litrosGuia)} L). Fijos: ${formatNumberWithSeparators(totalFijos)} L, Móviles: ${formatNumberWithSeparators(totalMoviles)} L.`
      };
    }

    return { valido: true, mensaje: "" };
  };

  // Función para manejar cambios en litros documentados
  const handleLitrosDocumentadosChange = (value) => {
    handleChange("litrosDocumentados", value);
  };

  // Función para manejar cuando el campo pierde el foco
  const handleLitrosDocumentadosBlur = (value) => {
    handleBlur("litrosDocumentados");

    // Si ya hay cálculos realizados y el valor ha cambiado, mostrar modal
    if (calculoPetroleo.calculoRealizado) {
      if (!valorOriginalLitros) {
        setValorOriginalLitros(formData.litrosDocumentados);
      }

      const valorActual = parseFloat(valorOriginalLitros || formData.litrosDocumentados) || 0;
      const nuevoValor = parseFloat(value) || 0;

      if (Math.abs(valorActual - nuevoValor) > 0.01) {
        setNuevoValorLitros(value);
        setShowModalActualizacion(true);
      }
    }
  };

  // Función para cancelar y restaurar el valor original
  const cancelarActualizacion = () => {
    setFormData((prev) => ({
      ...prev,
      litrosDocumentados: valorOriginalLitros,
    }));

    setShowModalActualizacion(false);
    setNuevoValorLitros("");
    setValorOriginalLitros("");

    mostrarAlerta("info", "Se ha restaurado el valor original. Los cálculos permanecen sin cambios.");
  };

  // Función para confirmar actualización automática de cálculos
  const confirmarActualizacion = () => {
    setFormData((prev) => ({
      ...prev,
      litrosDocumentados: nuevoValorLitros,
    }));

    recalcularDiferencia(nuevoValorLitros);

    setShowModalActualizacion(false);
    setNuevoValorLitros("");
    setValorOriginalLitros("");

    mostrarAlerta("info", "Los cálculos han sido actualizados automáticamente con el nuevo valor.");
  };

  // Función para recalcular solo la diferencia
  const recalcularDiferencia = (nuevosLitrosDocumentados) => {
    const litrosGuia = parseFloat(nuevosLitrosDocumentados) || 0;
    const nuevaDiferencia = calculoPetroleo.litrosMedidos - litrosGuia;

    setCalculoPetroleo((prev) => ({
      ...prev,
      diferencia: nuevaDiferencia,
    }));

    setFormData((prev) => ({
      ...prev,
      observacion: generarObservacionDiferencia(litrosGuia, calculoPetroleo.litrosMedidos),
    }));
  };

  // Efecto para actualizar la faena cuando el usuario cambie
  useEffect(() => {
    if (user?.id_faena) {
      setFormData((prev) => ({
        ...prev,
        id_faena: user.id_faena,
      }));
    }
  }, [user]);

  // Cargar estanques cuando cambie la faena seleccionada
  useEffect(() => {
    if (formData.id_faena) {
      cargarEstanques(formData.id_faena);
    }
  }, [formData.id_faena]);

  // Cargar capacidad disponible cuando se abra el modal
  useEffect(() => {
    if (showEstanquesModal && formData.id_faena) {
      cargarCapacidadDisponible();
    }
  }, [showEstanquesModal, formData.id_faena]);

  // Validación en tiempo real
  useEffect(() => {
    validateField();
  }, [formData]);

  // Efecto para validar distribución TOTAL cuando cambie
  useEffect(() => {
    if (Object.keys(distribucionLitros).length > 0 || Object.keys(distribucionEstanquesMoviles).length > 0) {
      const validacion = validarDistribucionTotal();
      if (!validacion.valido) {
        console.log('Error en distribución total:', validacion.mensaje);
      }
    }
  }, [distribucionLitros, distribucionEstanquesMoviles, formData.litrosDocumentados, modoMultiMovil]);

  // Función para cargar los estanques de una faena
  const cargarEstanques = async (idFaena) => {
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      const response = await axios.get(`/api/estanques-fijo/${idFaena}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEstanques(response.data.data);

      const initialAlturas = {};
      const initialDistribucion = {};
      response.data.data.forEach((estanque) => {
        initialAlturas[estanque.id_estanque] = {
          inicial: "",
          final: "",
        };
        initialDistribucion[estanque.id_estanque] = "";
      });
      setAlturasEstanques(initialAlturas);
      setDistribucionLitros(initialDistribucion);
    } catch (error) {
      console.error("Error al cargar estanques:", error);
      mostrarAlerta("error", "Error al cargar los estanques fijos de la faena.");
    }
  };

  // Función para cargar la capacidad disponible
  const cargarCapacidadDisponible = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      const response = await axios.get(
        `/api/capacidad-disponible/${formData.id_faena}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCapacidadDisponible(response.data.capacidad_disponible);
      }
    } catch (error) {
      console.error("Error al cargar capacidad disponible:", error);
      mostrarModalAlerta("error", "Error al cargar la capacidad disponible.");
    }
  };

  // Mostrar alertas temporales
  const mostrarAlerta = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  // Mostrar alertas modales temporales
  const mostrarModalAlerta = (type, message) => {
    setModalAlert({ show: true, type, message });
    setTimeout(() => setModalAlert({ show: false, message: "", type: "" }), 5000);
  };

  // Función para validar campos en tiempo real
  const validateField = () => {
    const newErrors = {};

    if (touched.litrosDocumentados) {
      if (!formData.litrosDocumentados) {
        newErrors.litrosDocumentados = "La cantidad de litros es obligatoria";
      } else if (
        isNaN(formData.litrosDocumentados) ||
        parseFloat(formData.litrosDocumentados) <= 0
      ) {
        newErrors.litrosDocumentados = "Debe ingresar un valor numérico mayor a 0";
      }
    }

    setErrors(newErrors);
  };

  // Función para validar todos los campos
  const validarFormularioCompleto = () => {
    const newErrors = {};

    if (!formData.litrosDocumentados) {
      newErrors.litrosDocumentados = "Este campo es obligatorio";
    } else if (
      isNaN(formData.litrosDocumentados) ||
      parseFloat(formData.litrosDocumentados) <= 0
    ) {
      newErrors.litrosDocumentados = "Debe ingresar un valor numérico mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Manejar el enfoque en un campo
  const handleBlur = (field) => {
    setTouched({
      ...touched,
      [field]: true,
    });
  };

  // Función para manejar cambios en las alturas de estanques
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
  };

  // Resto de funciones originales (calcularLitrosPetroleo, procesarAlturas, etc.)
  // [Las funciones principales se mantienen igual que en tu código original]

  // Función para calcular los litros de petróleo según las alturas
  const calcularLitrosPetroleo = async () => {
    if (!formData.id_faena) {
      mostrarModalAlerta("error", "Debe seleccionar una faena antes de calcular.");
      return null;
    }

    if (!user || !user.id) {
      mostrarModalAlerta("error", "No se puede identificar al usuario actual.");
      return null;
    }

    if (!formData.litrosDocumentados || parseFloat(formData.litrosDocumentados) <= 0) {
      mostrarModalAlerta("error", "Debe ingresar la cantidad de litros documentados antes de calcular.");
      return null;
    }

    const validacionDistribucion = validarDistribucionTotal();
    if (!validacionDistribucion.valido) {
      mostrarModalAlerta("error", validacionDistribucion.mensaje);
      return null;
    }

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      const { alturasIniciales, alturasFinales, incompletas } = procesarAlturas();

      if (incompletas) {
        mostrarModalAlerta("error", "Debe ingresar todas las alturas iniciales y finales de los estanques.");
        return null;
      }

      const datosAlturasIniciales = convertirAlturasParaAPI(alturasIniciales);
      const datosAlturasFinales = convertirAlturasParaAPI(alturasFinales);

      if (hayAlturasIncompletas(datosAlturasIniciales) || hayAlturasIncompletas(datosAlturasFinales)) {
        mostrarModalAlerta("error", "Debe ingresar todas las alturas iniciales y finales de los estanques.");
        return null;
      }

      const datosCalcularInicial = {
        id_faena: formData.id_faena,
        id_usuario: user.id,
        tipo_movimiento: "ingreso",
        alturas: datosAlturasIniciales,
      };

      const datosCalcularFinal = {
        id_faena: formData.id_faena,
        id_usuario: user.id,
        tipo_movimiento: "ingreso",
        alturas: datosAlturasFinales,
      };

      const responseInicial = await axios.post("/api/calcular-litros-petroleo", datosCalcularInicial, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!responseInicial.data.success) {
        throw new Error(responseInicial.data.message || "Error al calcular los litros iniciales");
      }

      const responseFinal = await axios.post("/api/calcular-litros-petroleo", datosCalcularFinal, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!responseFinal.data.success) {
        throw new Error(responseFinal.data.message || "Error al calcular los litros finales");
      }

      return procesarResultadosCalculo(responseInicial, responseFinal);
    } catch (error) {
      console.error("Error al calcular litros de petróleo:", error);

      let errorMessage = "Error al calcular los litros de petróleo.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      mostrarModalAlerta("error", errorMessage);
      return null;
    }
  };

  // Función para procesar las alturas de los estanques
  const procesarAlturas = () => {
    const alturasIniciales = {};
    const alturasFinales = {};
    let incompletas = false;

    // Obtener estanques que tienen distribución > 0
    const estanquesConDistribucion = Object.keys(distribucionLitros).filter(estanqueId => {
      const distribucion = parseFloat(distribucionLitros[estanqueId]) || 0;
      return distribucion > 0;
    });

    estanquesConDistribucion.forEach((estanqueId) => {
      if (typeof alturasEstanques[estanqueId] === "object") {
        alturasIniciales[estanqueId] = alturasEstanques[estanqueId].inicial;
        alturasFinales[estanqueId] = alturasEstanques[estanqueId].final;
      } else {
        console.warn("Estructura de alturas incorrecta para estanque", estanqueId);
        alturasIniciales[estanqueId] = alturasEstanques[estanqueId];
        alturasFinales[estanqueId] = "";
      }

      if (
        alturasIniciales[estanqueId] === undefined ||
        alturasIniciales[estanqueId] === "" ||
        alturasFinales[estanqueId] === undefined ||
        alturasFinales[estanqueId] === ""
      ) {
        incompletas = true;
      }
    });

    return { alturasIniciales, alturasFinales, incompletas };
  };

  // Función para convertir alturas al formato API
  const convertirAlturasParaAPI = (alturas) => {
    return Object.keys(alturas).map((estanqueId) => {
      const altura = alturas[estanqueId];
      const alturaNum = altura === 0 || altura ? parseFloat(altura) : null;
      return {
        id_estanque: parseInt(estanqueId),
        altura: alturaNum,
      };
    });
  };

  // Función para verificar alturas incompletas
  const hayAlturasIncompletas = (datosAlturas) => {
    return datosAlturas.some((item) => {
      return (
        item.altura === undefined ||
        item.altura === null ||
        Number.isNaN(item.altura)
      );
    });
  };

  // Función para procesar los resultados del cálculo
  const procesarResultadosCalculo = (responseInicial, responseFinal) => {
    const stockInicial = responseInicial.data.litros_totales || 0;
    const stockFinal = responseFinal.data.litros_totales || 0;
    const litrosIngresados = stockFinal - stockInicial;
    const litrosGuia = parseFloat(formData.litrosDocumentados);

    // Diferencia = litros medidos - litros documentados
    const diferencia = litrosIngresados - litrosGuia;

    setCalculoPetroleo({
      litrosMedidos: litrosIngresados,
      diferencia: diferencia,
      calculoRealizado: true,
    });

    setFormData((prevFormData) => ({
      ...prevFormData,
      observacion: generarObservacionDiferencia(litrosGuia, litrosIngresados),
    }));

    setStockInicial(stockInicial);

    return {
      volInicial: stockInicial,
      volFinal: stockFinal,
      discrepanciaIni: stockInicial - 200,
      discrepanciaCam: diferencia,
    };
  };

  // Generar texto de observación basado en diferencia
  const generarObservacionDiferencia = (litrosGuia, litrosMedidos) => {
    const diferencia = litrosMedidos - litrosGuia;

    return `Según cálculo de alturas, se detecta una diferencia de ${formatNumber(
      Math.abs(diferencia)
    )} litros ${diferencia > 0 ? "de más" : "de menos"
      } en la recepción. Litros según guía: ${formatNumber(
        litrosGuia
      )}. Litros medidos: ${formatNumber(litrosMedidos)}.`;
  };

  // Verificar si hay alturas vacías (solo para estanques con distribución)
  const verificarAlturasCompletas = () => {
    // Obtener estanques que tienen distribución > 0
    const estanquesConDistribucion = Object.keys(distribucionLitros).filter(estanqueId => {
      const distribucion = parseFloat(distribucionLitros[estanqueId]) || 0;
      return distribucion > 0;
    });

    // Si no hay estanques con distribución, no hay nada que validar
    if (estanquesConDistribucion.length === 0) return false;

    // Validar solo los estanques que tienen distribución
    return !estanquesConDistribucion.some((estanqueId) => {
      const alturas = alturasEstanques[estanqueId];
      if (typeof alturas !== "object") return true;
      return !alturas.inicial || !alturas.final;
    });
  };

  // Función para manejar el cierre del modal de éxito
  const handleExitoModalConfirm = () => {
    setShowExitoModal(false);
    setDatosRecepcionExitosa(null);
    window.location.href = "/bombero";
  };

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    setTouched({
      litrosDocumentados: true,
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

    const validacionDistribucion = validarDistribucionTotal();
    if (!validacionDistribucion.valido) {
      mostrarAlerta("error", validacionDistribucion.mensaje);
      return;
    }

    setIsSubmitting(true);

    try {
      // Diferencia = litros medidos - litros documentados
      const diferencia = calculoPetroleo.litrosMedidos - parseFloat(formData.litrosDocumentados);

      // Preparar datos de estanques móviles para envío
      const datosEstanquesMoviles = prepararDatosEstanquesMoviles();

      // Datos para envío
      const dataToSend = {
        id_usuario: user.id,
        litros_documentados: parseFloat(formData.litrosDocumentados),
        litros_recibidos: calculoPetroleo.litrosMedidos,
        recibo_conforme: true,
        observacion: formData.observacion,
        id_faena: formData.id_faena,
        diferencia: diferencia,
        stock_inicial: stockInicial,
        distribucion_litros: distribucionLitros, // Estanques fijos
        distribucion_estanques_moviles: datosEstanquesMoviles, // Estanques móviles
        alturas_estanques: prepararDatosAlturasConTipo(),
      };

      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      const response = await axios.post("/api/ingresos-petroleo", dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Datos para el modal de éxito
      const datosParaModalExito = {
        litrosDocumentados: parseFloat(formData.litrosDocumentados),
        litrosMedidos: calculoPetroleo.litrosMedidos,
        diferencia: diferencia,
        stockInicial: stockInicial,
      };

      setDatosRecepcionExitosa(datosParaModalExito);
      setShowExitoModal(true);
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      manejarErrorEnvio(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NUEVA FUNCIÓN: Preparar datos de estanques móviles para envío
  const prepararDatosEstanquesMoviles = () => {
    if (modoMultiMovil) {
      // Modo múltiple: enviar distribución
      return {
        modo: "multiple",
        distribucion: distribucionEstanquesMoviles,
      };
    } else if (estanqueMovilSeleccionado) {
      // Modo simple: enviar estanque seleccionado
      return {
        modo: "simple",
        estanque_seleccionado: {
          id_estanque: estanqueMovilSeleccionado.id_estanque,
          nombre: estanqueMovilSeleccionado.nombre,
          // Asumir que recibe todos los litros en modo simple
          litros: parseFloat(formData.litrosDocumentados) || 0,
        },
      };
    }
    
    return null; // No hay estanques móviles seleccionados
  };

  // Función para preparar las alturas con tipo
  const prepararDatosAlturasConTipo = () => {
    const alturas = [];

    Object.keys(alturasEstanques).forEach((idEstanque) => {
      const datos = alturasEstanques[idEstanque];

      if (datos && typeof datos === "object") {
        if (datos.inicial !== undefined && datos.inicial !== "") {
          alturas.push({
            id_estanque: parseInt(idEstanque),
            altura: parseFloat(datos.inicial),
            tipo: "inicial",
          });
        }

        if (datos.final !== undefined && datos.final !== "") {
          alturas.push({
            id_estanque: parseInt(idEstanque),
            altura: parseFloat(datos.final),
            tipo: "final",
          });
        }
      }
    });

    return alturas;
  };

  // Función para resetear el formulario
  const resetearFormulario = () => {
    setFormData({
      litrosDocumentados: "",
      observacion: "",
      id_faena: formData.id_faena,
    });

    setTouched({});
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });

    setDistribucionLitros({});
    
    // Resetear estados de estanques móviles
    setEstanqueMovilSeleccionado(null);
    setDistribucionEstanquesMoviles({});
    setModoMultiMovil(false);

    const initialAlturas = {};
    const initialDistribucion = {};
    estanques.forEach((estanque) => {
      initialAlturas[estanque.id_estanque] = {
        inicial: "",
        final: "",
      };
      initialDistribucion[estanque.id_estanque] = "";
    });
    setAlturasEstanques(initialAlturas);
    setDistribucionLitros(initialDistribucion);
  };

  // Función para manejar errores en el envío
  const manejarErrorEnvio = (error) => {
    let errorMessage = "Error al registrar la recepción. Intente nuevamente.";

    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }

    mostrarAlerta("error", errorMessage);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-6 bg-gray-50 p-6 rounded-lg shadow-sm">
        {/* Mostrar alertas */}
        {alert.show && (
          <div
            className={`flex items-center p-4 rounded-lg shadow-sm ${alert.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : alert.type === "info"
                ? "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
                : "bg-red-100 text-red-800 border-l-4 border-red-500"
              }`}
          >
            {alert.type === "error" && <FaExclamationTriangle className="mr-3 flex-shrink-0" />}
            {alert.type === "info" && <FaInfoCircle className="mr-3 flex-shrink-0" />}
            <span className="text-sm">{alert.message}</span>
          </div>
        )}

        {/* Título principal */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaGasPump className="mr-3 text-orange-500" />
            Registro de Trasvasije de Petróleo
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Complete la información del trasvasije y configure la distribución de estanques
          </p>
        </div>

        {/* Panel de distribución TOTAL si existe */}
        {(Object.values(distribucionLitros).some(valor => parseFloat(valor) > 0) || 
          Object.values(distribucionEstanquesMoviles).some(valor => parseFloat(valor) > 0) ||
          estanqueMovilSeleccionado) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-500 p-2.5 rounded-full mr-4 shadow-sm">
                  <FaGasPump className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800 text-lg">
                    Distribución Configurada
                  </h3>
                  <div className="text-blue-700 text-sm space-y-1 mt-1">
                    {/* Estanques Fijos */}
                    {Object.values(distribucionLitros).some(valor => parseFloat(valor) > 0) && (
                      <p className="flex items-center">
                        <FaBuilding className="mr-2" size={12} />
                        Estanques Fijos: {formatNumberWithSeparators(
                          Object.values(distribucionLitros).reduce((total, valor) => {
                            return total + (parseFloat(valor) || 0);
                          }, 0)
                        )} L
                      </p>
                    )}
                    
                    {/* Estanques Móviles */}
                    {modoMultiMovil ? (
                      Object.values(distribucionEstanquesMoviles).some(valor => parseFloat(valor) > 0) && (
                        <p className="flex items-center">
                          <FaTruck className="mr-2" size={12} />
                          Estanques Móviles: {formatNumberWithSeparators(
                            Object.values(distribucionEstanquesMoviles).reduce((total, valor) => {
                              return total + (parseFloat(valor) || 0);
                            }, 0)
                          )} L
                        </p>
                      )
                    ) : (
                      estanqueMovilSeleccionado && (
                        <p className="flex items-center">
                          <FaTruck className="mr-2" size={12} />
                          Estanque Móvil: {estanqueMovilSeleccionado.nombre}
                        </p>
                      )
                    )}
                    
                    {/* Total */}
                    <p className="font-semibold text-blue-800 border-t border-blue-200 pt-2">
                      Total Distribuido: {formatNumberWithSeparators(
                        Object.values(distribucionLitros).reduce((total, valor) => total + (parseFloat(valor) || 0), 0) +
                        (modoMultiMovil 
                          ? Object.values(distribucionEstanquesMoviles).reduce((total, valor) => total + (parseFloat(valor) || 0), 0)
                          : 0)
                      )} L
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center text-blue-600">
                <div className={`w-4 h-4 rounded-full mr-2 shadow-sm ${validarDistribucionTotal().valido ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                <span className="text-sm font-medium">
                  {validarDistribucionTotal().valido ? 'Distribución Válida' : 'Requiere Ajuste'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Formulario principal */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaFileAlt className="mr-2 text-gray-600" />
            Información del Trasvasije
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campo de litros documentados */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Litros Documentados *
                <span className="text-xs text-gray-500 ml-2">(según documentación)</span>
              </label>
              <InputField
                placeholder="Ingrese litros según documentación"
                type="number"
                step="0.01"
                value={formData.litrosDocumentados}
                onChange={(e) => handleLitrosDocumentadosChange(e.target.value)}
                onBlur={(e) => handleLitrosDocumentadosBlur(e.target.value)}
                className={`bg-white rounded-lg text-gray-800 transition-colors ${
                  errors.litrosDocumentados ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-orange-500"
                }`}
              />
              {errors.litrosDocumentados && (
                <span className="text-red-500 text-xs mt-1 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {errors.litrosDocumentados}
                </span>
              )}
            </div>

            {/* Campo de niveles de estanques fijos */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveles de Estanques Fijos *
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  text="Ingresar Niveles"
                  color="orange"
                  icon={<FaRuler className="mr-2 text-white" />}
                  onClick={() => setShowEstanquesModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2.5 rounded-lg flex items-center transition-colors shadow-sm"
                  disabled={!formData.id_faena || !formData.litrosDocumentados}
                />
                {calculoPetroleo.calculoRealizado && (
                  <span className="text-green-600 flex items-center text-sm font-medium">
                    <FaCheck className="mr-1" />
                    Alturas Registradas
                  </span>
                )}
              </div>
              {!formData.id_faena ? (
                <span className="text-amber-600 text-xs mt-2 flex items-center">
                  <FaInfoCircle className="mr-1" />
                  No se ha podido identificar la faena
                </span>
              ) : !formData.litrosDocumentados ? (
                <span className="text-amber-600 text-xs mt-2 flex items-center">
                  <FaInfoCircle className="mr-1" />
                  Debe ingresar primero la cantidad de litros documentados
                </span>
              ) : (
                !calculoPetroleo.calculoRealizado && (
                  <span className="text-red-500 text-xs mt-2 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    Debe ingresar las alturas para calcular la diferencia
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Selector de estanques móviles */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaTruck className="mr-2 text-amber-600" />
            Estanques Móviles
            <span className="text-sm font-normal text-gray-500 ml-2">(opcional)</span>
          </h3>

          {formData.id_faena && formData.litrosDocumentados ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <SelectorEstanque
                idFaena={formData.id_faena}
                onEstanqueSelect={handleEstanqueMovilSelect}
                estanqueSeleccionado={estanqueMovilSeleccionado}
                litrosRequeridos={parseFloat(formData.litrosDocumentados) || 0}
                disabled={isSubmitting}
                tipoEstanque="movil"
                selectorId="estanques-moviles"
                modoMultiple={modoMultiMovil}
                distribucionLitros={distribucionEstanquesMoviles}
                onDistribucionChange={handleDistribucionEstanquesMovilesChange}
                mostrarToggle={true}
                onModoChange={handleModoMultiMovilChange}
                showTitle={false}
                className=""
              />
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FaInfoCircle className="text-gray-400 text-3xl mb-3 mx-auto" />
              <p className="text-gray-600 font-medium">
                {!formData.id_faena 
                  ? "Faena no identificada" 
                  : "Ingrese primero los litros documentados"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Complete los campos requeridos para habilitar la selección de estanques móviles
              </p>
            </div>
          )}
        </div>

        {/* Resultado del cálculo */}
        {calculoPetroleo.calculoRealizado && (
          <div
            className={`p-6 rounded-lg border shadow-sm transition-all duration-300 ${
              Math.abs(calculoPetroleo.diferencia) <= 0.5
                ? "bg-gray-50 border-gray-200"
                : calculoPetroleo.diferencia > 0
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-center mb-4">
              <h4
                className={`text-lg font-semibold ${
                  Math.abs(calculoPetroleo.diferencia) <= 0.5
                    ? "text-gray-700"
                    : calculoPetroleo.diferencia > 0
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                Resultado del Cálculo
              </h4>
              <div className="ml-3 bg-green-100 px-3 py-1 rounded-full">
                <FaCheck className="text-green-600 text-sm" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Litros Documentados</p>
                <p className="text-xl font-bold text-gray-800">
                  {formatNumberWithSeparators(parseFloat(formData.litrosDocumentados))} L
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Litros Medidos</p>
                <p className="text-xl font-bold text-gray-800">
                  {formatNumberWithSeparators(calculoPetroleo.litrosMedidos)} L
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Diferencia</p>
                <p
                  className={`text-xl font-bold ${
                    Math.abs(calculoPetroleo.diferencia) <= 0.5
                      ? "text-gray-700"
                      : calculoPetroleo.diferencia > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatNumberWithSeparators(Math.abs(calculoPetroleo.diferencia))} L
                  <span className="text-sm ml-1 font-normal">
                    ({calculoPetroleo.diferencia > 0 ? "excedente" : "faltante"})
                  </span>
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center">
                <FaSync className="mr-1" />
                Los valores se actualizan automáticamente
              </p>
            </div>
          </div>
        )}

        {/* Campo de observaciones */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <InputField
            placeholder="Ingrese observaciones adicionales sobre el trasvasije..."
            isTextarea={true}
            value={formData.observacion}
            onChange={(e) => handleChange("observacion", e.target.value)}
            className="bg-white rounded-lg px-4 py-3 min-h-[100px] text-gray-800 border-gray-300 focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
          <Button
            to="/Bombero"
            className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white text-sm px-6 py-3 rounded-lg transition-colors shadow-sm order-2 sm:order-1"
            icon={<FaHome className="mr-2 text-white" />}
            text="Volver al Inicio"
          />

          <Button
            text={isSubmitting ? "Procesando..." : "Registrar Trasvasije"}
            color="orange"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`bg-orange-600 hover:bg-orange-700 text-white text-sm px-8 py-3 rounded-lg transition-colors shadow-sm order-1 sm:order-2 ${
              isSubmitting ? "opacity-70 cursor-wait" : ""
            }`}
            icon={!isSubmitting && <FaGasPump className="mr-2 text-white" />}
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
          estanques={estanques}
          alturasEstanques={alturasEstanques}
          handleAlturaChange={handleAlturaChange}
          calcularLitrosPetroleo={calcularLitrosPetroleo}
          modalAlert={modalAlert}
          capacidadDisponible={capacidadDisponible}
          litrosRecibidos={parseFloat(formData.litrosDocumentados) || 0}
          distribucionLitros={distribucionLitros}
          onDistribucionChange={handleDistribucionChange}
        />
      </div>

      {/* Modales */}
      <ModalConfirmacionReinicio
        isOpen={showModalActualizacion}
        onConfirm={confirmarActualizacion}
        onCancel={cancelarActualizacion}
      />

      {datosRecepcionExitosa && (
        <ModalExitoRecepcion
          isOpen={showExitoModal}
          onConfirm={handleExitoModalConfirm}
          datosRecepcion={datosRecepcionExitosa}
        />
      )}
    </>
  );
};

export default FormRecepcionTrasvasije;