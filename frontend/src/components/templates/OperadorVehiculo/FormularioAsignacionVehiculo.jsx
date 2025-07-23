import React, { useState, useRef, useEffect } from "react";
import { FaGasPump, FaTruck, FaFileInvoiceDollar, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaClipboardList, FaSave, FaArrowLeft } from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import Label from "../../atoms/Typography/Label";
import Alert from "../../atoms/FeedBack/Alert";
import { useOperadorData } from "../../../hook/OperadorVehiculo/useOperadorData";
import axios from "../../../lib/axios";

const FormularioAsignacionVehiculo = () => {
    const navigate = useNavigate();
    const { loading: loadingOperador, usuario, maquinaAsignada } = useOperadorData();

    // Estados del formulario
    const [formData, setFormData] = useState({
        numero_boleta: "",
        litros: "",
        costo: "",
        precio_por_litro: "",
        fecha_carga: "",
        ubicacion: "",
        tipo_combustible: "Diesel",
        observaciones: ""
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [focusedFields, setFocusedFields] = useState({});
    const alertRef = useRef(null);

    // Auto-desvanecer mensajes
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (error && alertRef.current) {
            const offset = 100;
            const top = alertRef.current.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: "smooth" });
            const timer = setTimeout(() => setError(null), 8000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Calcular precio por litro automáticamente
    useEffect(() => {
        if (formData.costo && formData.litros && parseFloat(formData.litros) > 0) {
            const precioCalculado = (parseFloat(formData.costo) / parseFloat(formData.litros)).toFixed(2);
            setFormData(prev => ({
                ...prev,
                precio_por_litro: precioCalculado
            }));
        }
    }, [formData.costo, formData.litros]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.numero_boleta.trim()) {
            errors.numero_boleta = "El número de boleta es obligatorio";
        }

        if (!formData.litros || parseFloat(formData.litros) <= 0) {
            errors.litros = "Los litros deben ser mayor a 0";
        }

        if (!formData.costo || parseFloat(formData.costo) <= 0) {
            errors.costo = "El costo debe ser mayor a 0";
        }

        if (!formData.fecha_carga) {
            errors.fecha_carga = "La fecha de carga es obligatoria";
        } else {
            const fechaCarga = new Date(formData.fecha_carga);
            const hoy = new Date();
            if (fechaCarga > hoy) {
                errors.fecha_carga = "La fecha no puede ser futura";
            }
        }

        if (!formData.ubicacion.trim()) {
            errors.ubicacion = "La ubicación es obligatoria";
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage("");

        // Validar que tenga vehículo asignado
        if (!maquinaAsignada) {
            setError({ global: "No tienes un vehículo asignado. Contacta al administrador." });
            setIsLoading(false);
            return;
        }

        // Validar formulario
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setError(validationErrors);
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                id_user: usuario.id,
                id_maquina: maquinaAsignada.id_maquina,
                litros: parseFloat(formData.litros),
                costo: parseFloat(formData.costo),
                precio_por_litro: parseFloat(formData.precio_por_litro)
            };

            const response = await axios.post("/api/chofer/cargas-externas", payload);

            if (response.data.status === 'success') {
                setSuccessMessage("Carga externa registrada exitosamente. Será revisada por el encargado.");

                // Limpiar formulario
                setFormData({
                    numero_boleta: "",
                    litros: "",
                    costo: "",
                    precio_por_litro: "",
                    fecha_carga: "",
                    ubicacion: "",
                    tipo_combustible: "Diesel",
                    observaciones: ""
                });

                // Redirigir después de un momento
                setTimeout(() => {
                    navigate('/OperadorVehiculo');
                }, 2000);
            }
        } catch (err) {
            console.error('Error al registrar carga:', err);

            if (err.response?.data?.errors) {
                setError(err.response.data.errors);
            } else if (err.response?.data?.message) {
                setError({ global: err.response.data.message });
            } else {
                setError({ global: "Error al registrar la carga. Intenta nuevamente." });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getFieldError = (fieldId) => {
        if (!error || typeof error !== 'object') return null;
        return error[fieldId];
    };

    if (loadingOperador) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 text-base sm:text-lg font-medium">Cargando datos del vehículo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <UniversalHeader type="operador" />

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
                {/* Header del formulario - Mobile Optimized */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                <div className="bg-orange bg-opacity-20 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                                    <FaGasPump className="text-white text-sm sm:text-xl" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-white text-base sm:text-xl lg:text-2xl font-bold leading-tight">Registro de Carga Externa</h1>
                                    <p className="text-orange-100 text-xs sm:text-sm mt-0.5 sm:mt-0 leading-tight">Factura electrónica por compra fuera de faena</p>
                                </div>
                            </div>
                            <Button
                                text={<FaArrowLeft className="text-sm sm:text-base" />}
                                color="white"
                                className="text-orange-600 hover:bg-orange-50 p-1.5 sm:p-2 min-w-0 flex-shrink-0"
                                onClick={() => navigate('/OperadorVehiculo')}
                            />
                        </div>
                    </div>

                    {/* Info del vehículo - Mobile Optimized */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-orange-50 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                                <FaTruck className="text-orange-600 text-base sm:text-lg flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                        {maquinaAsignada?.maquina?.maquina_interna?.nombre || 'Vehículo no identificado'}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Patente: {maquinaAsignada?.maquina?.maquina_interna?.patente || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                                <p className="text-xs sm:text-sm text-gray-600">Operador:</p>
                                <p className="font-semibold text-gray-800 text-sm sm:text-base">{usuario?.nombreCompleto || usuario?.nombre}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alertas */}
                <div ref={alertRef} className="mb-4 sm:mb-6">
                    {error && error.global && (
                        <Alert type="error" message={error.global} />
                    )}
                    {successMessage && (
                        <Alert type="success" message={successMessage} />
                    )}
                </div>

                {/* Formulario - Mobile Optimized */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {/* Grid responsivo - 1 columna en móvil, 2 en desktop */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                            {/* Número de Boleta */}
                            <div className="lg:col-span-1">
                                <Label
                                    htmlFor="numero_boleta"
                                    label="Número de Boleta/Factura"
                                    required={true}
                                    tooltip="Número de la boleta o factura electrónica"
                                />
                                <InputField
                                    id="numero_boleta"
                                    type="text"
                                    placeholder="Ej: 001-023-456789"
                                    value={formData.numero_boleta}
                                    onChange={(e) => handleInputChange('numero_boleta', e.target.value)}
                                    icon={<FaFileInvoiceDollar />}
                                    disabled={isLoading}
                                    className={getFieldError('numero_boleta') ? 'border-red-500' : ''}
                                />
                                {getFieldError('numero_boleta') && (
                                    <div className="text-red-500 text-xs sm:text-sm mt-1">{getFieldError('numero_boleta')}</div>
                                )}
                            </div>

                            {/* Fecha de Carga */}
                            <div className="lg:col-span-1">
                                <Label
                                    htmlFor="fecha_carga"
                                    label="Fecha y Hora de Carga"
                                    required={true}
                                    tooltip="Fecha y hora exacta de la carga de combustible"
                                />
                                <InputField
                                    id="fecha_carga"
                                    type="datetime-local"
                                    value={formData.fecha_carga}
                                    onChange={(e) => handleInputChange('fecha_carga', e.target.value)}
                                    disabled={isLoading}
                                    className={getFieldError('fecha_carga') ? 'border-red-500' : ''}
                                />
                                {getFieldError('fecha_carga') && (
                                    <div className="text-red-500 text-xs sm:text-sm mt-1">{getFieldError('fecha_carga')}</div>
                                )}
                            </div>

                            {/* Litros */}
                            <div className="lg:col-span-1">
                                <Label
                                    htmlFor="litros"
                                    label="Litros Cargados"
                                    required={true}
                                    tooltip="Cantidad de litros de combustible cargados"
                                />
                                <InputField
                                    id="litros"
                                    type="number"
                                    placeholder="Ej: 45.5"
                                    value={formData.litros}
                                    onChange={(e) => handleInputChange('litros', e.target.value)}
                                    icon={<FaGasPump />}
                                    disabled={isLoading}
                                    min="0.01"
                                    step="any" // ✅ Permite decimales de 1 cifra
                                    className={getFieldError('litros') ? 'border-red-500' : ''}
                                />
                                {getFieldError('litros') && (
                                    <div className="text-red-500 text-xs sm:text-sm mt-1">{getFieldError('litros')}</div>
                                )}
                            </div>

                            {/* Costo Total */}
                            <div className="lg:col-span-1">
                                <Label
                                    htmlFor="costo"
                                    label="Costo Total ($)"
                                    required={true}
                                    tooltip="Monto total pagado por el combustible"
                                />
                                <InputField
                                    id="costo"
                                    type="number"
                                    placeholder="Ej: 35000"
                                    value={formData.costo}
                                    onChange={(e) => handleInputChange('costo', e.target.value)}
                                    icon={<FaDollarSign />}
                                    disabled={isLoading}
                                    min="0.01"
                                    step="any" // ✅ Permite decimales de 2 cifras
                                    className={getFieldError('costo') ? 'border-red-500' : ''}
                                />
                                {getFieldError('costo') && (
                                    <div className="text-red-500 text-xs sm:text-sm mt-1">{getFieldError('costo')}</div>
                                )}
                            </div>

                            {/* Precio por Litro (Calculado automáticamente) */}
                            <div className="lg:col-span-1">
                                <Label
                                    htmlFor="precio_por_litro"
                                    label="Precio por Litro ($)"
                                    tooltip="Se calcula automáticamente: Costo Total ÷ Litros"
                                />
                                <InputField
                                    id="precio_por_litro"
                                    type="number"
                                    value={formData.precio_por_litro}
                                    icon={<FaDollarSign />}
                                    disabled={true}
                                    step="any" // ✅ Para mostrar correctamente el precio calculado
                                    className="bg-gray-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente</p>
                            </div>

                            {/* Tipo de Combustible */}
                            <div className="lg:col-span-1">
                                <Label
                                    htmlFor="tipo_combustible"
                                    label="Tipo de Combustible"
                                    required={true}
                                />
                                <InputField
                                    id="tipo_combustible"
                                    type="text"
                                    value={formData.tipo_combustible}
                                    onChange={(e) => handleInputChange('tipo_combustible', e.target.value)}
                                    options={[
                                        { label: "Diesel", value: "Diesel" },
                                        { label: "Gasolina 93", value: "Gasolina 93" },
                                        { label: "Gasolina 95", value: "Gasolina 95" },
                                        { label: "Gasolina 97", value: "Gasolina 97" }
                                    ]}
                                    icon={<FaGasPump />}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Ubicación - Campo completo en ambas vistas */}
                        <div>
                            <Label
                                htmlFor="ubicacion"
                                label="Ubicación de la Carga"
                                required={true}
                                tooltip="Nombre de la estación de servicio o lugar donde se realizó la carga"
                            />
                            <InputField
                                id="ubicacion"
                                type="text"
                                placeholder="Ej: Estación Shell Los Andes, Copec Valparaíso Centro"
                                value={formData.ubicacion}
                                onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                                icon={<FaMapMarkerAlt />}
                                disabled={isLoading}
                                className={getFieldError('ubicacion') ? 'border-red-500' : ''}
                            />
                            {getFieldError('ubicacion') && (
                                <div className="text-red-500 text-xs sm:text-sm mt-1">{getFieldError('ubicacion')}</div>
                            )}
                        </div>

                        {/* Observaciones - Campo completo */}
                        <div>
                            <Label
                                htmlFor="observaciones"
                                label="Observaciones"
                                tooltip="Información adicional sobre la carga (opcional)"
                            />
                            <InputField
                                id="observaciones"
                                isTextarea={true}
                                placeholder="Información adicional sobre la carga, motivo de compra externa, etc."
                                value={formData.observaciones}
                                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                                disabled={isLoading}
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.observaciones.length}/500 caracteres
                            </p>
                        </div>

                        {/* Botones - Mobile Optimized */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-4 sm:pt-6 border-t">
                            <Button
                                text={
                                    isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <IoReload className="animate-spin" />
                                            <span className="hidden sm:inline">Registrando...</span>
                                            <span className="sm:hidden">Guardando...</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <FaSave />
                                            <span className="hidden sm:inline">Registrar Carga Externa</span>
                                            <span className="sm:hidden">Registrar Carga</span>
                                        </span>
                                    )
                                }
                                type="submit"
                                color="orange"
                                className="flex-1 py-3 text-sm sm:text-base"
                                disabled={isLoading || !maquinaAsignada}
                            />
                            <Button
                                text="Cancelar"
                                color="gray"
                                className="flex-1 py-3 text-sm sm:text-base order-first sm:order-last"
                                onClick={() => navigate('/OperadorVehiculo')}
                                disabled={isLoading}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer informativo - Mobile Optimized */}
                <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="bg-blue-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-800 text-xs sm:text-sm">Información importante</h3>
                            <p className="text-blue-700 text-xs sm:text-sm mt-1 leading-relaxed">
                                Esta carga será enviada para revisión y aprobación. Asegúrate de tener la boleta física
                                disponible para verificación posterior.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormularioAsignacionVehiculo;