import React, { useState } from 'react';
import MainAdminOperador from "../../organisms/AdminOperador/MainAdminOperador";
import AsignarMaquinasAdminOperador from "../../organisms/AdminOperador/AsignarMaquinasOperador";
import GestionarMaquinas from "../../organisms/AdminOperador/GestionarMaquinasOperador";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";
import TabNavigation from "../../molecules/TabNavigation";
import ConsumoViewAdminOperador from "../../organisms/AdminOperador/ConsumoView";
import GestionarUsuariosOperador from '../../organisms/AdminOperador/GestionarUsuariosOperador';

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
                return <GestionarUsuariosOperador />;
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