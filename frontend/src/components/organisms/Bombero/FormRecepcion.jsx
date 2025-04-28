import React, { useContext, useState, useEffect } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { FaHome, FaExclamationTriangle, FaTimes, FaRuler } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";

registerLocale("es", es);

const FormRecepcion = () => {
  // Acceder al contexto de usuario
  const { user, loading } = useContext(UserContext);
  
  // Estado local para los datos del formulario
  const [formData, setFormData] = useState({
    numeroGuia: "",
    litrosRecibidos: "",
    observacion: "",
    precio: "",
    id_faena: 2
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
    diferencia: 0
  });

  // Cargar estanques de la faena cuando cambie la faena seleccionada
  useEffect(() => {
    if (formData.id_faena) {
      cargarEstanques(formData.id_faena);
    }
  }, [formData.id_faena]);

  // Función para cargar los estanques de una faena
  const cargarEstanques = async (idFaena) => {
    try {
      console.log("Estanques faena:", idFaena);
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      const response = await axios.get(
        `/api/estanques/${idFaena}`, // <-- usar el id de la faena dinámicamente
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Guardar solo los datos de los estanques
      setEstanques(response.data.data);

      // Inicializar el estado de alturas con los estanques cargados
      const initialAlturas = {};
      response.data.data.forEach(estanque => {
        initialAlturas[estanque.id_estanque] = "";
      });
      setAlturasEstanques(initialAlturas);

    } catch (error) {
      console.error("Error al cargar estanques:", error);
      setAlert({
        show: true,
        type: "error",
        message: "Error al cargar los estanques de la faena."
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
      } else if (isNaN(formData.litrosRecibidos) || parseFloat(formData.litrosRecibidos) <= 0) {
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
      [field]: value
    });
  };
  
  // Manejar el enfoque en un campo
  const handleBlur = (field) => {
    setTouched({
      ...touched,
      [field]: true
    });
  };

  // Función para manejar cambios en las alturas de estanques
  const handleAlturaChange = (estanqueId, value) => {
    // Solo actualiza la altura del estanque específico
    setAlturasEstanques(prevState => ({
      ...prevState,
      [estanqueId]: value
    }));
  };

  // Función para calcular los litros de petróleo según las alturas
  const calcularLitrosPetroleo = async () => {
    if (!formData.id_faena) {
      setAlert({
        show: true,
        type: "error",
        message: "Debe seleccionar una faena antes de calcular."
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      return;
    }
  
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      const datosAlturas = Object.keys(alturasEstanques).map(estanqueId => ({
        id_estanque: parseInt(estanqueId),
        altura: parseFloat(alturasEstanques[estanqueId])
      }));
  
      console.log("Datos de la altura a calcular:", datosAlturas);
  
      const alturasIncompletas = datosAlturas.filter(item => isNaN(item.altura));
      if (alturasIncompletas.length > 0) {
        setAlert({
          show: true,
          type: "error",
          message: "Debe ingresar todas las alturas de los estanques."
        });
        setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
        return;
      }
  
      const response = await axios.post(
        "/api/calcular-litros-petroleo",
        {
          id_faena: formData.id_faena,
          alturas: datosAlturas
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
  
      const litrosGuia = parseFloat(formData.litrosRecibidos);
      const litrosCalculados = response.data.litros_totales;
  
      setCalculoPetroleo({
        litrosCalculados,
        diferencia: litrosGuia - litrosCalculados
      });
  
      setShowEstanquesModal(false);
  
      parseFloat(litrosGuia);
      parseFloat(litrosCalculados);
      
      if (isNaN(litrosGuia) || isNaN(litrosCalculados)) {
        console.error('Uno o ambos valores no son números válidos:', litrosGuia, litrosCalculados);
        // Asignar valores predeterminados si es necesario
      }
      
      setFormData({
        ...formData,
        observacion: `Según cálculo de alturas, se detecta una diferencia de ${Math.abs(litrosGuia - litrosCalculados).toFixed(2)} litros ${litrosGuia > litrosCalculados ? 'de más' : 'de menos'} en la recepción. Litros según guía: ${litrosGuia}. Litros calculados: ${litrosCalculados.toFixed(2)}.`
      });
      
  
    } catch (error) {
      console.error("Error al calcular litros de petróleo:", error);
      setAlert({
        show: true,
        type: "error",
        message: "Error al calcular los litros de petróleo."
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
    }
  };
  

  // Manejar el envío del formulario
  const handleSubmit = async () => {
    // Marcar todos los campos como tocados para validar
    const allFields = {
      numeroGuia: true,
      litrosRecibidos: true,
      precio: true
    };
    
    setTouched(allFields);
    
    if (loading || !user) {
      setAlert({
        show: true,
        type: "error",
        message: "No se ha podido acceder a la información del usuario."
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      return;
    }

    // Validación completa antes de enviar
    const newErrors = {};
    if (!formData.numeroGuia.trim()) newErrors.numeroGuia = "Este campo es obligatorio";
    
    if (!formData.litrosRecibidos) {
      newErrors.litrosRecibidos = "Este campo es obligatorio";
    } else if (isNaN(formData.litrosRecibidos) || parseFloat(formData.litrosRecibidos) <= 0) {
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
        message: "Por favor, complete todos los campos obligatorios correctamente."
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      return;
    }

    // Verificar que se haya realizado el cálculo de alturas
    if (calculoPetroleo.litrosCalculados === 0) {
      setAlert({
        show: true,
        type: "error",
        message: "Debe ingresar las alturas de los estanques y calcular la diferencia."
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      setShowEstanquesModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar los datos según el formato requerido por la API
      const dataToSend = {
        id_usuario: user.id, // Usando el ID del usuario desde el contexto
        numero_guia: formData.numeroGuia,
        litros_recibidos: parseFloat(formData.litrosRecibidos),
        observacion: formData.observacion,
        precio: parseFloat(formData.precio),
        id_faena: formData.id_faena,
        // Incluir datos del cálculo
        litros_calculados: calculoPetroleo.litrosCalculados,
        diferencia: calculoPetroleo.diferencia,
        // Incluir las alturas de los estanques
        alturas_estanques: Object.keys(alturasEstanques).map(id => ({
          id_estanque: parseInt(id),
          altura: parseFloat(alturasEstanques[id])
        }))
      };

      // Obtener el token de autenticación
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      // Realizar la petición a la API
      const response = await axios.post(
        "http://localhost:8000/api/ingresos-petroleo", 
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log("Respuesta de la API:", response.data);
      
      // Mostrar mensaje de éxito
      setAlert({
        show: true,
        type: "success",
        message: "Recepción de petróleo registrada con éxito"
      });
      
      // Limpiar el formulario después del envío exitoso
      setFormData({
        numeroGuia: "",
        litrosRecibidos: "",
        observacion: "",
        precio: "",
        id_faena: 2
      });
      
      // Resetear campos tocados y cálculos
      setTouched({});
      setCalculoPetroleo({ litrosCalculados: 0, diferencia: 0 });
      setAlturasEstanques({});
      
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
      
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      
      let errorMessage = "Error al registrar la recepción. Intente nuevamente.";
      
      // Mostrar mensaje más específico si está disponible
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setAlert({
        show: true,
        type: "error",
        message: errorMessage
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
            alert.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 
            'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}
        >
          {alert.type === 'error' && <FaExclamationTriangle className="mr-2" />}
          {alert.message}
        </div>
      )}
      
      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-2">Registro de Recepción de Petróleo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">N° Guía de Despacho *</label>
          <InputField
            placeholder="Ingrese número de guía"
            value={formData.numeroGuia}
            onChange={(e) => handleChange("numeroGuia", e.target.value)}
            onBlur={() => handleBlur("numeroGuia")}
            className={`bg-white rounded-md text-gray-800 ${errors.numeroGuia ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.numeroGuia && <span className="text-red-500 text-xs mt-1">{errors.numeroGuia}</span>}
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">Litros Recibidos *</label>
          <InputField
            placeholder="Ingrese cantidad de litros"
            type="number"
            value={formData.litrosRecibidos}
            onChange={(e) => handleChange("litrosRecibidos", e.target.value)}
            onBlur={() => handleBlur("litrosRecibidos")}
            className={`bg-white rounded-md text-gray-800 ${errors.litrosRecibidos ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.litrosRecibidos && <span className="text-red-500 text-xs mt-1">{errors.litrosRecibidos}</span>}
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">Precio del Petróleo (por litro) *</label>
          <InputField
            placeholder="Ingrese precio por litro"
            type="number"
            value={formData.precio}
            onChange={(e) => handleChange("precio", e.target.value)}
            onBlur={() => handleBlur("precio")}
            className={`bg-white rounded-md text-gray-800 ${errors.precio ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.precio && <span className="text-red-500 text-xs mt-1">{errors.precio}</span>}
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">Alturas de Estanques *</label>
          <div className="flex">
            <Button
              text="Ingresar Alturas"
              color="orange"
              icon={<FaRuler className="mr-2 text-white" />}
              onClick={() => setShowEstanquesModal(true)}
              className="bg-orange-500 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-md flex items-center w-full"
            />
            {calculoPetroleo.litrosCalculados > 0 && (
              <span className="ml-3 text-green-600 flex items-center text-sm">
                ✓ Alturas ingresadas
              </span>
            )}
          </div>
          {calculoPetroleo.litrosCalculados ===
           0 && (
            <span className="text-amber-600 text-xs mt-1">
              Debe ingresar las alturas para calcular la diferencia
            </span>
          )}
        </div>
      </div>
      
      {/* Calcular total estimado si hay litros y precio */}
      {formData.litrosRecibidos && formData.precio && !errors.litrosRecibidos && !errors.precio && (
        <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200 mt-2">
          <p className="text-sm text-blue-600">Total Estimado:</p>
          <p className="font-bold text-gray-800 text-lg">
            {(parseFloat(formData.litrosRecibidos) * parseFloat(formData.precio)).toLocaleString('es-CL', { 
              style: 'currency', 
              currency: 'CLP' 
            })}
          </p>
        </div>
      )}

      {/* Mostrar información de la diferencia calculada si existe */}
      {calculoPetroleo.litrosCalculados > 0 && (
        <div className={`p-3 rounded-lg text-center border mt-2 ${
          Math.abs(calculoPetroleo.diferencia) > 50 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <p className={`text-sm ${Math.abs(calculoPetroleo.diferencia) > 50 ? 'text-red-600' : 'text-green-600'}`}>
            Resultado del cálculo:
          </p>
          <div className="font-medium text-gray-800">
            <p>Litros según guía: {parseFloat(formData.litrosRecibidos).toFixed(2)}</p>
            <p>Litros calculados: {calculoPetroleo.litrosCalculados.toFixed(2)}</p>
            <p className={`font-bold ${Math.abs(calculoPetroleo.diferencia) > 50 ? 'text-red-600' : 'text-green-600'}`}>
              Diferencia: {Math.abs(calculoPetroleo.diferencia).toFixed(2)} litros {calculoPetroleo.diferencia > 0 ? 'de más' : 'de menos'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col col-span-full mt-2">
        <label className="text-sm font-medium text-gray-600 mb-1">Observación</label>
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
          className={`bg-orange-600 hover:bg-orange-700 text-white text-sm px-6 py-2 rounded-md ml-auto ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
        />
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Los campos marcados con * son obligatorios
      </div>

      {/* Modal para ingresar alturas de estanques */}
      {showEstanquesModal && (
        <div className="fixed inset-0 bg-white md:bg-gray-100 md:bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white w-full max-h-full md:rounded-lg md:h-auto md:max-w-2xl md:max-h-[90vh] md:shadow-lg overflow-y-auto">

            <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Ingreso de Alturas de Estanques</h3>
              <button 
                onClick={() => setShowEstanquesModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4">
              {estanques.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No hay estanques registrados para esta faena.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Ingrese la altura actual de cada estanque para calcular la cantidad real de petróleo recibido:
                  </p>
                  
                  <div className="space-y-4">
                    {estanques.map(estanque => (
                      <div key={estanque.id_estanque} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-600 mb-1">
                            {estanque.nombre || `Estanque ${estanque.id_estanque}`} - Capacidad: {estanque.capacidad} litros
                          </label>
                          <div className="flex items-center">
                            <InputField
                              placeholder="Ingrese altura en cm"
                              type="number"
                              value={alturasEstanques[estanque.id_estanque] || ""}
                              onChange={(e) => handleAlturaChange(estanque.id_estanque, e.target.value)}
                              className="bg-white rounded-md text-gray-800 border-gray-300"
                            />
                            <span className="ml-2 text-gray-600">cm</span>
                          </div>
                          {estanque.altura_nominal && (
                            <p className="text-xs text-gray-500 mt-1">
                              Altura nominal: {estanque.altura_nominal} cm
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-6 space-x-3 sticky bottom-0 pt-3 bg-white border-t">
                    <Button
                      text="Cancelar"
                      color="gray"
                      onClick={() => setShowEstanquesModal(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-md"
                    />
                    <Button
                      text="Calcular"
                      color="blue"
                      onClick={calcularLitrosPetroleo}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded-md"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormRecepcion;