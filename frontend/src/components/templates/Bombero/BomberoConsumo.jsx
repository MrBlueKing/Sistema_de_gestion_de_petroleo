import React, { useState, useEffect, useContext } from "react";
import axios from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import Header from "../../organisms/Bombero/Header";
import PageControl from "../../molecules/PageControl";
import TabProgressBar from "../../molecules/TabProgressBar";
import ConsumoForm from "../../organisms/Bombero/FormConsumo";
import { FaArrowLeft, FaCarSide, FaUserAlt, FaCheck, FaHome, FaPlus, FaInfoCircle } from "react-icons/fa";
import StepHeader from "../../molecules/StepHeader";
import Button from "../../atoms/Button/Button";
import { format } from "date-fns";

const Consumo = ({
  onPrevious,
  categoriaSeleccionada,
  patenteSeleccionada,
  solicitante,
  tipoSolicitante = "",
  idFaena = null, // Nueva prop para recibir el idFaena explícitamente
  resetFlow = null
}) => {
  // Obtener el contexto de usuario
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(4);
  const totalPages = 4;
  const [userInfo, setUserInfo] = useState(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  const localDateTime = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const [formData, setFormData] = useState({
    horometro: "",
    kilometraje: "",
    numeralInicial: "",
    numeralFinal: "",
    litros: "",
    fechaHora: localDateTime, // ahora sí es local
    observacion: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);
  // Estado para el estanque seleccionado - necesario para el ConsumoForm
  const [estanqueSeleccionado, setEstanqueSeleccionado] = useState(null);

  // Efecto para loggear información sobre idFaena (para debugging)
  useEffect(() => {
    console.log("idFaena recibido en Consumo:", idFaena);
    console.log("Solicitante:", solicitante);
    if (solicitante && solicitante.id_faena) {
      console.log("id_faena en solicitante:", solicitante.id_faena);
    }
  }, [idFaena, solicitante]);

  // Efecto para manejar los datos del usuario cuando estén disponibles
  useEffect(() => {
    if (!loading) {
      // El contexto ya se cargó
      setContextLoaded(true);

      if (user) {
        console.log("Datos del usuario obtenidos del contexto:", {
          id: user.id,
          nombre: user.name,
          email: user.email,
          id_faena: user.id_faena,
          usuario_completo: user
        });

        setUserInfo({
          id: user.id,
          id_faena: user.id_faena
        });
      } else {
        console.error("Usuario no autenticado o contexto vacío");
        setHasError(true);
        setErrorMessage("No se ha podido obtener la información del usuario. Por favor, vuelva a iniciar sesión.");
      }
    }
  }, [user, loading]);

  // Calcular litros automáticamente cuando cambian numeralInicial o numeralFinal
  useEffect(() => {
    const inicial = parseFloat(formData.numeralInicial) || 0;
    const final = parseFloat(formData.numeralFinal) || 0;

    // Solo calcula si ambos valores existen y el final es mayor que el inicial
    if (formData.numeralInicial && formData.numeralFinal && final > inicial) {
      const calculatedLitros = (final - inicial).toFixed(2);
      setFormData(prev => ({ ...prev, litros: calculatedLitros }));
    } else if (formData.numeralInicial && formData.numeralFinal) {
      // Si hay valores pero no cumplen la condición, limpiar litros
      setFormData(prev => ({ ...prev, litros: "" }));
    }
  }, [formData.numeralInicial, formData.numeralFinal]);

  // Determinar el ID de faena a usar - prioridad: prop idFaena > solicitante.id_faena > userInfo.id_faena
  const getFaenaId = () => {
    // Sistema de prioridad para determinar el id_faena
    if (idFaena) {
      return idFaena;
    } else if (solicitante && solicitante.id_faena) {
      return solicitante.id_faena;
    } else if (userInfo && userInfo.id_faena) {
      return userInfo.id_faena;
    }
    return null;
  };

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

  // Función para manejar la selección de estanque
  const handleEstanqueSelect = (estanque) => {
    console.log("Estanque seleccionado en Consumo:", estanque);
    setEstanqueSeleccionado(estanque);
  };

  const validateForm = () => {
    // Validar que tenemos los datos de usuario necesarios
    if (!userInfo || !userInfo.id) {
      setHasError(true);
      setErrorMessage('No se ha podido identificar al usuario actual. Por favor, vuelva a iniciar sesión.');
      return false;
    }

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

    // Validar que se haya seleccionado un estanque (si es necesario)
    if (formData.litros && parseFloat(formData.litros) > 0 && !estanqueSeleccionado) {
      setHasError(true);
      setErrorMessage('Debe seleccionar un estanque para el consumo');
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

      // Obtener el id_faena a usar en la API
      const faenaIdToUse = getFaenaId();

      // Log para depuración
      console.log("Preparando datos para la API con información de usuario:", {
        usuario_id: userInfo.id,
        faena_id: faenaIdToUse
      });

      // Añadir id_estanque si se seleccionó
      const estanqueId = estanqueSeleccionado ? estanqueSeleccionado.id_estanque : null;

      const apiData = {
        id_dotacion: solicitante.rut,
        id_equipo: patenteSeleccionada.id_maquina,
        id_usuario: userInfo.id, // Usar el ID del contexto
        fecha_consumo: formatDateForAPI(formData.fechaHora),
        litros_consumidos: parseFloat(formData.litros),
        id_faena: faenaIdToUse, // Usar el ID de faena determinado
        id_estanque: estanqueId, // Agregar ID del estanque seleccionado
        medicion: parseFloat(medicionValue),
        numeral_inicial: parseFloat(formData.numeralInicial),
        numeral_final: parseFloat(formData.numeralFinal),
        observacion: formData.observacion || null
      };

      console.log("Datos que se enviarán a la API:", apiData);

      // Realizar la petición a la API
      const response = await axios.post('/api/consumos', apiData);

      console.log("Respuesta de la API:", response.data);

      if (response.data.success) {
        setIsSaved(true);
        setIsSaving(false);
        // Guardar datos de éxito para mostrar en pantalla de confirmación
        setSuccessData({
          id: response.data.data.id || 'N/A',
          litros: formData.litros,
          fecha: new Date().toLocaleString(),
          solicitante: formatSolicitanteName(),
          equipo: formatPatente()
        });
      } else {
        throw new Error(response.data.message || 'Error al guardar el consumo');
      }
    } catch (error) {
      console.error("Error al guardar el consumo:", error);
      setHasError(true);

      // Manejar casos específicos de error
      if (error.response) {
        console.log("Respuesta de error completa:", error.response);

        // Error de respuesta del servidor
        if (error.response.status === 400 && error.response.data.message &&
          error.response.data.message.includes('Stock insuficiente')) {
          // Error específico de stock insuficiente
          setErrorMessage(`Stock insuficiente. El estanque seleccionado no tiene suficiente combustible 
            (disponible: ${error.response.data.data?.stock_actual || 'N/A'} litros).`);
        } else if (error.response.data && error.response.data.errors) {
          // Errores de validación
          const errorMessages = Object.values(error.response.data.errors).flat();
          setErrorMessage(errorMessages.join('. '));
        } else {
          // Otros errores del servidor
          setErrorMessage(error.response.data.message || "Error del servidor. Intente nuevamente.");
        }
      } else {
        // Error de red u otro tipo
        setErrorMessage(error.message || "Ocurrió un error al guardar. Verifique su conexión de red.");
      }

      setIsSaving(false);
    }
  };

  // Función para volver al inicio del flujo (resetea todo)
  const handleBackToStart = () => {
    if (resetFlow && typeof resetFlow === 'function') {
      resetFlow(); // Función proporcionada para reiniciar todo el flujo
    } else {
      // Alternativa: navegar a la página inicial
      navigate('/bombero');
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

  // Renderizar mensaje de espera mientras se carga el contexto
  if (!contextLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
        <Header />
        <main className="flex-1 w-full p-4 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Cargando información del usuario...</p>
          </div>
        </main>
      </div>
    );
  }

  // Renderizar mensaje de error si no hay usuario
  if (contextLoaded && !userInfo) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
        <Header />
        <main className="flex-1 w-full p-4 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-6 text-center max-w-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
              <FaInfoCircle className="text-red-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de sesión</h2>
            <p className="text-gray-700 mb-4">
              No se ha podido obtener la información del usuario. Es posible que su sesión haya expirado.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Renderizar pantalla de éxito
  const renderSuccessScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <FaCheck className="text-green-600 w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800">¡Consumo registrado exitosamente!</h2>

        <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-md">
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="col-span-2 border-b pb-2 mb-2">
              <p className="text-sm text-gray-500">Número de registro</p>
              <p className="font-semibold">{successData?.id || 'N/A'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Litros consumidos</p>
              <p className="font-semibold">{successData?.litros || 'N/A'} L</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Fecha y hora</p>
              <p className="font-semibold">{successData?.fecha || 'N/A'}</p>
            </div>

            <div className="col-span-2 mt-2">
              <p className="text-sm text-gray-500">Solicitante</p>
              <p className="font-semibold">{successData?.solicitante || 'N/A'}</p>
            </div>

            <div className="col-span-2">
              <p className="text-sm text-gray-500">Equipo/Vehículo</p>
              <p className="font-semibold">{successData?.equipo || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4">
          <button
            onClick={handleBackToStart}
            className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center"
          >
            <FaPlus className="mr-2" />
            <span>Nuevo registro</span>
          </button>

          <button
            onClick={() => navigate('/bombero')}
            className="w-full sm:w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg flex items-center justify-center"
          >
            <FaHome className="mr-2" />
            <span>Volver al inicio</span>
          </button>
        </div>
      </div>
    );
  };

  // Obtener el id_faena a usar
  const faenaIdToUse = getFaenaId();

  // Para debug - mostrar el ID de faena que se usará
  if (process.env.NODE_ENV === 'development') {
    console.log("ID de faena que se usará:", faenaIdToUse);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-14">
      <Header />
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text={isSaved ? "Consumo Registrado" : "Cargar Combustible"} />
          </div>

          {/* Contenedor principal con TabProgressBar */}
          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">
            <TabProgressBar activeTab="consumo" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col">

              {isSaved ? (
                // Pantalla de éxito cuando se guardó el consumo
                renderSuccessScreen()
              ) : (
                // Formulario normal
                <>
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
                            <span className={`text-xs px-1.5 py-0.5 rounded-full uppercase ${tipoSolicitante === "interno"
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
                      idFaena={faenaIdToUse} // CAMBIO CLAVE: Pasar el idFaena al formulario
                      estanqueSeleccionado={estanqueSeleccionado}
                      onEstanqueSelect={handleEstanqueSelect}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Controles inferiores - solo mostrar si no estamos en pantalla de éxito */}
          {!isSaved && (
            <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
              <Button
                onClick={onPrevious}
                className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
                icon={<FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />}
                textColor="orange-500"
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
          )}

          {/* Ayuda - solo mostrar si no estamos en pantalla de éxito */}
          {!isSaved && (
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
          )}
        </div>
      </main>
    </div>
  );
};

export default Consumo;