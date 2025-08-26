import React, { useState } from 'react';
import MainAdminOperador from "../../organisms/AdminOperador/MainAdminOperador";
import AsignarMaquinasAdminOperador from "../../organisms/AdminOperador/AsignarMaquinasOperador";
import GestionarMaquinas from "../../organisms/AdminOperador/GestionarMaquinasOperador";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";
import TabNavigation from "../../molecules/TabNavigation";
import ConsumoViewAdminOperador from "../../organisms/AdminOperador/ConsumoView";

const AdminOperador = () => {
    // 🆕 Estado para manejar las pestañas
    const [activeTab, setActiveTab] = useState('dashboard');

    // 🎨 Configuración de las pestañas - CORREGIDA
    const tabs = [
        {
            id: 'dashboard',
            label: 'Panel Administrativo',
            icon: 'FaListAlt',
            description: 'Vista general de cargas y operaciones'
        },
        {
            id: 'vista-consumo',
            label: 'Consumos de Máquinas',
            icon: 'FaGasPump',
            description: 'Vista de consumos de máquinas'
        },
        {
            id: 'asignar-maquinas',
            label: 'Asignar Máquinas',
            icon: 'FaTruckPickup',
            description: 'Asignar máquinas a operadores'
        },
        {
            id: 'gestionar-maquinas',
            label: 'Gestionar Máquinas',
            icon: 'FaCogs',
            description: 'Añadir y configurar nuevas máquinas'
        },
        {
            // ⭐ NUEVA PESTAÑA: Gestionar Usuarios
            id: 'gestionar-usuarios', // ✅ Corregido: ahora coincide con el switch
            label: 'Gestionar Usuarios',
            icon: 'FaUsers', // ✅ Icono más apropiado para usuarios
            description: 'Administrar usuarios y permisos'
        }
    ];

    // 🎨 Función para renderizar el contenido según la pestaña activa
    const renderActiveContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <MainAdminOperador />;
            case 'vista-consumo':
                return <ConsumoViewAdminOperador />;
            case 'asignar-maquinas':
                return <AsignarMaquinasAdminOperador />;
            case 'gestionar-maquinas':
                return <GestionarMaquinas />;
            case 'gestionar-usuarios': // ✅ Ahora coincide con el ID de la pestaña
                return (
                    <div className="p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                                <div className="text-6xl mb-4">👋</div>
                                <h1 className="text-4xl font-bold text-gray-800 mb-4">¡Hola!</h1>
                                <p className="text-xl text-gray-600 mb-8">
                                    Esta será la sección de Gestionar Usuarios
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <p className="text-blue-800 font-medium">
                                        🚧 Próximamente aquí podrás:
                                    </p>
                                    <ul className="text-blue-700 mt-4 text-left max-w-md mx-auto space-y-2">
                                        <li>• Crear nuevos usuarios</li>
                                        <li>• Editar perfiles existentes</li>
                                        <li>• Asignar roles y permisos</li>
                                        <li>• Gestionar faenas de usuarios</li>
                                        <li>• Ver historial de actividades</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <MainAdminOperador />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 pt-2">
            <UniversalHeader type="AdminOperador" />

            {/* 🆕 Navegación por pestañas */}
            <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* 🆕 Contenido dinámico */}
            <main className="flex-1">
                {renderActiveContent()}
            </main>
        </div>
    );
};

export default AdminOperador;