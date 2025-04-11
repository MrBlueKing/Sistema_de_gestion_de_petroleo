// Descripcion: este componente se encarga de mostrar un mensaje de carga en la pantalla
import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";

const Loading = ({ isLoading, message = "Cargando..." }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Small delay before showing loader to avoid flashing on quick loads
    let timer;
    if (isLoading) {
      timer = setTimeout(() => setVisible(true), 300);
    } else {
      setVisible(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  if (!isLoading && !visible) return null;
  
  return (
    <div className={`fixed inset-0 z-50 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center transform transition-all duration-500">
        <div className="relative">
          {/* Outer spinner ring */}
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-opacity-30"></div>
          {/* Inner spinning element */}
          <FaSpinner className="animate-spin text-orange-500 text-4xl relative z-10" />
        </div>
        
        <div className="mt-4 flex flex-col items-center">
          <p className="text-gray-800 font-medium text-center">{message}</p>
          <div className="mt-2 flex space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;