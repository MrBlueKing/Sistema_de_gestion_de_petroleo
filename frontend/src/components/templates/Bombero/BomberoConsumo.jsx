import React, { useState, useEffect, useContext } from "react";
import axios from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import Header from "../../organisms/Bombero/Header";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";
import PageControl from "../../molecules/PageControl";
import TabProgressBar from "../../molecules/TabProgressBar";
import ConsumoForm from "../../organisms/Bombero/FormConsumo";
import HistorialCollapsible from "../../molecules/HistorialCollapsible";
import {
  FaArrowLeft, FaCarSide, FaUserAlt, FaCheck, FaHome, FaPlus, FaInfoCircle, FaClipboardList, FaClock, FaHistory,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaGasPump,
  FaTachometerAlt,
  FaTruck,
  FaExclamationTriangle,
  FaEye,
  FaTimes,
  FaChevronUp,
  FaChevronDown
} from "react-icons/fa";
import StepHeader from "../../molecules/StepHeader";
import Button from "../../atoms/Button/Button";
import { format } from "date-fns";
import { useUltimaMedicionNumeralFinal } from "../../../hook/Bombero/useUltimaMedicionNumeralFinal";
import { useHistorialConsumos } from "../../../hook/Bombero/useHistorialConsumos";

// ✅ SOLUCIÓN DEFINITIVA: Badge de referencia EN EL LABEL del input
// Esto es MUY común en apps financieras/profesionales
const InputConReferencia = ({ 
  label, 
  tipo, 
  value, 
  onChange, 
  onBlur,
  disabled,
  className,
  placeholder,
  ultimoConsumo,
  tipoMedicion,
  icon: Icon 
}) => {
  const ultimaMedicion = ultimoConsumo?.medicion;
  const fechaUltima = ultimoConsumo?.fecha_formateada;
  
  const mostrarReferencia = ultimaMedicion && (
    (tipo === 'kilometraje' && tipoMedicion === 'Kilometraje') ||
    (tipo === 'horometro' && tipoMedicion === 'Horometro')
  );

  return (
    <div className="col-span-1">
      <label className="block text-left text-gray-700 text-xs sm:text-sm font-medium mb-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            {Icon && <Icon className="text-gray-500 mr-1" size={14} />}
            {label} <span className="text-red-500">*</span>
          </span>
          
          {/* 🎯 REFERENCIA DIRECTA EN EL LABEL - GENIAL PARA MOBILE */}
          {mostrarReferencia && (
            <div className="flex flex-col items-end">
              <span className="text-green-600 font-bold text-xs">
                Último: {tipoMedicion === 'Horometro' 
                  ? `${ultimaMedicion.toFixed(1)} hrs`
                  : `${Math.round(ultimaMedicion).toLocaleString()} km`
                }
              </span>
              <span className="text-gray-400 text-xs">
                {fechaUltima}
              </span>
            </div>
          )}
        </div>
      </label>
      
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={className}
        placeholder={placeholder}
      />
      
      {/* 💡 TIP CONTEXTUAL cuando hay referencia */}
      {mostrarReferencia && (
        <p className="text-xs text-blue-600 mt-1 flex items-center">
          <FaInfoCircle className="mr-1" size={10} />
          Debe ser mayor que {ultimaMedicion.toLocaleString()} {tipoMedicion === 'Horometro' ? 'hrs' : 'km'}
        </p>
      )}
    </div>
  );
};

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
  const DEBUG = false;
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();

  // Estados principales
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

  // HOOKS especializados
  const {
    loading: loadingUltimaMedicion,
    error: errorUltimaMedicion,
    data,
    medicionFormateada,
    tieneConsumo,
    numeralInicialSugerido,
    cargarUltimaMedicion
  } = useUltimaMedicionNumeralFinal();

  const {
    loadingHistorial,
    errorHistorial,
    historialConsumos,
    tieneHistorial,
    ultimoConsumo,
    penultimoConsumo,
    cantidadConsumos,
    cargarHistorialConsumos
  } = useHistorialConsumos();

  // ✅ Cargar datos cuando esté listo
  useEffect(() => {
    if (patenteSeleccionada?.id_maquina && userInfo?.id_faena) {
      DEBUG && console.log('🎯 Cargando datos para máquina:', patenteSeleccionada.id_maquina, 'faena:', userInfo.id_faena);
      cargarUltimaMedicion(patenteSeleccionada.id_maquina, userInfo.id_faena);
      cargarHistorialConsumos(patenteSeleccionada.id_maquina, 5); // Más registros para mejor contexto
    }
  }, [patenteSeleccionada?.id_maquina, userInfo?.id_faena, cargarUltimaMedicion, cargarHistorialConsumos]);

  // ✅ Setup inicial del usuario
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

  // ✅ Cálculo automático de litros
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

  // FUNCIONES AUXILIARES (mantenidas iguales por brevedad)
  const getFaenaId = () => {
    if (idFaena) return idFaena;
    if (solicitante?.id_faena) return solicitante.id_faena;
    if (userInfo?.id_faena) return userInfo.id_faena;
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

  const handleEstanqueSelect = (estanque) => setEstanqueSeleccionado(estanque);

  const handleConsumoComplete = (response = null) => {
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
  };

  const handleBackToStart = () => {
    if (resetFlow && typeof resetFlow === 'function') {
      resetFlow();
    } else {
      navigate('/bombero');
    }
  };

  // FORMATTERS
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

  const renderSuccessScreen = () => (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <FaCheck className="text-green-600 w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">¡Consumo registrado exitosamente!</h2>
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

  // Variables derivadas
  const tipoMedicion = categoriaSeleccionada?.tipo_medicion || "Kilometraje";
  const hasVehicleInfo = Boolean(patenteSeleccionada?.nombre);
  const faenaIdToUse = getFaenaId();

  // Early returns
  if (!contextLoaded) {
    return (
      <div>
        <UniversalHeader type="bombero" />
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
        <UniversalHeader type="bombero" />
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
                            {solicitante?.cargo && (
                              <span className="text-xs text-gray-500 ml-1 truncate">{solicitante.cargo}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Máquina */}
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

                  {/* ✅ HISTORIAL SIMPLE - Solo últimos 2, abierto por defecto */}
                  <HistorialCollapsible
                    ultimoConsumo={ultimoConsumo}
                    penultimoConsumo={penultimoConsumo}
                    tipoMedicion={tipoMedicion}
                    loading={loadingHistorial}
                    error={errorHistorial}
                    cantidadConsumos={cantidadConsumos}
                  />

                  {/* ✅ FORMULARIO CON INPUT MEJORADO */}
                  <div className="flex-grow">
                    <ConsumoForm
                      formData={formData}
                      handleChange={handleChange}
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
                      numeralInicialSugerido={numeralInicialSugerido}
                      loadingNumeralSugerido={loadingUltimaMedicion}
                      errorNumeralSugerido={errorUltimaMedicion}
                      datosUltimaMedicion={data}
                      // ✅ NUEVA PROP: Para que FormConsumo use el InputConReferencia
                      ultimoConsumo={ultimoConsumo}
                      InputConReferencia={InputConReferencia}
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