// 🚀 MAINADMINOPERADOR OPTIMIZADO CON LAYOUT BASE COMÚN
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../lib/axios';
import {
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaListAlt,
  FaGasPump,
  FaEye,
} from 'react-icons/fa';

import { FiAlertTriangle, FiTrendingUp  } from "react-icons/fi";
// Importar el layout base y sus componentes
import AdminLayoutBase, { 
  MetricsSection, 
  MetricCard, 
  TableSection, 
  SearchInput,
  ResponsiveTable,
  AdditionalSection 
} from './AdminLayoutBase';

// Importar modal de detalle (asumiendo que existe)
import DetalleCargaModal from '../../molecules/DetalleCargaModal';

const MainAdminOperador = () => {
  const navigate = useNavigate();
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [selectedCargaId, setSelectedCargaId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Funciones de manejo de modal
  const handleVerDetalle = (cargaId) => {
    setSelectedCargaId(cargaId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCargaId(null);
  };

  const handleActionComplete = () => {
    fetchCargasExternas();
  };

  const handleIrAConsumosView = () => {
    navigate('/consumos-view-AdminOperador');
  };

  // Función para obtener datos
  const fetchCargasExternas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/adminOperador/cargas");

      if (response.data.status === "success") {
        setCargas(response.data.data);
      } else {
        throw new Error(response.data.message || "Error al cargar datos");
      }
    } catch (error) {
      console.error("❌ Error al cargar cargas externas:", error);
      setError(
        error.response?.data?.message ||
        error.message ||
        "Error al cargar datos"
      );

      // Fallback a datos de ejemplo si hay error
      setCargas([
        {
          id: 1,
          numero_boleta: "BOL-001",
          user: { nombre: "Juan", apellido: "Pérez" },
          maquina: { nombre_maquina: "Excavadora CAT", patente: "AA-BB-12" },
          litros: 150.5,
          costo: 225750,
          estado: "pendiente",
          ubicacion: "Faena Norte",
          created_at: "2025-01-15T10:30:00Z",
        },
        {
          id: 2,
          numero_boleta: "BOL-002",
          user: { nombre: "María", apellido: "González" },
          maquina: { nombre_maquina: "Camión Volvo", patente: "CC-DD-34" },
          litros: 200.0,
          costo: 300000,
          estado: "aprobado",
          ubicacion: "Faena Sur",
          created_at: "2025-01-15T11:00:00Z",
        },
        {
          id: 3,
          numero_boleta: "BOL-003",
          user: { nombre: "Carlos", apellido: "Silva" },
          maquina: { nombre_maquina: "Retroexcavadora", patente: "EE-FF-56" },
          litros: 120.0,
          costo: 180000,
          estado: "rechazado",
          ubicacion: "Faena Este",
          created_at: "2025-01-15T12:30:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargasExternas();
  }, []);

  // Calcular estadísticas
  const stats = {
    total: cargas.length,
    pendientes: cargas.filter((c) => c.estado === "pendiente").length,
    aprobadas: cargas.filter((c) => c.estado === "aprobado").length,
    rechazadas: cargas.filter((c) => c.estado === "rechazado").length,
    totalLitros: cargas.reduce((sum, c) => sum + (c.litros || 0), 0),
    totalCosto: cargas.reduce((sum, c) => sum + (c.costo || 0), 0),
  };

  // Filtrar cargas por búsqueda
  const cargasFiltradas = cargas.filter(
    (carga) =>
      carga.numero_boleta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${carga.user?.nombre} ${carga.user?.apellido}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      carga.maquina?.nombre_maquina
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      carga.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones de formateo
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      aprobado: "bg-green-100 text-green-800 border-green-200",
      rechazado: "bg-red-100 text-red-800 border-red-200",
    };

    const labels = {
      pendiente: "Pendiente",
      aprobado: "Aprobado",
      rechazado: "Rechazado",
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[estado] || variants.pendiente}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  // Headers para la tabla (reducidos para evitar overflow)
  const tableHeaders = [
    "Boleta / Operador",
    "Máquina / Ubicación", 
    "Consumo",
    "Estado",
    "Fecha",
    "Acciones"
  ];

  // Función para renderizar filas de la tabla
  const renderTableRow = (carga, index, isMobile = false) => {
    if (isMobile) {
      // Vista móvil como card
      return (
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">{carga.numero_boleta}</p>
              <p className="text-sm text-gray-600">
                {carga.user?.nombre} {carga.user?.apellido}
              </p>
            </div>
            {getEstadoBadge(carga.estado)}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Máquina:</p>
              <p className="font-medium">{carga.maquina?.nombre_maquina}</p>
              <p className="text-xs text-gray-500">{carga.maquina?.patente}</p>
            </div>
            <div>
              <p className="text-gray-500">Consumo:</p>
              <p className="font-medium">{carga.litros} L</p>
              <p className="text-sm text-green-600">{formatCurrency(carga.costo)}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500">{carga.ubicacion}</p>
              <p className="text-xs text-gray-500">{formatDate(carga.created_at)}</p>
            </div>
            <button
              onClick={() => handleVerDetalle(carga.id)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaEye className="w-3 h-3 mr-1" />
              Ver
            </button>
          </div>
        </div>
      );
    }

    // Vista desktop (optimizada para evitar overflow)
    return (
      <tr key={carga.id} className="hover:bg-gray-50">
        {/* Boleta / Operador */}
        <td className="px-4 py-4 text-sm">
          <div>
            <p className="font-medium text-gray-900">{carga.numero_boleta}</p>
            <p className="text-xs text-gray-500">{carga.user?.nombre} {carga.user?.apellido}</p>
          </div>
        </td>
        
        {/* Máquina / Ubicación */}
        <td className="px-4 py-4 text-sm">
          <div>
            <p className="font-medium text-gray-900">{carga.maquina?.nombre_maquina}</p>
            <p className="text-xs text-gray-500">{carga.maquina?.patente} • {carga.ubicacion}</p>
          </div>
        </td>
        
        {/* Consumo (Litros + Costo) */}
        <td className="px-4 py-4 text-sm">
          <div className="flex items-center">
            <FaGasPump className="w-3 h-3 text-blue-600 mr-1" />
            <div>
              <p className="font-medium text-gray-900">{carga.litros} L</p>
              <p className="text-xs text-green-600">{formatCurrency(carga.costo)}</p>
            </div>
          </div>
        </td>
        
        {/* Estado */}
        <td className="px-4 py-4">
          {getEstadoBadge(carga.estado)}
        </td>
        
        {/* Fecha */}
        <td className="px-4 py-4 text-xs text-gray-500">
          {formatDate(carga.created_at)}
        </td>
        
        {/* Acciones */}
        <td className="px-4 py-4">
          <button
            onClick={() => handleVerDetalle(carga.id)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaEye className="w-3 h-3 mr-1" />
            Ver
          </button>
        </td>
      </tr>
    );
  };

  // Componente para acciones del header
  const headerActions = (
    <>
      <button
        onClick={handleIrAConsumosView}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
      >
        <FaListAlt className="w-4 h-4 mr-2" />
        Vista de Consumos
      </button>
      <div className="text-right">
        <p className="text-sm text-gray-500">Última actualización</p>
        <p className="text-sm font-medium text-gray-900">
          {new Date().toLocaleTimeString("es-CL")}
        </p>
      </div>
    </>
  );

  return (
    <AdminLayoutBase
      title="Panel de Administración"
      icon={FaTruck}
      description="Gestión y supervisión de cargas externas de combustible"
      headerActions={headerActions}
    >
      {/* Sección de métricas principales */}
      <MetricsSection>
        <MetricCard
          title="Total de Cargas"
          value={stats.total}
          icon={FaTruck}
          color="blue"
        />
        <MetricCard
          title="Pendientes"
          value={stats.pendientes}
          icon={FaClock}
          color="yellow"
        />
        <MetricCard
          title="Aprobadas"
          value={stats.aprobadas}
          icon={FaCheckCircle}
          color="green"
        />
        <MetricCard
          title="Rechazadas"
          value={stats.rechazadas}
          icon={FaTimesCircle}
          color="red"
        />
      </MetricsSection>

      {/* Sección de estadísticas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AdditionalSection title="Consumo Total" className="h-fit">
          <div className="space-y-4">
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
        </AdditionalSection>

        <AdditionalSection title="Estado de Revisión" className="h-fit">
          <div className="space-y-3">
            {stats.pendientes > 0 ? (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-800">
                  Cargas pendientes de revisión
                </span>
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                  {stats.pendientes}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                <FaCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Todas las cargas revisadas
                </span>
              </div>
            )}
          </div>
        </AdditionalSection>
      </div>

      {/* Tabla de cargas recientes */}
      <TableSection
        title={`Cargas Externas Recientes (${cargasFiltradas.length})`}
        searchComponent={
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por boleta, operador, máquina o ubicación..."
            className="w-full sm:w-80"
          />
        }
      >
        <ResponsiveTable
          headers={tableHeaders}
          data={cargasFiltradas}
          renderRow={renderTableRow}
          loading={loading}
          emptyMessage={
            searchTerm 
              ? "No se encontraron cargas con ese criterio de búsqueda."
              : "Aún no hay cargas registradas."
          }
        />
      </TableSection>

      {/* Modal de detalle */}
      <DetalleCargaModal
        cargaId={selectedCargaId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onActionComplete={handleActionComplete}
      />
    </AdminLayoutBase>
  );
};

export default MainAdminOperador;