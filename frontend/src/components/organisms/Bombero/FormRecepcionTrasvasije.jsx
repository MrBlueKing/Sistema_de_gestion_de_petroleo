import React, { useContext, useState, useEffect } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import {
  FaHome,
  FaExclamationTriangle,
  FaRuler,
  FaCheck,
  FaFileAlt,
  FaGasPump,
  FaCalculator,
  FaArrowRight,
  FaInfoCircle,
  FaSync,
  FaTruck,
  FaBuilding,
  FaExchangeAlt,
  FaCheckCircle
} from "react-icons/fa";

import { FaDropletSlash } from "react-icons/fa6";
import { UserContext } from "../../../context/userContext";
import axios from "../../../lib/axios";

// Función de utilidad para formatear números
const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0.00";
  }
  return parseFloat(num).toFixed(2);
};

const formatNumberWithSeparators = (num) => {
  if (num === undefined || num === null || isNaN(parseFloat(num))) {
    return "0,00";
  }
  return parseFloat(num).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// COMPONENTE MODAL DE ÉXITO
const ModalExitoTrasvasije = ({ isOpen, onConfirm, datosTrasvasije }) => {
  if (!isOpen) return null;

  const { tipo, litrosTransferidos, estanqueOrigen, estanqueDestino, diferenciaMedicion, verificado } = datosTrasvasije;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeInScale">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 text-white">
          <div className="flex items-center justify-center">
            <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
              <FaCheckCircle className="text-2xl" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">
                ¡Trasvasije Registrado Exitosamente!
              </h2>
              <p className="text-green-100 text-sm mt-1">
                {tipo === 'movil_a_fijo' ? 'Móvil → Fijo' : 'Fijo → Móvil'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-3">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <FaTruck className="text-white text-sm" />
                </div>
                <h3 className="font-semibold text-blue-800">Estanques</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700 text-sm">Origen:</span>
                  <span className="font-bold text-blue-900 text-sm">
                    {estanqueOrigen}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 text-sm">Destino:</span>
                  <span className="font-bold text-blue-900 text-sm">
                    {estanqueDestino}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center mb-3">
                <div className="bg-green-500 p-2 rounded-lg mr-3">
                  <FaDropletSlash className="text-white text-sm" />
                </div>
                <h3 className="font-semibold text-green-800">Trasvasije</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 text-sm">Litros:</span>
                  <span className="font-bold text-green-900">
                    {formatNumberWithSeparators(litrosTransferidos)} L
                  </span>
                </div>
                {diferenciaMedicion !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-green-700 text-sm">Diferencia:</span>
                    <span className={`font-bold text-sm ${Math.abs(diferenciaMedicion) <= 2 ? 'text-green-600' : Math.abs(diferenciaMedicion) <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatNumberWithSeparators(Math.abs(diferenciaMedicion))} L
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <FaGasPump className="mr-2 text-gray-500" />
              Estado del Trasvasije
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className="ml-2 font-medium text-green-600">✓ Completado</span>
              </div>
              <div>
                <span className="text-gray-600">Verificación:</span>
                <span className={`ml-2 font-medium ${verificado ? 'text-green-600' : 'text-amber-600'}`}>
                  {verificado ? '✓ Verificado' : '⏳ Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onConfirm}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-sm"
            >
              <span>Continuar</span>
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE PRINCIPAL
const FormularioTrasvasije = () => {
  const { user, loading } = useContext(UserContext);

  // Estados principales
  const [tipoTrasvasije, setTipoTrasvasije] = useState(''); // 'movil_a_fijo' o 'fijo_a_movil'
  const [estanquesDisponibles, setEstanquesDisponibles] = useState({
    fijos: [],
    moviles: []
  });

  // Estados del formulario
  const [formData, setFormData] = useState({
    id_usuario: '',
    id_faena: '',
    id_estanque_origen: '',
    id_estanque_destino: '',
    observaciones: ''
  });

  // Estados específicos para móvil → fijo
  const [datosMovilAFijo, setDatosMovilAFijo] = useState({
    litros_movil_inicial: '',
    litros_movil_final: '',
    altura_fijo_inicial: '',
    altura_fijo_final: ''
  });

  // Estados específicos para fijo → móvil
  const [datosFijoAMovil, setDatosFijoAMovil] = useState({
    numeral_inicial: '',
    numeral_final: ''
  });

  // Estados de UI
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitoModal, setShowExitoModal] = useState(false);
  const [datosExito, setDatosExito] = useState(null);

  // Efectos
  useEffect(() => {
    if (user?.id_faena && user?.id) {
      setFormData(prev => ({
        ...prev,
        id_faena: user.id_faena,
        id_usuario: user.id
      }));
      cargarEstanquesDisponibles(user.id_faena);
    }
  }, [user]);

  // Cargar estanques disponibles
  const cargarEstanquesDisponibles = async (idFaena) => {
    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      const response = await axios.get(`/api/trasvasijes/datos-formulario?id_faena=${idFaena}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setEstanquesDisponibles({
          fijos: response.data.data.estanques_fijos,
          moviles: response.data.data.estanques_moviles
        });
      }
    } catch (error) {
      console.error("Error al cargar estanques:", error);
      mostrarAlerta("error", "Error al cargar los estanques disponibles.");
    }
  };

  // Mostrar alertas
  const mostrarAlerta = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  // Manejar cambios en campos
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMovilAFijoChange = (field, value) => {
    setDatosMovilAFijo(prev => ({ ...prev, [field]: value }));
  };

  const handleFijoAMovilChange = (field, value) => {
    setDatosFijoAMovil(prev => ({ ...prev, [field]: value }));
  };

  // Validaciones
  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.id_estanque_origen) {
      newErrors.estanque_origen = "Debe seleccionar un estanque origen";
    }

    if (!formData.id_estanque_destino) {
      newErrors.estanque_destino = "Debe seleccionar un estanque destino";
    }

    if (tipoTrasvasije === 'movil_a_fijo') {
      if (!datosMovilAFijo.litros_movil_inicial || parseFloat(datosMovilAFijo.litros_movil_inicial) <= 0) {
        newErrors.litros_movil_inicial = "Debe ingresar los litros iniciales del móvil";
      }
      if (!datosMovilAFijo.litros_movil_final || parseFloat(datosMovilAFijo.litros_movil_final) < 0) {
        newErrors.litros_movil_final = "Debe ingresar los litros finales del móvil";
      }
      if (!datosMovilAFijo.altura_fijo_inicial || parseFloat(datosMovilAFijo.altura_fijo_inicial) < 0) {
        newErrors.altura_fijo_inicial = "Debe ingresar la altura inicial del estanque fijo";
      }
      if (!datosMovilAFijo.altura_fijo_final || parseFloat(datosMovilAFijo.altura_fijo_final) < 0) {
        newErrors.altura_fijo_final = "Debe ingresar la altura final del estanque fijo";
      }
      
      // Validaciones de lógica
      if (datosMovilAFijo.litros_movil_inicial && datosMovilAFijo.litros_movil_final) {
        if (parseFloat(datosMovilAFijo.litros_movil_inicial) <= parseFloat(datosMovilAFijo.litros_movil_final)) {
          newErrors.litros_movil = "Los litros iniciales deben ser mayores que los finales";
        }
      }
      
      if (datosMovilAFijo.altura_fijo_inicial && datosMovilAFijo.altura_fijo_final) {
        if (parseFloat(datosMovilAFijo.altura_fijo_inicial) >= parseFloat(datosMovilAFijo.altura_fijo_final)) {
          newErrors.altura_fijo = "La altura final debe ser mayor que la inicial";
        }
      }
    }

    if (tipoTrasvasije === 'fijo_a_movil') {
      if (!datosFijoAMovil.numeral_inicial || parseFloat(datosFijoAMovil.numeral_inicial) < 0) {
        newErrors.numeral_inicial = "Debe ingresar el numeral inicial";
      }
      if (!datosFijoAMovil.numeral_final || parseFloat(datosFijoAMovil.numeral_final) < 0) {
        newErrors.numeral_final = "Debe ingresar el numeral final";
      }
      
      // Validación de lógica
      if (datosFijoAMovil.numeral_inicial && datosFijoAMovil.numeral_final) {
        if (parseFloat(datosFijoAMovil.numeral_inicial) >= parseFloat(datosFijoAMovil.numeral_final)) {
          newErrors.numerales = "El numeral final debe ser mayor que el inicial";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Obtener estanques filtrados según el tipo de trasvasije
  const getEstanquesOrigen = () => {
    if (tipoTrasvasije === 'movil_a_fijo') {
      return estanquesDisponibles.moviles.filter(e => e.disponible_para_trasvasije);
    } else if (tipoTrasvasije === 'fijo_a_movil') {
      return estanquesDisponibles.fijos.filter(e => e.disponible_para_trasvasije);
    }
    return [];
  };

  const getEstanquesDestino = () => {
    if (tipoTrasvasije === 'movil_a_fijo') {
      return estanquesDisponibles.fijos;
    } else if (tipoTrasvasije === 'fijo_a_movil') {
      return estanquesDisponibles.moviles;
    }
    return [];
  };

  // Calcular litros a transferir
  const calcularLitrosTransferidos = () => {
    if (tipoTrasvasije === 'movil_a_fijo') {
      return parseFloat(datosMovilAFijo.litros_movil_inicial || 0) - parseFloat(datosMovilAFijo.litros_movil_final || 0);
    } else if (tipoTrasvasije === 'fijo_a_movil') {
      return parseFloat(datosFijoAMovil.numeral_final || 0) - parseFloat(datosFijoAMovil.numeral_inicial || 0);
    }
    return 0;
  };

  // Enviar trasvasije
  const handleSubmit = async () => {
    if (!validarFormulario()) {
      mostrarAlerta("error", "Por favor, complete todos los campos correctamente.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      
      let endpoint = '';
      let datos = {
        id_usuario: formData.id_usuario,
        id_faena: formData.id_faena,
        observaciones: formData.observaciones
      };

      if (tipoTrasvasije === 'movil_a_fijo') {
        endpoint = '/api/trasvasijes/movil-a-fijo';
        datos = {
          ...datos,
          id_estanque_movil: formData.id_estanque_origen,
          id_estanque_fijo: formData.id_estanque_destino,
          litros_movil_inicial: parseFloat(datosMovilAFijo.litros_movil_inicial),
          litros_movil_final: parseFloat(datosMovilAFijo.litros_movil_final),
          altura_fijo_inicial: parseFloat(datosMovilAFijo.altura_fijo_inicial),
          altura_fijo_final: parseFloat(datosMovilAFijo.altura_fijo_final)
        };
      } else {
        endpoint = '/api/trasvasijes/fijo-a-movil';
        datos = {
          ...datos,
          id_estanque_fijo: formData.id_estanque_origen,
          id_estanque_movil: formData.id_estanque_destino,
          numeral_inicial: parseFloat(datosFijoAMovil.numeral_inicial),
          numeral_final: parseFloat(datosFijoAMovil.numeral_final)
        };
      }

      const response = await axios.post(endpoint, datos, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Preparar datos para modal de éxito
        const estanqueOrigen = getEstanquesOrigen().find(e => e.id_estanque == formData.id_estanque_origen);
        const estanqueDestino = getEstanquesDestino().find(e => e.id_estanque == formData.id_estanque_destino);
        
        setDatosExito({
          tipo: tipoTrasvasije,
          litrosTransferidos: calcularLitrosTransferidos(),
          estanqueOrigen: estanqueOrigen?.nombre || 'Desconocido',
          estanqueDestino: estanqueDestino?.nombre || 'Desconocido',
          diferenciaMedicion: response.data.data.trasvasije?.diferencia_medicion,
          verificado: response.data.data.trasvasije?.verificado !== false
        });
        
        setShowExitoModal(true);
      }
    } catch (error) {
      console.error("Error al registrar trasvasije:", error);
      let errorMessage = "Error al registrar el trasvasije.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      mostrarAlerta("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetear formulario
  const resetearFormulario = () => {
    setTipoTrasvasije('');
    setFormData({
      id_usuario: user?.id || '',
      id_faena: user?.id_faena || '',
      id_estanque_origen: '',
      id_estanque_destino: '',
      observaciones: ''
    });
    setDatosMovilAFijo({
      litros_movil_inicial: '',
      litros_movil_final: '',
      altura_fijo_inicial: '',
      altura_fijo_final: ''
    });
    setDatosFijoAMovil({
      numeral_inicial: '',
      numeral_final: ''
    });
    setErrors({});
    setTouched({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-6 bg-gray-50 p-6 rounded-lg shadow-sm">
        {/* Alertas */}
        {alert.show && (
          <div
            className={`flex items-center p-4 rounded-lg shadow-sm ${
              alert.type === "success"
                ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                : alert.type === "info"
                ? "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
                : "bg-red-100 text-red-800 border-l-4 border-red-500"
            }`}
          >
            {alert.type === "error" && <FaExclamationTriangle className="mr-3 flex-shrink-0" />}
            {alert.type === "info" && <FaInfoCircle className="mr-3 flex-shrink-0" />}
            <span className="text-sm">{alert.message}</span>
          </div>
        )}

        {/* Título */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaExchangeAlt className="mr-3 text-blue-500" />
            Registro de Trasvasije
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Transfiera combustible entre estanques móviles y fijos
          </p>
        </div>

        {/* Selector de tipo de trasvasije */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Trasvasije</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setTipoTrasvasije('movil_a_fijo')}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipoTrasvasije === 'movil_a_fijo'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <FaTruck className="text-2xl mr-2" />
                <FaArrowRight className="text-lg mx-2" />
                <FaBuilding className="text-2xl" />
              </div>
              <h4 className="font-semibold">Móvil → Fijo</h4>
              <p className="text-sm mt-1">Transferir desde estanque móvil a estanque fijo</p>
            </button>

            <button
              onClick={() => setTipoTrasvasije('fijo_a_movil')}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipoTrasvasije === 'fijo_a_movil'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <FaBuilding className="text-2xl mr-2" />
                <FaArrowRight className="text-lg mx-2" />
                <FaTruck className="text-2xl" />
              </div>
              <h4 className="font-semibold">Fijo → Móvil</h4>
              <p className="text-sm mt-1">Transferir desde estanque fijo a estanque móvil</p>
            </button>
          </div>
        </div>

        {/* Formulario principal */}
        {tipoTrasvasije && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaFileAlt className="mr-2 text-gray-600" />
              Información del Trasvasije
            </h3>

            {/* Selección de estanques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estanque Origen *
                </label>
                <select
                  value={formData.id_estanque_origen}
                  onChange={(e) => handleChange('id_estanque_origen', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.estanque_origen ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar estanque origen</option>
                  {getEstanquesOrigen().map(estanque => (
                    <option key={estanque.id_estanque} value={estanque.id_estanque}>
                      {estanque.nombre} ({formatNumberWithSeparators(estanque.stock_actual)} L disponibles)
                    </option>
                  ))}
                </select>
                {errors.estanque_origen && (
                  <span className="text-red-500 text-xs mt-1">{errors.estanque_origen}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estanque Destino *
                </label>
                <select
                  value={formData.id_estanque_destino}
                  onChange={(e) => handleChange('id_estanque_destino', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.estanque_destino ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar estanque destino</option>
                  {getEstanquesDestino().map(estanque => (
                    <option key={estanque.id_estanque} value={estanque.id_estanque}>
                      {estanque.nombre} ({formatNumberWithSeparators(estanque.capacidad - estanque.stock_actual)} L capacidad disponible)
                    </option>
                  ))}
                </select>
                {errors.estanque_destino && (
                  <span className="text-red-500 text-xs mt-1">{errors.estanque_destino}</span>
                )}
              </div>
            </div>

            {/* Campos específicos según tipo de trasvasije */}
            {tipoTrasvasije === 'movil_a_fijo' && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-blue-800 mb-4 flex items-center">
                  <FaRuler className="mr-2" />
                  Mediciones Móvil → Fijo
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-700">Estanque Móvil (Litros)</h5>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Litros Iniciales *
                      </label>
                      <InputField
                        type="number"
                        step="0.01"
                        placeholder="Litros iniciales del móvil"
                        value={datosMovilAFijo.litros_movil_inicial}
                        onChange={(e) => handleMovilAFijoChange('litros_movil_inicial', e.target.value)}
                        className={`${errors.litros_movil_inicial ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.litros_movil_final && (
                        <span className="text-red-500 text-xs mt-1">{errors.litros_movil_final}</span>
                      )}
                    </div>
                    {errors.litros_movil && (
                      <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                        {errors.litros_movil}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-700">Estanque Fijo (Alturas en cm)</h5>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Altura Inicial *
                      </label>
                      <InputField
                        type="number"
                        step="0.01"
                        placeholder="Altura inicial en cm"
                        value={datosMovilAFijo.altura_fijo_inicial}
                        onChange={(e) => handleMovilAFijoChange('altura_fijo_inicial', e.target.value)}
                        className={`${errors.altura_fijo_inicial ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.altura_fijo_inicial && (
                        <span className="text-red-500 text-xs mt-1">{errors.altura_fijo_inicial}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Altura Final *
                      </label>
                      <InputField
                        type="number"
                        step="0.01"
                        placeholder="Altura final en cm"
                        value={datosMovilAFijo.altura_fijo_final}
                        onChange={(e) => handleMovilAFijoChange('altura_fijo_final', e.target.value)}
                        className={`${errors.altura_fijo_final ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.altura_fijo_final && (
                        <span className="text-red-500 text-xs mt-1">{errors.altura_fijo_final}</span>
                      )}
                    </div>
                    {errors.altura_fijo && (
                      <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                        {errors.altura_fijo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mostrar cálculo en tiempo real */}
                {datosMovilAFijo.litros_movil_inicial && datosMovilAFijo.litros_movil_final && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2">Cálculo Automático</h5>
                    <p className="text-blue-700">
                      Litros a transferir: <span className="font-bold">
                        {formatNumberWithSeparators(calcularLitrosTransferidos())} L
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {tipoTrasvasije === 'fijo_a_movil' && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-green-800 mb-4 flex items-center">
                  <FaCalculator className="mr-2" />
                  Numerales de Bomba
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numeral Inicial *
                    </label>
                    <InputField
                      type="number"
                      step="0.01"
                      placeholder="Lectura inicial del numeral"
                      value={datosFijoAMovil.numeral_inicial}
                      onChange={(e) => handleFijoAMovilChange('numeral_inicial', e.target.value)}
                      className={`${errors.numeral_inicial ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.numeral_inicial && (
                      <span className="text-red-500 text-xs mt-1">{errors.numeral_inicial}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numeral Final *
                    </label>
                    <InputField
                      type="number"
                      step="0.01"
                      placeholder="Lectura final del numeral"
                      value={datosFijoAMovil.numeral_final}
                      onChange={(e) => handleFijoAMovilChange('numeral_final', e.target.value)}
                      className={`${errors.numeral_final ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.numeral_final && (
                      <span className="text-red-500 text-xs mt-1">{errors.numeral_final}</span>
                    )}
                  </div>
                </div>

                {errors.numerales && (
                  <div className="mt-4 text-red-500 text-sm p-2 bg-red-50 rounded">
                    {errors.numerales}
                  </div>
                )}

                {/* Mostrar cálculo en tiempo real */}
                {datosFijoAMovil.numeral_inicial && datosFijoAMovil.numeral_final && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">Cálculo Automático</h5>
                    <p className="text-green-700">
                      Litros bombeados: <span className="font-bold">
                        {formatNumberWithSeparators(calcularLitrosTransferidos())} L
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Observaciones */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <InputField
                placeholder="Ingrese observaciones sobre el trasvasije..."
                isTextarea={true}
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                className="bg-white rounded-lg px-4 py-3 min-h-[100px] text-gray-800 border-gray-300 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Resumen antes de enviar */}
        {tipoTrasvasije && formData.id_estanque_origen && formData.id_estanque_destino && calcularLitrosTransferidos() > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <FaInfoCircle className="mr-2" />
              Resumen del Trasvasije
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-gray-700 mb-2">Origen</h4>
                <p className="text-sm text-gray-600">
                  {getEstanquesOrigen().find(e => e.id_estanque == formData.id_estanque_origen)?.nombre}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Stock: {formatNumberWithSeparators(
                    getEstanquesOrigen().find(e => e.id_estanque == formData.id_estanque_origen)?.stock_actual || 0
                  )} L
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-gray-700 mb-2">Transferencia</h4>
                <p className="text-lg font-bold text-blue-600">
                  {formatNumberWithSeparators(calcularLitrosTransferidos())} L
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {tipoTrasvasije === 'movil_a_fijo' ? 'Móvil → Fijo' : 'Fijo → Móvil'}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-gray-700 mb-2">Destino</h4>
                <p className="text-sm text-gray-600">
                  {getEstanquesDestino().find(e => e.id_estanque == formData.id_estanque_destino)?.nombre}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Disponible: {formatNumberWithSeparators(
                    (getEstanquesDestino().find(e => e.id_estanque == formData.id_estanque_destino)?.capacidad || 0) -
                    (getEstanquesDestino().find(e => e.id_estanque == formData.id_estanque_destino)?.stock_actual || 0)
                  )} L
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <Button
              to="/bombero"
              className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white text-sm px-6 py-3 rounded-lg transition-colors shadow-sm"
              icon={<FaHome className="mr-2 text-white" />}
              text="Volver al Inicio"
            />
            
            {tipoTrasvasije && (
              <Button
                text="Limpiar Formulario"
                onClick={resetearFormulario}
                className="flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white text-sm px-6 py-3 rounded-lg transition-colors shadow-sm"
                icon={<FaSync className="mr-2 text-white" />}
              />
            )}
          </div>

          {tipoTrasvasije && (
            <Button
              text={isSubmitting ? "Procesando..." : "Registrar Trasvasije"}
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.id_estanque_origen || !formData.id_estanque_destino || calcularLitrosTransferidos() <= 0}
              className={`bg-blue-600 hover:bg-blue-700 text-white text-sm px-8 py-3 rounded-lg transition-colors shadow-sm ${
                isSubmitting ? "opacity-70 cursor-wait" : ""
              }`}
              icon={!isSubmitting && <FaExchangeAlt className="mr-2 text-white" />}
            />
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          Los campos marcados con * son obligatorios
        </div>
      </div>

      {/* Modal de éxito */}
      {datosExito && (
        <ModalExitoTrasvasije
          isOpen={showExitoModal}
          onConfirm={() => {
            setShowExitoModal(false);
            setDatosExito(null);
            resetearFormulario();
            // Recargar estanques para actualizar stocks
            if (user?.id_faena) {
              cargarEstanquesDisponibles(user.id_faena);
            }
          }}
          datosTrasvasije={datosExito}
        />
      )}
    </>
  );
};

export default FormularioTrasvasije;