import React, { useState, useEffect } from "react";
import axios from "../../../lib/axios"; // Asumiendo que estás usando axios para las peticiones HTTP
import Header from "../../organisms/Bombero/Header";
import PageControl from "../../molecules/PageControl";
import TabProgressBar from "../../molecules/TabProgressBar";
import ConsumoForm from "../../organisms/Bombero/FormConsumo";
import { FaArrowLeft, FaCarSide, FaUserAlt, FaCheck } from "react-icons/fa";
import StepHeader from "../../molecules/StepHeader";
import Button from "../../atoms/Button/Button";

const Consumo = ({ 
  onPrevious, 
  categoriaSeleccionada, 
  patenteSeleccionada, 
  solicitante,
  tipoSolicitante = "",
  // Nuevos props para la integración con API
  usuarioActual = null, // El usuario logueado que registra el consumo
  faenaActual = null,   // La faena actual donde se realiza el consumo
  estanqueSeleccionado = null // El estanque del cual se está consumiendo
}) => {
  const [currentPage, setCurrentPage] = useState(4);
  const totalPages = 4;

  const [formData, setFormData] = useState({
    horometro: "",
    kilometraje: "",
    numeralInicial: "",
    numeralFinal: "",
    litros: "",
    fechaHora: new Date().toISOString().slice(0, 16),
    observacion: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Calcular litros automáticamente cuando cambian numeralInicial o numeralFinal
  useEffect(() => {
    const inicial = parseFloat(formData.numeralInicial) || 0;
    const final = parseFloat(formData.numeralFinal) || 0;
    
    // Solo calcula si ambos valores existen y el final es mayor que el inicial
    if (formData.numeralInicial && formData.numeralFinal && final > inicial) {
      const calculatedLitros = (final - inicial).toFixed(2);
      setFormData(prev => ({...prev, litros: calculatedLitros}));
    } else if (formData.numeralInicial && formData.numeralFinal) {
      // Si hay valores pero no cumplen la condición, limpiar litros
      setFormData(prev => ({...prev, litros: ""}));
    }
  }, [formData.numeralInicial, formData.numeralFinal]);

  const handleChange = (field, value) => {
    // Para campos numéricos, asegurarse de que son valores válidos
    if (['horometro', 'kilometraje', 'numeralInicial', 'numeralFinal', 'litros'].includes(field)) {
      // Permitir valores vacíos o valores numéricos válidos
      if (value === "" || (!isNaN(parseFloat(value)) && isFinite(value))) {
        setFormData({ ...formData, [field]: value });
      }
    } else {
      setFormData({ ...formData, [field]: value });
    }
    
    // Resetear mensajes de error si hay interacción del usuario
    if (hasError) {
      setHasError(false);
      setErrorMessage("");
    }
  };

  const validateForm = () => {
    // Determinar tipo de medición y campos requeridos
    const tipoMedicionActual = categoriaSeleccionada && 
      typeof categoriaSeleccionada === 'object' && 
      categoriaSeleccionada.tipo_medicion
        ? categoriaSeleccionada.tipo_medicion
        : "Kilometraje";
    
    const needsHorometro = tipoMedicionActual === 'Horometro';
    const needsKilometraje = tipoMedicionActual === 'Kilometraje';
    
    const requiredFields = [
      'numeralInicial',
      'numeralFinal',
      'litros'
    ];
    
    if (needsHorometro) {
      requiredFields.push('horometro');
    }
    
    if (needsKilometraje) {
      requiredFields.push('kilometraje');
    }
    
    // Validar campos requeridos
    for (const field of requiredFields) {
      if (!formData[field]) {
        setHasError(true);
        setErrorMessage(`El campo ${getFieldName(field)} es obligatorio`);
        return false;
      }
    }
    
    // Validar que el numeral final sea mayor que el inicial
    if (parseFloat(formData.numeralFinal) <= parseFloat(formData.numeralInicial)) {
      setHasError(true);
      setErrorMessage('El numeral final debe ser mayor que el inicial');
      return false;
    }
    
    // Validar que los litros sean mayor que cero
    if (parseFloat(formData.litros) <= 0) {
      setHasError(true);
      setErrorMessage('La cantidad de litros debe ser mayor que cero');
      return false;
    }
    
    // Validar que tenemos los datos necesarios para la API
    if (!solicitante || !solicitante.id) {
      setHasError(true);
      setErrorMessage('No se ha seleccionado un solicitante válido');
      return false;
    }
    
    if (!patenteSeleccionada || !patenteSeleccionada.id_maquina) {
      setHasError(true);
      setErrorMessage('No se ha seleccionado un equipo válido');
      return false;
    }
    
    if (!usuarioActual || !usuarioActual.id) {
      setHasError(true);
      setErrorMessage('No se ha identificado el usuario que registra el consumo');
      return false;
    }
    
    if (!estanqueSeleccionado || !estanqueSeleccionado.id_estanque) {
      setHasError(true);
      setErrorMessage('No se ha seleccionado un estanque válido');
      return false;
    }
    
    return true;
  };

  const getFieldName = (field) => {
    const fieldNames = {
      horometro: 'Horómetro',
      kilometraje: 'Kilometraje',
      numeralInicial: 'Numeral Inicial',
      numeralFinal: 'Numeral Final',
      litros: 'Litros',
      fechaHora: 'Fecha y Hora',
      observacion: 'Observación'
    };
    return fieldNames[field] || field;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      
      // Preparar los datos para enviar según la estructura esperada por el backend
      const tipoMedicionActual = categoriaSeleccionada && 
        typeof categoriaSeleccionada === 'object' && 
        categoriaSeleccionada.tipo_medicion
          ? categoriaSeleccionada.tipo_medicion
          : "Kilometraje";

      // Obtener el valor de medición según el tipo (horometro o kilometraje)
      const medicionValue = tipoMedicionActual === 'Horometro' 
        ? formData.horometro 
        : formData.kilometraje;
      
      const apiData = {
        id_dotacion: solicitante.id,
        id_equipo: patenteSeleccionada.id_maquina,
        id_usuario: usuarioActual.id,
        fecha_consumo: formatDateForAPI(formData.fechaHora),
        litros_consumidos: parseFloat(formData.litros),
        id_faena: faenaActual ? faenaActual.id_faena : null,
        id_estanque: estanqueSeleccionado.id_estanque,
        medicion: parseFloat(medicionValue),
        numeral_inicial: parseFloat(formData.numeralInicial),
        numeral_final: parseFloat(formData.numeralFinal),
        observacion: formData.observacion || null
      };
      
      // Realizar la petición a la API
      const response = await axios.post('/api/consumos', apiData);
      
      if (response.data.success) {
        setIsSaved(true);
        setIsSaving(false);
      } else {
        throw new Error(response.data.message || 'Error al guardar el consumo');
      }
    } catch (error) {
      console.error("Error al guardar el consumo:", error);
      setHasError(true);
      
      // Mostrar mensaje de error específico si viene de la API
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        setErrorMessage(errorMessages.join('. '));
      } else {
        setErrorMessage(error.message || "Ocurrió un error al guardar. Intente nuevamente.");
      }
      
      setIsSaving(false);
    }
  };

  // Función para formatear la fecha según lo espera la API
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace('T', ' '); // Formato: YYYY-MM-DD HH:MM:SS
  };

  // Formatear nombre del solicitante
  const formatSolicitanteName = () => {
    if (!solicitante) return "No especificado";
    return `${solicitante.nombre || ''} ${solicitante.apellido || ''}`.trim() || solicitante.rut || "No especificado";
  };

  // Formatear categoría
  const formatCategoria = () => {
    if (!categoriaSeleccionada) return "No seleccionada";
    return typeof categoriaSeleccionada === 'object' 
      ? categoriaSeleccionada.nombre || "No especificada"
      : categoriaSeleccionada;
  };

  // Formatear patente
  const formatPatente = () => {
    if (!patenteSeleccionada) return "No seleccionada";
    return typeof patenteSeleccionada === 'object'
      ? patenteSeleccionada.patente || patenteSeleccionada.nombre || "No especificada"
      : patenteSeleccionada;
  };

  // Determinar tipo de medición
  const tipoMedicion = categoriaSeleccionada && 
    typeof categoriaSeleccionada === 'object' && 
    categoriaSeleccionada.tipo_medicion
      ? categoriaSeleccionada.tipo_medicion
      : "Kilometraje";

  // Verificar si tiene información de vehículo
  const hasVehicleInfo = Boolean(patenteSeleccionada && typeof patenteSeleccionada === 'object' && patenteSeleccionada.nombre);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text="Cargar Combustible" />
          </div>
          
          {/* Contenedor principal con TabProgressBar */}
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">
            <TabProgressBar activeTab="consumo" />
            
            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col">
              {/* Banner de resumen */}
              <div className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg mb-3 p-2 flex items-center justify-center">
                <FaCheck className="mr-2" />
                <span className="text-sm font-medium">Información de solicitud completada</span>
              </div>
              
              {/* Tarjetas de resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {/* Solicitante */}
                <div className="bg-blue-50 rounded-lg p-2 border-l-4 border-blue-500 hover:bg-blue-100 transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <FaUserAlt />
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-gray-700 font-semibold text-sm truncate">
                        {formatSolicitanteName()}
                      </span>
                      <div className="flex items-center">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full uppercase ${
                          tipoSolicitante === "interno" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {tipoSolicitante || "No especificado"}
                        </span>
                        {solicitante && solicitante.cargo && (
                          <span className="text-xs text-gray-500 ml-1 truncate">{solicitante.cargo}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Máquina/Vehículo */}
                <div className="bg-amber-50 rounded-lg p-2 border-l-4 border-amber-500 hover:bg-amber-100 transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <FaCarSide />
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-gray-700 font-semibold text-sm truncate">
                        {formatPatente()}
                      </span>
                      <div className="flex items-center">
                        <span className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full uppercase">
                          {formatCategoria()}
                        </span>
                        {hasVehicleInfo && (
                          <span className="text-xs text-gray-500 ml-1 truncate">
                            {patenteSeleccionada.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Estanque seleccionado (Opcional, muestra esta información si existe) */}
              {estanqueSeleccionado && (
                <div className="bg-blue-50 rounded-lg p-2 mb-3 border-l-4 border-blue-400">
                  <div className="flex items-center">
                    <span className="text-sm">
                      Estanque: <strong>{estanqueSeleccionado.nombre || estanqueSeleccionado.id_estanque}</strong>
                    </span>
                    {estanqueSeleccionado.capacidad && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-2">
                        Capacidad: {estanqueSeleccionado.capacidad} litros
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Formulario */}
              <div className="flex-grow">
                <ConsumoForm
                  formData={formData}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  isSaving={isSaving}
                  isSaved={isSaved}
                  hasError={hasError}
                  errorMessage={errorMessage}
                  tipoMedicion={tipoMedicion}
                />
              </div>
            </div>
          </div>
          
          {/* Controles inferiores */}
          <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
            <Button
              onClick={onPrevious}
              className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
              icon={<FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />}
            />
            
            <div className="flex-1 flex justify-center">
              <PageControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            
            <div className="w-5 h-5 md:w-6 md:h-6"></div>
          </div>

          {/* Ayuda */}
          <div className="bg-blue-50 text-blue-800 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-xs sm:text-sm w-full max-w-xs sm:max-w-sm">
            <p className="flex items-center justify-center">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="inline-block">
                Complete los campos y haga clic en "Guardar" para registrar el consumo
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Consumo;