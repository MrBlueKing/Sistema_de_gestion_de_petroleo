import React, { useState, useEffect, useContext } from "react";
import { FaTruck, FaGasPump, FaCheckCircle, FaExclamationTriangle, FaFileAlt, FaInfoCircle, FaSpinner } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";
import { getAuthToken } from "../../../utils/session";
import SelectorEstanque from "../../molecules/SelectorEstanque";

const FormRecepcionMovil = () => {
    const { user } = useContext(UserContext);

    const [formData, setFormData] = useState({
        numeroGuia: "",
        numeroFactura: "",
        nombreEstacion: "",
        litrosComprados: "",
        precioLitro: "",
        precioTotal: "",
        tipoCombustible: "Diesel",
        reciboConforme: true,
        observacion: "",
        idEstanqueMovil: ""
    });

    const [estanqueMovilSeleccionado, setEstanqueMovilSeleccionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });

    const tiposCombustible = [
        { value: "Diesel", label: "Diesel" },
        { value: "Petróleo", label: "Petróleo" },
        { value: "Gasolina 93", label: "Gasolina 93" },
        { value: "Gasolina 95", label: "Gasolina 95" },
        { value: "Gasolina 97", label: "Gasolina 97" }
    ];

    const handleEstanqueMovilSelect = (estanque) => {
        setEstanqueMovilSeleccionado(estanque);
        if (estanque) {
            setFormData(prev => ({
                ...prev,
                idEstanqueMovil: estanque.id_estanque.toString()
            }));
            // Limpiar error si había uno
            if (errors.idEstanqueMovil) {
                setErrors(prev => ({ ...prev, idEstanqueMovil: "" }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                idEstanqueMovil: ""
            }));
        }
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlert({ show: true, type: tipo, message: mensaje });
        setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
    };

    const handleChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Auto-calcular precio total cuando cambian litros comprados o precio por litro
            if (field === 'litrosComprados' || field === 'precioLitro') {
                const litros = field === 'litrosComprados' ? parseFloat(value) || 0 : parseFloat(updated.litrosComprados) || 0;
                const precio = field === 'precioLitro' ? parseFloat(value) || 0 : parseFloat(updated.precioLitro) || 0;
                updated.precioTotal = (litros * precio).toFixed(0); // Sin decimales como boletas reales
            }

            return updated;
        });

        // Limpiar errores
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.numeroFactura.trim()) {
            newErrors.numeroFactura = "Número de factura/boleta es obligatorio";
        }

        if (!formData.nombreEstacion.trim()) {
            newErrors.nombreEstacion = "Nombre de la estación de servicio es obligatorio";
        }

        if (!formData.litrosComprados || parseFloat(formData.litrosComprados) <= 0) {
            newErrors.litrosComprados = "Los litros comprados deben ser mayor a 0";
        }

        if (!formData.precioLitro || parseFloat(formData.precioLitro) <= 0) {
            newErrors.precioLitro = "El precio por litro debe ser mayor a 0";
        }

        if (!formData.idEstanqueMovil) {
            newErrors.idEstanqueMovil = "Debe seleccionar un estanque móvil donde depositar el combustible";
        }

        // Validar capacidad del estanque
        if (estanqueMovilSeleccionado && formData.litrosComprados) {
            const litrosComprados = parseFloat(formData.litrosComprados);
            const capacidadDisponible = estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual;

            if (litrosComprados > capacidadDisponible) {
                newErrors.litrosComprados = `El estanque seleccionado solo tiene ${capacidadDisponible}L de capacidad disponible`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        setTouched({
            numeroFactura: true,
            nombreEstacion: true,
            litrosComprados: true,
            precioLitro: true,
            idEstanqueMovil: true,
        });

        if (!validateForm()) {
            mostrarAlerta("error", "Por favor, complete todos los campos obligatorios correctamente.");
            return;
        }

        if (!user?.id || !user?.id_faena) {
            mostrarAlerta("error", "Error: No se pudo identificar el usuario o la faena.");
            return;
        }

        setLoading(true);

        try {
            const token = getAuthToken();
            if (!token) {
                mostrarAlerta('error', 'No hay sesión activa. Inicie sesión nuevamente.');
                return;
            }

            const payload = {
                id_usuario: user.id,
                id_faena: user.id_faena,
                numero_guia: formData.numeroGuia?.trim() || null,
                numero_factura: formData.numeroFactura.trim(),
                nombre_estacion: formData.nombreEstacion.trim(),
                litros_comprados: parseFloat(formData.litrosComprados),
                precio_litro: parseFloat(formData.precioLitro),
                precio_total: parseFloat(formData.precioTotal),
                tipo_combustible: formData.tipoCombustible,
                recibo_conforme: formData.reciboConforme,
                observacion: formData.observacion?.trim() || null,
                id_estanque_movil: parseInt(formData.idEstanqueMovil)
            };

            console.log('Enviando compra de combustible:', payload);

            const response = await axios.post('/api/recepciones/estanque-movil', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                mostrarAlerta('success', '¡Compra de combustible registrada exitosamente!');

                // Resetear formulario
                setFormData({
                    numeroGuia: "",
                    numeroFactura: "",
                    nombreEstacion: "",
                    litrosComprados: "",
                    precioLitro: "",
                    precioTotal: "",
                    tipoCombustible: "Diesel",
                    reciboConforme: true,
                    observacion: "",
                    idEstanqueMovil: ""
                });
                setEstanqueMovilSeleccionado(null);
                setTouched({});
                setErrors({});

            } else {
                mostrarAlerta('error', `Error: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error al registrar compra:', error);
            const mensaje = error.response?.data?.message || 'Error de conexión. Intente nuevamente.';
            mostrarAlerta('error', mensaje);
        } finally {
            setLoading(false);
        }
    };

    // Loading inicial del usuario
    if (!user) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-orange-500 mb-2" />
                    <p className="text-gray-600">Cargando datos del usuario...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 w-full p-2 sm:p-3 text-center">
            <div className="bg-orange-500 p-4 rounded-3xl w-full">
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
                            {alert.type === "error" && <FaExclamationTriangle className="mr-2" />}
                            {alert.type === "info" && <FaInfoCircle className="mr-2" />}
                            {alert.type === "success" && <FaCheckCircle className="mr-2" />}
                            {alert.message}
                        </div>
                    )}

                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">
                        Registro de Compra de Combustible para Estanque Móvil
                    </h2>

                    {/* SECCIÓN 1: DATOS DE LA COMPRA */}
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
                                <input
                                    type="text"
                                    placeholder="Ej: 123456789"
                                    value={formData.numeroFactura}
                                    onChange={(e) => handleChange("numeroFactura", e.target.value)}
                                    onBlur={() => handleBlur("numeroFactura")}
                                    className={`w-full px-3 py-2 border rounded-md bg-white text-gray-800 ${errors.numeroFactura ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.numeroFactura && (
                                    <span className="text-red-500 text-xs mt-1">{errors.numeroFactura}</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-600 mb-1">
                                    Cantidad de Litros *
                                    <span className="text-xs text-gray-500 ml-1">(según boleta)</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ej: 500.00"
                                    value={formData.litrosComprados}
                                    onChange={(e) => handleChange("litrosComprados", e.target.value)}
                                    onBlur={() => handleBlur("litrosComprados")}
                                    className={`w-full px-3 py-2 border rounded-md bg-white text-gray-800 ${errors.litrosComprados ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.litrosComprados && (
                                    <span className="text-red-500 text-xs mt-1">{errors.litrosComprados}</span>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-600 mb-1">
                                    Precio Unitario *
                                    <span className="text-xs text-gray-500 ml-1">($/litro)</span>
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="Ej: 850"
                                    value={formData.precioLitro}
                                    onChange={(e) => handleChange("precioLitro", e.target.value)}
                                    onBlur={() => handleBlur("precioLitro")}
                                    className={`w-full px-3 py-2 border rounded-md bg-white text-gray-800 ${errors.precioLitro ? "border-red-500" : "border-gray-300"
                                        }`}
                                />
                                {errors.precioLitro && (
                                    <span className="text-red-500 text-xs mt-1">{errors.precioLitro}</span>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-600 mb-1">
                                    Precio Total
                                    <span className="text-xs text-gray-500 ml-1">(se calcula automáticamente)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.precioTotal ? `$${parseInt(formData.precioTotal).toLocaleString('es-CL')}` : ""}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-green-700 font-bold text-lg"
                                    placeholder="$0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: ESTANQUE DESTINO */}
                    <div className="text-left space-y-4">
                        <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
                            <FaTruck className="mr-2 text-blue-600" />
                            2. Seleccione el Estanque Móvil de Destino
                        </h3>

                        <div className="pl-4">
                            <p className="text-sm text-gray-600 mb-3">
                                Seleccione el estanque móvil donde se depositará el combustible comprado:
                            </p>

                            <SelectorEstanque
                                idFaena={user.id_faena}
                                tipoEstanque="movil"
                                onEstanqueSelect={handleEstanqueMovilSelect}
                                estanqueSeleccionado={estanqueMovilSeleccionado}
                                litrosRequeridos={parseFloat(formData.litrosComprados) || 0}
                                disabled={loading}
                                selectorId="estanque-movil-recepcion"
                                showTitle={false}
                            />

                            {errors.idEstanqueMovil && (
                                <span className="text-red-500 text-xs mt-2 block">{errors.idEstanqueMovil}</span>
                            )}
                        </div>
                    </div>

                    {/* Información del estanque seleccionado */}
                    {estanqueMovilSeleccionado && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-blue-500 p-2 rounded-full mr-3">
                                        <FaTruck className="text-white text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-blue-800">
                                            ✅ {estanqueMovilSeleccionado.nombre}
                                        </h4>
                                        <p className="text-blue-700 text-sm">
                                            Estanque seleccionado para recibir el combustible
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-700 text-sm">Capacidad disponible</p>
                                    <p className="text-blue-900 font-bold text-lg">
                                        {(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual).toLocaleString()} L
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN 4: CONFIRMACIÓN Y OBSERVACIONES */}
                    <div className="text-left space-y-4">
                        <h3 className="text-lg font-medium text-gray-700 flex items-center border-b pb-2">
                            <FaCheckCircle className="mr-2 text-purple-600" />
                            3. Confirmación y Observaciones
                        </h3>

                        <div className="pl-4 space-y-4">
                            {/* Observaciones */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-600 mb-1">
                                    Observaciones (Opcional)
                                    <span className="text-xs text-gray-500 ml-1">(comentarios adicionales)</span>
                                </label>
                                <textarea
                                    placeholder="Ej: Compra realizada sin inconvenientes..."
                                    value={formData.observacion}
                                    onChange={(e) => handleChange("observacion", e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resumen final antes de enviar */}
                    {formData.litrosComprados && formData.precioTotal && estanqueMovilSeleccionado && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-green-800 mb-3 flex items-center">
                                <FaCheckCircle className="mr-2" />
                                Resumen de la Compra
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-green-600 font-medium">Estación:</span>
                                    <p className="text-green-800">{formData.nombreEstacion || "Por completar"}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 font-medium">Combustible:</span>
                                    <p className="text-green-800">{formData.tipoCombustible} - {formData.litrosComprados}L</p>
                                </div>
                                <div>
                                    <span className="text-green-600 font-medium">Total pagado:</span>
                                    <p className="text-green-800 font-bold">${parseInt(formData.precioTotal).toLocaleString('es-CL')}</p>
                                </div>
                                <div>
                                    <span className="text-green-600 font-medium">Destino:</span>
                                    <p className="text-green-800">{estanqueMovilSeleccionado.nombre}</p>
                                </div>
                            </div>

                            {/* Información de capacidad */}
                            <div className="mt-3 pt-3 border-t border-green-300">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-green-600">Capacidad disponible en destino:</span>
                                    <span className={`font-bold ${(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual) >= parseFloat(formData.litrosComprados)
                                        ? "text-green-700" : "text-red-600"
                                        }`}>
                                        {(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual).toLocaleString()} L
                                        {(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual) >= parseFloat(formData.litrosComprados)
                                            ? " ✅ Suficiente" : " ⚠️ Insuficiente"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botón de envío */}
                    <div className="text-center pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !user?.id || !user?.id_faena || !formData.reciboConforme}
                            className={`px-8 py-3 text-lg font-semibold rounded-lg text-white flex items-center justify-center mx-auto space-x-2 transition-all ${loading || !user?.id || !user?.id_faena || !formData.reciboConforme
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 transform hover:scale-105'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    <span>Registrando Compra...</span>
                                </>
                            ) : (
                                <>
                                    <FaTruck />
                                    <span>Registrar Compra de Combustible</span>
                                </>
                            )}
                        </button>

                        {(!user?.id || !user?.id_faena) && (
                            <p className="text-red-500 text-xs mt-2">
                                ⚠️ Error: No se puede identificar el usuario o la faena
                            </p>
                        )}

                        {!formData.reciboConforme && (
                            <p className="text-amber-600 text-xs mt-2">
                                ⚠️ Debe confirmar que los datos son correctos para continuar
                            </p>
                        )}
                    </div>

                    {/* Información adicional */}
                    <div className="text-xs text-gray-500 text-center space-y-1">
                        <p>Los campos marcados con * son obligatorios</p>
                        <p>💡 El precio total se calcula automáticamente: Litros × Precio por Litro</p>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default FormRecepcionMovil;