import React, { useState } from "react";
import Header from "../../components/organisms/Bombero/Header";
import FormRecepcionFijos from "../../components/templates/Bombero/BomberoRecepcion";
import FormRecepcionMovil from "../../components/templates/Bombero/BomberoRecepcionMovil";
import { 
  FaTruck, 
  FaExchangeAlt
} from "react-icons/fa";
import { FaGasPump } from "react-icons/fa";

const BomberoRecepcion = () => {
  const [tipoRecepcion, setTipoRecepcion] = useState('estanques_fijos');
  
  // Opciones de recepción
  const tiposRecepcion = [
    {
      id: 'estanques_fijos',
      titulo: 'Tradicional',
      descripcion: 'Estanques Fijos',
      icon: <FaGasPump className="w-5 h-5" />,
      disponible: true
    },
    {
      id: 'estanque_movil',
      titulo: 'Móvil',
      descripcion: 'Estanque Móvil',
      icon: <FaTruck className="w-5 h-5" />,
      disponible: true
    },
    {
      id: 'trasvasije',
      titulo: 'Trasvasije',
      descripcion: 'Redistribuir',
      icon: <FaExchangeAlt className="w-5 h-5" />,
      disponible: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Título principal */}
      <div className="bg-white border-b border-gray-200 px-4 py-10">
        <h1 className="text-xl font-bold text-gray-800 text-center">
          Recepción de Combustible
        </h1>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {tiposRecepcion.map((tipo) => (
            <button
              key={tipo.id}
              className={`
                flex-1 p-4 text-center border-b-2 transition-colors
                ${tipoRecepcion === tipo.id
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                }
                ${!tipo.disponible && 'opacity-50 cursor-not-allowed'}
              `}
              onClick={() => tipo.disponible && setTipoRecepcion(tipo.id)}
              disabled={!tipo.disponible}
            >
              <div className="flex flex-col items-center space-y-1">
                {tipo.icon}
                <div className="text-xs font-medium">{tipo.titulo}</div>
                <div className="text-xs opacity-75">{tipo.descripcion}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del formulario */}
      <div className="">
        {tipoRecepcion === 'estanques_fijos' && <FormRecepcionFijos />}
        {tipoRecepcion === 'estanque_movil' && <FormRecepcionMovil />}
        {tipoRecepcion === 'trasvasije' && (
          <div className="text-center py-16 text-gray-500">
            <div className="mb-4 text-4xl">🚧</div>
            <p className="font-medium">Funcionalidad en desarrollo</p>
            <p className="text-sm mt-1">Próximamente disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BomberoRecepcion;