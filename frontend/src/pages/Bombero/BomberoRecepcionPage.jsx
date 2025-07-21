import React, { useState } from "react";
import Header from "../../components/organisms/Bombero/Header";
import UniversalHeader from "../../components/organisms/Todos/UniversalHeader";
import BomberoFormLayout from "../../components/templates/Bombero/BomberoFormRecepcion";

import { FaExchangeAlt } from "react-icons/fa";
import { RiOilFill } from "react-icons/ri";
import { FaGasPump } from "react-icons/fa";

const BomberoRecepcionPage = () => {
  // 🔧 CAMBIAR los IDs para que coincidan con el componente unificado
  const [tipoRecepcion, setTipoRecepcion] = useState('recepcion');

  // 🔧 ACTUALIZAR los IDs en el array
  const tiposRecepcion = [
    {
      id: 'recepcion',        // 👈 Cambio: era 'estanques_fijos'
      titulo: 'Tradicional',
      descripcion: 'Estanques Fijos',
      icon: <FaGasPump className="w-5 h-5" />,
      disponible: true
    },
    {
      id: 'movil',           // 👈 Cambio: era 'estanque_movil'
      titulo: 'Móvil',
      descripcion: 'Estanque Móvil',
      icon: <RiOilFill className="w-5 h-5" />,
      disponible: true
    },
    {
      id: 'trasvasije',      // 👈 Este se mantiene igual
      titulo: 'Trasvasije',
      descripcion: 'Redistribuir',
      icon: <FaExchangeAlt className="w-5 h-5" />,
      disponible: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-5">
       <UniversalHeader type="bombero" />
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

      {/* 🎯 CONTENIDO SIMPLIFICADO - 1 línea en lugar de 3 */}
      <div className="">
        <BomberoFormLayout tipo={tipoRecepcion} />
      </div>
    </div>
  );
};

export default BomberoRecepcionPage;