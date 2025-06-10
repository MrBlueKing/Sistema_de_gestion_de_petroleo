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
              nuevo valor de litros recibidos.
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
    litrosCalculados,
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
                    Litros Calculados:
                  </span>
                  <span className="font-bold text-orange-900">
                    {formatNumberWithSeparators(litrosCalculados)} L
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

  // Estados para datos del formulario
  const [formData, setFormData] = useState({
    numeroGuia: "",
    litrosRecibidos: "",
    observacion: "",
    precio: "",
    id_faena: "",
  });

  // Estados para controlar el modal de actualización
  const [showModalActualizacion, setShowModalActualizacion] = useState(false);
  const [nuevoValorLitros, setNuevoValorLitros] = useState("");
  const [valorOriginalLitros, setValorOriginalLitros] = useState(""); // NUEVO ESTADO

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
  const [calculoPetroleo, setCalculoPetroleo] = useState({
    litrosCalculados: 0,
    diferencia: 0,
    calculoRealizado: false,
  });

  const [stockInicial, setStockInicial] = useState(0);

  // Función para manejar cambios en la distribución
  const handleDistribucionChange = (nuevaDistribucion) => {
    setDistribucionLitros(nuevaDistribucion);
    console.log('Nueva distribución:', nuevaDistribucion);
  };

  // Función para validar distribución
  const validarDistribucion = () => {
    const litrosGuia = parseFloat(formData.litrosRecibidos) || 0;
    const totalDistribuido = Object.values(distribucionLitros).reduce((total, valor) => {
      return total + (parseFloat(valor) || 0);
    }, 0);

    // Si no hay distribución, permitir continuar
    if (totalDistribuido === 0) return { valido: true, mensaje: "" };

    // Si hay distribución, debe coincidir exactamente con litros guía
    if (Math.abs(totalDistribuido - litrosGuia) > 0.01) {
      return {
        valido: false,
        mensaje: `La distribución (${formatNumberWithSeparators(totalDistribuido)} L) debe coincidir exactamente con los litros de la guía (${formatNumberWithSeparators(litrosGuia)} L).`
      };
    }

    return { valido: true, mensaje: "" };
  };

  // FUNCIÓN MODIFICADA - Ahora solo maneja cambios normales
  const handleLitrosRecibidosChange = (value) => {
    // Permitir cambio normal sin mostrar modal
    handleChange("litrosRecibidos", value);
  };

  // NUEVA FUNCIÓN para manejar cuando el campo pierde el foco
  const handleLitrosRecibidosBlur = (value) => {
    // Marcar el campo como tocado
    handleBlur("litrosRecibidos");

    // Si ya hay cálculos realizados y el valor ha cambiado, mostrar modal
    if (calculoPetroleo.calculoRealizado) {
      // Guardar el valor original antes del cambio si no existe
      if (!valorOriginalLitros) {
        setValorOriginalLitros(formData.litrosRecibidos);
      }

      const valorActual = parseFloat(valorOriginalLitros || formData.litrosRecibidos) || 0;
      const nuevoValor = parseFloat(value) || 0;

      // Solo mostrar modal si el valor realmente cambió
      if (Math.abs(valorActual - nuevoValor) > 0.01) {
        setNuevoValorLitros(value);
        setShowModalActualizacion(true);
      }
    }
  };

  // NUEVA FUNCIÓN para cancelar y restaurar el valor original
  const cancelarActualizacion = () => {
    // Restaurar el valor original
    setFormData((prev) => ({
      ...prev,
      litrosRecibidos: valorOriginalLitros,
    }));

    // Limpiar estados del modal
    setShowModalActualizacion(false);
    setNuevoValorLitros("");
    setValorOriginalLitros("");

    // Mostrar mensaje informativo
    mostrarAlerta(
      "info",
      "Se ha restaurado el valor original. Los cálculos permanecen sin cambios."
    );
  };

  // FUNCIÓN MODIFICADA para confirmar actualización automática de cálculos
  const confirmarActualizacion = () => {
    // Actualizar el valor de litros recibidos
    setFormData((prev) => ({
      ...prev,
      litrosRecibidos: nuevoValorLitros,
    }));

    // Recalcular la diferencia con el nuevo valor
    recalcularDiferencia(nuevoValorLitros);

    // Cerrar modal y limpiar estados
    setShowModalActualizacion(false);
    setNuevoValorLitros("");
    setValorOriginalLitros(""); // Limpiar valor original

    // Mostrar alerta informativa
    mostrarAlerta(
      "info",
      "Los cálculos han sido actualizados automáticamente con el nuevo valor."
    );
  };

  // Función para recalcular solo la diferencia manteniendo los litros calculados
  const recalcularDiferencia = (nuevosLitrosRecibidos) => {
    const litrosGuia = parseFloat(nuevosLitrosRecibidos) || 0;
    const nuevaDiferencia = calculoPetroleo.litrosCalculados - litrosGuia;

    // Actualizar solo la diferencia, manteniendo litros calculados
    setCalculoPetroleo((prev) => ({
      ...prev,
      diferencia: nuevaDiferencia,
    }));

    // Actualizar la observación con la nueva diferencia
    setFormData((prev) => ({
      ...prev,
      observacion: generarObservacionDiferencia(
        litrosGuia,
        calculoPetroleo.litrosCalculados
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
        console.log('Error en distribución:', validacion.mensaje);
      }
    }
  }, [distribucionLitros, formData.litrosRecibidos]);

  // Función para cargar los estanques de una faena
  // Función para cargar los estanques de una faena
  const cargarEstanques = async (idFaena) => {
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      // 👇 CAMBIO AQUÍ: Nueva ruta que filtra solo estanques fijos
      const response = await axios.get(`/api/estanques-fijo/${idFaena}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Guardar datos de los estanques (la estructura de response.data.data se mantiene igual)
      setEstanques(response.data.data);

      // El resto del código permanece igual...
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
    setTimeout(
      () => setModalAlert({ show: false, message: "", type: "" }),
      5000
    );
  };

  // Función para validar campos en tiempo real
  const validateField = () => {
    const newErrors = {};

    if (touched.numeroGuia && !formData.numeroGuia.trim()) {
      newErrors.numeroGuia = "El número de guía es obligatorio";
    }

    if (touched.litrosRecibidos) {
      if (!formData.litrosRecibidos) {
        newErrors.litrosRecibidos = "La cantidad de litros es obligatoria";
      } else if (
        isNaN(formData.litrosRecibidos) ||
        parseFloat(formData.litrosRecibidos) <= 0
      ) {
        newErrors.litrosRecibidos = "Debe ingresar un valor numérico mayor a 0";
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

  // Función para validar todos los campos
  const validarFormularioCompleto = () => {
    const newErrors = {};

    if (!formData.numeroGuia.trim())
      newErrors.numeroGuia = "Este campo es obligatorio";

    if (!formData.litrosRecibidos) {
      newErrors.litrosRecibidos = "Este campo es obligatorio";
    } else if (
      isNaN(formData.litrosRecibidos) ||
      parseFloat(formData.litrosRecibidos) <= 0
    ) {
      newErrors.litrosRecibidos = "Debe ingresar un valor numérico mayor a 0";
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
      // Siempre aseguramos formato de objeto para alturas
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
        // Si se recibe un valor simple, asumimos que es altura inicial
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

  // Función para calcular los litros de petróleo según las alturas
  const calcularLitrosPetroleo = async () => {
    // Validaciones iniciales
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

    // Validar que se haya ingresado litros recibidos
    if (
      !formData.litrosRecibidos ||
      parseFloat(formData.litrosRecibidos) <= 0
    ) {
      mostrarModalAlerta(
        "error",
        "Debe ingresar la cantidad de litros recibidos antes de calcular."
      );
      return null;
    }

    // Validar distribución si existe
    const validacionDistribucion = validarDistribucion();
    if (!validacionDistribucion.valido) {
      mostrarModalAlerta("error", validacionDistribucion.mensaje);
      return null;
    }

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      // Procesar y validar alturas
      const { alturasIniciales, alturasFinales, incompletas } =
        procesarAlturas();

      if (incompletas) {
        mostrarModalAlerta(
          "error",
          "Debe ingresar todas las alturas iniciales y finales de los estanques."
        );
        return null;
      }

      // Convertir las alturas al formato que espera la API
      const datosAlturasIniciales = convertirAlturasParaAPI(alturasIniciales);
      const datosAlturasFinales = convertirAlturasParaAPI(alturasFinales);

      // Validar completitud de las alturas
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

      // Preparar datos para las peticiones API
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

      // Llamar a la API para calcular los litros iniciales
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

      // Llamar a la API para calcular los litros finales
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

      // Procesar los resultados y actualizar estados
      return procesarResultadosCalculo(responseInicial, responseFinal);
    } catch (error) {
      console.error("Error al calcular litros de petróleo:", error);

      // Obtener mensaje de error más específico si está disponible
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

    // Separar las alturas en iniciales y finales
    Object.keys(alturasEstanques).forEach((estanqueId) => {
      // Considerar la estructura {inicial, final}
      if (typeof alturasEstanques[estanqueId] === "object") {
        alturasIniciales[estanqueId] = alturasEstanques[estanqueId].inicial;
        alturasFinales[estanqueId] = alturasEstanques[estanqueId].final;
      } else {
        // Compatibilidad con la estructura antigua
        console.warn(
          "Estructura de alturas incorrecta para estanque",
          estanqueId
        );
        alturasIniciales[estanqueId] = alturasEstanques[estanqueId];
        alturasFinales[estanqueId] = ""; // Valor vacío para altura final
      }

      // Verificar si falta alguna altura
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
    // Obtener los valores calculados
    const stockInicial = responseInicial.data.litros_totales || 0;
    const stockFinal = responseFinal.data.litros_totales || 0;
    const litrosIngresados = stockFinal - stockInicial;
    const litrosGuia = parseFloat(formData.litrosRecibidos);

    // CAMBIO: Ahora es litros calculados - litros guía
    const diferencia = litrosIngresados - litrosGuia;

    // Guardar en el estado del componente
    setCalculoPetroleo({
      litrosCalculados: litrosIngresados,
      diferencia: diferencia, // Este valor ahora será correcto
      calculoRealizado: true,
    });

    // Actualizar observación con la diferencia calculada
    setFormData((prevFormData) => ({
      ...prevFormData,
      observacion: generarObservacionDiferencia(litrosGuia, litrosIngresados),
    }));

    // Actualizar stock inicial
    setStockInicial(stockInicial);

    // Retornar los valores que espera EstanquesModal
    return {
      volInicial: stockInicial,
      volFinal: stockFinal,
      discrepanciaIni: stockInicial - 200,
      discrepanciaCam: diferencia, // Usar la nueva diferencia
    };
  };

  // Generar texto de observación basado en diferencia
  const generarObservacionDiferencia = (litrosGuia, litrosIngresados) => {
    const diferencia = litrosIngresados - litrosGuia; // CAMBIO: Nuevo orden

    return `Según cálculo de alturas, se detecta una diferencia de ${formatNumber(
      Math.abs(diferencia)
    )} litros ${diferencia > 0 ? "de más" : "de menos"
      } en la recepción. Litros según guía: ${formatNumber(
        litrosGuia
      )}. Litros calculados: ${formatNumber(litrosIngresados)}.`;
  };

  // Verificar si hay alturas vacías
  const verificarAlturasCompletas = () => {
    return !Object.values(alturasEstanques).some((alturas) => {
      if (typeof alturas !== "object") return true;
      return !alturas.inicial || !alturas.final;
    });
  };

  // Preparar datos de alturas para envío a API
  const prepararDatosAlturas = () => {
    const alturas = [];

    Object.keys(alturasEstanques).forEach((idEstanque) => {
      const datos = alturasEstanques[idEstanque];

      // Verificar si hay datos de alturas iniciales y finales
      if (datos && typeof datos === "object") {
        // Agregar altura inicial si existe
        if (datos.inicial !== undefined && datos.inicial !== "") {
          alturas.push({
            id_estanque: parseInt(idEstanque),
            altura: parseFloat(datos.inicial),
            tipo: "inicial",
          });
        }

        // Agregar altura final si existe
        if (datos.final !== undefined && datos.final !== "") {
          alturas.push({
            id_estanque: parseInt(idEstanque),
            altura: parseFloat(datos.final),
            tipo: "final",
          });
        }
      } else if (datos !== undefined && datos !== "") {
        // Compatibilidad con formato antiguo (solo altura)
        console.warn("Formato de altura no estándar detectado en envío");
        alturas.push({
          id_estanque: parseInt(idEstanque),
          altura: parseFloat(datos),
          tipo: "inicial", // Por defecto se considera inicial
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

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    // Marcar todos los campos como tocados para validar
    setTouched({
      numeroGuia: true,
      litrosRecibidos: true,
      precio: true,
    });

    if (loading || !user) {
      mostrarAlerta(
        "error",
        "No se ha podido acceder a la información del usuario."
      );
      return;
    }

    // Validación completa antes de enviar
    if (!validarFormularioCompleto()) {
      mostrarAlerta(
        "error",
        "Por favor, complete todos los campos obligatorios correctamente."
      );
      return;
    }

    // Verificar que se haya realizado el cálculo de alturas
    if (!calculoPetroleo.calculoRealizado) {
      mostrarAlerta(
        "error",
        "Debe ingresar las alturas de los estanques y calcular la diferencia."
      );
      setShowEstanquesModal(true);
      return;
    }

    // Validación adicional de alturas de estanques
    if (!verificarAlturasCompletas()) {
      mostrarAlerta(
        "error",
        "Debe ingresar todas las alturas iniciales y finales de los estanques."
      );
      setShowEstanquesModal(true);
      return;
    }

    // Validación final de distribución
    const validacionDistribucion = validarDistribucion();
    if (!validacionDistribucion.valido) {
      mostrarAlerta("error", validacionDistribucion.mensaje);
      setShowEstanquesModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcular precio total
      const precioTotal =
        parseFloat(formData.litrosRecibidos) * parseFloat(formData.precio);

      // CAMBIO: Calcular diferencia como litros calculados - litros guía
      const diferencia =
        calculoPetroleo.litrosCalculados - parseFloat(formData.litrosRecibidos);

      // Preparar datos para el formato esperado por la API
      const alturas = prepararDatosAlturas();

      // Preparar los datos según la estructura de la BD
      const dataToSend = {
        id_usuario: user.id,
        numero_guia: formData.numeroGuia,
        litros_documentados: parseFloat(formData.litrosRecibidos), // Valor de la guía
        litros_recibidos: calculoPetroleo.litrosCalculados, // Valor calculado por alturas
        precio: parseFloat(formData.precio),
        precio_total: precioTotal,
        recibo_conforme: true,
        observacion: formData.observacion,
        id_faena: formData.id_faena,
        diferencia: diferencia,
        stock_inicial: stockInicial,
        // 🆕 ENVIAR DISTRIBUCIÓN DE LITROS
        distribucion_litros: distribucionLitros,
        // Modificar formato de alturas para incluir el tipo
        alturas_estanques: prepararDatosAlturasConTipo(),
      };

      // Obtener el token de autenticación
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      // Realizar la petición a la API
      const response = await axios.post("/api/ingresos-petroleo", dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Preparar datos para el modal de éxito
      const datosParaModalExito = {
        numeroGuia: formData.numeroGuia,
        litrosDocumentados: parseFloat(formData.litrosRecibidos),
        litrosCalculados: calculoPetroleo.litrosCalculados,
        diferencia: diferencia, // Usar la nueva diferencia
        precioTotal: precioTotal,
        stockInicial: stockInicial,
        precio: parseFloat(formData.precio),
      };

      // Mostrar modal de éxito
      setDatosRecepcionExitosa(datosParaModalExito);
      setShowExitoModal(true);
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      manejarErrorEnvio(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Y agregar esta nueva función para preparar las alturas con tipo:
  const prepararDatosAlturasConTipo = () => {
    const alturas = [];

    Object.keys(alturasEstanques).forEach((idEstanque) => {
      const datos = alturasEstanques[idEstanque];

      if (datos && typeof datos === "object") {
        // Agregar altura inicial
        if (datos.inicial !== undefined && datos.inicial !== "") {
          alturas.push({
            id_estanque: parseInt(idEstanque),
            altura: parseFloat(datos.inicial),
            tipo: "inicial",
          });
        }

        // Agregar altura final
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
    // Limpiar el formulario después del envío exitoso pero mantener la faena
    setFormData({
      numeroGuia: "",
      litrosRecibidos: "",
      observacion: "",
      precio: "",
      id_faena: formData.id_faena, // Mantener la faena actual
    });

    // Resetear campos tocados y cálculos
    setTouched({});
    setCalculoPetroleo({
      litrosCalculados: 0,
      diferencia: 0,
      calculoRealizado: false,
    });

    // Resetear distribución
    setDistribucionLitros({});

    // Reiniciar las alturas de estanques
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

    // Mostrar mensaje más específico si está disponible
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }

    mostrarAlerta("error", errorMessage);
  };

  // Mostrar un mensaje de carga mientras se carga la información del usuario
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

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

        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-2">
          Registro de Recepción de Petróleo
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">
              N° Guía de Despacho *
            </label>
            <InputField
              placeholder="Ingrese número de guía"
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

          {/* CAMPO LITROS RECIBIDOS - CON ACTUALIZACIÓN AL SALIR DEL CAMPO */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1 flex items-center">
              Litros Recibidos *
            </label>
            <div className="relative">
              <InputField
                placeholder="Ingrese cantidad de litros"
                type="number"
                value={formData.litrosRecibidos}
                onChange={(e) => handleLitrosRecibidosChange(e.target.value)}
                className={`bg-white rounded-md text-gray-800 ${errors.litrosRecibidos ? "border-red-500" : "border-gray-300"
                  }`}

              />

            </div>
            {errors.litrosRecibidos && (
              <span className="text-red-500 text-xs mt-1">
                {errors.litrosRecibidos}
              </span>
            )}

          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">
              Precio del Petróleo (por litro) *
            </label>
            <InputField
              placeholder="Ingrese precio por litro"
              type="number"
              value={formData.precio}
              onChange={(e) => handleChange("precio", e.target.value)}
              onBlur={() => handleBlur("precio")}
              className={`bg-white rounded-md text-gray-800 ${errors.precio ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.precio && (
              <span className="text-red-500 text-xs mt-1">{errors.precio}</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">
              Niveles de Estanques *
            </label>
            <div className="flex">
              <Button
                text="Ingresar Niveles"
                color="orange"
                icon={<FaRuler className="mr-2 text-white" />}
                onClick={() => setShowEstanquesModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-md flex items-center w-full"
                disabled={!formData.id_faena || !formData.litrosRecibidos}
              />
              {calculoPetroleo.calculoRealizado && (
                <span className="ml-3 text-green-600 flex items-center text-sm">
                  ✓ Alturas ingresadas
                </span>
              )}
            </div>
            {!formData.id_faena ? (
              <span className="text-amber-600 text-xs mt-1">
                No se ha podido identificar la faena
              </span>
            ) : !formData.litrosRecibidos ? (
              <span className="text-amber-600 text-xs mt-1">
                Debe ingresar primero la cantidad de litros recibidos
              </span>
            ) : (
              !calculoPetroleo.calculoRealizado && (
                <span className="text-red-500 text-xs mt-1">
                  Debe ingresar las alturas para calcular la diferencia
                </span>
              )
            )}
          </div>
        </div>

        {/* Calcular total estimado si hay litros y precio */}
        {formData.litrosRecibidos &&
          formData.precio &&
          !errors.litrosRecibidos &&
          !errors.precio && (
            <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200 mt-2">
              <p className="text-sm text-blue-600">Total Estimado:</p>
              <p className="font-bold text-gray-800 text-lg">
                {(
                  parseFloat(formData.litrosRecibidos) *
                  parseFloat(formData.precio)
                ).toLocaleString("es-CL", {
                  style: "currency",
                  currency: "CLP",
                })}
              </p>
            </div>
          )}

        {/* RESULTADO DEL CÁLCULO CON ACTUALIZACIÓN AUTOMÁTICA */}
        {calculoPetroleo.calculoRealizado && (
          <div
            className={`p-4 rounded-lg text-center border mt-2 transition-all duration-300 ${Math.abs(calculoPetroleo.diferencia) <= 0.5
              ? "bg-gray-50 border-gray-200" // Diferencia mínima
              : calculoPetroleo.diferencia > 0
                ? "bg-green-50 border-green-200" // Excedente - VERDE
                : "bg-red-50 border-red-200" // Faltante - ROJO
              }`}
          >
            <div className="flex items-center justify-center mb-3">
              <p
                className={`text-sm font-medium ${Math.abs(calculoPetroleo.diferencia) <= 0.5
                  ? "text-gray-600" // Diferencia mínima
                  : calculoPetroleo.diferencia > 0
                    ? "text-green-600" // Excedente - VERDE
                    : "text-red-600" // Faltante - ROJO
                  }`}
              >
                Resultado del cálculo:
              </p>
              <div className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                <FaCheck className="text-green-600 text-xs" />
              </div>
            </div>
            <div className="space-y-2 font-medium text-gray-800">
              <p className="flex justify-between items-center">
                <span>Litros según guía:</span>
                <span className="font-bold">
                  {formatNumberWithSeparators(
                    parseFloat(formData.litrosRecibidos)
                  )}{" "}
                  L
                </span>
              </p>
              <p className="flex justify-between items-center">
                <span>Litros ingresados calculados:</span>
                <span className="font-bold">
                  {formatNumberWithSeparators(calculoPetroleo.litrosCalculados)}{" "}
                  L
                </span>
              </p>
              <div className="border-t pt-2">
                <p className="flex justify-between items-center">
                  <span>Diferencia:</span>
                  <span
                    className={`font-bold text-lg ${Math.abs(calculoPetroleo.diferencia) <= 0.5
                      ? "text-gray-600" // Diferencia mínima
                      : calculoPetroleo.diferencia > 0
                        ? "text-green-600" // Excedente - VERDE
                        : "text-red-600" // Faltante - ROJO
                      }`}
                  >
                    {formatNumberWithSeparators(
                      Math.abs(calculoPetroleo.diferencia)
                    )}{" "}
                    L
                    <span className="text-sm ml-1">
                      ({calculoPetroleo.diferencia > 0 ? "de más" : "de menos"})
                    </span>
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 flex items-center justify-center">
              <FaSync className="mr-1" />
              Los valores se actualizan automáticamente
            </div>
          </div>
        )}

        <div className="flex flex-col col-span-full mt-2">
          <label className="text-sm font-medium text-gray-600 mb-1">
            Observación
          </label>
          <InputField
            placeholder="Ingrese sus observaciones"
            isTextarea={true}
            value={formData.observacion}
            onChange={(e) => handleChange("observacion", e.target.value)}
            className="bg-white rounded-md px-3 py-2 min-h-[80px] text-gray-800 border-gray-300"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center mt-4 pt-2 border-t space-y-reverse space-y-3 sm:space-y-0">
          {/* Botón Volver - Abajo en móvil, izquierda en desktop */}
          <Button
            to="/Bombero"
            className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-3 sm:py-2 rounded-md w-full sm:w-auto"
            icon={<FaHome className="mr-2 text-white" />}
            text="Volver"
          />

          {/* Botón Ingresar - Arriba en móvil, derecha en desktop */}
          <Button
            text={isSubmitting ? "Procesando..." : "Ingresar Recepción"}
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

        {/* MODAL DE ESTANQUES CON DISTRIBUCIÓN */}
        <EstanquesModal
          isOpen={showEstanquesModal}
          onClose={(stockSistema = null) => {
            // Si se proporciona stockSistema, actualizarlo
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
          litrosRecibidos={parseFloat(formData.litrosRecibidos) || 0}
          // PROPS PARA DISTRIBUCIÓN:
          distribucionLitros={distribucionLitros}
          onDistribucionChange={handleDistribucionChange}
        />
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA ACTUALIZACIÓN */}
      <ModalConfirmacionReinicio
        isOpen={showModalActualizacion}
        onConfirm={confirmarActualizacion}
        onCancel={cancelarActualizacion}
      />

      {/* MODAL DE ÉXITO */}
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