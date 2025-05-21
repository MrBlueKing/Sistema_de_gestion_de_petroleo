import { useState, useContext } from "react";
import SimpleKpiCalculator from "../../molecules/KpiSimpleCalculator";
import { FiCheckCircle, FiX, FiLoader } from "react-icons/fi";
import { UserContext } from "../../../context/userContext";

const MainIngresoDatos = () => {
  // Estados principales
  const periodoSeleccionado = "mensual";
  const { user } = useContext(UserContext);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Función para manejar KPIs calculados desde la calculadora
  const handleCalculatedKpis = (resultado) => {
    if (!resultado?.data) {
      setError('Los datos calculados no tienen formato válido');
      return;
    }

    try {
      // Mensajes de éxito
      setMensajeExito(`Datos ingresados correctamente para ${obtenerNombreMesAnterior()}`);
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err) {
      console.error('Error al procesar datos calculados:', err);
      setError('Error al procesar los resultados calculados');
    }
  };

  // Función auxiliar para obtener el nombre del mes anterior
  const obtenerNombreMesAnterior = () => {
    const fechaActual = new Date();
    fechaActual.setMonth(fechaActual.getMonth() - 1);
    return fechaActual.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Título de la sección */}
        <h1 className="text-2xl font-bold text-center mb-6">Ingreso de Datos</h1>

        {/* Mensajes de estado */}
        {cargando && (
          <div className="text-center py-4 bg-white rounded-lg shadow-md mb-4">
            <FiLoader className="animate-spin mx-auto h-8 w-8 text-blue-500" />
            <p className="mt-2 text-gray-600">Procesando datos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="py-1"><FiX className="h-6 w-6 text-red-500 mr-4" /></div>
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {mensajeExito && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="py-1"><FiCheckCircle className="h-6 w-6 text-green-500 mr-4" /></div>
              <div>
                <p className="font-bold">Éxito</p>
                <p>{mensajeExito}</p>
              </div>
            </div>
          </div>
        )}

        {/* Calculadora de KPIs */}
        <SimpleKpiCalculator
          onCalculate={handleCalculatedKpis}
          periodo={periodoSeleccionado}
          setLoading={setCargando}
        />
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
        <div className="container mx-auto flex justify-between items-center text-sm text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} Minera 3H.
          </div>
          <div className="flex items-center">
            <span className="mr-2">Versión 1.0.0</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainIngresoDatos;