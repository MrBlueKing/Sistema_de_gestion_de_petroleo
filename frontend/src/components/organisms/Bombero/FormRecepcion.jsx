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
} from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";
import EstanquesModal from "./EstanqueModal";

registerLocale("es", es);

// Función de utilidad para formatear números a 2 decimales
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0.00";
  }
  return parseFloat(num).toFixed(2);
};

const FormRecepcion = () => {
  // Acceder al contexto de usuario
  const { user, loading } = useContext(UserContext);

  // Estado para capacidad disponible
  const [capacidadDisponible, setCapacidadDisponible] = useState();

  // Estado para alertas del modal
  const [modalAlert, setModalAlert] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Estado local para los datos del formulario
  const [formData, setFormData] = useState({
    numeroGuia: "",
    litrosRecibidos: "",
    observacion: "",
    precio: "",
    id_faena: "", // <-- Inicializar vacío
  });

  // Estado para errores de validación
  const [errors, setErrors] = useState({});

  // Estado para mensaje de alerta
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Estado para indicar si el formulario está enviándose
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para manejar el enfoque en campos
  const [touched, setTouched] = useState({});

  // Estado para mostrar/ocultar modal de estanques
  const [showEstanquesModal, setShowEstanquesModal] = useState(false);

  // Estado para almacenar los estanques de la faena
  const [estanques, setEstanques] = useState([]);

  // Estado para almacenar las alturas de los estanques
  const [alturasEstanques, setAlturasEstanques] = useState({});

  // Estado para almacenar información calculada del petróleo
  const [calculoPetroleo, setCalculoPetroleo] = useState({
    litrosCalculados: 0,
    diferencia: 0,
    calculoRealizado: false, // Flag para indicar si se ha realizado el cálculo
  });

  // Actualizar la faena cuando el usuario cambie
  useEffect(() => {
    if (user?.id_faena) {
      setFormData((prev) => ({
        ...prev,
        id_faena: user.id_faena,
      }));
    }
  }, [user]);

  // Cargar capacidad disponible cuando se abra el modal
  useEffect(() => {
    if (showEstanquesModal && formData.id_faena) {
      cargarCapacidadDisponible();
    }
  }, [showEstanquesModal, formData.id_faena]);

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
      setModalAlert({
        show: true,
        type: "error",
        message: "Error al cargar la capacidad disponible.",
      });
      setTimeout(
        () => setModalAlert({ show: false, message: "", type: "" }),
        5000
      );
    }
  };

  // Cargar estanques de la faena cuando cambie la faena seleccionada
  useEffect(() => {
    if (formData.id_faena) {
      cargarEstanques(formData.id_faena);
    }
  }, [formData.id_faena]);

  // Función para cargar los estanques de una faena
  const cargarEstanques = async (idFaena) => {
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      const response = await axios.get(`/api/estanques/${idFaena}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Guardar solo los datos de los estanques
      setEstanques(response.data.data);

      // Inicializar el estado de alturas con los estanques cargados
      const initialAlturas = {};
      response.data.data.forEach((estanque) => {
        initialAlturas[estanque.id_estanque] = {
          inicial: "",
          final: "",
        };
      });
      setAlturasEstanques(initialAlturas);
    } catch (error) {
      console.error("Error al cargar estanques:", error);
      setAlert({
        show: true,
        type: "error",
        message: "Error al cargar los estanques de la faena.",
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
    }
  };

  // Validación en tiempo real
  useEffect(() => {
    validateField();
  }, [formData]);

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

// Corrección para la función calcularLitrosPetroleo en FormRecepcion.jsx

// Reemplazar la función actual por esta versión corregida:
const calcularLitrosPetroleo = async () => {
  if (!formData.id_faena) {
    setModalAlert({
      show: true,
      type: "error",
      message: "Debe seleccionar una faena antes de calcular.",
    });
    setTimeout(
      () => setModalAlert({ show: false, message: "", type: "" }),
      5000
    );
    return null;
  }

  if (!user || !user.id) {
    setModalAlert({
      show: true,
      type: "error",
      message: "No se puede identificar al usuario actual.",
    });
    setTimeout(
      () => setModalAlert({ show: false, message: "", type: "" }),
      5000
    );
    return null;
  }

  // Validar que se haya ingresado litros recibidos
  if (
    !formData.litrosRecibidos ||
    parseFloat(formData.litrosRecibidos) <= 0
  ) {
    setModalAlert({
      show: true,
      type: "error",
      message:
        "Debe ingresar la cantidad de litros recibidos antes de calcular.",
    });
    setTimeout(
      () => setModalAlert({ show: false, message: "", type: "" }),
      5000
    );
    return null;
  }

  try {
    const token = JSON.parse(localStorage.getItem("authToken"))?.token;

    // Validar que haya alturas iniciales y finales
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

    if (incompletas) {
      setModalAlert({
        show: true,
        type: "error",
        message:
          "Debe ingresar todas las alturas iniciales y finales de los estanques.",
      });
      setTimeout(
        () => setModalAlert({ show: false, message: "", type: "" }),
        5000
      );
      return null;
    }

    // PRIMER CAMBIO: Convertir las alturas iniciales al formato que espera la API
    const datosAlturasIniciales = Object.keys(alturasIniciales).map(
      (estanqueId) => {
        const altura = alturasIniciales[estanqueId];
        const alturaNum = altura === 0 || altura ? parseFloat(altura) : null;
        return {
          id_estanque: parseInt(estanqueId),
          altura: alturaNum, // CORRECTO: usar 'altura' en lugar de 'inicial'
        };
      }
    );

    // PRIMER CAMBIO: Convertir las alturas finales al formato que espera la API
    const datosAlturasFinales = Object.keys(alturasFinales).map(
      (estanqueId) => {
        const altura = alturasFinales[estanqueId];
        const alturaNum = altura === 0 || altura ? parseFloat(altura) : null;
        return {
          id_estanque: parseInt(estanqueId),
          altura: alturaNum, // CORRECTO: usar 'altura' en lugar de 'final'
        };
      }
    );

    // Filtrar entradas incompletas
    const alturasInicialesIncompletas = datosAlturasIniciales.filter(
      (item) => {
        return (
          item.altura === undefined ||
          item.altura === null ||
          Number.isNaN(item.altura)
        );
      }
    );

    const alturasFinalesIncompletas = datosAlturasFinales.filter((item) => {
      return (
        item.altura === undefined ||
        item.altura === null ||
        Number.isNaN(item.altura)
      );
    });

    if (
      alturasInicialesIncompletas.length > 0 ||
      alturasFinalesIncompletas.length > 0
    ) {
      setModalAlert({
        show: true,
        type: "error",
        message:
          "Debe ingresar todas las alturas iniciales y finales de los estanques.",
      });
      setTimeout(
        () => setModalAlert({ show: false, message: "", type: "" }),
        5000
      );
      return null;
    }

    // Crear objetos de datos para enviar a la API
    const datosCalcularInicial = {
      id_faena: formData.id_faena,
      id_usuario: user.id,
      tipo_movimiento: "ingreso", // SEGUNDO CAMBIO: usar 'ingreso' en lugar de 'consulta'
      alturas: datosAlturasIniciales,
    };

    const datosCalcularFinal = {
      id_faena: formData.id_faena,
      id_usuario: user.id,
      tipo_movimiento: "ingreso", // SEGUNDO CAMBIO: usar 'ingreso' en lugar de 'consulta'
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

    // Obtener los valores calculados
    const stockInicial = responseInicial.data.litros_totales || 0;
    const stockFinal = responseFinal.data.litros_totales || 0;
    const litrosIngresados = stockFinal - stockInicial;
    const litrosGuia = parseFloat(formData.litrosRecibidos);

    // Guardar en el estado del componente
    setCalculoPetroleo({
      litrosCalculados: litrosIngresados,
      diferencia: litrosGuia - litrosIngresados,
      calculoRealizado: true,
    });

    // Actualizar observación con la diferencia calculada
    setFormData((prevFormData) => ({
      ...prevFormData,
      observacion: `Según cálculo de alturas, se detecta una diferencia de ${formatNumber(
        Math.abs(litrosGuia - litrosIngresados)
      )} litros ${
        litrosGuia > litrosIngresados ? "de menos" : "de más"
      } en la recepción. Litros según guía: ${formatNumber(
        litrosGuia
      )}. Litros calculados: ${formatNumber(litrosIngresados)}.`,
    }));

    // IMPORTANTE: Retornar los valores que espera EstanquesModal
    return {
      volInicial: stockInicial, // Stock real inicial calculado por alturas
      volFinal: stockFinal, // Stock real final calculado por alturas
      discrepanciaIni: stockInicial - 200, // Discrepancia inicial: real vs teórico
      discrepanciaCam: litrosGuia - litrosIngresados, // Discrepancia del camión
    };
  } catch (error) {
    console.error("Error al calcular litros de petróleo:", error);

    // Obtener mensaje de error más específico si está disponible
    let errorMessage = "Error al calcular los litros de petróleo.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    setModalAlert({
      show: true,
      type: "error",
      message: errorMessage,
    });
    setTimeout(
      () => setModalAlert({ show: false, message: "", type: "" }),
      5000
    );
    return null;
  }
};




  // Manejar el envío del formulario
  const handleSubmit = async () => {
    // Marcar todos los campos como tocados para validar
    const allFields = {
      numeroGuia: true,
      litrosRecibidos: true,
      precio: true,
    };

    setTouched(allFields);

    if (loading || !user) {
      setAlert({
        show: true,
        type: "error",
        message: "No se ha podido acceder a la información del usuario.",
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      return;
    }

    // Validación completa antes de enviar
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Mostrar alerta de validación
      setAlert({
        show: true,
        type: "error",
        message:
          "Por favor, complete todos los campos obligatorios correctamente.",
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      return;
    }

    // Verificar que se haya realizado el cálculo de alturas
    if (!calculoPetroleo.calculoRealizado) {
      setAlert({
        show: true,
        type: "error",
        message:
          "Debe ingresar las alturas de los estanques y calcular la diferencia.",
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      setShowEstanquesModal(true);
      return;
    }

    // Validación adicional de alturas de estanques
    const hayAlturasVacias = Object.values(alturasEstanques).some(
      (alturas) => {
        if (typeof alturas !== "object") return true;
        return !alturas.inicial || !alturas.final;
      }
    );
    
    if (hayAlturasVacias) {
      setAlert({
        show: true,
        type: "error",
        message: "Debe ingresar todas las alturas iniciales y finales de los estanques.",
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      setShowEstanquesModal(true); // Abrir modal para completar alturas
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcular precio total
      const precioTotal =
        parseFloat(formData.litrosRecibidos) * parseFloat(formData.precio);

      // Calcular diferencia entre litros recibidos y calculados
      const diferencia =
        parseFloat(formData.litrosRecibidos) - calculoPetroleo.litrosCalculados;

      // Preparar datos para el formato esperado por la API
      const alturas = [];
      
      // Procesar las alturas en el formato correcto para la API
      Object.keys(alturasEstanques).forEach((idEstanque) => {
        const datos = alturasEstanques[idEstanque];
        
        // Verificar si hay datos de alturas iniciales y finales
        if (datos && typeof datos === 'object') {
          // Agregar altura inicial si existe
          if (datos.inicial !== undefined && datos.inicial !== "") {
            alturas.push({
              id_estanque: parseInt(idEstanque),
              altura: parseFloat(datos.inicial),
              tipo: "inicial"
            });
          }
          
          // Agregar altura final si existe
          if (datos.final !== undefined && datos.final !== "") {
            alturas.push({
              id_estanque: parseInt(idEstanque),
              altura: parseFloat(datos.final),
              tipo: "final"
            });
          }
        } else if (datos !== undefined && datos !== "") {
          // Compatibilidad con formato antiguo (solo altura)
          console.warn("Formato de altura no estándar detectado en envío");
          alturas.push({
            id_estanque: parseInt(idEstanque),
            altura: parseFloat(datos),
            tipo: "inicial" // Por defecto se considera inicial
          });
        }
      });

      // Preparar los datos según la estructura de la BD
      const dataToSend = {
        id_usuario: user.id,
        numero_guia: formData.numeroGuia,
        litros_documentados: parseFloat(formData.litrosRecibidos),
        litros_calculados: calculoPetroleo.litrosCalculados,
        precio: parseFloat(formData.precio),
        precio_total: precioTotal,
        recibo_conforme: true,
        observacion: formData.observacion,
        id_faena: formData.id_faena,
        diferencia: diferencia,
        alturas_estanques: alturas
      };

      // Obtener el token de autenticación
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;

      // Realizar la petición a la API
      const response = await axios.post("/api/ingresos-petroleo", dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Mostrar mensaje de éxito
      setAlert({
        show: true,
        type: "success",
        message: "Recepción de petróleo registrada con éxito",
      });

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
      
      // Reiniciar las alturas de estanques
      const initialAlturas = {};
      estanques.forEach((estanque) => {
        initialAlturas[estanque.id_estanque] = {
          inicial: "",
          final: "",
        };
      });
      setAlturasEstanques(initialAlturas);

      // Ocultar mensaje después de 5 segundos
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
    } catch (error) {
      console.error("Error al enviar los datos:", error);

      let errorMessage = "Error al registrar la recepción. Intente nuevamente.";

      // Mostrar mensaje más específico si está disponible
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      setAlert({
        show: true,
        type: "error",
        message: errorMessage,
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="flex flex-col space-y-4 bg-gray-50 p-5 rounded-lg shadow-sm">
      {/* Mostrar alertas */}
      {alert.show && (
        <div
          className={`flex items-center p-3 rounded-lg ${
            alert.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}
        >
          {alert.type === "error" && <FaExclamationTriangle className="mr-2" />}
          {alert.message}
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-2">
        Registro de Recepción de Petróleo
      </h2>

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
            className={`bg-white rounded-md text-gray-800 ${
              errors.numeroGuia ? "border-red-500" : "border-gray-300"
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
            Litros Recibidos *
          </label>
          <InputField
            placeholder="Ingrese cantidad de litros"
            type="number"
            value={formData.litrosRecibidos}
            onChange={(e) => handleChange("litrosRecibidos", e.target.value)}
            onBlur={() => handleBlur("litrosRecibidos")}
            className={`bg-white rounded-md text-gray-800 ${
              errors.litrosRecibidos ? "border-red-500" : "border-gray-300"
            }`}
          />
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
            className={`bg-white rounded-md text-gray-800 ${
              errors.precio ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.precio && (
            <span className="text-red-500 text-xs mt-1">{errors.precio}</span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">
            Alturas de Estanques *
          </label>
          <div className="flex">
            <Button
              text="Ingresar Alturas"
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

      {/* Mostrar información de la diferencia calculada si se ha realizado el cálculo */}
      {calculoPetroleo.calculoRealizado && (
        <div
          className={`p-3 rounded-lg text-center border mt-2 ${
            Math.abs(calculoPetroleo.diferencia) > 50
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <p
            className={`text-sm ${
              Math.abs(calculoPetroleo.diferencia) > 50
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            Resultado del cálculo:
          </p>
          <div className="font-medium text-gray-800">
            <p>
              Litros según guía:{" "}
              {formatNumber(parseFloat(formData.litrosRecibidos))}
            </p>
            <p>
              Litros ingresados calculados:{" "}
              {formatNumber(calculoPetroleo.litrosCalculados)}
            </p>
            <p
              className={`font-bold ${
                Math.abs(calculoPetroleo.diferencia) > 50
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              Diferencia: {formatNumber(Math.abs(calculoPetroleo.diferencia))}{" "}
              litros {calculoPetroleo.diferencia > 0 ? "de más" : "de menos"}
            </p>
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

      <div className="flex items-center mt-4 pt-2 border-t">
        <Button
          to="/Bombero"
          className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-md"
          icon={<FaHome className="mr-2 text-white" />}
          text="Volver"
        />
        <Button
          text={isSubmitting ? "Procesando..." : "Ingresar Recepción"}
          color="orange"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`bg-orange-600 hover:bg-orange-700 text-white text-sm px-6 py-2 rounded-md ml-auto ${
            isSubmitting ? "opacity-70 cursor-wait" : ""
          }`}
        />
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Los campos marcados con * son obligatorios
      </div>

      {/* MODAL DE ESTANQUES */}
      <EstanquesModal
        isOpen={showEstanquesModal}
        onClose={() => setShowEstanquesModal(false)}
        estanques={estanques}
        alturasEstanques={alturasEstanques}
        handleAlturaChange={handleAlturaChange}
        calcularLitrosPetroleo={calcularLitrosPetroleo}
        modalAlert={modalAlert}
        capacidadDisponible={capacidadDisponible}
      />
    </div>
  );
};

export default FormRecepcion;