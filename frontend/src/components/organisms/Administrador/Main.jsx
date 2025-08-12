import { FiUsers, FiUserPlus, FiUser, FiSettings } from 'react-icons/fi';
import { FaCar } from "react-icons/fa";
import { MdCarRental } from "react-icons/md";
import { GrLicense } from "react-icons/gr";
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../../../lib/axios'; // Asegúrate de que la ruta sea correcta
import { TbCategoryPlus } from "react-icons/tb";
import { FaTruckDroplet } from "react-icons/fa6";
import { FaUserCog } from "react-icons/fa";

const DashboardCard = ({ title, value, icon, color }) => {
    const Icon = icon;
    return (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex items-center">
            <div className={`rounded-full p-3 mr-4 ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
};

const ActivityItem = ({ title, time, status, statusColor, user, role }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-100 gap-2">
            <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                    <FiUser size={16} />
                </div>
                <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-xs text-gray-500">
                        <span className="font-medium">{user}</span> • <span className="text-blue-500">{role}</span> • {time}
                    </p>
                </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs self-start sm:self-auto ${statusColor}`}>
                {status}
            </span>
        </div>
    );
};

const QuickAccessButton = ({ icon, title, to }) => {
    const Icon = icon;
    return (
        <Link to={to} className="flex flex-col items-center justify-center bg-white shadow rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
            <Icon size={40} className="mb-2 text-blue-600" />
            <span className="text-sm font-medium text-center">{title}</span>
        </Link>
    );
};


const UserRow = ({ name, role, station, status, lastActive }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Activo': return 'bg-green-100 text-green-800';
            case 'Inactivo': return 'bg-gray-100 text-gray-800';
            case 'Suspendido': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Gerente': return 'text-purple-600';
            case 'Administrador': return 'text-blue-600';
            case 'Bombero': return 'text-orange-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg mb-2 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center min-w-[180px]">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                    <FiUser size={18} />
                </div>
                <div>
                    <p className="font-medium">{name}</p>
                    <p className={`text-sm ${getRoleColor(role)}`}>{role}</p>
                </div>
            </div>
            <div className="text-sm text-gray-500">{station}</div>
            <div>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>{status}</span>
            </div>
            <div className="text-sm text-gray-500 whitespace-nowrap">{lastActive}</div>
            <button className="p-2 hover:bg-gray-100 rounded self-start sm:self-auto">
                <FiSettings size={16} className="text-gray-500" />
            </button>
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
        <main className="p-4 sm:p-6 bg-gray-100 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Panel de Administración</h1>
            </div>

            {/* Accesos rápidos */}
            <div className="mb-8 bg-white p-4 sm:p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Acceso rápido</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <QuickAccessButton icon={FiUserPlus} title="Agregar Usuario" to="/registroUsuario" />
                    <QuickAccessButton icon={TbCategoryPlus} title="Añadir Tipo Maquina" to="/AñadirTipoMaquina" />
                    <QuickAccessButton icon={FaTruckDroplet} title="Categorización de Equipos" to="/GestionarMaquinaCategoria" />
                    {/* <QuickAccessButton icon={FaUserCog} title="Gestionar Personal" to="/GestionarPersonalInterno" />  */}
                    <QuickAccessButton icon={FaUserCog} title="Gestionar Personal Externo" to="/GestionarPersonalExterno" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <QuickAccessButton icon={GrLicense} title="Gertionar Permisos Personal Interno" to="/GestionarPermisoPersonalInterno" />
                    <QuickAccessButton icon={MdCarRental} title="Gertionar Permisos Maquinas" to="/GestionarPermisoMaquinas" />
                </div>
            </div>

            {/* Usuarios recientes */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Usuarios agregados recientemente</h2>

                {loading ? (
                    <p className="text-gray-500">Cargando usuarios...</p>
                ) : (
                    <div className="space-y-2">
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
        </main>
    );
}
