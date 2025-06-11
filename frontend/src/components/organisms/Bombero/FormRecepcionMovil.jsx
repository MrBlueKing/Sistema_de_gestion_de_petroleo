import React, { useState, useEffect } from "react";
import Button from "../../atoms/Button/Button";
import InputField from "../../atoms/Inputs/InputField";
import { FaTruck, FaGasPump, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

const FormRecepcionMovil = () => {
    const [formData, setFormData] = useState({
        numeroGuia: "",
        litrosDocumentados: "",
        litrosRecibidos: "",
        precio: "",
        precioTotal: "",
        reciboConforme: true,
        observacion: "",
        idEstanqueMovil: "",
        alturaFinal: ""
    });

    const [estanquesMoviles, setEstanquesMoviles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });

    // Cargar estanques móviles disponibles
    useEffect(() => {
        fetchEstanquesMoviles();
    }, []);

    const fetchEstanquesMoviles = async () => {
        try {
            // Aquí harías la llamada a tu API para obtener estanques móviles
            // const response = await fetch('/api/estanques/moviles');
            // const data = await response.json();

            // Mock data por ahora
            setEstanquesMoviles([
                { value: "3", label: "Estanque Móvil 1 (Stock: 50L / Cap: 500L)" },
                { value: "4", label: "Estanque Móvil 2 (Stock: 0L / Cap: 300L)" },
                { value: "5", label: "Camión Cisterna A (Stock: 150L / Cap: 1000L)" }
            ]);
        } catch (error) {
            console.error('Error al cargar estanques móviles:', error);
        }
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlert({ show: true, type: tipo, message: mensaje });
        setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Auto-calcular precio total
        if (field === 'litrosRecibidos' || field === 'precio') {
            const litros = field === 'litrosRecibidos' ? parseFloat(value) || 0 : parseFloat(formData.litrosRecibidos) || 0;
            const precio = field === 'precio' ? parseFloat(value) || 0 : parseFloat(formData.precio) || 0;

            setFormData(prev => ({
                ...prev,
                [field]: value,
                precioTotal: (litros * precio).toFixed(2)
            }));
        }

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

        if (!formData.numeroGuia.trim()) {
            newErrors.numeroGuia = "Número de guía es requerido";
        }

        if (!formData.litrosDocumentados || parseFloat(formData.litrosDocumentados) <= 0) {
            newErrors.litrosDocumentados = "Litros documentados debe ser mayor a 0";
        }

        if (!formData.litrosRecibidos || parseFloat(formData.litrosRecibidos) <= 0) {
            newErrors.litrosRecibidos = "Litros recibidos debe ser mayor a 0";
        }

        if (!formData.precio || parseFloat(formData.precio) <= 0) {
            newErrors.precio = "Precio debe ser mayor a 0";
        }

        if (!formData.idEstanqueMovil) {
            newErrors.idEstanqueMovil = "Debe seleccionar un estanque móvil";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        setTouched({
            numeroGuia: true,
            litrosDocumentados: true,
            litrosRecibidos: true,
            precio: true,
            idEstanqueMovil: true,
        });

        if (!validateForm()) {
            mostrarAlerta("error", "Por favor, complete todos los campos obligatorios correctamente.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                id_usuario: 4, // Obtener del contexto de usuario
                numero_guia: formData.numeroGuia,
                litros_documentados: parseFloat(formData.litrosDocumentados),
                litros_recibidos: parseFloat(formData.litrosRecibidos),
                precio: parseFloat(formData.precio),
                precio_total: parseFloat(formData.precioTotal),
                recibo_conforme: formData.reciboConforme,
                observacion: formData.observacion || null,
                id_faena: 2, // Obtener del contexto de faena
                id_estanque_movil: parseInt(formData.idEstanqueMovil),
                altura_final: formData.alturaFinal ? parseFloat(formData.alturaFinal) : null
            };

            const response = await fetch('/api/recepciones/estanque-movil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Si usas tokens
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                mostrarAlerta('success', '¡Recepción a estanque móvil registrada exitosamente!');
                // Resetear formulario
                setFormData({
                    numeroGuia: "",
                    litrosDocumentados: "",
                    litrosRecibidos: "",
                    precio: "",
                    precioTotal: "",
                    reciboConforme: true,
                    observacion: "",
                    idEstanqueMovil: "",
                    alturaFinal: ""
                });
                setTouched({});
                // Recargar estanques para actualizar stock
                fetchEstanquesMoviles();
            } else {
                mostrarAlerta('error', `Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error al registrar recepción:', error);
            mostrarAlerta('error', 'Error al registrar la recepción. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const diferencia = parseFloat(formData.litrosDocumentados || 0) - parseFloat(formData.litrosRecibidos || 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <main className="flex-1 w-full p-2 sm:p-3  text-center">
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

                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-2">
                        Registro de Recepción a Estanque Móvil
                    </h2>

                    {/* Información del estanque seleccionado */}
                    {formData.idEstanqueMovil && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-blue-500 p-2 rounded-full mr-3">
                                        <FaTruck className="text-white text-sm" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-blue-800">
                                            Estanque Móvil Seleccionado
                                        </h3>
                                        <p className="text-blue-700 text-sm">
                                            {estanquesMoviles.find(e => e.value === formData.idEstanqueMovil)?.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center text-blue-600">
                                    <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                                    <span className="text-sm font-medium">Activo</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Información de la guía */}
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
                                className={`bg-white rounded-md text-gray-800 ${errors.numeroGuia ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.numeroGuia && (
                                <span className="text-red-500 text-xs mt-1">{errors.numeroGuia}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Estanque Móvil *
                            </label>
                            <InputField
                                name="idEstanqueMovil"
                                value={formData.idEstanqueMovil}
                                onChange={(e) => handleChange("idEstanqueMovil", e.target.value)}
                                onBlur={() => handleBlur("idEstanqueMovil")}
                                options={[
                                    { value: "", label: "Seleccionar estanque..." },
                                    ...estanquesMoviles
                                ]}
                                className={`bg-white rounded-md text-gray-800 ${errors.idEstanqueMovil ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.idEstanqueMovil && (
                                <span className="text-red-500 text-xs mt-1">{errors.idEstanqueMovil}</span>
                            )}
                        </div>
                    </div>

                    {/* Información de combustible */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1 flex items-center">
                                Litros Documentados *
                                <span className="text-xs text-gray-500 ml-2">(según guía)</span>
                            </label>
                            <InputField
                                type="number"
                                placeholder="Ingrese litros según guía"
                                value={formData.litrosDocumentados}
                                onChange={(e) => handleChange("litrosDocumentados", e.target.value)}
                                onBlur={() => handleBlur("litrosDocumentados")}
                                className={`bg-white rounded-md text-gray-800 ${errors.litrosDocumentados ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.litrosDocumentados && (
                                <span className="text-red-500 text-xs mt-1">{errors.litrosDocumentados}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Litros Recibidos *
                            </label>
                            <InputField
                                type="number"
                                placeholder="Ingrese litros recibidos"
                                value={formData.litrosRecibidos}
                                onChange={(e) => handleChange("litrosRecibidos", e.target.value)}
                                onBlur={() => handleBlur("litrosRecibidos")}
                                className={`bg-white rounded-md text-gray-800 ${errors.litrosRecibidos ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.litrosRecibidos && (
                                <span className="text-red-500 text-xs mt-1">{errors.litrosRecibidos}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Altura Final (opcional)
                            </label>
                            <InputField
                                type="number"
                                placeholder="Ingrese altura final"
                                value={formData.alturaFinal}
                                onChange={(e) => handleChange("alturaFinal", e.target.value)}
                                className="bg-white rounded-md text-gray-800 border-gray-300"
                            />
                        </div>
                    </div>

                    {/* Mostrar diferencia si existe */}
                    {(formData.litrosDocumentados && formData.litrosRecibidos) && (
                        <div className={`p-3 rounded-lg ${diferencia === 0
                            ? 'bg-green-50 border border-green-200'
                            : Math.abs(diferencia) <= 0.5
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                            <div className="flex items-center space-x-2">
                                {diferencia === 0 ? (
                                    <FaCheckCircle className="text-green-600" />
                                ) : Math.abs(diferencia) <= 0.5 ? (
                                    <FaInfoCircle className="text-blue-600" />
                                ) : (
                                    <FaExclamationTriangle className="text-yellow-600" />
                                )}
                                <span className="text-sm font-medium">
                                    Diferencia: {diferencia.toFixed(2)} L
                                    {diferencia === 0 && <span className="text-green-600 ml-1">(Sin diferencia)</span>}
                                    {Math.abs(diferencia) <= 0.5 && diferencia !== 0 && <span className="text-blue-600 ml-1">(Diferencia normal)</span>}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Información de precio */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Precio del Petróleo (por litro) *
                            </label>
                            <InputField
                                type="number"
                                placeholder="Ingrese precio por litro"
                                value={formData.precio}
                                onChange={(e) => handleChange("precio", e.target.value)}
                                onBlur={() => handleBlur("precio")}
                                className={`bg-white rounded-md text-gray-800 ${errors.precio ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.precio && (
                                <span className="text-red-500 text-xs mt-1">{errors.precio}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Precio Total
                            </label>
                            <InputField
                                type="number"
                                placeholder="Precio calculado automáticamente"
                                value={formData.precioTotal}
                                disabled
                                className="bg-gray-100 text-gray-800 border-gray-300"
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="reciboConforme"
                                    checked={formData.reciboConforme}
                                    onChange={(e) => handleChange("reciboConforme", e.target.checked)}
                                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Recibo Conforme</span>
                            </label>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">
                            Observaciones
                        </label>
                        <InputField
                            placeholder="Observaciones adicionales sobre la recepción..."
                            value={formData.observacion}
                            onChange={(e) => handleChange("observacion", e.target.value)}
                            isTextarea
                            className="bg-white rounded-md text-gray-800 border-gray-300 min-h-[80px]"
                        />
                    </div>

                    {/* Botón de envío */}
                    <div className="text-center pt-4">
                        <Button
                            text={loading ? "Registrando..." : "Registrar Recepción Móvil"}
                            onClick={handleSubmit}
                            disabled={loading}
                            color="orange"
                            className="px-8 py-3 text-lg font-semibold"
                            icon={<FaTruck />}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default FormRecepcionMovil;