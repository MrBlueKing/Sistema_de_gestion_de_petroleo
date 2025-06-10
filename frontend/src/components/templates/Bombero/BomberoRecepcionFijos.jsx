import React, { useState } from "react";
import Button from "../../atoms/Button/Button";
import { FaGasPump } from "react-icons/fa";
// Aquí importarías tu FormRecepcion actual y lo renombrarías

const FormRecepcionFijos = () => {
  const [formData, setFormData] = useState({
    fechaHora: "",
    numeroGuia: "",
    litrosDocumentados: "",
    litrosRecibidos: "",
    precio: "",
    precioTotal: "",
    reciboConforme: true,
    observacion: "",
    estanques: [], // Para manejar múltiples estanques
    alturasEstanques: []
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    console.log("Datos de recepción fijos enviados:", formData);
    
    try {
      const payload = {
        id_usuario: 4,
        numero_guia: formData.numeroGuia,
        litros_documentados: parseFloat(formData.litrosDocumentados),
        litros_recibidos: parseFloat(formData.litrosRecibidos),
        precio: parseFloat(formData.precio),
        precio_total: parseFloat(formData.precioTotal),
        recibo_conforme: formData.reciboConforme,
        observacion: formData.observacion,
        id_faena: 2,
        stock_inicial: 0, // Calcular según tu lógica
        diferencia: parseFloat(formData.litrosDocumentados) - parseFloat(formData.litrosRecibidos),
        alturas_estanques: formData.alturasEstanques
      };

      const response = await fetch('/api/recepciones/estanques-fijos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert('¡Recepción a estanques fijos registrada exitosamente!');
        // Resetear formulario
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar la recepción');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 space-y-6">
      <div className="text-center border-b pb-4">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <FaGasPump className="text-blue-600 text-2xl" />
          <h2 className="text-xl font-bold text-gray-800">Recepción Tradicional</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Proceso tradicional con verificación de alturas en múltiples estanques
        </p>
      </div>

      {/* Aquí integrarías tu FormRecepcion actual */}
      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl">
        <p className="text-gray-500 mb-4">
          Aquí va tu FormRecepcion actual (renombrado)
        </p>
        <p className="text-sm text-gray-400">
          Mantén la misma funcionalidad pero adaptada para usar la nueva API:
          <br />
          <code className="bg-gray-100 px-2 py-1 rounded">
            POST /api/recepciones/estanques-fijos
          </code>
        </p>
      </div>

      <div className="text-center">
        <Button
          text="Registrar Recepción Tradicional"
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold"
          icon={<FaGasPump />}
        />
      </div>
    </div>
  );
};

export default FormRecepcionFijos;