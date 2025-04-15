import React, { useState } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import RadioButton from "../../atoms/Button/RadioButton";
import Header from "./Header";

const GestionarTipoMaquina = () => {
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [tipoMedicion, setTipoMedicion] = useState(''); // Comienza sin seleccionar

  const handleRegistrar = () => {
    if (!nombreCategoria || !tipoMedicion) {
      alert("Por favor completa todos los campos.");
      return;
    }

    console.log('Registrando categoría:', {
      nombreCategoria,
      tipoMedicion
    });

    // Aquí iría la lógica para enviar los datos al backend
  };

  return (
    <div className="max-w-sm mx-auto bg-white shadow-md rounded-md overflow-hidden">
      <Header title="Opciones" />

      <div className="p-4">
        <div className="bg-gray-200 p-3 mb-6 text-center font-medium">
          Gestionar Tipo Maquina
        </div>

        <InputField 
          placeholder="Nombre Categoría" 
          value={nombreCategoria}
          onChange={(e) => setNombreCategoria(e.target.value)}
        />

        <div className="border rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-500 mb-2">Tipo Medición</div>

          <RadioButton 
            label="Horometro"
            name="tipoMedicion"
            value="horometro"
            checked={tipoMedicion === 'horometro'}
            onChange={() => setTipoMedicion('horometro')}
          />

          <RadioButton 
            label="Kilometraje"
            name="tipoMedicion"
            value="kilometraje"
            checked={tipoMedicion === 'kilometraje'}
            onChange={() => setTipoMedicion('kilometraje')}
          />
        </div>

        <Button 
          label="Registrar Categoría" 
          onClick={handleRegistrar}
        />
      </div>
    </div>
  );
};

export default GestionarTipoMaquina;
