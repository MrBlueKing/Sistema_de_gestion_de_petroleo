import React, { useState, useEffect } from "react";
import { FaCalculator, FaHistory } from "react-icons/fa";
import { FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi";
import { gerenteService } from "../../context/apiService";

const SimpleKpiCalculator = ({ 
  onCalculate,
  periodo = "mensual", 
  faena = "todas",
  setPeriodo,
  setFaena
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [valores, setValores] = useState({
    toneladas: "",
    camionadas: "",
    // Estos valores se mantienen pero no se muestran al usuario
    litros_petroleo: 12500,
    horas: 720,
    kilometros: 8500,
    concentracion: 1.23,
    costo_litro: 850,
  });

  // Estado para controlar actualizaciones
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [puedeActualizar, setPuedeActualizar] = useState(true);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [historialVisible, setHistorialVisible] = useState(false);
  const [historialActualizaciones, setHistorialActualizaciones] = useState([]);

  // Verificar si puede actualizar
  useEffect(() => {
    const verificarPermisoActualizacion = async () => {
      try {
        const response = await gerenteService.verificarPermisoActualizacion();
        setPuedeActualizar(response.puedeActualizar);
        setUltimaActualizacion(response.ultimaActualizacion);
        setTiempoRestante(response.tiempoRestante || 0);
        
        // Si hay historial disponible en la respuesta
        if (response.historial) {
          setHistorialActualizaciones(response.historial);
        } else {
          // Cargar historial por separado
          try {
            const historialRes = await gerenteService.obtenerHistorialActualizaciones({
              faena,
              periodo,
              limite: 5 // últimas 5 actualizaciones
            });
            if (historialRes && historialRes.data) {
              setHistorialActualizaciones(historialRes.data);
            }
          } catch (histErr) {
            console.error('Error al obtener historial:', histErr);
          }
        }
      } catch (error) {
        console.error('Error al verificar permisos de actualización:', error);
      }
    };

    verificarPermisoActualizacion();
    
    // Actualizar el contador cada segundo
    const interval = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          setPuedeActualizar(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [faena, periodo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Convertir a número si es un campo numérico
    const parsedValue = !isNaN(value) && value !== "" ? parseFloat(value) : value;
    setValores({ ...valores, [name]: parsedValue });
    
    // Limpiar mensajes de error cuando el usuario comienza a escribir
    if (error) {
      setError(null);
    }
  };

  const formatearTiempoRestante = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setValores({
      ...valores,
      toneladas: "",
      camionadas: ""
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que se hayan ingresado los datos requeridos
    if (!valores.toneladas && !valores.camionadas) {
      setError("Debe ingresar al menos las toneladas extraídas o el número de camionadas.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Verificar si puede actualizar
      if (!puedeActualizar) {
        setError(`No puede actualizar hasta dentro de ${formatearTiempoRestante(tiempoRestante)}`);
        setLoading(false);
        return;
      }

      // Llamar a la API para calcular los KPIs
      const kpisCalculados = await gerenteService.calcularKpis({
        valores_entrada: valores,
        periodo,
        faena
      });

      // Mostrar mensaje de éxito
      setSuccess("KPIs calculados correctamente");
      setTimeout(() => setSuccess(null), 3000);

      // Notificar al componente padre sobre los KPIs calculados
      if (onCalculate && typeof onCalculate === 'function') {
        onCalculate(kpisCalculados);
      }

      // Actualizar estado después de una actualización exitosa
      if (kpisCalculados.status === 'success' && kpisCalculados.proximaActualizacion) {
        setPuedeActualizar(false);
        setUltimaActualizacion(new Date());
        const proxActualiza = new Date(kpisCalculados.proximaActualizacion);
        const tiempoRestanteMs = Math.max(0, proxActualiza - new Date());
        setTiempoRestante(Math.floor(tiempoRestanteMs / 1000));
        
        // Actualizar historial con la nueva entrada
        if (kpisCalculados.actualizacion) {
          setHistorialActualizaciones([
            kpisCalculados.actualizacion,
            ...historialActualizaciones.slice(0, 4) // Mantener solo los últimos 5
          ]);
        }
        
        // Limpiar formulario tras éxito
        resetForm();
      }

    } catch (err) {
      console.error("Error al calcular KPIs:", err);
      setError("No se pudieron calcular los KPIs. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FaCalculator className="text-orange-500 mr-2" size={24} />
          <h3 className="text-xl font-semibold">Calculadora de KPIs</h3>
        </div>
        
        <button 
          type="button"
          onClick={() => setHistorialVisible(!historialVisible)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <FaHistory className="mr-1" />
          {historialVisible ? 'Ocultar historial' : 'Ver historial'}
        </button>
      </div>

      {/* Historial de actualizaciones */}
      {historialVisible && historialActualizaciones.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="font-medium mb-2 text-gray-700 flex items-center">
            <FiInfo className="mr-1" /> Últimas actualizaciones
          </h4>
          <div className="text-sm max-h-40 overflow-y-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Fecha</th>
                  <th className="text-left py-1">Faena</th>
                  <th className="text-right py-1">Toneladas</th>
                  <th className="text-right py-1">Camionadas</th>
                </tr>
              </thead>
              <tbody>
                {historialActualizaciones.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-100">
                    <td className="py-1">{new Date(item.fecha).toLocaleString()}</td>
                    <td className="py-1">{item.faena === 'todas' ? 'Todas' : 
                        item.faena === '1' ? 'Cabildo' : 
                        item.faena === '2' ? 'Catemu' : 
                        item.faena === '3' ? 'Chincolco' : 
                        item.faena === '4' ? 'Tiltil' : item.faena}</td>
                    <td className="py-1 text-right">{item.toneladas?.toLocaleString() || '-'}</td>
                    <td className="py-1 text-right">{item.camionadas?.toLocaleString() || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado de actualización */}
      {!puedeActualizar && tiempoRestante > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md flex items-start">
          <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Límite de actualización</p>
            <p className="text-sm">
              La próxima actualización estará disponible en: {formatearTiempoRestante(tiempoRestante)}
            </p>
          </div>
        </div>
      )}

      {ultimaActualizacion && puedeActualizar && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
          <FiCheckCircle className="mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Actualización disponible</p>
            <p className="text-sm">
              Última actualización: {new Date(ultimaActualizacion).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <FiCheckCircle className="mr-2" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Configuración general - Usando los props del componente padre */}
          <div className="md:col-span-2 p-4 bg-gray-50 rounded-md mb-2">
            <h4 className="font-medium mb-2">Configuración</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  name="periodo"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faena
                </label>
                <select
                  name="faena"
                  value={faena}
                  onChange={(e) => setFaena(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="todas">Todas las faenas</option>
                  <option value="1">Cabildo</option>
                  <option value="2">Catemu</option>
                  <option value="3">Chincolco</option>
                  <option value="4">Tiltil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Solo los inputs de toneladas y camionadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Toneladas Extraídas
            </label>
            <input
              type="number"
              name="toneladas"
              value={valores.toneladas || ""}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              min="0"
              step="100"
              placeholder="Ej: 45200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Camionadas
            </label>
            <input
              type="number"
              name="camionadas"
              value={valores.camionadas || ""}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              min="0"
              step="1"
              placeholder="Ej: 820"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Limpiar
          </button>
          
          <button
            type="submit"
            className={`px-4 py-2 ${!puedeActualizar ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-md transition-colors flex items-center`}
            disabled={loading || !puedeActualizar}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
                Calculando...
              </>
            ) : !puedeActualizar ? (
              <>
                <FaCalculator className="mr-2" />
                Espere {formatearTiempoRestante(tiempoRestante)}
              </>
            ) : (
              <>
                <FaCalculator className="mr-2" />
                Calcular KPIs
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimpleKpiCalculator;