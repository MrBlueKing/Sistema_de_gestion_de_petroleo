import React, { useState } from 'react';
import TabNavigation from '../../molecules/TabNavigation';
import UniversalHeader from '../../organisms/Todos/UniversalHeader';

// Importar los componentes de vista (asumiendo que existen)
import MainAdminOperador from '../../organisms/AdminOperador/MainAdminOperador';
import ConsumoViewAdminOperador from '../../organisms/AdminOperador/ConsumoView';
import AsignarMaquinasAdminOperador from '../../organisms/AdminOperador/AsignarMaquinasOperador';
import GestionarMaquinas from '../../organisms/AdminOperador/GestionarMaquinasOperador';
import GestionarUsuariosOperador from '../../organisms/AdminOperador/GestionarUsuariosOperador';

const AdminOperador = () => {
    const [activeTab, setActiveTab] = useState('principal');

    // Configuración de pestañas optimizada para móviles
    const tabs = [
        {
            id: 'principal',
            label: 'Principal',
            description: 'Vista principal del panel',
            icon: 'FaListAlt'
        },
        {
            id: 'vista-consumo',
            label: 'Consumo',
            description: 'Vista de consumo de combustible',
            icon: 'FaGasPump'
        },
        {
            id: 'asignar-maquinas',
            label: 'Asignar',
            description: 'Asignar máquinas a operadores',
            icon: 'FaTruckPickup'
        },
        {
            id: 'gestionar-maquinas',
            label: 'Máquinas',
            description: 'Gestionar máquinas del sistema',
            icon: 'FaCogs'
        },
        {
            id: 'gestionar-usuarios',
            label: 'Usuarios',
            description: 'Gestionar usuarios operadores',
            icon: 'FaUsers'
        }
    ];

    const renderActiveContent = () => {
        switch (activeTab) {
            case 'principal':
                return <MainAdminOperador />;
            case 'vista-consumo':
                return <ConsumoViewAdminOperador />;
            case 'asignar-maquinas':
                return <AsignarMaquinasAdminOperador />;
            case 'gestionar-maquinas':
                return <GestionarMaquinas />;
            case 'gestionar-usuarios':
                return <GestionarUsuariosOperador />;
            default:
                return <MainAdminOperador />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 pt-2">
            <UniversalHeader type="AdminOperador" />

            {/* Navegación por pestañas */}
            <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Contenido dinámico */}
            <main className="flex-1">
                {renderActiveContent()}
            </main>
        </div>
    );
};

export default AdminOperador;