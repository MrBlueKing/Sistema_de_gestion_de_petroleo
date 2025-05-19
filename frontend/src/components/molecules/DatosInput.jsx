import React from 'react';

const DatosInput = ({ horometro, cargas, setHorometro, setCargas }) => {
  const handleChange = (setter, index, value) => {
    setter(prev => {
      const nuevo = [...prev];
      nuevo[index] = parseFloat(value) || 0;
      return nuevo;
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2 text-blue-700">🔧 Editar Datos</h2>
      <div className="grid grid-cols-2 gap-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="space-y-1">
            <label className="text-sm font-medium">Día {i + 1}</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="border px-2 py-1 rounded w-1/2"
                value={horometro[i]}
                onChange={e => handleChange(setHorometro, i, e.target.value)}
              />
              <input
                type="number"
                className="border px-2 py-1 rounded w-1/2"
                value={cargas[i]}
                onChange={e => handleChange(setCargas, i, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatosInput;
