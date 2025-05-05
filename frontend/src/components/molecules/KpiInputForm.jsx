import { useState, useEffect } from "react";
import {
  FiDroplet,
  FiTruck,
  FiTrendingUp,
  FiActivity,
  FiSave,
  FiRefreshCw,
  FiPlus,
  FiX,
  FiCheckCircle
} from "react-icons/fi";
import { FaFlask, FaHardHat } from "react-icons/fa";

const KpiInputForm = ({ onSaveKpis }) => {
  // Estados para almacenar los valores de KPIs
  const [kpiValues, setKpiValues] = useState({
    produccionTotal: "45200",
    leyPromedio: "1.23",
    rendimientoOperacional: "92",
    camionadas: "820",
    costoPetroleoTon: "15",
    costoPetroleoHora: "25",
    costoPetroleoKm: "0.50"
  });

  // Estado para mostrar notificación
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success" // success o error
  });

  // Estado para modal
  const [showModal, setShowModal] = useState(false);
  
  // Estado para campos personalizados
  const [customFields, setCustomFields] = useState([
    // Podemos iniciar con algunos campos personalizados comunes
    { id: 1, name: "Costo explosivos/Ton", value: "8.75", unit: "$" },
    { id: 2, name: "Horas hombre/Ton", value: "0.35", unit: "h" }
  ]);
  
  // Estado para nuevo campo personalizado
  const [newField, setNewField] = useState({
    name: "",
    value: "",
    unit: ""
  });

  // Manejador para cambios en los campos de KPI
  const handleKpiChange = (e) => {
    const { name, value } = e.target;
    setKpiValues({
      ...kpiValues,
      [name]: value
    });
  };

  // Manejador para cambios en campos personalizados
  const handleCustomFieldChange = (id, e) => {
    const { name, value } = e.target;
    setCustomFields(customFields.map(field => 
      field.id === id ? { ...field, [name]: value } : field
    ));
  };

  // Manejador para guardar los KPIs
  const handleSaveKpis = () => {
    // Aquí podrías realizar una llamada a una API para guardar los datos
    // Por ahora, simplemente actualizamos el estado y mostramos una notificación
    
    // Simulamos la propagación al componente padre
    if (onSaveKpis) {
      const allKpis = [
        {
          title: "Producción Total",
          value: kpiValues.produccionTotal,
          change: "+5%",
          unit: "ton",
          subtext: "Toneladas extraídas este mes",
          icon: FiTruck,
          isPositive: true,
          color: "blue"
        },
        {
          title: "Ley Promedio",
          value: kpiValues.leyPromedio,
          change: "-0.1%",
          unit: "%",
          subtext: "Concentración de mineral promedio",
          icon: FaFlask,
          isPositive: false,
          color: "amber"
        },
        {
          title: "Rendimiento Operacional",
          value: kpiValues.rendimientoOperacional,
          change: "-2%",
          unit: "%",
          subtext: "Eficiencia de equipos",
          icon: FiActivity,
          isPositive: false,
          color: "green"
        },
        {
          title: "Camionadas",
          value: kpiValues.camionadas,
          change: "+12",
          unit: "",
          subtext: "Número de viajes realizados",
          icon: FiTruck,
          isPositive: true,
          color: "indigo"
        },
        {
          title: "Costo Petróleo / Ton",
          value: `$${kpiValues.costoPetroleoTon}`,
          change: "+3%",
          unit: "",
          subtext: "Costo por tonelada producida",
          icon: FiDroplet,
          isPositive: false,
          color: "red"
        },
        {
          title: "Costo Petróleo / Hora",
          value: `$${kpiValues.costoPetroleoHora}`,
          change: "-1%",
          unit: "",
          subtext: "Costo por hora de operación",
          icon: FiDroplet,
          isPositive: true,
          color: "teal"
        },
        {
          title: "Costo Petróleo / Km",
          value: `$${kpiValues.costoPetroleoKm}`,
          change: "+0.5%",
          unit: "",
          subtext: "Costo por kilómetro recorrido",
          icon: FiDroplet,
          isPositive: false,
          color: "purple"
        },
        ...customFields.map((field, index) => ({
          title: field.name,
          value: field.unit ? `${field.value} ${field.unit}` : field.value,
          change: "N/A",
          unit: "",
          subtext: "Indicador personalizado",
          icon: FiActivity,
          isPositive: true,
          color: ["cyan", "pink", "lime", "sky", "emerald", "fuchsia"][index % 6]
        }))
      ];
      
      onSaveKpis(allKpis);
    }
    
    // Mostrar notificación de éxito
    setNotification({
      show: true,
      message: "KPIs actualizados correctamente",
      type: "success"
    });
    
    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
      setNotification({
        ...notification,
        show: false
      });
    }, 3000);
  };

  // Manejador para añadir campo personalizado
  const handleAddCustomField = () => {
    if (newField.name.trim() === "" || newField.value.trim() === "") {
      setNotification({
        show: true,
        message: "El nombre y valor son obligatorios",
        type: "error"
      });
      
      setTimeout(() => {
        setNotification({
          ...notification,
          show: false
        });
      }, 3000);
      
      return;
    }
    
    const id = customFields.length > 0 
      ? Math.max(...customFields.map(field => field.id)) + 1 
      : 1;
    
    setCustomFields([
      ...customFields,
      {
        id,
        ...newField
      }
    ]);
    
    // Limpiar el formulario
    setNewField({
      name: "",
      value: "",
      unit: ""
    });
    
    // Cerrar el modal
    setShowModal(false);
  };

  // Manejador para eliminar campo personalizado
  const handleRemoveCustomField = (id) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <FiActivity className="mr-2 text-orange-500" />
        Actualización de Indicadores Clave
      </h2>
      
      {/* Notificación */}
      {notification.show && (
        <div className={`mb-4 p-3 rounded-md flex items-center ${
          notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {notification.type === "success" ? (
            <FiCheckCircle className="mr-2" />
          ) : (
            <FiX className="mr-2" />
          )}
          {notification.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* KPIs Predefinidos */}
        <div className="col-span-1 space-y-4">
          <h3 className="text-md font-medium text-gray-700 border-b pb-2">Producción & Calidad</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producción Total (ton)
              </label>
              <input
                type="text"
                name="produccionTotal"
                value={kpiValues.produccionTotal}
                onChange={handleKpiChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ley Promedio (%)
              </label>
              <input
                type="text"
                name="leyPromedio"
                value={kpiValues.leyPromedio}
                onChange={handleKpiChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rendimiento Operacional (%)
              </label>
              <input
                type="text"
                name="rendimientoOperacional"
                value={kpiValues.rendimientoOperacional}
                onChange={handleKpiChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Camionadas
              </label>
              <input
                type="text"
                name="camionadas"
                value={kpiValues.camionadas}
                onChange={handleKpiChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>
        
        <div className="col-span-1 space-y-4">
          <h3 className="text-md font-medium text-gray-700 border-b pb-2">Costos de Combustible</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Petróleo / Ton ($)
              </label>
              <input
                type="text"
                name="costoPetroleoTon"
                value={kpiValues.costoPetroleoTon}
                onChange={handleKpiChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Petróleo / Hora ($)
              </label>
              <input
                type="text"
                name="costoPetroleoHora"
                value={kpiValues.costoPetroleoHora}
                onChange={handleKpiChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Petróleo / Km ($)
              </label>
              <input
                type="text"
                name="costoPetroleoKm"
                value={kpiValues.costoPetroleoKm}
                onChange={handleKpiChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>
        
        <div className="col-span-1 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-md font-medium text-gray-700">Indicadores Personalizados</h3>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center text-xs bg-orange-500 hover:bg-orange-600 text-white py-1 px-2 rounded-md"
            >
              <FiPlus className="mr-1" size={12} />
              Agregar
            </button>
          </div>
          
          <div className="space-y-3">
            {customFields.map(field => (
              <div key={field.id} className="flex items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.name}
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="value"
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(field.id, e)}
                      className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <input
                      type="text"
                      name="unit"
                      value={field.unit}
                      onChange={(e) => handleCustomFieldChange(field.id, e)}
                      placeholder="Unidad"
                      className="w-16 p-2 border border-gray-300 border-l-0 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCustomField(field.id)}
                  className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-full"
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
            
            {customFields.length === 0 && (
              <div className="text-sm text-gray-500 py-3 italic">
                No hay indicadores personalizados
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
          onClick={() => window.location.reload()}
        >
          <FiRefreshCw className="mr-2" />
          Restablecer
        </button>
        
        <button
          className="flex items-center bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md"
          onClick={handleSaveKpis}
        >
          <FiSave className="mr-2" />
          Guardar KPIs
        </button>
      </div>
      
      {/* Modal para añadir campo personalizado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Agregar Indicador Personalizado</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Indicador
                </label>
                <input
                  type="text"
                  name="name"
                  value={newField.name}
                  onChange={(e) => setNewField({...newField, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ej. Costo de Explosivos por Ton"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <div className="flex">
                  <input
                    type="text"
                    name="value"
                    value={newField.value}
                    onChange={(e) => setNewField({...newField, value: e.target.value})}
                    className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ej. 10.5"
                  />
                  <input
                    type="text"
                    name="unit"
                    value={newField.unit}
                    onChange={(e) => setNewField({...newField, unit: e.target.value})}
                    className="w-16 p-2 border border-gray-300 border-l-0 rounded-r-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Unid."
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md"
                onClick={handleAddCustomField}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiInputForm;