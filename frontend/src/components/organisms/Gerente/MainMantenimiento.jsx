import { useState } from "react";
import Header from "../../organisms/Gerente/Header";

import {
    FiTrendingUp, FiUsers, FiSettings,
    FiPieChart, FiActivity, FiCalendar, FiFileText,
    FiChevronRight, FiStar, FiClock, FiTarget
} from "react-icons/fi";

const MainGerente = ({ children }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Actualizar la hora cada minuto
    useState(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Datos de ejemplo para las tarjetas
    const statsCards = [
        {
            title: "Operaciones Activas",
            value: "12",
            icon: FiActivity,
            color: "bg-blue-500",
            change: "+5.2%"
        },
        {
            title: "Equipos en Línea",
            value: "28",
            icon: FiTarget,
            color: "bg-green-500",
            change: "+2.1%"
        },
        {
            title: "Eficiencia Global",
            value: "94%",
            icon: FiTrendingUp,
            color: "bg-orange-500",
            change: "+1.8%"
        },
        {
            title: "Personal Activo",
            value: "156",
            icon: FiUsers,
            color: "bg-purple-500",
            change: "+3.4%"
        }
    ];

    const quickActions = [
        { title: "Reportes Diarios", icon: FiFileText, color: "bg-blue-100 text-blue-600" },
        { title: "Análisis KPI", icon: FiTrendingUp, color: "bg-green-100 text-green-600" },
        { title: "Gestión de Equipos", icon: FiSettings, color: "bg-orange-100 text-orange-600" },
        { title: "Planificación", icon: FiCalendar, color: "bg-purple-100 text-purple-600" }
    ];

    const recentActivity = [
        { time: "08:30", action: "Inicio de operaciones en Catemu", status: "completed" },
        { time: "09:15", action: "Mantenimiento programado - Dumper 11", status: "in-progress" },
        { time: "10:00", action: "Reunión de coordinación", status: "upcoming" },
        { time: "11:30", action: "Inspección de seguridad", status: "upcoming" }
    ];

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
            <Header />
            
            <div className="container mx-auto px-4 py-6">
                {/* Bienvenida */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">
                                    ¡Bienvenido al Panel Gerencial! 👋
                                </h1>
                                <p className="text-blue-100">
                                    Gestiona y supervisa las operaciones desde aquí
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-blue-200">
                                    {currentTime.toLocaleDateString('es-ES', { 
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="text-lg font-semibold">
                                    {currentTime.toLocaleTimeString('es-ES', { 
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsCards.map((card, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${card.color}`}>
                                    <card.icon className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-sm text-green-600 font-medium">
                                    {card.change}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-1">
                                {card.value}
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {card.title}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Grid principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Acciones rápidas */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <FiStar className="mr-2 text-yellow-500" />
                                Acciones Rápidas
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className={`p-3 rounded-lg ${action.color} mr-4`}>
                                            <action.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800">{action.title}</h3>
                                        </div>
                                        <FiChevronRight className="h-5 w-5 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Gráfico placeholder */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <FiPieChart className="mr-2 text-blue-500" />
                                Vista General de Operaciones
                            </h2>
                            <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <FiTrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">Gráficos y análisis próximamente</p>
                                    <p className="text-gray-400 text-sm">Los datos se mostrarán aquí</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actividad reciente */}
                    <div>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <FiClock className="mr-2 text-green-500" />
                                Actividad Reciente
                            </h2>
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${
                                            activity.status === 'completed' ? 'bg-green-500' :
                                            activity.status === 'in-progress' ? 'bg-yellow-500' :
                                            'bg-gray-300'
                                        }`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm text-gray-800 font-medium">
                                                    {activity.action}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {activity.time}
                                                </span>
                                            </div>
                                            <div className="mt-1">
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    activity.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {activity.status === 'completed' ? 'Completado' :
                                                     activity.status === 'in-progress' ? 'En progreso' :
                                                     'Programado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Panel de estado */}
                        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Estado del Sistema</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Conectividad</span>
                                    <span className="flex items-center text-green-600 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        Online
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Base de Datos</span>
                                    <span className="flex items-center text-green-600 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        Activa
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Sincronización</span>
                                    <span className="flex items-center text-green-600 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        Actualizada
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección para contenido hijo */}
                {children && (
                    <section className="mt-8">{children}</section>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
                <div className="container mx-auto flex justify-between items-center text-sm text-gray-500">
                    <div>
                        &copy; {new Date().getFullYear()} Minera 3H. Todos los derechos reservados.
                    </div>
                    <div className="flex items-center">
                        <span className="mr-2">Versión 2.0.0</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full mx-2"></span>
                        <span>Panel Gerencial</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainGerente;