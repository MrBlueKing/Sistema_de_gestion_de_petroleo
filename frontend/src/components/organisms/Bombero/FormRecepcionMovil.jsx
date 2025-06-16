import React, { useState, useEffect, useContext } from "react";
import { FaTruck, FaGasPump, FaCheckCircle, FaExclamationTriangle, FaFileAlt, FaStickyNote, FaFileInvoice, FaInfoCircle, FaSpinner } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";
import { getAuthToken } from "../../../utils/session";
import SelectorEstanque from "../../molecules/SelectorEstanque";
import ModalExitoRecepcionMovil from "../../molecules/ModalExitoRecepcionMovil";

const FormRecepcionMovil = () => {
    const { user } = useContext(UserContext);

    const [formData, setFormData] = useState({
        numeroGuia: "",
        numeroFactura: "",
        litrosComprados: "",
        precioLitro: "",
        precioTotal: "",
        observacion: "",
        idEstanqueMovil: ""
    });

    const [estanqueMovilSeleccionado, setEstanqueMovilSeleccionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });
    // ✅ 2. AGREGAR ESTADOS PARA EL MODAL DE ÉXITO
    const [showExitoModal, setShowExitoModal] = useState(false);
    const [datosRecepcionExitosa, setDatosRecepcionExitosa] = useState(null);

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

    // ✅ 3. FUNCIÓN PARA MANEJAR EL CIERRE DEL MODAL
    const handleExitoModalConfirm = () => {
        setShowExitoModal(false);
        setDatosRecepcionExitosa(null);

        // Opcional: Redireccionar o limpiar formulario
        // window.location.href = "/dashboard"; // Si quieres redireccionar
        // O simplemente limpiar el formulario para nueva compra
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlert({ show: true, type: tipo, message: mensaje });
        setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
    };

    const handleChange = (field, value) => {
        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: value
            };

            // Calcular precio total automáticamente
            if (field === 'litrosComprados' || field === 'precioLitro') {
                const litros = field === 'litrosComprados' ? parseFloat(value) || 0 : parseFloat(updated.litrosComprados) || 0;
                const precio = field === 'precioLitro' ? parseFloat(value) || 0 : parseFloat(updated.precioLitro) || 0;
                updated.precioTotal = (litros * precio).toFixed(0);
            }

            return updated;
        });

        // Limpiar errores del campo actual
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

        // Validar número de factura (obligatorio)
        if (!formData.numeroFactura.trim()) {
            newErrors.numeroFactura = "Número de factura/boleta es obligatorio";
        }

        // Validar litros comprados (obligatorio y > 0)
        if (!formData.litrosComprados || parseFloat(formData.litrosComprados) <= 0) {
            newErrors.litrosComprados = "Los litros comprados deben ser mayor a 0";
        }

        // Validar precio por litro (obligatorio y > 0)
        if (!formData.precioLitro || parseFloat(formData.precioLitro) <= 0) {
            newErrors.precioLitro = "El precio por litro debe ser mayor a 0";
        }

        // Validar selección de estanque móvil (obligatorio)
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

    // ✅ 4. HANDLESUBMIT ACTUALIZADO CON MODAL DE ÉXITO
    const handleSubmit = async () => {
        setTouched({
            numeroFactura: true,
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

            // ✅ PAYLOAD CORREGIDO
            const payload = {
                id_usuario: user.id,
                id_faena: user.id_faena,
                numero_guia: formData.numeroGuia?.trim() || formData.numeroFactura.trim(),
                litros_documentados: parseFloat(formData.litrosComprados),
                litros_recibidos: parseFloat(formData.litrosComprados),
                precio: parseFloat(formData.precioLitro),
                precio_total: parseFloat(formData.precioTotal),
                recibo_conforme: true,
                diferencia: 0,
                observacion: formData.observacion?.trim() || null,
                id_estanque_movil: parseInt(formData.idEstanqueMovil)
            };

            console.log('✅ Enviando compra de combustible:', payload);

            const response = await axios.post('/api/recepciones/estanque-movil', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                // ✅ PREPARAR DATOS PARA EL MODAL DE ÉXITO
                const datosParaModal = {
                    numeroFactura: formData.numeroFactura,
                    numeroGuia: formData.numeroGuia || null,
                    litrosComprados: parseFloat(formData.litrosComprados),
                    precioLitro: parseFloat(formData.precioLitro),
                    precioTotal: parseFloat(formData.precioTotal),
                    estanqueNombre: estanqueMovilSeleccionado.nombre,
                    capacidadTotal: estanqueMovilSeleccionado.capacidad,
                    stockAnterior: response.data.data.stock_anterior || 0,
                    stockNuevo: response.data.data.stock_nuevo || 0,
                    observacion: formData.observacion || null
                };

                // ✅ MOSTRAR MODAL DE ÉXITO EN LUGAR DE ALERTA SIMPLE
                setDatosRecepcionExitosa(datosParaModal);
                setShowExitoModal(true);

                // ✅ RESETEAR FORMULARIO
                setFormData({
                    numeroGuia: "",
                    numeroFactura: "",
                    litrosComprados: "",
                    precioLitro: "",
                    precioTotal: "",
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
            console.log('📋 Detalles del error:', error.response?.data);

            let mensaje = 'Error de conexión. Intente nuevamente.';
            if (error.response?.data?.message) {
                mensaje = error.response.data.message;
            } else if (error.response?.data?.errors) {
                const errores = Object.values(error.response.data.errors).flat();
                mensaje = errores.join(', ');
            }

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
                                    <span className="text-xs text-gray-500 ml-1">(según Factura)</span>
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

                    {/* Resumen final antes de enviar - VERSIÓN MEJORADA */}
                    {formData.litrosComprados && formData.precioTotal && estanqueMovilSeleccionado && (
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 shadow-sm">
                            <h4 className="font-semibold text-green-800 mb-4 flex items-center text-lg">
                                <FaCheckCircle className="mr-2 text-green-600" />
                                Resumen de la Compra de Combustible
                            </h4>

                            {/* Información principal en cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* Card: Datos de la compra */}
                                <div className="bg-white rounded-lg p-4 border border-gray-100">
                                    <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                                        <FaFileInvoice className="mr-2 text-blue-500" />
                                        Datos de la Compra
                                    </h5>
                                    <div className="space-y-2 text-sm">
                                        {formData.numeroGuia && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">N° Guía:</span>
                                                <span className="font-medium text-gray-800">{formData.numeroGuia}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">N° Factura/Boleta:</span>
                                            <span className="font-medium text-gray-800">{formData.numeroFactura}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Cantidad:</span>
                                            <span className="font-bold text-blue-600">{parseFloat(formData.litrosComprados).toLocaleString()} Litros</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Precio unitario:</span>
                                            <span className="font-medium text-gray-800">${parseFloat(formData.precioLitro).toLocaleString('es-CL')}/L</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                            <span className="text-gray-700 font-medium">Total pagado:</span>
                                            <span className="font-bold text-green-600 text-lg">${parseInt(formData.precioTotal).toLocaleString('es-CL')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card: Información del estanque */}
                                <div className="bg-white rounded-lg p-4 border border-gray-100">
                                    <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                                        <FaTruck className="mr-2 text-orange-500" />
                                        Estanque Destino
                                    </h5>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-gray-600 block">Nombre del estanque:</span>
                                            <span className="font-medium text-gray-800">{estanqueMovilSeleccionado.nombre}</span>
                                        </div>

                                        <div>
                                            <span className="text-gray-600 block">Capacidad total:</span>
                                            <span className="font-medium text-gray-800">{estanqueMovilSeleccionado.capacidad.toLocaleString()} L</span>
                                        </div>

                                        <div>
                                            <span className="text-gray-600 block">Stock actual:</span>
                                            <span className="font-medium text-gray-800">{estanqueMovilSeleccionado.stock_actual.toLocaleString()} L</span>
                                        </div>

                                        <div>
                                            <span className="text-gray-600 block">Disponible:</span>
                                            <span className={`font-bold ${(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual) >= parseFloat(formData.litrosComprados)
                                                ? "text-green-600" : "text-red-600"
                                                }`}>
                                                {(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual).toLocaleString()} L
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Validación de capacidad destacada */}
                            <div className={`p-4 rounded-lg border-2 ${(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual) >= parseFloat(formData.litrosComprados)
                                ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual) >= parseFloat(formData.litrosComprados) ? (
                                            <FaCheckCircle className="text-green-600 mr-2" />
                                        ) : (
                                            <FaExclamationTriangle className="text-red-600 mr-2" />
                                        )}
                                        <span className={`font-medium ${(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual) >= parseFloat(formData.litrosComprados)
                                            ? "text-green-800" : "text-red-800"
                                            }`}>
                                            Estado de la operación:
                                        </span>
                                    </div>
                                    <span className={`font-bold ${(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual) >= parseFloat(formData.litrosComprados)
                                        ? "text-green-600" : "text-red-600"
                                        }`}>
                                        {(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual) >= parseFloat(formData.litrosComprados)
                                            ? "✅ Operación viable" : "⚠️ Capacidad insuficiente"}
                                    </span>
                                </div>

                                {/* Cálculo detallado */}
                                <div className="mt-2 text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Stock después de la compra:</span>
                                        <span className="font-medium">
                                            {(estanqueMovilSeleccionado.stock_actual + parseFloat(formData.litrosComprados)).toLocaleString()} L
                                            <span className="text-gray-500 ml-1">
                                                ({((estanqueMovilSeleccionado.stock_actual + parseFloat(formData.litrosComprados)) / estanqueMovilSeleccionado.capacidad * 100).toFixed(1)}%)
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Capacidad restante:</span>
                                        <span className="font-medium">
                                            {(estanqueMovilSeleccionado.capacidad - estanqueMovilSeleccionado.stock_actual - parseFloat(formData.litrosComprados)).toLocaleString()} L
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Observaciones si las hay */}
                            {formData.observacion && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h6 className="font-medium text-yellow-800 mb-1 flex items-center">
                                        <FaStickyNote className="mr-2" />
                                        Observaciones:
                                    </h6>
                                    <p className="text-yellow-700 text-sm">{formData.observacion}</p>
                                </div>
                            )}

                            {/* Mensaje de confirmación */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-800 text-sm flex items-center">
                                    <FaInfoCircle className="mr-2" />
                                    Verifique que todos los datos sean correctos antes de registrar la compra.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Botón de envío */}
                    <div className="text-center pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !user?.id || !user?.id_faena}
                            className={`px-8 py-3 text-lg font-semibold rounded-lg text-white flex items-center justify-center mx-auto space-x-2 transition-all ${loading || !user?.id || !user?.id_faena
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
                    </div>

                    {/* Información adicional */}
                    <div className="text-xs text-gray-500 text-center space-y-1">
                        <p>Los campos marcados con * son obligatorios</p>
                        <p>💡 El precio total se calcula automáticamente: Litros × Precio por Litro</p>
                    </div>
                </div>
            </div>
            {/* ✅ MODAL DE ÉXITO */}
            {datosRecepcionExitosa && (
                <ModalExitoRecepcionMovil
                    isOpen={showExitoModal}
                    onConfirm={handleExitoModalConfirm}
                    datosRecepcion={datosRecepcionExitosa}
                />
            )}  
        </main>
    );
};

export default FormRecepcionMovil;