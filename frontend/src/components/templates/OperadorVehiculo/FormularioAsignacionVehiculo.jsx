import React, { useState, useRef, useEffect, useContext } from "react";
import { FaGasPump, FaTruck, FaFileInvoiceDollar, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaClipboardList, FaSave, FaArrowLeft, FaTachometerAlt, FaBuilding, FaCheckCircle } from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import Label from "../../atoms/Typography/Label";
import Alert from "../../atoms/FeedBack/Alert";
import { useOperadorData } from "../../../hook/OperadorVehiculo/useOperadorData";
import { UserContext } from "../../../context/userContext";
import HistorialCollapsible from "../../molecules/HistorialCollapsible";
import { useHistorialConsumos } from "../../../hook/Bombero/useHistorialConsumos";
import axios from "../../../lib/axios";
// 🆕 IMPORTAR EL NUEVO SELECTOR Y HOOK
import SelectorMaquinasOperadorVehiculo from "../../molecules/SelectorMaquinasOperadorVehiculo";
import { useMaquinasDisponibles } from "../../../hook/OperadorVehiculo/useMaquinasDisponibles";

// ✅ COMPONENTE FUERA PARA EVITAR PÉRDIDA DE FOCO
const InputKilometrajeSimple = ({
    label,
    name,
    type,
    value,
    onChange,
    onBlur,
    placeholder,
    icon: Icon,
    ultimoConsumo,
    required = false,
    disabled = false,
    className = "",
    getFieldError,
    kilometrajeError,
    isValidating,
    maquinaSeleccionada
}) => {
    const ultimoKilometraje = ultimoConsumo?.medicion;
    const fechaUltima = ultimoConsumo?.fecha_formateada;
    const mostrarReferencia = ultimoKilometraje;

    return (
        <div>
            <Label
                htmlFor={name}
                label={label}
                required={required}
                tooltip="Kilometraje que marca el vehículo al momento de la carga"
            />

            {/* 🆕 MOSTRAR ESTADO SEGÚN LA SITUACIÓN */}
            {maquinaSeleccionada && mostrarReferencia && (
                <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-green-700 font-medium">
                            Último kilometraje de {maquinaSeleccionada.nombre_maquina}:
                        </span>
                        <div className="text-right">
                            <span className="text-green-600 font-bold">
                                {Math.round(ultimoKilometraje).toLocaleString()} km
                            </span>
                            {fechaUltima && (
                                <div className="text-gray-500 text-xs">{fechaUltima}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 🆕 CASO: Máquina seleccionada pero sin historial */}
            {maquinaSeleccionada && !mostrarReferencia && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-sm">
                        <span className="text-blue-700">
                            ℹ️ {maquinaSeleccionada.nombre_maquina} no tiene historial previo. Puedes ingresar cualquier kilometraje.
                        </span>
                    </div>
                </div>
            )}

            {/* 🆕 CASO: No hay máquina seleccionada */}
            {!maquinaSeleccionada && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center text-sm">
                        <span className="text-yellow-700">
                            ⚠️ Selecciona una máquina primero para ver el último kilometraje registrado
                        </span>
                    </div>
                </div>
            )}

            <InputField
                id={name}
                name={name}
                type={type}
                step="1"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                icon={Icon}
                disabled={disabled || !maquinaSeleccionada} // 🆕 Deshabilitar si no hay máquina
                className={`${getFieldError && getFieldError(name) ? 'border-red-300 focus:border-red-500' : ''} ${kilometrajeError ? 'border-red-300 focus:border-red-500' : ''} ${className}`}
            />

            {kilometrajeError && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    {kilometrajeError}
                </p>
            )}

            {getFieldError && getFieldError(name) && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(name)}</p>
            )}

            <p className="text-gray-600 text-xs mt-1">
                💡 Ingresa el kilometraje exacto que muestra el odómetro
            </p>
        </div>
    );
};

const FormularioAsignacionVehiculo = ({ onIngresoExitoso }) => {
    const navigate = useNavigate();

    // ✅ HOOKS ACTUALIZADOS - Sin maquinaAsignada
    const { loading: loadingOperador, usuario, error: errorOperador } = useOperadorData();
    const { user } = useContext(UserContext);

    // 🆕 ESTADOS PARA MÁQUINA SELECCIONADA
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
    const [datosUltimoConsumo, setDatosUltimoConsumo] = useState(null);
    const { obtenerMaquinaPorId } = useMaquinasDisponibles();

    // 🆕 FUNCIÓN PARA MANEJAR SELECCIÓN DE MÁQUINA
    const handleSeleccionarMaquina = async (maquina) => {
        console.log('🚛 Máquina seleccionada:', maquina);
        setMaquinaSeleccionada(maquina);

        if (maquina) {
            // 🆕 LIMPIAR DATOS ANTERIORES PRIMERO
            setDatosUltimoConsumo(null);
            setKilometrajeError(""); // Limpiar errores previos

            // 🆕 MOSTRAR INDICADOR DE CARGA
            console.log(`📊 Cargando historial para ${maquina.nombre_maquina}...`);

            try {
                // Cargar historial de la máquina seleccionada
                await cargarHistorialConsumos(maquina.id_maquina, 2);
                console.log(`✅ Historial cargado para ${maquina.nombre_maquina}`);
            } catch (error) {
                console.warn('⚠️ No se pudo cargar historial para la máquina:', error);
                // 🆕 OPCIONAL: Mostrar mensaje al usuario
                setDatosUltimoConsumo(null); // Asegurar que quede limpio
            }
        } else {
            // Si se deselecciona la máquina
            setDatosUltimoConsumo(null);
            setKilometrajeError("");
        }
    };

    // ✅ ESTADOS DEL FORMULARIO
    const [formData, setFormData] = useState({
        numero_boleta: "",
        litros: "",
        precio_por_litro: "",
        costo: "",
        ubicacion: "",
        tipo_combustible: "Diesel",
        observaciones: "",
        medicion: "",
        id_faena: 5
    });

    // ✅ HOOK DE HISTORIAL
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

    // ✅ ESTADOS DE CONTROL
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [focusedFields, setFocusedFields] = useState({});
    const alertRef = useRef(null);

    // 🆕 REFERENCIAS PARA ERRORES
    const errorRefs = useRef({
        numero_boleta: null,
        litros: null,
        precio_por_litro: null,
        ubicacion: null,
        medicion: null,
        id_faena: null
    });

    // 🆕 ESTADOS PARA FUNCIONALIDADES AVANZADAS
    const [fieldErrors, setFieldErrors] = useState({});
    const [kilometrajeError, setKilometrajeError] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdCarga, setCreatedCarga] = useState(null);

    // 🆕 FUNCIÓN PARA SCROLLEAR AL PRIMER ERROR
    const scrollToFirstError = (errors) => {
        const errorFields = Object.keys(errors);
        if (errorFields.length > 0) {
            const firstErrorField = errorFields[0];
            const errorElement = errorRefs.current[firstErrorField];

            if (errorElement) {
                errorElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                setTimeout(() => {
                    const inputElement = errorElement.querySelector('input, select, textarea');
                    if (inputElement) {
                        inputElement.focus();
                    }
                }, 500);
            }
        }
    };

    // 🆕 VALIDACIÓN EN TIEMPO REAL DEL KILOMETRAJE - CORREGIDA
    const validateKilometrajeRealTime = (value) => {
        if (!value || value.trim() === '') {
            return "";
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return "Debe ser un número válido";
        }

        if (numValue < 0) {
            return "El kilometraje no puede ser negativo";
        }

        if (numValue > 999999) {
            return "Kilometraje demasiado alto (máximo 999,999 km)";
        }

        // 🆕 USAR datosUltimoConsumo
        const ultimoKilometraje = datosUltimoConsumo?.medicion;
        if (ultimoKilometraje && numValue <= ultimoKilometraje) {
            return `Debe ser mayor a ${Math.round(ultimoKilometraje).toLocaleString()} km`;
        }

        return "";
    };

    // ✅ MANEJAR CAMBIOS EN EL FORMULARIO
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'medicion') {
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));

                const error = validateKilometrajeRealTime(value);
                setKilometrajeError(error);

                if (fieldErrors.medicion) {
                    setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.medicion;
                        return newErrors;
                    });
                }
            }
            return;
        }

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            if (name === 'litros' || name === 'precio_por_litro') {
                const litros = name === 'litros' ? parseFloat(value) || 0 : parseFloat(prev.litros) || 0;
                const precio = name === 'precio_por_litro' ? parseFloat(value) || 0 : parseFloat(prev.precio_por_litro) || 0;
                newData.costo = (litros * precio).toFixed(2);
            }

            return newData;
        });

        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // ✅ EFECTO PARA CARGAR HISTORIAL
    useEffect(() => {
        if (maquinaSeleccionada?.id_maquina) {
            cargarHistorialConsumos(maquinaSeleccionada.id_maquina, 2);
        }
    }, [maquinaSeleccionada?.id_maquina, cargarHistorialConsumos]);
    // 🔧 MEJORAR EL useEffect PARA MANEJAR CAMBIOS DE MÁQUINA
    useEffect(() => {
        if (ultimoConsumo && maquinaSeleccionada) {
            console.log('🔄 Actualizando datos del último consumo:', {
                maquina: maquinaSeleccionada.nombre_maquina,
                ultimoKm: ultimoConsumo.medicion || ultimoConsumo.kilometraje,
                fecha: ultimoConsumo.fecha_consumo
            });

            setDatosUltimoConsumo({
                medicion: ultimoConsumo.medicion || ultimoConsumo.kilometraje,
                fecha_consumo: ultimoConsumo.fecha_consumo || ultimoConsumo.created_at,
                litros_consumidos: ultimoConsumo.litros_consumidos,
                fecha_formateada: ultimoConsumo.fecha_consumo ?
                    new Date(ultimoConsumo.fecha_consumo).toLocaleDateString('es-ES') : null
            });
        } else if (maquinaSeleccionada && !ultimoConsumo) {
            // 🆕 CASO: Máquina seleccionada pero sin historial
            console.log(`ℹ️ ${maquinaSeleccionada.nombre_maquina} no tiene historial de consumos`);
            setDatosUltimoConsumo(null);
        }
    }, [ultimoConsumo, maquinaSeleccionada]);


    // ✅ DETECTAR TIPO DE MEDICIÓN
    const tipoMedicion = maquinaSeleccionada?.tipo_maquina === 'Generador' ? 'Horometro' : 'Kilometraje';

    // ✅ EFECTO PARA MOSTRAR ERRORES DEL OPERADOR
    useEffect(() => {
        if (errorOperador) {
            setError({ global: errorOperador });
        }
    }, [errorOperador]);

    // ✅ AUTO-DESVANECER MENSAJES
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // ✅ EFECTO PARA MANEJAR ERRORES
    useEffect(() => {
        if (error) {
            if (typeof error === 'object' && !error.global) {
                scrollToFirstError(error);
            } else if (error.global && alertRef.current) {
                const offset = 100;
                const top = alertRef.current.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: "smooth" });
            }

            const timer = setTimeout(() => setError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // ✅ CALCULAR COSTO AUTOMÁTICAMENTE
    useEffect(() => {
        if (formData.precio_por_litro && formData.litros && parseFloat(formData.litros) > 0) {
            const costoCalculado = (parseFloat(formData.precio_por_litro) * parseFloat(formData.litros)).toFixed(2);
            setFormData(prev => ({
                ...prev,
                costo: costoCalculado
            }));
        }
    }, [formData.precio_por_litro, formData.litros]);

    // ✅ FUNCIÓN PARA MANEJAR INPUT CHANGE
    const handleInputChange = (field, value) => {
        if (field === 'medicion') {
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setFormData(prev => ({
                    ...prev,
                    [field]: value
                }));

                const error = validateKilometrajeRealTime(value);
                setKilometrajeError(error);

                if (fieldErrors[field]) {
                    setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                    });
                }
            }
            return;
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // ✅ VALIDACIÓN DEL FORMULARIO - CORREGIDA
    const validateForm = () => {
        const errors = {};

        if (!maquinaSeleccionada) {
            errors.maquina = "Debes seleccionar una máquina";
        }

        if (!formData.numero_boleta.trim()) {
            errors.numero_boleta = "El número de boleta es obligatorio";
        }

        if (!formData.litros || parseFloat(formData.litros) <= 0) {
            errors.litros = "Los litros deben ser mayor a 0";
        }

        if (!formData.precio_por_litro || parseFloat(formData.precio_por_litro) <= 0) {
            errors.precio_por_litro = "El precio por litro debe ser mayor a 0";
        }

        if (!formData.ubicacion.trim()) {
            errors.ubicacion = "La ubicación es obligatoria";
        }

        // 🆕 VALIDACIÓN CORREGIDA PARA USAR datosUltimoConsumo
        if (!formData.medicion) {
            errors.medicion = "El campo Kilometraje es obligatorio";
        } else {
            const valorKilometraje = parseFloat(formData.medicion);
            const ultimoKilometraje = datosUltimoConsumo?.medicion;

            if (ultimoKilometraje && valorKilometraje <= ultimoKilometraje) {
                errors.medicion = `El kilometraje debe ser mayor a ${Math.round(ultimoKilometraje).toLocaleString()} km (último registrado)`;
            }
        }

        return errors;
    };

    // ✅ MAPEAR ERRORES DEL BACKEND
    const mapBackendErrors = (backendErrors) => {
        const mappedErrors = {};
        if (backendErrors) {
            Object.keys(backendErrors).forEach(field => {
                const errorMessages = Array.isArray(backendErrors[field])
                    ? backendErrors[field]
                    : [backendErrors[field]];
                mappedErrors[field] = errorMessages[0];
            });
        }
        return mappedErrors;
    };

    // 🆕 FUNCIÓN handleSubmit SIMPLIFICADA - SIN REVALIDACIÓN
    const handleSubmit = async () => {
        console.log('🚀 Iniciando proceso de envío...');

        // PASO 1: Validación básica del formulario
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            console.log('❌ Formulario tiene errores, no enviando');
            setError(errors);
            return;
        }

        console.log('✅ Validación de formulario pasada, procediendo con el envío...');

        // PASO 2: Proceder con el envío
        setIsLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const payload = {
                numero_boleta: formData.numero_boleta,
                litros: parseFloat(formData.litros),
                costo: parseFloat(formData.costo),
                precio_por_litro: parseFloat(formData.precio_por_litro),
                ubicacion: formData.ubicacion,
                tipo_combustible: formData.tipo_combustible,
                observaciones: formData.observaciones,
                medicion: parseFloat(formData.medicion),
                id_user: usuario.id,
                id_maquina: maquinaSeleccionada.id_maquina,
                id_faena: usuario.id_faena,
            };

            console.log('📝 Payload preparado:', payload);

            const response = await axios.post("/api/chofer/cargas-externas", payload);

            console.log('✅ Respuesta recibida:', response);

            if (response.data.status === 'success') {
                if (onIngresoExitoso) {
                    console.log('📢 Notificando ingreso exitoso para refrescar historial...');
                    onIngresoExitoso();
                }

                setCreatedCarga(response.data.data || {
                    numero_boleta: formData.numero_boleta,
                    litros: formData.litros,
                    costo: formData.costo,
                    medicion: formData.medicion,
                    ubicacion: formData.ubicacion
                });
                setShowSuccessModal(true);

                // Limpiar formulario
                setFormData({
                    numero_boleta: "",
                    litros: "",
                    precio_por_litro: "",
                    costo: "",
                    ubicacion: "",
                    tipo_combustible: "Diesel",
                    observaciones: "",
                    medicion: "",
                    id_faena: 5
                });
                setKilometrajeError("");
            }
        } catch (error) {
            console.error('❌ Error enviando datos:', error);

            if (error.response?.status === 422) {
                const backendErrors = error.response.data.errors || {};
                const mappedErrors = mapBackendErrors(backendErrors);
                setFieldErrors(mappedErrors);
                setError({ global: error.response.data.message || "Errores de validación en el formulario" });
            } else if (error.response?.status === 500) {
                setError({ global: `Error del servidor: ${error.response.data.message || 'Error interno'}` });
            } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                setError({ global: "Error de conexión. Verifica tu internet e intenta nuevamente." });
            } else {
                setError({ global: "Error inesperado. Intenta nuevamente." });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 🆕 CERRAR MODAL DE ÉXITO
    const handleCloseSuccessModal = (action) => {
        setShowSuccessModal(false);
        setCreatedCarga(null);

        if (action === 'new') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/OperadorVehiculo');
        }
    };

    // ✅ OBTENER ERRORES DE CAMPO
    const getFieldError = (fieldId) => {
        if (!error || typeof error !== 'object') return null;
        return error[fieldId] || fieldErrors[fieldId];
    };

    // ✅ LOADING DEL OPERADOR
    if (loadingOperador) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 text-base sm:text-lg font-medium">Cargando datos del operador...</p>
                </div>
            </div>
        );
    }

    // ✅ VALIDAR DATOS NECESARIOS
    if (!usuario?.id && !user?.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="bg-red-100 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de autenticación</h2>
                    <p className="text-gray-600 mb-4">No se pudieron cargar los datos del usuario.</p>
                    <Button
                        text="Volver al inicio"
                        color="orange"
                        onClick={() => navigate('/')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg mb-4 shadow-sm">
            {/* 🆕 MODAL DE ÉXITO */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-12">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 rounded-t-xl">
                            <div className="flex items-center space-x-3">
                                <div className="bg-green-500 bg-opacity-20 rounded-full p-2">
                                    <FaCheckCircle className="text-white text-xl" />
                                </div>
                                <h2 className="text-white text-lg font-bold">¡Carga Registrada!</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                La carga ha sido registrada exitosamente.
                            </p>

                            {createdCarga && (
                                <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 mb-6">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">Boleta:</span>
                                        <span className="text-gray-900">{createdCarga.numero_boleta}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">Litros:</span>
                                        <span className="text-gray-900">{createdCarga.litros}L</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">Costo:</span>
                                        <span className="text-gray-900">${Number(createdCarga.costo).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">Kilometraje:</span>
                                        <span className="text-gray-900">{Number(createdCarga.medicion).toLocaleString()} km</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">Estado:</span>
                                        <span className="text-orange-600 font-medium capitalize">{createdCarga.estado || 'Por Rendir'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">Ubicación:</span>
                                        <span className="text-blue-600 font-medium">{createdCarga.ubicacion || "Estación de Servicio"}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    text="Terminar carga"
                                    color="orange"
                                    className="w-full py-3"
                                    onClick={() => handleCloseSuccessModal('new')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alertas */}
            <div ref={alertRef} className="mb-4 sm:mb-6">
                {error && error.global && (
                    <Alert type="error" message={error.global} />
                )}
                {successMessage && (
                    <Alert type="success" message={successMessage} />
                )}
            </div>

            {/* Formulario */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
                <div className="space-y-5 sm:space-y-6">
                    {/* SECCIÓN 0: Seleccionar máquina a cargar */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaTruck className="text-orange-500" />
                            1.- Seleccione la Máquina a Cargar.
                        </h3>
                        <div ref={el => errorRefs.current['maquina'] = el}>
                            {console.log("Datos enviados:", { maquinaSeleccionada})}
                            <SelectorMaquinasOperadorVehiculo
                                maquinaSeleccionada={maquinaSeleccionada?.id_maquina}
                                onSeleccionarMaquina={handleSeleccionarMaquina}
                                error={getFieldError('maquina')}
                                placeholder="Selecciona la máquina a cargar..."
                                required
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 1: INFORMACIÓN DE LA BOLETA */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaFileInvoiceDollar className="text-orange-500" />
                            2.- Información de la Boleta
                        </h3>
                        <div ref={el => errorRefs.current['numero_boleta'] = el}>
                            <Label
                                htmlFor="numero_boleta"
                                label="Número de Boleta/Factura"
                                required={true}
                                tooltip="Número de la boleta o factura electrónica"
                            />
                            <InputField
                                id="numero_boleta"
                                type="text"
                                placeholder="Ej: 163810"
                                value={formData.numero_boleta}
                                onChange={(e) => handleInputChange('numero_boleta', e.target.value)}
                                icon={<FaFileInvoiceDollar />}
                                disabled={isLoading}
                                className={`${getFieldError('numero_boleta') ? 'border-red-300 focus:border-red-500' : ''} text-base`}
                            />
                            {getFieldError('numero_boleta') && (
                                <p className="text-red-500 text-sm mt-1">{getFieldError('numero_boleta')}</p>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN 2: INFORMACIÓN DEL COMBUSTIBLE */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaGasPump className="text-blue-500" />
                            3.- Información del Combustible
                        </h3>

                        {/* Tipo de Combustible */}
                        <div>
                            <Label
                                htmlFor="tipo_combustible"
                                label="Tipo de Combustible"
                                required={true}
                            />
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                {[
                                    { value: 'Diesel', label: 'Diesel', color: 'from-gray-400 to-gray-800' },
                                    { value: 'Gasolina 93', label: '93', color: 'from-green-200 to-green-500' },
                                    { value: 'Gasolina 95', label: '95', color: 'from-green-200 to-green-600' },
                                    { value: 'Gasolina 97', label: '97', color: 'from-green-200 to-green-700' }
                                ].map((combustible) => (
                                    <button
                                        key={combustible.value}
                                        type="button"
                                        onClick={() => handleInputChange('tipo_combustible', combustible.value)}
                                        disabled={isLoading}
                                        className={`
                                                relative p-4 rounded-xl border-2 transition-all duration-200 
                                                ${formData.tipo_combustible === combustible.value
                                                ? `border-orange-500 bg-gradient-to-br ${combustible.color} text-white shadow-lg scale-105`
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:shadow-md'
                                            }
                                                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">{combustible.icon}</div>
                                            <div className="font-semibold text-sm">
                                                {combustible.value === 'Diesel' ? 'Diesel' : `Gasolina ${combustible.label}`}
                                            </div>
                                        </div>
                                        {formData.tipo_combustible === combustible.value && (
                                            <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                                ✓
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Litros y Precio por Litro */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div ref={el => errorRefs.current['litros'] = el}>
                                <Label
                                    htmlFor="litros"
                                    label="Litros Cargados"
                                    required={true}
                                />
                                <InputField
                                    id="litros"
                                    type="number"
                                    step="0.001"
                                    placeholder="40"
                                    value={formData.litros}
                                    onChange={(e) => handleInputChange('litros', e.target.value)}
                                    icon={<FaGasPump />}
                                    disabled={isLoading}
                                    className={`${getFieldError('litros') ? 'border-red-300 focus:border-red-500' : ''} text-base`}
                                />
                                {getFieldError('litros') && (
                                    <p className="text-red-500 text-sm mt-1">{getFieldError('litros')}</p>
                                )}
                            </div>

                            <div ref={el => errorRefs.current['precio_por_litro'] = el}>
                                <Label
                                    htmlFor="precio_por_litro"
                                    label="Precio por Litro ($)"
                                    required={true}
                                />
                                <InputField
                                    id="precio_por_litro"
                                    type="number"
                                    step="0.01"
                                    placeholder="986"
                                    value={formData.precio_por_litro}
                                    onChange={(e) => handleInputChange('precio_por_litro', e.target.value)}
                                    icon={<FaDollarSign />}
                                    disabled={isLoading}
                                    className={`${getFieldError('precio_por_litro') ? 'border-red-300 focus:border-red-500' : ''} text-base`}
                                />
                                {getFieldError('precio_por_litro') && (
                                    <p className="text-red-500 text-sm mt-1">{getFieldError('precio_por_litro')}</p>
                                )}
                            </div>
                        </div>

                        {/* Costo Total - Calculado automáticamente */}
                        <div>
                            <Label
                                htmlFor="costo"
                                label="Costo Total (Calculado automáticamente)"
                            />
                            <div className="relative">
                                <InputField
                                    id="costo"
                                    type="text"
                                    value={
                                        formData.costo
                                            ? `${Math.round(parseFloat(formData.costo)).toLocaleString('es-CL')}`
                                            : ''
                                    }
                                    icon={<FaDollarSign />}
                                    disabled={true}
                                    className="bg-gray-100 text-base font-semibold text-gray-700"
                                    placeholder="Se calcula automáticamente"
                                />
                                {formData.costo && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                        Auto
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-600 text-xs mt-1">
                                Fórmula: Litros × Precio por Litro = Costo Total
                            </p>
                        </div>
                    </div>

                    {/* SECCIÓN 3: INFORMACIÓN DEL VEHÍCULO */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaTachometerAlt className="text-orange-500" />
                            4.- Información del Vehículo
                        </h3>

                        <div ref={el => errorRefs.current['medicion'] = el}>
                            <InputKilometrajeSimple
                                label="Kilometraje Actual del Vehículo"
                                name="medicion"
                                type="number"
                                value={formData.medicion}
                                onChange={handleChange}
                                placeholder="125420"
                                icon={<FaTachometerAlt />}
                                ultimoConsumo={datosUltimoConsumo}
                                maquinaSeleccionada={maquinaSeleccionada} // 🆕 AGREGAR ESTO
                                required={true}
                                disabled={isLoading}
                                className="text-base"
                                getFieldError={getFieldError}
                                kilometrajeError={kilometrajeError}
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 4: UBICACIÓN Y OBSERVACIONES */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-green-500" />
                            5.- Ubicación y Detalles
                        </h3>

                        <div ref={el => errorRefs.current['ubicacion'] = el}>
                            <Label
                                htmlFor="ubicacion"
                                label="¿Dónde cargaste combustible?"
                                required={true}
                            />
                            <InputField
                                id="ubicacion"
                                type="text"
                                placeholder="Cabildo Copec, Til til copec, etc."
                                value={formData.ubicacion}
                                onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                                icon={<FaMapMarkerAlt />}
                                disabled={isLoading}
                                className={`${getFieldError('ubicacion') ? 'border-red-300 focus:border-red-500' : ''} text-base`}
                            />
                            {getFieldError('ubicacion') && (
                                <p className="text-red-500 text-sm mt-1">{getFieldError('ubicacion')}</p>
                            )}
                            <p className="text-gray-600 text-xs mt-1">
                                Sé específico: nombre de la estación, ubicación o referencia
                            </p>
                        </div>

                        <div>
                            <Label
                                htmlFor="observaciones"
                                label="Observaciones (Opcional)"
                            />
                            <div className="relative">
                                <textarea
                                    id="observaciones"
                                    placeholder="Ej: Carga de emergencia por falta de combustible, trabajo nocturno, etc."
                                    value={formData.observaciones}
                                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                                    disabled={isLoading}
                                    rows={3}
                                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base resize-none bg-white"
                                />
                                <FaClipboardList className="absolute left-3 top-3 text-gray-400" />
                            </div>
                            <p className="text-gray-600 text-xs mt-1">
                                Agrega cualquier información adicional relevante
                            </p>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            onClick={() => {
                                handleSubmit();
                            }}
                            disabled={isLoading || !maquinaSeleccionada}
                            className="w-full py-4 text-lg font-semibold shadow-lg bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <>
                                    <IoReload className="animate-spin text-lg" />
                                    <span>Registrando carga...</span>
                                </>
                            ) : (
                                <>
                                    <FaSave className="text-lg" />
                                    <span>Registrar Carga Externa</span>
                                </>
                            )}
                        </button>

                        <Button
                            text={
                                <span className="flex items-center justify-center gap-2">
                                    <FaArrowLeft />
                                    <span>Cancelar</span>
                                </span>
                            }
                            color="gray"
                            className="w-full py-3 text-base"
                            onClick={() => navigate('/OperadorVehiculo')}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormularioAsignacionVehiculo;