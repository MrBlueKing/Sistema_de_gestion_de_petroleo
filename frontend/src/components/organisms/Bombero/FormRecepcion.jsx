import React, { useContext, useState, useEffect } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import {
  FaHome,
  FaExclamationTriangle,
  FaTimes,
  FaRuler,
  FaCheck,
  FaFileAlt,
  FaGasPump,
  FaCalculator,
  FaDollarSign,
  FaArrowRight,
  FaLock,
  FaUnlock,
  FaRedo,
  FaInfoCircle,
  FaSync,
} from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";
import EstanquesModal from "./EstanquesModal";
import { FaCheckCircle } from "react-icons/fa";

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

// COMPONENTE MODAL DE CONFIRMACIÓN PARA REINICIAR (SIMPLIFICADO)
const ModalConfirmacionReinicio = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-transparent bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
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
              nuevo valor de litros guía.
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
                <p className="font-medium mb-1">
                  Se actualizará automáticamente:
                </p>
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

// COMPONENTE MODAL DE ÉXITO INTEGRADO
const ModalExitoRecepcion = ({ isOpen, onConfirm, datosRecepcion }) => {
  if (!isOpen) return null;

  const {
    numeroGuia,
    litrosDocumentados,
    litrosMedidos,
    diferencia,
    precioTotal,
    stockInicial,
    precio,
  } = datosRecepcion;

  const diferenciaMagnitud = Math.abs(diferencia);
  const esDiferenciaSignificativa = diferenciaMagnitud > 0.5;
  const esExcedente = diferencia > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-transparent bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeInScale">
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white">
          <div className="flex items-center justify-center">
            <div className="bg-transparent bg-opacity-20 p-3 rounded-full mr-4">
              <FaCheck className="text-2xl" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">
                ¡Recepción Registrada Exitosamente!
              </h2>
            </div>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Resumen de datos en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Información de la Guía */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-3">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <FaFileAlt className="text-white text-sm" />
                </div>
                <h3 className="font-semibold text-blue-800">
                  Información de Guía
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700 text-sm">N° Guía:</span>
                  <span className="font-bold text-blue-900">{numeroGuia}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 text-sm">
                    Litros Guía:
                  </span>
                  <span className="font-bold text-blue-900">
                    {formatNumberWithSeparators(litrosDocumentados)} L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 text-sm">
                    Precio por Litro:
                  </span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(precio)}
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
                  <span className="text-orange-700 text-sm">
                    Stock Inicial:
                  </span>
                  <span className="font-bold text-orange-900">
                    {formatNumberWithSeparators(stockInicial)} L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700 text-sm">
                    Litros Medidos:
                  </span>
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

          {/* Resumen financiero */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-500 p-2 rounded-lg mr-3">
                  <FaDollarSign className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">
                    Total de la Recepción
                  </h3>
                  <p className="text-green-600 text-sm">
                    Basado en litros Guía
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(precioTotal)}
                </div>
                <div className="text-green-600 text-sm">
                  {formatNumberWithSeparators(litrosDocumentados)} L ×{" "}
                  {formatCurrency(precio)}
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
                <span className="ml-2 font-medium text-orange-600">
                  ✓ Completado
                </span>
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

const FormRecepcion = () => {
  // Acceder al contexto de usuario
  const { user, loading } = useContext(UserContext);

  const activo = false;

  // ✅ CORREGIDO: Estados para datos del formulario con nombres más claros
  const [formData, setFormData] = useState({
    numeroGuia: "",
    litrosDocumentados: "", // ← CAMBIO: Nombre más claro (antes era litrosRecibidos)
    observacion: "",
    precio: "",
    id_faena: "",
  });

  // Estados para controlar el modal de actualización
  const [showModalActualizacion, setShowModalActualizacion] = useState(false);
  const [nuevoValorLitros, setNuevoValorLitros] = useState("");
  const [valorOriginalLitros, setValorOriginalLitros] = useState("");

  // Estados para distribución de combustible
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

  // ✅ CORREGIDO: Estado del cálculo con nombre más claro
  const [calculoPetroleo, setCalculoPetroleo] = useState({
    litrosMedidos: 0, // ← CAMBIO: Nombre más claro (antes era litrosCalculados)
    diferencia: 0,
    calculoRealizado: false,
  });

  const [stockInicial, setStockInicial] = useState(0);

  // NUEVOS ESTADOS PARA NUMERALES(Cambio de contexto)
  const [modoNumerales, setModoNumerales] = useState(false);
  const [numeralesIngresados, setNumeralesIngresados] = useState({});

  // Función para manejar cambios en la distribución
  const handleDistribucionChange = (nuevaDistribucion) => {
    setDistribucionLitros(nuevaDistribucion);
    activo && console.log('Nueva distribución:', nuevaDistribucion);
  };

  // Función para validar distribución
  const validarDistribucion = () => {
    if (modoNumerales) {
      // Validación específica para numerales
      const estanquesConNumerales = Object.entries(numeralesIngresados)
        .filter(([_, numeral]) => numeral && parseFloat(numeral) > 0);

      if (estanquesConNumerales.length === 0) {
        return {
          valido: false,
          mensaje: "Debe ingresar al menos un numeral de bomba para continuar."
        };
      }

      // Verificar numerales únicos y crecientes
      const numerales = estanquesConNumerales.map(([_, numeral]) => parseFloat(numeral));
      const numeralesOrdenados = [...numerales].sort((a, b) => a - b);

      for (let i = 1; i < numeralesOrdenados.length; i++) {
        if (numeralesOrdenados[i] <= numeralesOrdenados[i - 1]) {
          return {
            valido: false,
            mensaje: "Los numerales de bomba deben ser estrictamente crecientes y únicos."
          };
        }
      }

      return { valido: true };
    } else {
      // Validación original para litros directos
      const totalDistribuido = Object.values(distribucionLitros).reduce((total, valor) => {
        const num = parseFloat(valor) || 0;
        return total + num;
      }, 0);

      if (totalDistribuido === 0) {
        return {
          valido: false,
          mensaje: "Debe distribuir combustible en al menos un estanque."
        };
      }

      // // Si hay distribución, debe coincidir exactamente con litros guía
      // if (Math.abs(totalDistribuido - litrosGuia) > 0.01) {
      //   return {
      //     valido: false,
      //     mensaje: `La distribución (${formatNumberWithSeparators(totalDistribuido)} L) debe coincidir exactamente con los litros Guía (${formatNumberWithSeparators(litrosGuia)} L).`
      //   };
      // }

      return { valido: true, mensaje: "" };
    }
  };

  // ✅ CORREGIDO: Función para manejar cambios en litros documentados
  const handleLitrosDocumentadosChange = (value) => {
    handleChange("litrosDocumentados", value);
  };

  // ✅ CORREGIDO: Función para manejar cuando el campo pierde el foco
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

    mostrarAlerta(
      "info",
      "Se ha restaurado el valor original. Los cálculos permanecen sin cambios."
    );
  };

  // ✅ CORREGIDO: Función para confirmar actualización automática de cálculos
  const confirmarActualizacion = () => {
    setFormData((prev) => ({
      ...prev,
      litrosDocumentados: nuevoValorLitros,
    }));

    recalcularDiferencia(nuevoValorLitros);

    setShowModalActualizacion(false);
    setNuevoValorLitros("");
    setValorOriginalLitros("");

    mostrarAlerta(
      "info",
      "Los cálculos han sido actualizados automáticamente con el nuevo valor."
    );
  };

  // ✅ CORREGIDO: Función para recalcular solo la diferencia
  const recalcularDiferencia = (nuevosLitrosDocumentados) => {
    const litrosGuia = parseFloat(nuevosLitrosDocumentados) || 0;
    const nuevaDiferencia = calculoPetroleo.litrosMedidos - litrosGuia;

    setCalculoPetroleo((prev) => ({
      ...prev,
      diferencia: nuevaDiferencia,
    }));

    setFormData((prev) => ({
      ...prev,
      observacion: generarObservacionDiferencia(
        litrosGuia,
        calculoPetroleo.litrosMedidos
      ),
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

  // Efecto para validar distribución cuando cambie
  useEffect(() => {
    if (Object.keys(distribucionLitros).length > 0) {
      const validacion = validarDistribucion();
      if (!validacion.valido) {
        activo && console.log('Error en distribución:', validacion.mensaje);
      }
    }
  }, [distribucionLitros, formData.litrosDocumentados]);

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
      activo && console.log("Error al cargar estanques:", error);
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
      activo && console.log("Error al cargar capacidad disponible:", error);
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
    setTimeout(
      () => setModalAlert({ show: false, message: "", type: "" }),
      5000
    );
  };

  // ✅ CORREGIDO: Función para validar campos en tiempo real
  const validateField = () => {
    const newErrors = {};

    if (touched.numeroGuia && !formData.numeroGuia.trim()) {
      newErrors.numeroGuia = "El número de guía es obligatorio";
    }

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

    if (touched.precio) {
      if (!formData.precio) {
        newErrors.precio = "El precio es obligatorio";
      } else if (isNaN(formData.precio) || parseFloat(formData.precio) <= 0) {
        newErrors.precio = "Debe ingresar un precio válido mayor a 0";
      }
    }

    setErrors(newErrors);
  };

  // ✅ CORREGIDO: Función para validar todos los campos
  const validarFormularioCompleto = () => {
    const newErrors = {};

    if (!formData.numeroGuia.trim())
      newErrors.numeroGuia = "Este campo es obligatorio";

    if (!formData.litrosDocumentados) {
      newErrors.litrosDocumentados = "Este campo es obligatorio";
    } else if (
      isNaN(formData.litrosDocumentados) ||
      parseFloat(formData.litrosDocumentados) <= 0
    ) {
      newErrors.litrosDocumentados = "Debe ingresar un valor numérico mayor a 0";
    }

    if (!formData.precio) {
      newErrors.precio = "Este campo es obligatorio";
    } else if (isNaN(formData.precio) || parseFloat(formData.precio) <= 0) {
      newErrors.precio = "Debe ingresar un precio válido mayor a 0";
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

  // ✅ CORREGIDO: Función para calcular los litros de petróleo según las alturas
  const calcularLitrosPetroleo = async () => {
    if (!formData.id_faena) {
      mostrarModalAlerta(
        "error",
        "Debe seleccionar una faena antes de calcular."
      );
      return null;
    }

    if (!user || !user.id) {
      mostrarModalAlerta("error", "No se puede identificar al usuario actual.");
      return null;
    }

    if (
      !formData.litrosDocumentados ||
      parseFloat(formData.litrosDocumentados) <= 0
    ) {
      mostrarModalAlerta(
        "error",
        "Debe ingresar la cantidad de litros Guía antes de calcular."
      );
      return null;
    }

    const validacionDistribucion = validarDistribucion();
    if (!validacionDistribucion.valido) {
      mostrarModalAlerta("error", validacionDistribucion.mensaje);
      return null;
    }

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      const { alturasIniciales, alturasFinales, incompletas } =
        procesarAlturas();

      if (incompletas) {
        mostrarModalAlerta(
          "error",
          "Debe ingresar todas las alturas iniciales y finales de los estanques."
        );
        return null;
      }

      const datosAlturasIniciales = convertirAlturasParaAPI(alturasIniciales);
      const datosAlturasFinales = convertirAlturasParaAPI(alturasFinales);

      if (
        hayAlturasIncompletas(datosAlturasIniciales) ||
        hayAlturasIncompletas(datosAlturasFinales)
      ) {
        mostrarModalAlerta(
          "error",
          "Debe ingresar todas las alturas iniciales y finales de los estanques."
        );
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

      const responseInicial = await axios.post(
        "/api/calcular-litros-petroleo",
        datosCalcularInicial,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!responseInicial.data.success) {
        throw new Error(
          responseInicial.data.message ||
          "Error al calcular los litros iniciales"
        );
      }

      const responseFinal = await axios.post(
        "/api/calcular-litros-petroleo",
        datosCalcularFinal,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!responseFinal.data.success) {
        throw new Error(
          responseFinal.data.message || "Error al calcular los litros finales"
        );
      }

      return procesarResultadosCalculo(responseInicial, responseFinal);
    } catch (error) {
      activo && console.log("Error al calcular litros de petróleo:", error);

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
        console.warn(
          "Estructura de alturas incorrecta para estanque",
          estanqueId
        );
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

  // ✅ CORREGIDO: Función para procesar los resultados del cálculo
  const procesarResultadosCalculo = (responseInicial, responseFinal) => {
    const stockInicial = responseInicial.data.litros_totales || 0;
    const stockFinal = responseFinal.data.litros_totales || 0;
    const litrosIngresados = stockFinal - stockInicial;
    const litrosGuia = parseFloat(formData.litrosDocumentados);

    // Diferencia = litros medidos - litros documentados
    const diferencia = litrosIngresados - litrosGuia;

    // ✅ CORREGIDO: Usar litrosMedidos en lugar de litrosCalculados
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

  // ✅ CORREGIDO: Generar texto de observación basado en diferencia
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

  // Preparar datos de alturas para envío a API
  const prepararDatosAlturas = () => {
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
      } else if (datos !== undefined && datos !== "") {
        console.warn("Formato de altura no estándar detectado en envío");
        alturas.push({
          id_estanque: parseInt(idEstanque),
          altura: parseFloat(datos),
          tipo: "inicial",
        });
      }
    });

    return alturas;
  };

  // Función para manejar el cierre del modal de éxito
  const handleExitoModalConfirm = () => {
    setShowExitoModal(false);
    setDatosRecepcionExitosa(null);
    window.location.href = "/bombero";
  };


  // Función para calcular litros desde numerales
  const calcularLitrosDesdeNumeralesFormRecepcion = (numerales = numeralesIngresados) => {
    const estanquesConNumerales = Object.entries(numerales)
      .filter(([_, numeral]) => numeral && parseFloat(numeral) > 0)
      .map(([estanqueId, numeral]) => ({
        id_estanque: parseInt(estanqueId),
        numeral: parseFloat(numeral)
      }))
      .sort((a, b) => a.numeral - b.numeral);

    const litrosCalculados = {};
    let numeralAnterior = 0;

    estanquesConNumerales.forEach(item => {
      litrosCalculados[item.id_estanque] = item.numeral - numeralAnterior;
      numeralAnterior = item.numeral;
    });

    return litrosCalculados;
  };

  // Función para manejar cambio de numerales desde el modal
  const handleNumeralesChange = (numerales) => {
    setNumeralesIngresados(numerales);

    // Calcular automáticamente la distribución de litros
    const litrosCalculados = calcularLitrosDesdeNumeralesFormRecepcion(numerales);

    // Convertir a formato de distribución compatible
    const nuevaDistribucion = {};
    estanques.forEach(estanque => {
      nuevaDistribucion[estanque.id_estanque] = litrosCalculados[estanque.id_estanque] || 0;
    });

    setDistribucionLitros(nuevaDistribucion);
  };

  // ✅ CORREGIDO: Manejar el envío del formulario
  const handleSubmit = async () => {
    setTouched({
      numeroGuia: true,
      litrosDocumentados: true,
      precio: true,
    });

    if (loading || !user) {
      mostrarAlerta(
        "error",
        "No se ha podido acceder a la información del usuario."
      );
      return;
    }

    if (!validarFormularioCompleto()) {
      mostrarAlerta(
        "error",
        "Por favor, complete todos los campos obligatorios correctamente."
      );
      return;
    }

    if (!calculoPetroleo.calculoRealizado) {
      mostrarAlerta(
        "error",
        "Debe ingresar las alturas de los estanques y calcular la diferencia."
      );
      setShowEstanquesModal(true);
      return;
    }

    if (!verificarAlturasCompletas()) {
      mostrarAlerta(
        "error",
        "Debe ingresar todas las alturas iniciales y finales de los estanques."
      );
      setShowEstanquesModal(true);
      return;
    }

    const validacionDistribucion = validarDistribucion();
    if (!validacionDistribucion.valido) {
      mostrarAlerta("error", validacionDistribucion.mensaje);
      setShowEstanquesModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ CORREGIDO: Usar litrosDocumentados en lugar de litrosRecibidos
      const precioTotal =
        parseFloat(formData.litrosDocumentados) * parseFloat(formData.precio);

      // ✅ CORREGIDO: Diferencia = litros medidos - litros documentados
      const diferencia =
        calculoPetroleo.litrosMedidos - parseFloat(formData.litrosDocumentados);

      const alturas = prepararDatosAlturas();

      // ✅ CORREGIDO: Datos para envío con nombres correctos
      const dataToSend = {
        id_usuario: user.id,
        numero_guia: formData.numeroGuia,
        litros_documentados: parseFloat(formData.litrosDocumentados), // ← Litros según guía
        litros_recibidos: calculoPetroleo.litrosMedidos, // ← Litros medidos por alturas
        precio: parseFloat(formData.precio),
        precio_total: precioTotal,
        recibo_conforme: true,
        observacion: formData.observacion,
        id_faena: formData.id_faena,
        diferencia: diferencia,
        stock_inicial: stockInicial,
        distribucion_litros: modoNumerales
          ? calcularLitrosDesdeNumeralesFormRecepcion()
          : distribucionLitros,
        // OPCIONAL: Guardar información adicional sobre el método usado
        metodo_medicion: modoNumerales ? "numerales_bomba" : "litros_directos",
        numerales_originales: modoNumerales ? numeralesIngresados : null,
        alturas_estanques: prepararDatosAlturasConTipo(),
      };

      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      const response = await axios.post("/api/ingresos-petroleo", dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ CORREGIDO: Datos para el modal de éxito con nombres correctos
      const datosParaModalExito = {
        numeroGuia: formData.numeroGuia,
        litrosDocumentados: parseFloat(formData.litrosDocumentados),
        litrosMedidos: calculoPetroleo.litrosMedidos,
        diferencia: diferencia,
        precioTotal: precioTotal,
        stockInicial: stockInicial,
        precio: parseFloat(formData.precio),
      };

      setDatosRecepcionExitosa(datosParaModalExito);
      setShowExitoModal(true);
    } catch (error) {
      activo && console.log("Error al enviar los datos:", error);
      manejarErrorEnvio(error);
    } finally {
      setIsSubmitting(false);
    }
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

  // ✅ CORREGIDO: Función para resetear el formulario
  const resetearFormulario = () => {
    setFormData({
      numeroGuia: "",
      litrosDocumentados: "",
      observacion: "",
      precio: "",
      id_faena: formData.id_faena,
    });

    setTouched({});
    setCalculoPetroleo({
      litrosMedidos: 0,
      diferencia: 0,
      calculoRealizado: false,
    });

    setDistribucionLitros({});

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
            {alert.type === "error" && (
              <FaExclamationTriangle className="mr-2" />
            )}
            {alert.type === "info" && <FaInfoCircle className="mr-2" />}
            {alert.message}
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">
          Registro de Recepción de Petróleo desde Camión
        </h2>

        {/* Panel de distribución si existe */}
        {Object.values(distribucionLitros).some(valor => parseFloat(valor) > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-500 p-2 rounded-full mr-3">
                  <FaGasPump className="text-white text-sm" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-800">
                    Distribución Configurada
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Total distribuido: {formatNumberWithSeparators(
                      Object.values(distribucionLitros).reduce((total, valor) => {
                        return total + (parseFloat(valor) || 0);
                      }, 0)
                    )} L
                  </p>
                </div>
              </div>
              <div className="flex items-center text-blue-600">
                <div className={`w-3 h-3 rounded-full mr-2 ${validarDistribucion().valido ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                <span className="text-sm font-medium">
                  {validarDistribucion().valido ? 'Válida' : 'Requiere ajuste'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 1: DATOS DE LA GUÍA */}
        <div className="text-left space-y-4">
          <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
            <FaFileAlt className="mr-2 text-orange-600" />
            1. Datos de la Guía de Despacho
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Número de Guía de Despacho *
                <span className="text-xs text-gray-500 ml-1">(según documento de compra)</span>
              </label>
              <InputField
                placeholder="Ej: 123456789"
                value={formData.numeroGuia}
                onChange={(e) => handleChange("numeroGuia", e.target.value)}
                onBlur={() => handleBlur("numeroGuia")}
                className={`bg-white rounded-md text-gray-800 ${errors.numeroGuia ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.numeroGuia && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.numeroGuia}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Precio del Petróleo (por litro) *
                <span className="text-xs text-gray-500 ml-1">($/litro)</span>
              </label>
              <InputField
                placeholder="Ej: 850"
                type="number"
                value={formData.precio}
                onChange={(e) => handleChange("precio", e.target.value)}
                onBlur={() => handleBlur("precio")}
                className={`bg-white rounded-md text-gray-800 ${errors.precio ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.precio && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.precio}
                </span>
              )}
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-600 mb-1 flex items-center">
                Litros Según Guía *
                <span className="text-xs text-gray-500 ml-2">(según guía de despacho)</span>
              </label>
              <div className="relative">
                <InputField
                  placeholder="Ej: 5000.00"
                  type="number"
                  value={formData.litrosDocumentados}
                  onChange={(e) => handleLitrosDocumentadosChange(e.target.value)}
                  onBlur={(e) => handleLitrosDocumentadosBlur(e.target.value)}
                  className={`bg-white rounded-md text-gray-800 ${errors.litrosDocumentados ? "border-red-500" : "border-gray-300"
                    }`}
                />
              </div>
              {errors.litrosDocumentados && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.litrosDocumentados}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: MEDICIÓN EN ESTANQUES */}
        <div className="text-left space-y-4">
          <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
            <FaRuler className="mr-2 text-green-600" />
            2. Medición en Estanques y Distribución
          </h3>

          <div className="pl-4 space-y-4">
            <p className="text-sm text-gray-600">
              Ingrese las alturas de los estanques antes y después del vaciado del camión,
              y configure cómo se distribuirán los litros entre los estanques fijos:
            </p>

            <button
              onClick={() => setShowEstanquesModal(true)}
              className="flex items-center px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              <FaRuler className="mr-2" />
              <span>Abrir Medición de Estanques</span>
            </button>

            {/* Mostrar resultados del cálculo si existen */}
            {calculoPetroleo.calculoRealizado && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <FaCalculator className="mr-2" />
                  Resultados del Cálculo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-600 font-medium">Litros Medidos:</span>
                    <p className="text-green-800 font-bold">
                      {formatNumberWithSeparators(calculoPetroleo.litrosMedidos)} L
                    </p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Diferencia:</span>
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
                  <div>
                    <span className="text-green-600 font-medium">Estado:</span>
                    <p className="text-green-800 font-bold">✓ Calculado</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 flex items-center justify-center">
                  <FaSync className="mr-1" />
                  Los valores se actualizan automáticamente
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: INFORMACIÓN ECONÓMICA */}
        {formData.litrosDocumentados && formData.precio && (
          <div className="text-left space-y-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
              <FaDollarSign className="mr-2 text-green-600" />
              3. Información Económica
            </h3>

            <div className="pl-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600 font-medium">Precio por Litro:</span>
                    <p className="text-black-800 font-bold">${formData.precio}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Precio Total Estimado:</span>
                    <p className="text-black-800 font-bold text-lg">
                      {formatCurrency(parseFloat(formData.litrosDocumentados) * parseFloat(formData.precio))}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  * El precio total se calculará exactamente con los litros medidos finales
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 4: OBSERVACIONES Y CONFIRMACIÓN */}
        <div className="text-left space-y-4">
          <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
            <FaCheckCircle className="mr-2 text-blue-600" />
            4. Observaciones y Confirmación
          </h3>

          <div className="pl-4 space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-600 mb-1">
                Observaciones (Opcional)
                <span className="text-xs text-gray-500 ml-1">(comentarios sobre la recepción)</span>
              </label>
              <InputField
                placeholder="Ej: Recepción realizada sin inconvenientes..."
                isTextarea={true}
                value={formData.observacion}
                onChange={(e) => handleChange("observacion", e.target.value)}
                className="bg-white rounded-md px-3 py-2 min-h-[80px] text-gray-800 border-gray-300"
              />
            </div>

            {/* Resumen final antes de enviar */}
            {formData.numeroGuia && formData.litrosDocumentados && formData.precio && calculoPetroleo.calculoRealizado && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 mb-3 flex items-center">
                  <FaCheckCircle className="mr-2" />
                  Resumen de la Recepción
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-orange-600 font-medium">Guía:</span>
                    <p className="text-orange-800">{formData.numeroGuia}</p>
                  </div>
                  <div>
                    <span className="text-orange-600 font-medium">Documentados:</span>
                    <p className="text-orange-800">{formatNumberWithSeparators(formData.litrosDocumentados)} L</p>
                  </div>
                  <div>
                    <span className="text-orange-600 font-medium">Medidos:</span>
                    <p className="text-orange-800">{formatNumberWithSeparators(calculoPetroleo.litrosMedidos)} L</p>
                  </div>
                  <div>
                    <span className="text-orange-600 font-medium">Diferencia:</span>
                    <p className={`font-bold ${calculoPetroleo.diferencia === 0 ? "text-gray-600" :
                      calculoPetroleo.diferencia > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      {calculoPetroleo.diferencia > 0 ? "+" : ""}{formatNumberWithSeparators(calculoPetroleo.diferencia)} L
                    </p>
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
            text={isSubmitting ? "Procesando..." : "Registrar Recepción"}
            color="orange"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`bg-orange-600 hover:bg-orange-700 text-white text-sm px-6 py-3 sm:py-2 rounded-md w-full sm:w-auto sm:ml-auto ${isSubmitting ? "opacity-70 cursor-wait" : ""
              }`}
          />
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Los campos marcados con * son obligatorios
        </div>

        {/* ✅ CORREGIDO: Modal de estanques con prop actualizada */}
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
          // NUEVAS PROPS PARA NUMERALES:
          modoNumerales={modoNumerales}
          onModoNumeralesChange={setModoNumerales}
          numeralesIngresados={numeralesIngresados}
          onNumeralesChange={handleNumeralesChange}
        />
      </div>

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

export default FormRecepcion;