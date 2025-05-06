import React, { useState, useEffect } from "react";
import { FaCalculator, FaHistory } from "react-icons/fa";
import { FiCheckCircle, FiInfo, FiAlertCircle } from "react-icons/fi";
import { gerenteService } from "../../context/apiService";

const SimpleKpiCalculator = ({
  onCalculate,
  periodo = "mensual",
  faena = "todas",
  setPeriodo,
  setFaena
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Estado para los campos de entrada
  const [valores, setValores] = useState({
    toneladas: "",
    camionadas: "",
    litros_petroleo: "",
    horas: "",
    kilometros: "",
    concentracion: "",
    costo_litro: "",
  });

  // Estado para controlar el historial
  const [historialVisible, setHistorialVisible] = useState(false);
  const [historialActualizaciones, setHistorialActualizaciones] = useState([]);

  // Cargar historial de actualizaciones desde la API
  useEffect(() => {
    const cargarHistorial = async () => {
      setLoading(true);
      try {
        // Intentar obtener el historial real desde la API
        const historialRes = await gerenteService.obtenerHistorialActualizaciones({
          faena,
          periodo,
          limite: 5 // últimas 5 actualizaciones
        });
        
        if (historialRes && historialRes.data) {
          setHistorialActualizaciones(historialRes.data);
        } else {
          // Si la API responde pero no hay datos
          setHistorialActualizaciones([]);
        }
      } catch (histErr) {
        console.error('Error al obtener historial:', histErr);
        // Si falla la petición, simplemente mostrar un array vacío
        setHistorialActualizaciones([]);
        setError("No se pudo cargar el historial de actualizaciones. Verifique la conexión.");
      } finally {
        setLoading(false);
      }
    };

    // Cargar historial
    cargarHistorial();
  }, [faena, periodo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Convertir a número si es un campo numérico y no está vacío
    const parsedValue = value !== "" ? parseFloat(value) : value;
    setValores({ ...valores, [name]: parsedValue });
  };

  const resetForm = () => {
    setValores({
      toneladas: "",
      camionadas: "",
      litros_petroleo: "",
      horas: "",
      kilometros: "",
      concentracion: "",
      costo_litro: ""
    });
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que haya al menos un dato
    if (!valores.toneladas && !valores.camionadas) {
      setError("Ingrese al menos un valor (toneladas o camionadas)");
      return;
    }

    try {
      setLoading(true);
      setSuccess(null);
      setError(null);

      // Intentar llamar a la API para cálculos reales
      const resultadoAPI = await gerenteService.calcularKpis({
        valores_entrada: valores,
        periodo,
        faena
      });

      // Verificar si la API respondió correctamente
      if (resultadoAPI && resultadoAPI.status === 'success') {
        // Usar los datos reales de la API
        setSuccess("KPIs calculados correctamente");
        
        // Notificar al componente padre con los datos reales de la API
        if (onCalculate && typeof onCalculate === 'function') {
          onCalculate(resultadoAPI);
        }

        // Actualizar historial con la nueva entrada (solo si es exitoso)
        const nuevaEntrada = {
          fecha: new Date().toISOString(),
          faena: faena,
          toneladas: valores.toneladas || 0,
          camionadas: valores.camionadas || 0
        };

        setHistorialActualizaciones([
          nuevaEntrada,
          ...historialActualizaciones.slice(0, 4) // Mantener solo los últimos 5
        ]);

        // Limpiar formulario tras éxito
        resetForm();
      } else {
        // Si la API respondió pero con errores
        setError(resultadoAPI.message || "Error en el cálculo de KPIs. Intente nuevamente.");
      }
    } catch (err) {
      console.error("Error al calcular KPIs:", err);
      setError("No se pudieron calcular los KPIs. Verifique la conexión con el servidor.");
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
          disabled={historialActualizaciones.length === 0}
        >
          <FaHistory className="mr-1" />
          {historialVisible ? 'Ocultar historial' : 'Ver historial'}
        </button>
      </div>

      {/* Información sobre la calculadora */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-blue-800 text-sm">
        <FiInfo className="inline-block mr-2" />
        Esta calculadora permite actualizar los KPIs con valores reales. Los datos ingresados se procesarán en el servidor para calcular los indicadores en el dashboard.
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

      {/* Mostrar un mensaje cuando no hay historial */}
      {historialVisible && historialActualizaciones.length === 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-center text-gray-500">
          No hay actualizaciones recientes en el historial.
        </div>
      )}

      {/* Mensajes de éxito y error */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <FiCheckCircle className="mr-2" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Toneladas y camionadas */}
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
              placeholder="Toneladas"
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
              placeholder="Camionadas"
            />
          </div>
        </div>

        {/* Campos adicionales (opcionales) */}
        <div className="mb-4">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer font-medium mb-2">Datos adicionales (opcionales)</summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 p-3 bg-gray-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Litros de Petróleo
                </label>
                <input
                  type="number"
                  name="litros_petroleo"
                  value={valores.litros_petroleo || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Litros totales"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas Trabajadas
                </label>
                <input
                  type="number"
                  name="horas"
                  value={valores.horas || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Horas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilómetros Recorridos
                </label>
                <input
                  type="number"
                  name="kilometros"
                  value={valores.kilometros || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Kilómetros"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concentración Mineral
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="concentracion"
                  value={valores.concentracion || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ley mineral"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo por Litro
                </label>
                <input
                  type="number"
                  name="costo_litro"
                  value={valores.costo_litro || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="$ por litro"
                />
              </div>
            </div>
          </details>
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
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
                Calculando...
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