import React, { useState } from 'react';
import { FaHistory, FaChevronDown, FaChevronUp, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const HistorialCollapsible = ({ 
  ultimoConsumo, 
  penultimoConsumo, 
  tipoMedicion, 
  loading, 
  error,
  cantidadConsumos 
}) => {
  const [expandido, setExpandido] = useState(true); // ✅ ABIERTO POR DEFECTO

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-sm text-gray-600">Cargando historial...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" size={14} />
          <span className="text-sm text-red-600">Error al cargar historial</span>
        </div>
      </div>
    );
  }

  if (!ultimoConsumo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <FaInfoCircle className="text-yellow-600 mr-2" size={14} />
          <span className="text-sm text-yellow-800 font-medium">Primera carga de esta máquina</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4 shadow-sm">
      {/* HEADER CLICKEABLE */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setExpandido(!expandido);
        }}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <FaHistory className="text-green-600" size={14} />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-800 text-sm">
              Historial de Mediciones
            </div>
            <div className="text-xs text-gray-500">
              Últimas 2 mediciones
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          {/* PREVIEW de la última medición */}
          <div className="text-right mr-3">
            <div className="text-sm font-bold text-green-600">
              {tipoMedicion === 'Horometro' 
                ? `${ultimoConsumo.medicion?.toFixed(1)} hrs`
                : `${Math.round(ultimoConsumo.medicion).toLocaleString()} km`
              }
            </div>
            <div className="text-xs text-gray-500">Última medición</div>
          </div>
          
          {expandido ? (
            <FaChevronUp className="text-gray-400" size={12} />
          ) : (
            <FaChevronDown className="text-gray-400" size={12} />
          )}
        </div>
      </button>

      {/* CONTENIDO EXPANDIBLE */}
      {expandido && (
        <div className="px-3 pb-3">
          <div className="space-y-3">
            {/* ÚLTIMO CONSUMO */}
            {ultimoConsumo && (
              <div className="rounded-lg p-3 bg-green-50 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                    🔥 ÚLTIMA MEDICIÓN
                  </span>
                  <div className="text-xs text-gray-500">
                    📅 {ultimoConsumo.fecha_formateada}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-500">MEDICIÓN</div>
                    <div className="font-bold text-green-600">
                      {tipoMedicion === 'Horometro' 
                        ? `${ultimoConsumo.medicion?.toFixed(1)} hrs`
                        : `${Math.round(ultimoConsumo.medicion).toLocaleString()} km`
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">COMBUSTIBLE</div>
                    <div className="font-semibold text-orange-600">
                      {ultimoConsumo.litros_consumidos?.toFixed(1)} L
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">UBICACIÓN</div>
                    <div className="font-medium text-blue-600 text-xs">
                      {ultimoConsumo.faena_ubicacion}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PENÚLTIMO CONSUMO - Solo si existe */}
            {penultimoConsumo && (
              <div className="rounded-lg p-3 bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500 text-white">
                    📋 MEDICIÓN ANTERIOR
                  </span>
                  <div className="text-xs text-gray-500">
                    📅 {penultimoConsumo.fecha_formateada}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-500">MEDICIÓN</div>
                    <div className="font-bold text-gray-600">
                      {tipoMedicion === 'Horometro' 
                        ? `${penultimoConsumo.medicion?.toFixed(1)} hrs`
                        : `${Math.round(penultimoConsumo.medicion).toLocaleString()} km`
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">COMBUSTIBLE</div>
                    <div className="font-semibold text-orange-600">
                      {penultimoConsumo.litros_consumidos?.toFixed(1)} L
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">UBICACIÓN</div>
                    <div className="font-medium text-blue-600 text-xs">
                      {penultimoConsumo.faena_ubicacion}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialCollapsible;