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
  idFaena = null,
  resetFlow = null,
  preloadedEstanques = null
}) => {
  const DEBUG = false; // o true si estás depurando
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();

  // Estados
  const [currentPage, setCurrentPage] = useState(4);
  const [userInfo, setUserInfo] = useState(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [formData, setFormData] = useState({
    horometro: "",
    kilometraje: "",
    numeralInicial: "",
    numeralFinal: "",
    litros: "",
    fechaHora: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    observacion: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [estanqueSeleccionado, setEstanqueSeleccionado] = useState(null);

  // Constantes
  const totalPages = 4;

  // TODOS los useEffect juntos al inicio para mantener el orden
  useEffect(() => {
    DEBUG && console.log('DEBUG CONSUMO - Props recibidas:', {
      onPrevious: typeof onPrevious,
      categoriaSeleccionada,
      patenteSeleccionada,
      solicitante,
      tipoSolicitante,
      idFaena,
      resetFlow: typeof resetFlow,
      preloadedEstanques,
      formData,
      userInfo,
      estanqueSeleccionado
    });
  }, [onPrevious, categoriaSeleccionada, patenteSeleccionada, solicitante, tipoSolicitante, idFaena, resetFlow, preloadedEstanques, formData, userInfo, estanqueSeleccionado]);

  useEffect(() => {
    if (!loading) {
      setContextLoaded(true);

      if (user) {
        const userInfoData = {
          id: user.id,
          id_faena: user.id_faena,
          faena: user.id_faena,
          nombre: user.nombre,
          apellido: user.apellido
        };
        
        setUserInfo(userInfoData);
        DEBUG && console.log('DEBUG CONSUMO - UserInfo establecido:', userInfoData);
      } else {
        setHasError(true);
        setErrorMessage("No se ha podido obtener la información del usuario. Por favor, vuelva a iniciar sesión.");
      }
    }
  }, [user, loading]);

  useEffect(() => {
    const inicial = parseFloat(formData.numeralInicial) || 0;
    const final = parseFloat(formData.numeralFinal) || 0;

    if (formData.numeralInicial && formData.numeralFinal && final > inicial) {
      const calculatedLitros = (final - inicial).toFixed(2);
      setFormData(prev => ({ ...prev, litros: calculatedLitros }));
    } else if (formData.numeralInicial && formData.numeralFinal) {
      setFormData(prev => ({ ...prev, litros: "" }));
    }
  }, [formData.numeralInicial, formData.numeralFinal]);

  // Funciones
  const getFaenaId = () => {
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
    if (['horometro', 'kilometraje', 'numeralInicial', 'numeralFinal', 'litros'].includes(field)) {
      if (value === "" || (!isNaN(parseFloat(value)) && isFinite(value))) {
        setFormData({ ...formData, [field]: value });
      }
    } else {
      setFormData({ ...formData, [field]: value });
    }

    if (hasError) {
      setHasError(false);
      setErrorMessage("");
    }
  };

  const handleEstanqueSelect = (estanque) => {
    setEstanqueSeleccionado(estanque);
  };

  const handleConsumoComplete = (response = null) => {
    DEBUG && console.log('DEBUG CONSUMO - Consumo completado desde ConsumoFormMultiEstanque', response);
    
    setIsSaved(true);
    setIsSaving(false);
    setHasError(false);
    setErrorMessage("");
    
    const successInfo = {
      id: response?.data?.id_consumo || 'Generado automáticamente',
      litros: formData.litros,
      fecha: new Date().toLocaleString(),
      solicitante: formatSolicitanteName(),
      equipo: formatPatente(),
      observacion: formData.observacion
    };
    
    setSuccessData(successInfo);
    DEBUG && console.log('DEBUG CONSUMO - Datos de éxito establecidos:', successInfo);
  };

  const validateForm = () => {
    if (!userInfo || !userInfo.id) {
      setHasError(true);
      setErrorMessage('No se ha podido identificar al usuario actual. Por favor, vuelva a iniciar sesión.');
      return false;
    }

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

    for (const field of requiredFields) {
      if (!formData[field]) {
        setHasError(true);
        setErrorMessage(`El campo ${getFieldName(field)} es obligatorio`);
        return false;
      }
    }

    if (parseFloat(formData.numeralFinal) <= parseFloat(formData.numeralInicial)) {
      setHasError(true);
      setErrorMessage('El numeral final debe ser mayor que el inicial');
      return false;
    }

    if (parseFloat(formData.litros) <= 0) {
      setHasError(true);
      setErrorMessage('La cantidad de litros debe ser mayor que cero');
      return false;
    }

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

      const tipoMedicionActual = categoriaSeleccionada &&
        typeof categoriaSeleccionada === 'object' &&
        categoriaSeleccionada.tipo_medicion
        ? categoriaSeleccionada.tipo_medicion
        : "Kilometraje";

      const medicionValue = tipoMedicionActual === 'Horometro'
        ? formData.horometro
        : formData.kilometraje;

      const faenaIdToUse = getFaenaId();
      const estanqueId = estanqueSeleccionado ? estanqueSeleccionado.id_estanque : null;

      const apiData = {
        id_dotacion: solicitante.rut,
        id_equipo: patenteSeleccionada.id_maquina,
        id_usuario: userInfo.id,
        fecha_consumo: formatDateForAPI(formData.fechaHora),
        litros_consumidos: parseFloat(formData.litros),
        id_faena: faenaIdToUse,
        id_estanque: estanqueId,
        medicion: parseFloat(medicionValue),
        numeral_inicial: parseFloat(formData.numeralInicial),
        numeral_final: parseFloat(formData.numeralFinal),
        observacion: formData.observacion || null
      };

      const response = await axios.post('/api/consumos', apiData);
      DEBUG && console.log("datiños: ", response.data);
      DEBUG && console.log("datiños: ", response.data.data);

      if (response.data.success) {
        setIsSaved(true);
        setIsSaving(false);
        setSuccessData({
          id: response.data.data.id_consumo || 'N/A',
          litros: formData.litros,
          fecha: new Date().toLocaleString(),
          solicitante: formatSolicitanteName(),
          equipo: formatPatente(),
          observacion: formData.observacion
        });
      } else {
        throw new Error(response.data.message || 'Error al guardar el consumo');
      }
    } catch (error) {
      setHasError(true);

      if (error.response) {
        if (error.response.status === 400 && error.response.data.message &&
          error.response.data.message.includes('Stock insuficiente')) {
          setErrorMessage(`Stock insuficiente. El estanque seleccionado no tiene suficiente combustible 
            (disponible: ${error.response.data.data?.stock_actual || 'N/A'} litros).`);
        } else if (error.response.data && error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors).flat();
          setErrorMessage(errorMessages.join('. '));
        } else {
          setErrorMessage(error.response.data.message || "Error del servidor. Intente nuevamente.");
        }
      } else {
        setErrorMessage(error.message || "Ocurrió un error al guardar. Verifique su conexión de red.");
      }

      setIsSaving(false);
    }
  };

  const handleBackToStart = () => {
    if (resetFlow && typeof resetFlow === 'function') {
      resetFlow();
    } else {
      navigate('/bombero');
    }
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  const formatSolicitanteName = () => {
    if (!solicitante) return "No especificado";
    return `${solicitante.nombre || ''} ${solicitante.apellido || ''}`.trim() || solicitante.rut || "No especificado";
  };

  const formatCategoria = () => {
    if (!categoriaSeleccionada) return "No seleccionada";
    return typeof categoriaSeleccionada === 'object'
      ? categoriaSeleccionada.nombre || "No especificada"
      : categoriaSeleccionada;
  };

  const formatPatente = () => {
    if (!patenteSeleccionada) return "No seleccionada";
    return typeof patenteSeleccionada === 'object'
      ? patenteSeleccionada.patente || patenteSeleccionada.nombre || "No especificada"
      : patenteSeleccionada;
  };

  // Variables derivadas
  const tipoMedicion = categoriaSeleccionada &&
    typeof categoriaSeleccionada === 'object' &&
    categoriaSeleccionada.tipo_medicion
    ? categoriaSeleccionada.tipo_medicion
    : "Kilometraje";

  const hasVehicleInfo = Boolean(patenteSeleccionada && typeof patenteSeleccionada === 'object' && patenteSeleccionada.nombre);
  const faenaIdToUse = getFaenaId();

  // Early returns
  if (!contextLoaded) {
    return (
      <div>
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

  if (contextLoaded && !userInfo) {
    return (
      <div>
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
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Observación</p>
              <p className="font-semibold">{successData?.observacion || 'N/A'}</p>
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pt-6">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4 text-center">
        <div className="bg-gray-200 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 rounded-2xl sm:rounded-3xl flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="w-full">
            <StepHeader text={isSaved ? "Consumo Registrado" : "Cargar Combustible"} />
          </div>

          <div className="bg-orange-500 w-full rounded-2xl sm:rounded-3xl md:rounded-[40px] py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 space-y-2 sm:space-y-3 md:space-y-4 min-h-[300px] md:min-h-[350px] flex flex-col">
            <TabProgressBar activeTab="consumo" />

            <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-2 sm:p-3 md:p-4 flex-grow flex flex-col">

              {isSaved ? (
                renderSuccessScreen()
              ) : (
                <>
                  <div className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg mb-3 p-2 flex items-center justify-center">
                    <FaCheck className="mr-2" />
                    <span className="text-sm font-medium">Información de solicitud completada</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
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
                      idFaena={faenaIdToUse}
                      estanqueSeleccionado={estanqueSeleccionado}
                      onEstanqueSelect={handleEstanqueSelect}
                      preloadedEstanques={preloadedEstanques}
                      solicitante={solicitante}
                      categoriaSeleccionada={categoriaSeleccionada}
                      patenteSeleccionada={patenteSeleccionada}
                      userInfo={userInfo}
                      onComplete={handleConsumoComplete}
                      resetFlow={resetFlow}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {!isSaved && (
            <div className="flex items-center w-full px-1 sm:px-2 md:px-4 py-1 sm:py-2">
              <Button
                onClick={onPrevious}
                className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none flex items-center justify-center"
                icon={<FaArrowLeft className="text-black w-5 h-5 md:w-6 md:h-6" />}
                textColor="orange-500"
              />
              <div className="w-5 h-5 md:w-6 md:h-6"></div>
            </div>
          )}

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