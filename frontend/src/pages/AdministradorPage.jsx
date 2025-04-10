import { useState} from 'react';
import { 
  FaUsers, 
  FaUser, 
  FaChartBar, 
  FaChartLine, 
  FaTint, 
  FaCog, 
  FaSearch, 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaTrashAlt, 
  FaSignOutAlt 
} from 'react-icons/fa';

export default function AdministradorPage() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [users] = useState([
    { id: 1, nombre: 'Carlos Mendoza', correo: 'carlos@petrolera.com', rol: 'Supervisor', estado: 'Activo', ultimoAcceso: '10/04/2025' },
    { id: 2, nombre: 'Ana Martínez', correo: 'ana@petrolera.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: '09/04/2025' },
    { id: 3, nombre: 'Luis Ramírez', correo: 'luis@petrolera.com', rol: 'Analista', estado: 'Inactivo', ultimoAcceso: '01/04/2025' },
    { id: 4, nombre: 'María Gómez', correo: 'maria@petrolera.com', rol: 'Técnico', estado: 'Activo', ultimoAcceso: '08/04/2025' }
  ]);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [stats] = useState({
    produccionMensual: '342,580 barriles',
    inventarioActual: '45,890 barriles',
    movimientosDiarios: '37',
    usuariosActivos: '12'
  });

  const handleAddUser = () => {
    setShowUserModal(true);
  };
  
  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">PetroControl</h1>
          <p className="text-xs text-gray-400">Sistema de Control de Petróleo</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="mt-5 px-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-4 py-3 w-full text-sm rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-800' : 'hover:bg-gray-800'}`}
            >
              <FaChartBar className="h-5 w-5 mr-3" />
              Dashboard
            </button>
            
            <button 
              onClick={() => setActiveTab('usuarios')}
              className={`flex items-center px-4 py-3 w-full text-sm rounded-lg ${activeTab === 'usuarios' ? 'bg-blue-800' : 'hover:bg-gray-800'}`}
            >
              <FaUsers className="h-5 w-5 mr-3" />
              Gestión de Usuarios
            </button>
            
            <button 
              onClick={() => setActiveTab('actividad')}
              className={`flex items-center px-4 py-3 w-full text-sm rounded-lg ${activeTab === 'actividad' ? 'bg-blue-800' : 'hover:bg-gray-800'}`}
            >
              <FaChartLine className="h-5 w-5 mr-3" />
              Registros de Actividad
            </button>
            
            <button 
              onClick={() => setActiveTab('produccion')}
              className={`flex items-center px-4 py-3 w-full text-sm rounded-lg ${activeTab === 'produccion' ? 'bg-blue-800' : 'hover:bg-gray-800'}`}
            >
              <FaTint className="h-5 w-5 mr-3" />
              Producción de Petróleo
            </button>
            
            <button 
              onClick={() => setActiveTab('configuracion')}
              className={`flex items-center px-4 py-3 w-full text-sm rounded-lg ${activeTab === 'configuracion' ? 'bg-blue-800' : 'hover:bg-gray-800'}`}
            >
              <FaCog className="h-5 w-5 mr-3" />
              Configuración
            </button>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2">
              <span className="font-bold">A</span>
            </div>
            <div>
              <p className="text-sm font-medium">Admin Principal</p>
              <p className="text-xs text-gray-400">admin@petrolera.com</p>
            </div>
          </div>
          <button className="mt-3 flex items-center text-sm text-gray-400 hover:text-white">
            <FaSignOutAlt className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab === 'dashboard' && 'Dashboard Principal'}
              {activeTab === 'usuarios' && 'Gestión de Usuarios'}
              {activeTab === 'actividad' && 'Registros de Actividad'}
              {activeTab === 'produccion' && 'Producción de Petróleo'}
              {activeTab === 'configuracion' && 'Configuración del Sistema'}
            </h2>
            <div className="flex items-center">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="bg-gray-100 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" 
                />
                <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <FaTint className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Producción Mensual</p>
                      <p className="text-xl font-bold">{stats.produccionMensual}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <FaChartBar className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Inventario Actual</p>
                      <p className="text-xl font-bold">{stats.inventarioActual}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <FaChartLine className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Movimientos Diarios</p>
                      <p className="text-xl font-bold">{stats.movimientosDiarios}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <FaUsers className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
                      <p className="text-xl font-bold">{stats.usuariosActivos}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-lg mb-4">Actividad Reciente</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                        <FaUser className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Ana Martínez actualizó datos de producción</p>
                        <p className="text-xs text-gray-500">Hace 35 minutos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <FaUser className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Carlos Mendoza registró nuevo lote</p>
                        <p className="text-xs text-gray-500">Hace 2 horas</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-red-100 text-red-600">
                        <FaUser className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Luis Ramírez modificó registros de inventario</p>
                        <p className="text-xs text-gray-500">Hace 4 horas</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-lg mb-4">Registro de Alertas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Nivel de inventario bajo</p>
                        <p className="text-xs text-gray-500">Tanque 3 - 10/04/2025</p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pendiente</span>
                    </div>
                    
                    <div className="flex items-center p-3 bg-red-50 border-l-4 border-red-400 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Presión anormal detectada</p>
                        <p className="text-xs text-gray-500">Sector B - 09/04/2025</p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Crítico</span>
                    </div>
                    
                    <div className="flex items-center p-3 bg-green-50 border-l-4 border-green-400 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Mantenimiento completado</p>
                        <p className="text-xs text-gray-500">Planta Principal - 08/04/2025</p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Resuelto</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'usuarios' && (
            <div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Listado de Usuarios</h3>
                  <button 
                    onClick={handleAddUser}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <FaPlus className="h-4 w-4 mr-1" />
                    Agregar Usuario
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                                {user.nombre.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.correo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.rol}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.ultimoAcceso}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleViewUserDetails(user)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaEye className="h-4 w-4" />
                              </button>
                              <button className="text-yellow-600 hover:text-yellow-800">
                                <FaEdit className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-800">
                                <FaTrashAlt className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                        Mostrando <span className="font-medium">1</span> a <span className="font-medium">4</span> de <span className="font-medium">4</span> resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          <span className="sr-only">Anterior</span>
                          Anterior
                        </button>
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                          1
                        </button>
                        <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          <span className="sr-only">Siguiente</span>
                          Siguiente
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Otros tabs: actividad, producción, configuración */}
          {(activeTab === 'actividad' || activeTab === 'produccion' || activeTab === 'configuracion') && (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <h3 className="text-lg font-medium text-gray-500">Contenido de {activeTab} en desarrollo</h3>
              <p className="mt-2 text-gray-400">Esta sección estará disponible próximamente</p>
            </div>
          )}
        </main>
      </div>
      
      {/* Modal para añadir usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Agregar Nuevo Usuario</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <form>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>Seleccionar rol</option>
                    <option>Administrador</option>
                    <option>Supervisor</option>
                    <option>Operador</option>
                    <option>Analista</option>
                    <option>Técnico</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="flex justify-end p-4 border-t">
              <button 
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Guardar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para ver detalles de usuario */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Detalles del Usuario</h3>
              <button onClick={() => setShowUserDetails(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedUser.nombre.charAt(0)}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium">{selectedUser.nombre}</h4>
                  <p className="text-gray-500">{selectedUser.correo}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">ID de Usuario</p>
                  <p className="font-medium">{selectedUser.id}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Rol</p>
                  <p className="font-medium">{selectedUser.rol}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className={`font-medium ${selectedUser.estado === 'Activo' ? 'text-green-600' : 'text-gray-600'}`}>
                    {selectedUser.estado}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Último Acceso</p>
                  <p className="font-medium">{selectedUser.ultimoAcceso}</p>
                </div>
                
                <div className="col-span-2 bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Permisos</p>
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">Ver Registros</span>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">Editar Datos</span>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">Generar Reportes</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <h5 className="font-medium mb-2">Actividad Reciente</h5>
                <div className="space-y-2">
                  <div className="text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-900">Actualización de datos de producción</span> - <span className="text-gray-500">10/04/2025 09:45</span>
                  </div>
                  <div className="text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-900">Acceso al sistema</span> - <span className="text-gray-500">10/04/2025 08:30</span>
                  </div>
                  <div className="text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-900">Generación de reporte mensual</span> - <span className="text-gray-500">08/04/2025 14:15</span>
                  </div>
                </div>
                </div>
            </div>
            
            <div className="flex justify-end p-4 border-t">
              <button 
                onClick={() => setShowUserDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
              >
                Cerrar
              </button>
              <button 
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaEdit className="inline h-4 w-4 mr-1" />
                Editar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}