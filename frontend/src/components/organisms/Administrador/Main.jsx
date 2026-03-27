import { FiUsers, FiUserPlus, FiUser, FiSettings } from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  FaCar,
  FaUserCog,
  FaChartLine,
  FaUsers as FaUsersGroup,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaGasPump,
  FaFilePdf,
} from "react-icons/fa";
import { MdCarRental, MdDashboard, MdSecurity } from "react-icons/md";
import { GrLicense } from "react-icons/gr";
import { useEffect, useState } from "react";
import axios from '../../../lib/axios';

import { TbCategoryPlus } from "react-icons/tb";
import { FaTruckDroplet } from "react-icons/fa6";

const DashboardCard = ({ title, value, icon, color, trend, subtitle }) => {
  const Icon = icon;
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className={`rounded-full p-3 mr-4 ${color} shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm font-semibold">
                  ↗ {trend}
                </span>
                <span className="text-gray-400 text-sm ml-1">este mes</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={`h-1 bg-gradient-to-r ${color
          .replace("bg-", "from-")
          .replace("-500", "-400")} to-transparent`}
      ></div>
    </div>
  );
};

const ActivityItem = ({ title, time, status, statusColor, user, role }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
          <FiUser size={18} />
        </div>
        <div className="ml-4">
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{user}</span> •
            <span className="text-orange-500 font-medium ml-1">
              {role === "Bombero" ? "Encargado de Abastecimiento" : role}
            </span>{" "}
            •<span className="ml-1">{time}</span>
          </p>
        </div>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${statusColor}`}
      >
        {status}
      </span>
    </div>
  );
};

const QuickAccessButton = ({
  icon,
  title,
  to,
  color = "from-orange-400 to-red-400",
  description,
}) => {
  const Icon = icon;

  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100 flex flex-col justify-center text-center"
    >
      <div className="p-6">
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r ${color} shadow-lg mb-4 mx-auto`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-gray-500 text-sm mb-3">{description}</p>
        )}
        <div className="flex items-center justify-center text-blue-600 text-sm font-semibold">
          <span>Acceder</span>
          <svg
            className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
};

const UserRow = ({ name, role, station, status, lastActive }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Activo":
        return "bg-green-100 text-green-800 border-green-200";
      case "Inactivo":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Suspendido":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Gerente":
        return "text-purple-600";
      case "Administrador":
        return "text-orange-600";
      case "Bombero":
        return "text-orange-600";
      case "Encargado de Abastecimiento":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  // Reemplazar "Bombero" por "Encargado de Abastecimiento"
  const displayRole = role === "Bombero" ? "Encargado de Abastecimiento" : role;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl mb-3 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
      <div className="flex items-center min-w-[200px]">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
          <FiUser size={20} />
        </div>
        <div className="ml-4">
          <p className="font-bold text-gray-900 text-lg">{name}</p>
          <p className={`text-sm font-semibold ${getRoleColor(role)}`}>
            {displayRole}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-sm text-gray-600 font-medium">{station}</div>

        <div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
        </div>

        <div className="text-sm text-gray-500 whitespace-nowrap font-medium">
          {lastActive}
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors self-start sm:self-auto">
          <FiSettings size={18} className="text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  );
};

const formatearFecha = (fecha) => {
  const date = new Date(fecha);
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Main() {
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMachines: 0,
    pendingApprovals: 0,
  });


 useEffect(() => {
        const fetchRecentUsers = async () => {
            const token = JSON.parse(localStorage.getItem("authToken"))?.token;
            try {
                const response = await axios.get("/api/usuarios/recientes", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setRecentUsers(response.data);
            } catch (error) {
                console.error("Error al obtener usuarios recientes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentUsers();
    }, []);


  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="text-center">
            {/* Logo centrado */}
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg mb-6 mt-4">
                <MdDashboard className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-4xl sm:text-5xl font-bold">
              Panel de{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Administración
              </span>
            </h1>

            {/* Texto */}
            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Gestione usuarios, equipos y permisos desde el centro de control
              administrativo
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-28xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
        {/* Accesos Rápidos */}
        <div className="mb-8">
          <div className="">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
              <QuickAccessButton
                icon={FiUserPlus}
                title="Agregar Usuario"
                to="/registroUsuario"
                color="from-blue-500 to-indigo-500"
                description="Registrar nuevo usuario"
              />
              <QuickAccessButton
                icon={TbCategoryPlus}
                title="Añadir Tipo Máquina"
                to="/AñadirTipoMaquina"
                color="from-green-500 to-emerald-500"
                description="Nueva categoría de equipo"
              />
              <QuickAccessButton
                icon={FaTruckDroplet}
                title="Categorización de Equipos"
                to="/GestionarMaquinaCategoria"
                color="from-orange-500 to-red-500"
                description="Clasificar maquinaria"
              />
              <QuickAccessButton
                icon={FaUserCog}
                title="Personal Externo"
                to="/GestionarPersonalExterno"
                color="from-purple-500 to-pink-500"
                description="Gestionar contratistas"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <QuickAccessButton
                icon={GrLicense}
                title="Permisos Personal Interno"
                to="/GestionarPermisoPersonalInterno"
                color="from-indigo-500 to-blue-500"
                description="Autorizar personal interno"
              />
              <QuickAccessButton
                icon={MdCarRental}
                title="Permisos Máquinas"
                to="/GestionarPermisoMaquinas"
                color="from-teal-500 to-green-500"
                description="Autorizar uso de equipos"
              />
              <QuickAccessButton
                icon={FaMapMarkerAlt}
                title="Gestión de Faenas Bomberos"
                to="/GestionarFaenasBomberos"
                color="from-orange-500 to-red-500"
                description="Asignar múltiples faenas"
              />
              <QuickAccessButton
                icon={FaGasPump}
                title="Gestión de Estanques"
                to="/administrador/estanques"
                color="from-blue-500 to-cyan-500"
                description="Administrar estanques"
              />
              <QuickAccessButton
                icon={FaFilePdf}
                title="Reportes PDF"
                to="/administrador/reportes"
                color="from-red-500 to-rose-600"
                description="Consumo y rendimiento comparativo"
              />
            </div>
          </div>
        </div>

        {/* Usuarios Recientes */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Usuarios Agregados Recientemente
              </h2>
              <p className="text-gray-600">Últimos registros en el sistema</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500 font-medium">
                En tiempo real
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-gray-500 font-medium">
                Cargando usuarios...
              </span>
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">
                No hay usuarios recientes para mostrar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <UserRow
                  key={user.id}
                  name={`${user.nombre} ${user.apellido}`}
                  role={user.rol || "Sin Rol"}
                  station={user.ubicacion_faena || "Sin estación"}
                  status={user.estado === 1 ? "Activo" : "Inactivo"}
                  lastActive={formatearFecha(user.created_at)}
                />
              ))}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-gray-200">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mb-4">
            <MdDashboard className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Sistema de Gestión de Combustible v2.0
          </h3>
          <p className="text-gray-600 mb-4">
            Panel Administrativo - Control Centralizado
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <span>Gestión de Usuarios</span>
            <span>•</span>
            <span>Control de Permisos</span>
            <span>•</span>
            <span>Administración de Equipos</span>
          </div>
        </div>
      </main>
    </div>
  );
}
