import React from 'react';
import Button from '../../atoms/Button/Button'; // Asumiendo que tienes este componente

const Main = () => {
  return (
    <div className="flex flex-col items-center justify-start bg-gray-100 h-screen p-4">
            
      {/* Botones */}
      <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-xs mt-12">
        <Button 
          text="Recepción Petróleo" 
          onClick={() => console.log('Recepción Petróleo')} 
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-full w-full shadow-md"
        />
        <Button 
          text="Cargar Combustible" 
          onClick={() => console.log('Cargar Combustible')} 
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-full w-full shadow-md"
        />
      </div>
    </div>
  );
};

export default Main;