import React, { useState, useEffect } from "react";
import Button from "../../atoms/Button/Button";
import InputField from "../../atoms/Inputs/InputField";
import { FaTruck, FaGasPump, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

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
        { value: "3", label: "Estanque Móvil 1 adasdas(Stock: 50L / Cap: 500L)" },
        { value: "4", label: "Estanque Móvil 2 (Stock: 0L / Cap: 300L)" },
        { value: "5", label: "Camión Cisterna A (Stock: 150L / Cap: 1000L)" }
      ]);
    } catch (error) {
      console.error('Error al cargar estanques móviles:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Auto-calcular precio total
    if (name === 'litrosRecibidos' || name === 'precio') {
      const litros = name === 'litrosRecibidos' ? parseFloat(value) || 0 : parseFloat(formData.litrosRecibidos) || 0;
      const precio = name === 'precio' ? parseFloat(value) || 0 : parseFloat(formData.precio) || 0;
      
      setFormData(prev => ({
        ...prev,
        [name]: fieldValue,
        precioTotal: (litros * precio).toFixed(2)
      }));
    }

    // Limpiar errores
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
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
    if (!validateForm()) {
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
        alert('¡Recepción a estanque móvil registrada exitosamente!');
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
        // Recargar estanques para actualizar stock
        fetchEstanquesMoviles();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error al registrar recepción:', error);
      alert('Error al registrar la recepción. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const diferencia = parseFloat(formData.litrosDocumentados || 0) - parseFloat(formData.litrosRecibidos || 0);

  return (
    <div className="bg-white rounded-2xl p-6 space-y-6">
      <div className="text-center border-b pb-4">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <FaTruck className="text-green-600 text-2xl" />
          <h2 className="text-xl font-bold text-gray-800">Recepción Estanque Móvil</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Registro de compra directa de combustible a estanque móvil
        </p>
      </div>

      {/* Información de la guía */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Guía *
          </label>
          <InputField
            type="text"
            name="numeroGuia"
            value={formData.numeroGuia}
            onChange={handleChange}
            placeholder="Ej: GUIA-001"
            className={errors.numeroGuia ? 'border-red-500' : ''}
          />
          {errors.numeroGuia && (
            <p className="text-red-500 text-xs mt-1">{errors.numeroGuia}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estanque Móvil *
          </label>
          <InputField
            name="idEstanqueMovil"
            value={formData.idEstanqueMovil}
            onChange={handleChange}
            options={[
              { value: "", label: "Seleccionar estanque..." },
              ...estanquesMoviles
            ]}
            className={errors.idEstanqueMovil ? 'border-red-500' : ''}
          />
          {errors.idEstanqueMovil && (
            <p className="text-red-500 text-xs mt-1">{errors.idEstanqueMovil}</p>
          )}
        </div>
      </div>

      {/* Información del estanque seleccionado */}
      {formData.idEstanqueMovil && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <FaTruck className="text-blue-600" />
            <h4 className="font-semibold text-blue-800">
              {estanquesMoviles.find(e => e.value === formData.idEstanqueMovil)?.label}
            </h4>
          </div>
        </div>
      )}

      {/* Información de combustible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Litros Documentados *
          </label>
          <InputField
            type="number"
            name="litrosDocumentados"
            value={formData.litrosDocumentados}
            onChange={handleChange}
            placeholder="0.00"
            min={0}
            className={errors.litrosDocumentados ? 'border-red-500' : ''}
          />
          {errors.litrosDocumentados && (
            <p className="text-red-500 text-xs mt-1">{errors.litrosDocumentados}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Litros Recibidos *
          </label>
          <InputField
            type="number"
            name="litrosRecibidos"
            value={formData.litrosRecibidos}
            onChange={handleChange}
            placeholder="0.00"
            min={0}
            className={errors.litrosRecibidos ? 'border-red-500' : ''}
          />
          {errors.litrosRecibidos && (
            <p className="text-red-500 text-xs mt-1">{errors.litrosRecibidos}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Altura Final (opcional)
          </label>
          <InputField
            type="number"
            name="alturaFinal"
            value={formData.alturaFinal}
            onChange={handleChange}
            placeholder="0.00"
            min={0}
          />
        </div>
      </div>

      {/* Mostrar diferencia si existe */}
      {(formData.litrosDocumentados && formData.litrosRecibidos) && (
        <div className={`p-3 rounded-lg ${diferencia === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center space-x-2">
            {diferencia === 0 ? (
              <FaCheckCircle className="text-green-600" />
            ) : (
              <FaExclamationTriangle className="text-yellow-600" />
            )}
            <span className="text-sm font-medium">
              Diferencia: {diferencia.toFixed(2)} L
            </span>
            {diferencia === 0 && <span className="text-green-600 text-sm">(Sin diferencia)</span>}
          </div>
        </div>
      )}

      {/* Información de precio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio por Litro *
          </label>
          <InputField
            type="number"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            placeholder="0.00"
            min={0}
            className={errors.precio ? 'border-red-500' : ''}
          />
          {errors.precio && (
            <p className="text-red-500 text-xs mt-1">{errors.precio}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Total
          </label>
          <InputField
            type="number"
            name="precioTotal"
            value={formData.precioTotal}
            onChange={handleChange}
            placeholder="0.00"
            disabled
            className="bg-gray-100"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="reciboConforme"
              checked={formData.reciboConforme}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Recibo Conforme</span>
          </label>
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        <InputField
          name="observacion"
          value={formData.observacion}
          onChange={handleChange}
          placeholder="Observaciones adicionales sobre la recepción..."
          isTextarea
          className="min-h-[80px]"
        />
      </div>

      {/* Botón de envío */}
      <div className="text-center pt-4">
        <Button
          text={loading ? "Registrando..." : "Registrar Recepción Móvil"}
          onClick={handleSubmit}
          disabled={loading}
          color="green"
          className="px-8 py-3 text-lg font-semibold"
          icon={<FaGasPump />}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default FormRecepcionMovil;