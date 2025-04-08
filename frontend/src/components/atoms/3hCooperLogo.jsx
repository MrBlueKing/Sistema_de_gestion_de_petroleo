
import React from 'react';

const ThreeHCopperLogo = () => {
  return (
    <div className="flex justify-center mb-4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 bg-red-600 flex flex-col justify-center items-center">
          <span className="text-white text-3xl font-bold">3H</span>
          <span className="text-white text-sm font-bold">COPPER</span>
        </div>
        <div className="absolute top-3 right-3 w-4 h-4 bg-orange-400 rounded-full"></div>
      </div>
    </div>
  );
}

export default ThreeHCopperLogo;