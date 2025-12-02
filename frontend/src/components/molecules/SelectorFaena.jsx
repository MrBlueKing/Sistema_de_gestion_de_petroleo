import React, { useState, useEffect, useRef } from "react";
import { FaMapMarkerAlt, FaChevronDown, FaCheck, FaSpinner } from "react-icons/fa";
import axios from "../../lib/axios";
import { FAENA_COLORS } from "../../context/faenaColor";

const SelectorFaena = ({ faenaActual, onFaenaChange }) => {
  const [faenas, setFaenas] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);
  const dropdownRef = useRef(null);

  // Usar colores del sistema centralizado
  const FAENAS_INFO = Object.fromEntries(
    Object.entries(FAENA_COLORS).map(([id, data]) => [
      id,
      {
        nombre: data.name,
        ubicacion: data.name,
        detalle: data.region,
        color: data.icon.replace('text-', ''),
        emoji: data.emoji
      }
    ])
  );

  // Cargar faenas disponibles
  useEffect(() => {
    const cargarFaenas = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/user-faenas');
        console.log('📍 SelectorFaena - Respuesta API faenas:', response.data);
        if (response.data.success) {
          console.log('📍 SelectorFaena - Faenas recibidas:', response.data.faenas);
          console.log('📍 SelectorFaena - Cantidad de faenas:', response.data.faenas.length);
          setFaenas(response.data.faenas);
        } else {
          console.warn('📍 SelectorFaena - Respuesta sin success:', response.data);
        }
      } catch (error) {
        console.error('❌ SelectorFaena - Error al cargar faenas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarFaenas();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCambiarFaena = async (faenaId) => {
    if (faenaId === faenaActual) {
      setIsOpen(false);
      return;
    }

    setChanging(true);
    try {
      const response = await axios.post('/api/user-faenas/cambiar-activa', {
        faena_id: faenaId
      });

      if (response.data.success) {
        onFaenaChange(faenaId, response.data.faena);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error al cambiar faena:', error);
      alert('Error al cambiar la faena. Intente nuevamente.');
    } finally {
      setChanging(false);
    }
  };

  const getFaenaInfo = (faenaId) => {
    return FAENAS_INFO[faenaId] || {
      nombre: `Faena ${faenaId}`,
      ubicacion: `Faena ${faenaId}`,
      detalle: "Ubicación desconocida",
      color: "gray-600"
    };
  };

  const faenaActualInfo = getFaenaInfo(faenaActual);

  console.log('🎯 SelectorFaena - Props:', { faenaActual, faenas, loading });

  // Si solo hay una faena, mostrar sin dropdown
  if (faenas.length <= 1) {
    console.log('🎯 SelectorFaena - Mostrando sin dropdown (solo 1 faena)');
    return (
      <div className="flex items-center text-xs md:text-sm mt-0.5 md:mt-0">
        <FaMapMarkerAlt className={`text-${faenaActualInfo.color} mr-1 flex-shrink-0`} size={10} />
        <span className="font-medium truncate">{faenaActualInfo.ubicacion}</span>
        <span className="hidden md:inline text-gray-500 ml-1">• {faenaActualInfo.detalle}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || changing}
        className="flex items-center text-xs md:text-sm mt-0.5 md:mt-0 hover:bg-gray-100 rounded px-2 py-1 transition-colors group"
      >
        <FaMapMarkerAlt className={`text-${faenaActualInfo.color} mr-1 flex-shrink-0`} size={10} />
        <span className="font-medium truncate">{faenaActualInfo.ubicacion}</span>
        <span className="hidden md:inline text-gray-500 ml-1">• {faenaActualInfo.detalle}</span>

        {changing ? (
          <FaSpinner className="ml-2 animate-spin text-gray-400" size={12} />
        ) : (
          <FaChevronDown
            className={`ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            size={12}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && !loading && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] md:min-w-[250px]">
          <div className="py-1">
            {faenas.map((faena) => {
              const info = getFaenaInfo(faena.id_faena);
              const isSelected = faena.id_faena === faenaActual;

              return (
                <button
                  key={faena.id_faena}
                  onClick={() => handleCambiarFaena(faena.id_faena)}
                  disabled={changing}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  } ${changing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center">
                    <FaMapMarkerAlt className={`text-${info.color} mr-2`} size={12} />
                    <div>
                      <div className="font-medium text-sm">{info.ubicacion}</div>
                      <div className="text-xs text-gray-500">{info.detalle}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <FaCheck className="text-blue-600 ml-2" size={14} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorFaena;
