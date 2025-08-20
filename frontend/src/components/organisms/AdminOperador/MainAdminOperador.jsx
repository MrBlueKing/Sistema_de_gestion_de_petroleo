import React, { useState, useEffect } from 'react';
import { 
  FaTruck, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaUsers,
  FaExclamationTriangle,
  FaEye,
  FaSearch
} from 'react-icons/fa';
import { FiFileText,FiTrendingUp, FiXCircle, FiAlertTriangle} from "react-icons/fi";

const MainAdminOperador = () => {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Simulación de datos (reemplazar con llamada real a la API)
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setCargas([
        {
          id: 1,
          numero_boleta: 'BOL-001',
          user: { nombre: 'Juan', apellido: 'Pérez' },
          maquina: { nombre_maquina: 'Excavadora CAT', patente: 'AA-BB-12' },
          litros: 150.5,
          costo: 225750,
          estado: 'pendiente',
          created_at: '2025-01-15T10:30:00Z'
        },
        {
          id: 2,
          numero_boleta: 'BOL-002',
          user: { nombre: 'María', apellido: 'González' },
          maquina: { nombre_maquina: 'Camión Tolva', patente: 'CC-DD-34' },
          litros: 200.0,
          costo: 300000,
          estado: 'aprobado',
          created_at: '2025-01-15T09:15:00Z'
        },
        {
          id: 3,
          numero_boleta: 'BOL-003',
          user: { nombre: 'Carlos', apellido: 'López' },
          maquina: { nombre_maquina: 'Bulldozer', patente: 'EE-FF-56' },
          litros: 180.0,
          costo: 270000,
          estado: 'rechazado',
          created_at: '2025-01-15T08:45:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Estadísticas calculadas
  const stats = {
    total: cargas.length,
    pendientes: cargas.filter(c => c.estado === 'pendiente').length,
    aprobadas: cargas.filter(c => c.estado === 'aprobado').length,
    rechazadas: cargas.filter(c => c.estado === 'rechazado').length,
    totalLitros: cargas.reduce((sum, c) => sum + c.litros, 0),
    totalCosto: cargas.reduce((sum, c) => sum + c.costo, 0)
  };

  // Filtrar cargas por búsqueda
  const cargasFiltradas = cargas.filter(carga =>
    carga.numero_boleta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${carga.user.nombre} ${carga.user.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    carga.maquina.nombre_maquina.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      aprobado: 'bg-green-100 text-green-800 border-green-200',
      rechazado: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      pendiente: <FaClock  className="w-4 h-4" />,
      aprobado: <FaCheckCircle className="w-4 h-4" />,
      rechazado: <FiXCircle  className="w-4 h-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variants[estado]}`}>
        {icons[estado]}
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Administrador de Operadores</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Gestión y supervisión de cargas externas de combustible
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Última actualización</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleTimeString('es-CL')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiFileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cargas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock  className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendientes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aprobadas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiXCircle  className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rechazadas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Recursos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Consumo Total</h3>
              <FiTrendingUp  className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Litros totales</span>
                <span className="text-xl font-bold text-blue-600">
                  {stats.totalLitros.toLocaleString()} L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Costo total</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.totalCosto)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Estado de Revisión</h3>
              <FiAlertTriangle  className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {stats.pendientes > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-yellow-800">
                    Cargas pendientes de revisión
                  </span>
                  <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                    {stats.pendientes}
                  </span>
                </div>
              )}
              {stats.pendientes === 0 && (
                <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                  <FaCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Todas las cargas revisadas
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Cargas Recientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Cargas Recientes</h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar cargas..."
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Ver todas
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boleta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Máquina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Litros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cargasFiltradas.map((carga) => (
                  <tr key={carga.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {carga.numero_boleta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {carga.user.nombre} {carga.user.apellido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{carga.maquina.nombre_maquina}</div>
                        <div className="text-gray-500">{carga.maquina.patente}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {carga.litros} L
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(carga.costo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(carga.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(carga.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                        <FaEye  className="h-4 w-4" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cargasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cargas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No se encontraron cargas con ese criterio de búsqueda.' : 'Aún no hay cargas registradas.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainAdminOperador;