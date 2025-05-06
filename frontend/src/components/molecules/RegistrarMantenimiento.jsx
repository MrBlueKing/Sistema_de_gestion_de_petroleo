import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiTool, FiCalendar, FiClock, FiFileText, FiSave, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../../lib/axios';

const RegistrarMantenimiento = ({ idMaquina, onClose, onSuccess }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [maquina, setMaquina] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    fecha_mantencion: new Date().toISOString().split('T')[0],
    horas_kilometros_actuales: '',
    observaciones: ''
  });

  // Usar idMaquina de props o de params (para compatibilidad)
  const actualIdMaquina = idMaquina || params?.idMaquina;

  useEffect(() => {
    const cargarDatosMaquina = async () => {
      try {
        setLoading(true);
        setError(null);
        // Cargar datos de la máquina y su última medición
        const response = await api.get(`/mantenimiento/historial/${actualIdMaquina}`);
        
        if (response.data && response.data.data) {
          setMaquina(response.data.data);
          
          // Pre-cargar la última medición en el formulario
          setFormData({
            ...formData,
            horas_kilometros_actuales: response.data.data.ultima_medicion || ''
          });
        } else {
          setError('No se encontraron datos de la máquina');
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('No se pudieron cargar los datos de la máquina');
      } finally {
        setLoading(false);
      }
    };

    if (actualIdMaquina) {
      cargarDatosMaquina();
    } else {
      setLoading(false);
    }
  }, [actualIdMaquina]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      
      // Validar que la medición actual sea mayor que cero
      if (parseFloat(formData.horas_kilometros_actuales) <= 0) {
        setError('La medición actual debe ser mayor que cero');
        return;
      }
      
      // Enviar datos al servidor
      const response = await api.post('/mantenimiento/registrar', {
        id_maquina: actualIdMaquina,
        ...formData
      });
      
      // Mostrar mensaje de éxito
      setSuccessMessage('Mantenimiento registrado con éxito');
      
      // Si hay un callback de éxito en las props, usarlo
      if (typeof onSuccess === 'function') {
        setTimeout(() => {
          onSuccess('Mantenimiento registrado con éxito');
        }, 1500);
      } else {
        // Si no hay callback pero hay navigate, redirigir después de un momento
        setTimeout(() => {
          navigate && navigate(`/maquinas/detalle/${actualIdMaquina}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error al registrar mantenimiento:', error);
      setError('Error al registrar el mantenimiento: ' + 
        (error.response?.data?.message || error.message || 'Error desconocido'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <FiTool className="text-blue-500 mr-3" size={24} />
          <h2 className="text-xl font-semibold">Cargando datos...</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FiTool className="text-blue-500 mr-3" size={24} />
          <h2 className="text-xl font-semibold">
            Registrar Mantenimiento {maquina?.maquina && `- ${maquina.maquina.nombre} (${maquina.maquina.patente || 'Sin patente'})`}
          </h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX size={24} />
          </button>
        )}
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md border border-red-200">
          <div className="flex">
            <FiAlertCircle className="text-red-500 mr-2" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Mensajes de éxito */}
      {successMessage && (
        <div className="mb-6 bg-green-50 p-4 rounded-md border border-green-200">
          <div className="flex">
            <FiCheckCircle className="text-green-500 mr-2" size={20} />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}
      
      {maquina ? (
        <>
          <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Información de la máquina</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Última medición registrada:</span>
                <p className="font-semibold">{maquina?.ultima_medicion || 0} horas/km</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Último mantenimiento:</span>
                <p className="font-semibold">
                  {maquina?.mantenciones?.length > 0 ? 
                    new Date(maquina.mantenciones[0].fecha_mantencion).toLocaleDateString() : 
                    'Sin registros previos'}
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiCalendar className="inline mr-1" /> Fecha de Mantenimiento
                </label>
                <input
                  type="date"
                  name="fecha_mantencion"
                  value={formData.fecha_mantencion}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiClock className="inline mr-1" /> Medición Actual (horas/kilómetros)
                </label>
                <input
                  type="number"
                  name="horas_kilometros_actuales"
                  value={formData.horas_kilometros_actuales}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiFileText className="inline mr-1" /> Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detalles del mantenimiento realizado..."
              ></textarea>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose || (() => navigate && navigate(-1))}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-1" /> Guardar Mantenimiento
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-red-500">No se encontró información de la máquina seleccionada.</p>
          <button
            onClick={onClose || (() => navigate && navigate(-1))}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistrarMantenimiento;