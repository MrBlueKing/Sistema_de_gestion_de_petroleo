import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Agregar esta línea
import {
  FaGasPump,
  FaTruck,
  FaClock,
  FaFileAlt,
  FaUser,
  FaMapMarkerAlt,
  FaCog,
  FaPlus,
  FaHistory,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaTruckPickup,
  FaChartLine,
  FaRoute,
  FaArrowRight,
  FaTachometerAlt,
  FaBuilding,
  FaUserShield,
  FaBatteryThreeQuarters
} from "react-icons/fa";
import { RxIdCard } from "react-icons/rx";
import { CgInternal } from "react-icons/cg";
import { FaIdCard } from "react-icons/fa6";
import { GrStatusGood } from "react-icons/gr";
import { LiaTachometerAltSolid } from "react-icons/lia";
import UniversalHeader from "../../components/organisms/Todos/UniversalHeader";
import { useOperadorData } from "../../hook/OperadorVehiculo/useOperadorData";

const MenuPrincipalOperadorVehiculo = () => {
  // Usar el hook con destructuring seguro
  const { loading, usuario, maquinaAsignada, vehiculoInfo, ultimoConsumoInfo } = useOperadorData();
  const navigate = useNavigate(); // ✅ Agregar esta línea

  const [resumenCargas, setResumenCargas] = useState({
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    totalMes: 0
  });
  const [cargasRecientes, setCargasRecientes] = useState([]);

  // Helper para obtener nombre de faena
  const getFaenaName = (idFaena) => {
    const faenas = {
      1: "Cabildo",
      2: "Catemu",
      3: "Chincolco",
      4: "Tiltil"
    };
    return faenas[idFaena] || "Sin asignar";
  };

  // Helper para obtener información de estado
  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'pendiente':
        return {
          icon: FaClock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          badge: 'bg-yellow-100 text-yellow-800',
          text: 'Pendiente'
        };
      case 'aprobada':
        return {
          icon: FaCheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
          badge: 'bg-green-100 text-green-800',
          text: 'Aprobada'
        };
      case 'rechazada':
        return {
          icon: FaTimesCircle,
          color: 'text-red-600',
          bg: 'bg-red-100',
          badge: 'bg-red-100 text-red-800',
          text: 'Rechazada'
        };
      default:
        return {
          icon: FaExclamationCircle,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          badge: 'bg-gray-100 text-gray-800',
          text: 'Desconocido'
        };
    }
  };

  // Componente de tarjeta de estadística
  const StatCard = ({ icon: Icon, title, value, color, description, trend }) => (
    <div className="group bg-white rounded-xl p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2.5 lg:p-3 group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-300">
          <Icon className="text-orange-600 text-lg lg:text-xl" />
        </div>
        {trend && (
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl lg:text-3xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm lg:text-base font-semibold text-gray-700">{title}</p>
        {description && (
          <p className="text-xs lg:text-sm text-gray-500 leading-tight">{description}</p>
        )}
      </div>
    </div>
  );

  // Componente de acción rápida actualizado
  const ActionCard = ({ icon: Icon, title, description, color, onClick, badge, disabled = false }) => (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
        ${color} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg active:scale-[0.98]'} 
        text-white rounded-xl p-5 lg:p-6 transition-all duration-300 transform hover:scale-[1.02] 
        w-full text-left min-h-[130px] lg:min-h-[140px] flex flex-col justify-between shadow-md
        relative overflow-hidden z-10
      `} // ✅ Agregar z-10 aquí
      >
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-0"></div> {/* ✅ z-0 */}

        <div className="flex items-start justify-between mb-3 relative z-20"> {/* ✅ z-20 */}
          <Icon size={28} className="lg:w-8 lg:h-8 opacity-90" />
          {badge && (
            <span className="bg-white bg-opacity-20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium border border-white border-opacity-20">
              {badge}
            </span>
          )}
        </div>
        <div className="relative z-20"> {/* ✅ z-20 */}
          <h3 className="font-bold text-base lg:text-lg mb-2 leading-tight">{title}</h3>
          <p className="text-sm lg:text-base opacity-90 leading-relaxed">{description}</p>
        </div>

        {/* ✅ Icono con z-index controlado */}
        <FaArrowRight className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-60 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 text-sm z-10" />
      </button>
    </div>
  );

  // Componente de información del vehículo
  const VehicleInfoRow = ({ label, value, icon: Icon, highlight = false, type = "text" }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 group hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors duration-200">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {Icon && (
          <div className="bg-orange-50 rounded-lg p-2 group-hover:bg-orange-100 transition-colors duration-200">
            <Icon className="text-orange-600 text-sm" />
          </div>
        )}
        <span className="text-gray-600 font-medium text-sm lg:text-base">{label}</span>
      </div>
      <div className="text-right">
        {type === "badge" ? (
          <span className={`px-3 py-1.5 rounded-full text-xs lg:text-sm font-semibold ${highlight ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        ) : type === "license" ? (
          <span className="bg-gray-900 text-white px-3 py-1.5 rounded font-bold text-xs lg:text-sm tracking-wider">
            {value}
          </span>
        ) : (
          <span className={`font-semibold text-sm lg:text-base ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 lg:h-16 lg:w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4 lg:mb-6"></div>
          <p className="text-gray-600 text-base lg:text-lg font-medium">Cargando panel...</p>
          <p className="text-gray-500 text-sm mt-1">Preparando información del vehículo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <UniversalHeader type="operador" />

      <div className="pt-0 lg:pt-0">
        {/* Hero Section mejorado */}
        <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white shadow-xl">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full mb-3 sm:mb-4 mt-6">
                <FaGasPump className="text-amber-600 text-lg sm:text-2xl" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold leading-tight mb-1 sm:mb-2">
                ¡Bienvenido, {usuario?.nombre || 'Usuario'}! 👋
              </h1>
              <p className="text-orange-100 text-xs sm:text-sm lg:text-base max-w-md mx-auto leading-relaxed">
                Sistema de Gestión de Combustible
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 lg:py-8 space-y-6 lg:space-y-8">
          {/* ✅ NUEVA DISTRIBUCIÓN: 3 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

            {/* 1️⃣ Perfil del Operador */}
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 lg:p-6 border border-gray-100">
              <div className="flex items-center mb-4 lg:mb-6">
                <div className="bg-orange-100 rounded-lg lg:rounded-xl p-2.5 lg:p-3 mr-3">
                  <FaUser className="text-orange-600 text-lg lg:text-xl" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-800">Operador</h2>
              </div>
              <div className="space-y-0">
                <VehicleInfoRow
                  icon={FaUser}
                  label="Nombre"
                  value={usuario?.nombreCompleto || usuario?.nombre || 'No disponible'}
                  highlight={true}
                />
                <VehicleInfoRow
                  icon={FaIdCard}
                  label="RUT"
                  value={usuario?.rut || 'No disponible'}
                />
                <VehicleInfoRow
                  icon={FaBuilding}
                  label="Faena"
                  value={getFaenaName(usuario?.id_faena)}
                  type="badge"
                  highlight={true}
                />
                <VehicleInfoRow
                  icon={FaUserShield}
                  label="Estado"
                  value={usuario?.estado === 1 ? 'Activo' : 'Inactivo'}
                  type="badge"
                  highlight={usuario?.estado === 1}
                />
              </div>
            </div>

            {/* 2️⃣ Información del Vehículo */}
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 lg:p-6 border border-gray-100">
              <div className="flex items-center mb-4 lg:mb-6">
                <div className="bg-orange-100 rounded-lg lg:rounded-xl p-2.5 lg:p-3 mr-3">
                  <FaTruck className="text-orange-600 text-lg lg:text-xl" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-800">Vehículo</h2>
              </div>
              {maquinaAsignada ? (
                <div className="space-y-0">
                  <VehicleInfoRow
                    icon={FaTruck}
                    label="Nombre"
                    value={vehiculoInfo?.nombre || 'No disponible'}
                    highlight={true}
                  />
                  <VehicleInfoRow
                    icon={RxIdCard}
                    label="Patente"
                    value={vehiculoInfo?.patente || 'No disponible'}
                    type="license"
                  />
                  <VehicleInfoRow
                    icon={CgInternal}
                    label="Tipo"
                    value={vehiculoInfo?.tipo || 'No disponible'}
                  />
                  <VehicleInfoRow
                    icon={GrStatusGood}
                    label="Estado"
                    value={vehiculoInfo?.estado || 'Desconocido'}
                    type="badge"
                    highlight={vehiculoInfo?.estado === 'operativo'}
                  />
                </div>
              ) : (
                <div className="text-center py-6 lg:py-8">
                  <div className="bg-orange-100 rounded-full p-3 lg:p-4 w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 flex items-center justify-center">
                    <FaExclamationCircle className="text-orange-600 text-lg lg:text-2xl" />
                  </div>
                  <p className="text-gray-700 text-base lg:text-lg font-medium mb-1">Sin vehículo asignado</p>
                  <p className="text-gray-500 text-sm lg:text-base">Contacta al administrador</p>
                </div>
              )}
            </div>

            {/* 3️⃣ Último Consumo */}
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 lg:p-6 border border-gray-100">
              <div className="flex items-center mb-4 lg:mb-6">
                <div className="bg-orange-100 rounded-lg lg:rounded-xl p-2.5 lg:p-3 mr-3">
                  <FaGasPump className="text-orange-600 text-lg lg:text-xl" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-800">Último Consumo</h2>
              </div>
              {maquinaAsignada ? (
                <div className="space-y-0">
                  <VehicleInfoRow
                    icon={FaGasPump}
                    label="Litros Consumidos"
                    value={ultimoConsumoInfo?.litros_formateados || 'Sin consumos'}
                    highlight={ultimoConsumoInfo?.tiene_consumo}
                  />
                  <VehicleInfoRow
                    icon={FaTachometerAlt}
                    label="Kilometraje"
                    value={ultimoConsumoInfo?.kilometraje_formateado || 'Sin registros'}
                  />
                  <VehicleInfoRow
                    icon={FaBatteryThreeQuarters}
                    label="Precio por Litro"
                    value={ultimoConsumoInfo?.precio_formateado || 'N/A'}
                  />
                  <VehicleInfoRow
                    icon={FaCalendarAlt}
                    label="Fecha"
                    value={ultimoConsumoInfo?.fecha_formateada || 'Sin fecha'}
                  />
                </div>
              ) : (
                <div className="text-center py-6 lg:py-8">
                  <div className="bg-gray-100 rounded-full p-3 lg:p-4 w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 flex items-center justify-center">
                    <FaGasPump className="text-gray-400 text-lg lg:text-2xl" />
                  </div>
                  <p className="text-gray-500 text-sm lg:text-base">Sin información de consumo</p>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard
              icon={FaClock}
              title="Pendientes"
              value={resumenCargas.pendientes}
              description="En revisión"
              trend="+2"
            />
            <StatCard
              icon={FaCheckCircle}
              title="Aprobadas"
              value={resumenCargas.aprobadas}
              description="Este mes"
            />
            <StatCard
              icon={FaTimesCircle}
              title="Rechazadas"
              value={resumenCargas.rechazadas}
              description="Requieren corrección"
            />
            <StatCard
              icon={FaChartLine}
              title="Total"
              value={resumenCargas.totalMes}
              description="Cargas del mes"
            />
          </div>

          {/* Acciones Rápidas */}
          <div>
            <div className="flex items-center mb-4 lg:mb-6">
              <div className="bg-orange-100 rounded-lg lg:rounded-xl p-2.5 lg:p-3 mr-3">
                <FaCog className="text-orange-600 text-lg lg:text-xl" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Acciones Rápidas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              <ActionCard
                icon={FaPlus}
                title="Nueva Carga"
                description="Registrar combustible y kilometraje"
                color="bg-gradient-to-br from-orange-500 to-orange-600"
                //badge="Nuevo"
                disabled={!maquinaAsignada}
                onClick={() => navigate('/FormularioOperador')} // ✅ Cambiar esta línea
              />
              <ActionCard
                icon={FaHistory}
                title="Historial"
                description="Ver todas mis cargas registradas"
                color="bg-gradient-to-br from-orange-400 to-orange-500"
                onClick={() => alert('Ir a historial de cargas')}
              />
              <ActionCard
                icon={FaRoute}
                title="Rutas y KM"
                description="Consultar rutas y kilometrajes"
                color="bg-gradient-to-br from-orange-600 to-red-500"
                onClick={() => alert('Ir a rutas')}
              />
            </div>
          </div>

          {/* Cargas Recientes */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100">
            <div className="p-4 lg:p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
                <div className="flex items-center">
                  <div className="bg-orange-100 rounded-lg lg:rounded-xl p-2.5 lg:p-3 mr-3">
                    <FaCalendarAlt className="text-orange-600 text-lg lg:text-xl" />
                  </div>
                  <h2 className="text-lg lg:text-xl font-bold text-gray-800">Cargas Recientes</h2>
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl font-semibold transition-colors duration-200 text-sm lg:text-base self-start sm:self-auto">
                  Ver todas
                </button>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              {cargasRecientes.length > 0 ? (
                <div className="space-y-3 lg:space-y-4">
                  {cargasRecientes.map((carga) => {
                    const estadoInfo = getEstadoInfo(carga.estado);
                    const IconoEstado = estadoInfo.icon;

                    return (
                      <div key={carga.id} className="group bg-gray-50 rounded-lg lg:rounded-xl p-3 lg:p-4 hover:bg-gray-100 hover:shadow-sm transition-all duration-200 border border-gray-200">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className={`p-2 lg:p-2.5 rounded-lg ${estadoInfo.bg} flex-shrink-0`}>
                              <IconoEstado size={16} className={`lg:w-5 lg:h-5 ${estadoInfo.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-2">
                                <p className="font-bold text-gray-900 text-sm lg:text-base">
                                  Boleta: {carga.numero_boleta}
                                </p>
                                <span className={`text-xs lg:text-sm font-semibold px-2 lg:px-3 py-1 rounded-full ${estadoInfo.badge} self-start sm:self-auto`}>
                                  {estadoInfo.text}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs lg:text-sm text-gray-600">
                                <div className="flex items-center">
                                  <FaMapMarkerAlt className="mr-1.5 text-gray-400 flex-shrink-0" size={10} />
                                  <span className="truncate">{carga.ubicacion}</span>
                                </div>
                                <div className="flex items-center">
                                  <FaTachometerAlt className="mr-1.5 text-gray-400 flex-shrink-0" size={10} />
                                  <span>{carga.kilometraje} km</span>
                                </div>
                                <div className="flex items-center">
                                  <FaCalendarAlt className="mr-1.5 text-gray-400 flex-shrink-0" size={10} />
                                  <span>{carga.fecha_legible}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end lg:flex-col lg:items-end lg:text-right gap-4 lg:gap-1 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-base lg:text-lg leading-tight">{carga.litros}L</p>
                              <p className="text-emerald-600 font-semibold text-sm lg:text-base">${carga.costo.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 lg:py-12">
                  <div className="bg-gray-100 rounded-full p-4 lg:p-6 w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-4 lg:mb-6 flex items-center justify-center">
                    <FaFileAlt className="text-gray-400 text-2xl lg:text-3xl" />
                  </div>
                  <p className="text-gray-700 text-lg lg:text-xl font-semibold mb-2">No hay cargas registradas</p>
                  <p className="text-gray-500 mb-4 lg:mb-6 text-sm lg:text-base">Comienza registrando tu primera carga</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPrincipalOperadorVehiculo;