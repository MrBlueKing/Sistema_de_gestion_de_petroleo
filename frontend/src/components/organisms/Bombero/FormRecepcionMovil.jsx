import React, { useState, useEffect, useContext } from "react";
import { FaTruck, FaGasPump, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaSpinner } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";
import { getAuthToken } from "../../../utils/session";

const FormRecepcionMovil = () => {
    const { user } = useContext(UserContext);
    
    const [formData, setFormData] = useState({
        numeroGuia: "",
        litrosDocumentados: "",
        litrosRecibidos: "",
        precio: "",
        precioTotal: "",
        reciboConforme: true,
        observacion: "",
        idEstanqueMovil: "",
        diferencia: 0
    });

    const [estanquesMoviles, setEstanquesMoviles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });

    // Cargar estanques móviles disponibles
    useEffect(() => {
        if (user?.id_faena) {
            fetchEstanquesMoviles();
        }
    }, [user]);

    const fetchEstanquesMoviles = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                mostrarAlerta('error', 'No hay sesión activa');
                return;
            }

            const response = await axios.get(`/api/estanques-moviles/${user.id_faena}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const estanquesFormatted = response.data.data.map(estanque => ({
                    value: estanque.id_estanque.toString(),
                    label: `${estanque.nombre} (Stock: ${estanque.stock_actual}L / Cap: ${estanque.capacidad}L)`,
                    capacidad: estanque.capacidad,
                    stock_actual: estanque.stock_actual
                }));
                setEstanquesMoviles(estanquesFormatted);
            } else {
                mostrarAlerta('error', `Error al cargar estanques móviles: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error al cargar estanques móviles:', error);
            mostrarAlerta('error', 'Error al cargar estanques móviles. Verifique su conexión.');
        }
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlert({ show: true, type: tipo, message: mensaje });
        setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
    };

    const handleChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Auto-calcular precio total cuando cambian litros recibidos o precio
            if (field === 'litrosRecibidos' || field === 'precio') {
                const litros = field === 'litrosRecibidos' ? parseFloat(value) || 0 : parseFloat(updated.litrosRecibidos) || 0;
                const precio = field === 'precio' ? parseFloat(value) || 0 : parseFloat(updated.precio) || 0;
                updated.precioTotal = (litros * precio).toFixed(2);
            }

            // Auto-calcular diferencia cuando cambian litros documentados o recibidos
            if (field === 'litrosDocumentados' || field === 'litrosRecibidos') {
                const documentados = field === 'litrosDocumentados' ? parseFloat(value) || 0 : parseFloat(updated.litrosDocumentados) || 0;
                const recibidos = field === 'litrosRecibidos' ? parseFloat(value) || 0 : parseFloat(updated.litrosRecibidos) || 0;
                updated.diferencia = recibidos - documentados; // Diferencia = recibidos - documentados
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

        // Validar capacidad del estanque
        if (formData.idEstanqueMovil && formData.litrosRecibidos) {
            const estanque = estanquesMoviles.find(e => e.value === formData.idEstanqueMovil);
            if (estanque) {
                const nuevoStock = estanque.stock_actual + parseFloat(formData.litrosRecibidos);
                if (nuevoStock > estanque.capacidad) {
                    newErrors.litrosRecibidos = `Excede la capacidad del estanque. Capacidad disponible: ${estanque.capacidad - estanque.stock_actual}L`;
                }
            }
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
                numero_guia: formData.numeroGuia,
                litros_documentados: parseFloat(formData.litrosDocumentados),
                litros_recibidos: parseFloat(formData.litrosRecibidos),
                precio: parseFloat(formData.precio),
                precio_total: parseFloat(formData.precioTotal),
                recibo_conforme: formData.reciboConforme,
                observacion: formData.observacion || null,
                id_estanque_movil: parseInt(formData.idEstanqueMovil),
                diferencia: parseFloat(formData.diferencia)
            };

            console.log('Enviando payload:', payload);

            const response = await axios.post('/api/recepciones/estanque-movil', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Respuesta del servidor:', response.data);

            if (response.data.success) {
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
                    diferencia: 0
                });
                setTouched({});
                
                // Recargar estanques para actualizar stock
                await fetchEstanquesMoviles();
            } else {
                mostrarAlerta('error', `Error: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error al registrar recepción:', error);
            
            // Manejar diferentes tipos de errores
            if (error.response) {
                const statusCode = error.response.status;
                const errorMessage = error.response.data?.message || 'Error desconocido';
                
                if (statusCode === 401) {
                    mostrarAlerta('error', 'Sesión expirada. Inicie sesión nuevamente.');
                } else if (statusCode === 422) {
                    mostrarAlerta('error', `Error de validación: ${errorMessage}`);
                } else if (statusCode === 500) {
                    mostrarAlerta('error', `Error del servidor: ${errorMessage}`);
                } else {
                    mostrarAlerta('error', `Error (${statusCode}): ${errorMessage}`);
                }
            } else if (error.request) {
                mostrarAlerta('error', 'Error de conexión. Verifique su conexión a internet.');
            } else {
                mostrarAlerta('error', 'Error inesperado. Intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getDiferenciaInfo = () => {
        const diferencia = parseFloat(formData.diferencia);
        const absDiferencia = Math.abs(diferencia);

        if (absDiferencia === 0) {
            return { color: 'text-green-600', icon: FaCheckCircle, text: 'Sin diferencia', bg: 'bg-green-50 border-green-200' };
        } else if (absDiferencia <= 0.5) {
            return { color: 'text-blue-600', icon: FaInfoCircle, text: 'Diferencia normal', bg: 'bg-blue-50 border-blue-200' };
        } else {
            return { color: 'text-yellow-600', icon: FaExclamationTriangle, text: 'Diferencia significativa', bg: 'bg-yellow-50 border-yellow-200' };
        }
    };

    const diferencia = parseFloat(formData.diferencia) || 0;
    const diferenciaInfo = getDiferenciaInfo();

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

                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-2">
                        Registro de Recepción a Estanque Móvil
                    </h2>

                    {/* Información del usuario y faena */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                            <div>
                                <span className="text-blue-700 font-medium">Usuario:</span>
                                <span className="ml-1 text-blue-800">{user.nombre}</span>
                            </div>
                            <div>
                                <span className="text-blue-700 font-medium">Faena ID:</span>
                                <span className="ml-1 text-blue-800">{user.id_faena}</span>
                            </div>
                        </div>
                    </div>

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
                            <input
                                type="text"
                                placeholder="Ingrese número de guía"
                                value={formData.numeroGuia}
                                onChange={(e) => handleChange("numeroGuia", e.target.value)}
                                onBlur={() => handleBlur("numeroGuia")}
                                className={`w-full px-3 py-2 border rounded-md bg-white text-gray-800 ${errors.numeroGuia ? "border-red-500" : "border-gray-300"
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
                            <select
                                value={formData.idEstanqueMovil}
                                onChange={(e) => handleChange("idEstanqueMovil", e.target.value)}
                                onBlur={() => handleBlur("idEstanqueMovil")}
                                className={`w-full px-3 py-2 border rounded-md bg-white text-gray-800 ${errors.idEstanqueMovil ? "border-red-500" : "border-gray-300"
                                    }`}
                            >
                                <option value="">Seleccionar estanque...</option>
                                {estanquesMoviles.map(estanque => (
                                    <option key={estanque.value} value={estanque.value}>
                                        {estanque.label}
                                    </option>
                                ))}
                            </select>
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
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Ingrese litros según guía"
                                value={formData.litrosDocumentados}
                                onChange={(e) => handleChange("litrosDocumentados", e.target.value)}
                                onBlur={() => handleBlur("litrosDocumentados")}
                                className={`w-full px-3 py-2 border rounded-md bg-white text-gray-800 ${errors.litrosDocumentados ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.litrosDocumentados && (
                                <span className="text-red-500 text-xs mt-1">{errors.litrosDocumentados}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Litros Recibidos *
                                <span className="text-xs text-gray-500 ml-2">(medidos)</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Ingrese litros recibidos"
                                value={formData.litrosRecibidos}
                                onChange={(e) => handleChange("litrosRecibidos", e.target.value)}
                                onBlur={() => handleBlur("litrosRecibidos")}
                                className={`w-full px-3 py-2 border rounded-md bg-white text-gray-800 ${errors.litrosRecibidos ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.litrosRecibidos && (
                                <span className="text-red-500 text-xs mt-1">{errors.litrosRecibidos}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-600 mb-1">
                                Precio por Litro *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Ingrese precio por litro"
                                value={formData.precio}
                                onChange={(e) => handleChange("precio", e.target.value)}
                                onBlur={() => handleBlur("precio")}
                                className={`w-full px-3 py-2 border rounded-md bg-white text-gray-800 ${errors.precio ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {errors.precio && (
                                <span className="text-red-500 text-xs mt-1">{errors.precio}</span>
                            )}
                        </div>
                    </div>

                    {/* Mostrar diferencia y precio total */}
                    {(formData.litrosDocumentados && formData.litrosRecibidos) && (
                        <div className={`p-3 rounded-lg border ${diferenciaInfo.bg}`}>
                            <div className="flex items-center space-x-2">
                                <diferenciaInfo.icon className={diferenciaInfo.color} />
                                <span className="text-sm font-medium">
                                    Diferencia: {diferencia.toFixed(2)} L
                                    <span className={`ml-1 ${diferenciaInfo.color}`}>
                                        ({diferencia > 0 ? 'de más' : diferencia < 0 ? 'de menos' : 'exacto'})
                                    </span>
                                </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                                {diferenciaInfo.text}
                            </div>
                        </div>
                    )}

                    {/* Precio total */}
                    {formData.precioTotal && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="text-center">
                                <span className="text-sm text-green-600">Precio Total:</span>
                                <div className="text-lg font-bold text-green-700">
                                    ${parseFloat(formData.precioTotal).toLocaleString('es-CL')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Checkbox recibo conforme */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="reciboConforme"
                            checked={formData.reciboConforme}
                            onChange={(e) => handleChange("reciboConforme", e.target.checked)}
                            className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label htmlFor="reciboConforme" className="text-sm font-medium text-gray-700">
                            Recibo Conforme
                        </label>
                    </div>

                    {/* Observaciones */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">
                            Observaciones
                        </label>
                        <textarea
                            placeholder="Observaciones adicionales sobre la recepción..."
                            value={formData.observacion}
                            onChange={(e) => handleChange("observacion", e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 resize-none"
                        />
                    </div>

                    {/* Botón de envío */}
                    <div className="text-center pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !user?.id || !user?.id_faena}
                            className={`px-8 py-3 text-lg font-semibold rounded-lg text-white flex items-center justify-center mx-auto space-x-2 ${
                                loading || !user?.id || !user?.id_faena
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:ring-orange-300'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    <span>Registrando...</span>
                                </>
                            ) : (
                                <>
                                    <FaTruck />
                                    <span>Registrar Recepción Móvil</span>
                                </>
                            )}
                        </button>
                        
                        {(!user?.id || !user?.id_faena) && (
                            <p className="text-red-500 text-xs mt-2">
                                Error: No se puede identificar el usuario o la faena
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default FormRecepcionMovil;