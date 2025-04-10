
import React, { useState } from 'react';
import { 
  FaBars, FaBell, FaUser, FaOilCan, FaTint, FaChevronRight, FaHome, FaCog, FaSignOutAlt, 
  FaUsers, FaChartBar, FaTruck, FaFileAlt, FaCalendarAlt, FaChartPie, FaExclamationTriangle, 
  FaInfoCircle, FaSearch, FaPlus, FaFilter, FaEllipsisH, FaArrowUp, FaArrowDown, FaMinus
} from 'react-icons/fa';

const GerentePage = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationCount] = useState(5);
    const [currentDate] = useState(new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    
    const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
    };
  
    return (
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen`}>
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-500 p-1 rounded-md">
                <FaOilCan className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FuelPro</span>
              <span className="text-xs font-semibold bg-green-500 text-white px-2 py-1 rounded-full">Admin</span>
            </div>
          </div>
          <div className="p-4">
            <div className="px-4 py-3 bg-gray-800 rounded-lg mb-4">
              <div className="text-sm text-gray-400">Administrador</div>
              <div className="text-md font-medium text-white">Juan Pérez</div>
            </div>
            <nav className="space-y-1">
              <a href="#" className="flex items-center px-4 py-3 text-white bg-gray-800 rounded-lg">
                <FaHome className="h-5 w-5 mr-3 text-orange-500" />
                <span>Dashboard</span>
              </a>
              <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                <FaUsers className="h-5 w-5 mr-3 text-gray-400" />
                <span>Usuarios</span>
              </a>
              <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                <FaTruck className="h-5 w-5 mr-3 text-gray-400" />
                <span>Proveedores</span>
              </a>
              <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                <FaChartBar className="h-5 w-5 mr-3 text-gray-400" />
                <span>Reportes</span>
              </a>
              <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                <FaFileAlt className="h-5 w-5 mr-3 text-gray-400" />
                <span>Facturas</span>
              </a>
              <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                <FaCog className="h-5 w-5 mr-3 text-gray-400" />
                <span>Configuración</span>
              </a>
              <a href="#" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                <FaSignOutAlt className="h-5 w-5 mr-3 text-gray-400" />
                <span>Cerrar Sesión</span>
              </a>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between h-16 px-6 bg-white shadow-sm">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden"
              >
                <FaBars className="h-6 w-6" />
              </button>
              <div className="ml-6 hidden md:block">
                <h2 className="text-lg font-medium text-gray-800">{currentDate}</h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                    placeholder="Buscar..."
                  />
                </div>
              </div>
              <div className="relative">
                <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                  <FaBell className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-full">
                  <FaUser className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </div>
          </header>
          
          {/* Main */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-6xl mx-auto">
              {/* Dashboard Header */}
              <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">Panel de Administración</h1>
                  <p className="text-gray-500">Gestión general del sistema de combustible</p>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-3">
                  <button className="bg-white border border-gray-300 rounded-md px-4 py-2 flex items-center text-gray-700 hover:bg-gray-50">
                    <FaFilter className="h-4 w-4 mr-2" />
                    <span>Filtrar</span>
                  </button>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-4 py-2 flex items-center">
                    <FaPlus className="h-4 w-4 mr-2" />
                    <span>Nuevo Reporte</span>
                  </button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Petróleo Total</div>
                      <div className="text-2xl font-bold text-gray-800">12,540 L</div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FaOilCan className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-500 font-medium flex items-center">
                      <FaArrowUp className="w-3 h-3 mr-1" />
                      3.2%
                    </span>
                    <span className="text-gray-500 ml-2">vs. mes anterior</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Combustible Disponible</div>
                      <div className="text-2xl font-bold text-gray-800">8,320 L</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <FaTint className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-red-500 font-medium flex items-center">
                      <FaArrowDown className="w-3 h-3 mr-1" />
                      1.8%
                    </span>
                    <span className="text-gray-500 ml-2">vs. mes anterior</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Transacciones</div>
                      <div className="text-2xl font-bold text-gray-800">284</div>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <FaFileAlt className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-500 font-medium flex items-center">
                      <FaArrowUp className="w-3 h-3 mr-1" />
                      12.5%
                    </span>
                    <span className="text-gray-500 ml-2">vs. mes anterior</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Alertas Activas</div>
                      <div className="text-2xl font-bold text-gray-800">5</div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <FaExclamationTriangle className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <button className="text-orange-500 text-sm font-medium hover:text-orange-600">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Consumo Semanal</h2>
                    <button className="text-gray-500 hover:text-gray-700">
                      <FaEllipsisH className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    {/* Placeholder for chart */}
                    <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <FaChartBar className="h-16 w-16 text-gray-300" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Distribución de Uso</h2>
                    <button className="text-gray-500 hover:text-gray-700">
                      <FaEllipsisH className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    {/* Placeholder for chart */}
                    <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <FaChartPie className="h-16 w-16 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Actividad Reciente</h2>
                    <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                      Ver Todos
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        { id: "TRX-4932", type: "Recepción", user: "Carlos Ruiz", amount: "1,200 L", date: "10 Abr, 2025", status: "Completado" },
                        { id: "TRX-4931", type: "Carga", user: "María López", amount: "350 L", date: "10 Abr, 2025", status: "Completado" },
                        { id: "TRX-4930", type: "Recepción", user: "Roberto García", amount: "800 L", date: "09 Abr, 2025", status: "Pendiente" },
                        { id: "TRX-4929", type: "Carga", user: "Ana Martínez", amount: "420 L", date: "09 Abr, 2025", status: "Completado" },
                        { id: "TRX-4928", type: "Carga", user: "Pedro Sánchez", amount: "180 L", date: "08 Abr, 2025", status: "Cancelado" },
                      ].map((transaction, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === "Recepción" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.user}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.status === "Completado" ? "bg-green-100 text-green-800" : 
                              transaction.status === "Pendiente" ? "bg-yellow-100 text-yellow-800" : 
                              "bg-red-100 text-red-800"
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-orange-500 hover:text-orange-600">
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Anterior
                    </button>
                    <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de <span className="font-medium">24</span> resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          <span className="sr-only">Anterior</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-orange-500 hover:bg-gray-50">
                          1
                        </button>
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          2
                        </button>
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          3
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-50 text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          8
                        </button>
                        <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          <span className="sr-only">Siguiente</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Alerts Section */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Alertas del Sistema</h2>
                </div>
                <div className="p-6">
                  <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Nivel bajo de combustible (Tanque 2)</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>El nivel actual está por debajo del 15%. Se recomienda recargar pronto.</p>
                        </div>
                        <div className="mt-3">
                          <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200">
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Problema en bomba principal</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>Se ha detectado un rendimiento anormal en la bomba principal. Requiere mantenimiento urgente.</p>
                        </div>
                        <div className="mt-3">
                          <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200">
                            Crear orden de servicio
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaInfoCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Mantenimiento programado</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Mantenimiento programado para el 15 de abril, 2025. Los sistemas estarán offline desde 22:00 hasta 02:00.</p>
                        </div>
                        <div className="mt-3">
                          <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200">
                            Ver calendario
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
};  

export default GerentePage;
