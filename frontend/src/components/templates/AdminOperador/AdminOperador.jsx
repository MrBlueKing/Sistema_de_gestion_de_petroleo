import React, { useState } from 'react';
import TabNavigation from '../../molecules/TabNavigation';
import UniversalHeader from '../../organisms/Todos/UniversalHeader';

// Importar los componentes de vista (asumiendo que existen)
import MainAdminOperador from '../../organisms/AdminOperador/MainAdminOperador';
import ConsumoViewAdminOperador from '../../organisms/AdminOperador/AdminCargasView';
import GestionarMaquinas from '../../organisms/AdminOperador/GestionarMaquinasOperador';
import GestionarUsuariosOperador from '../../organisms/AdminOperador/GestionarUsuariosOperador';
import GraficosPetroleo from '../../organisms/Gerente/Graficos'
import HistorialMaquinas from '../../organisms/Todos/HistorialMaquinas';
import Recepciones from '../../organisms/Gerente/VerificacionIngresos';

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
            id: 'consumos-externos',
            label: 'Consumos Externos',
            description: 'Vista de consumo de combustibles externos',
            icon: 'FaGasPump'
        },
        {
            id: 'consumos-internos',
            label: 'Consumos Internos',
            description: 'Vista de consumos internos',
            icon: 'FaGasPump'
        },
        {
            id: 'graficos',
            label: 'Gráficos',
            description: 'Visualización de métricas y estadísticas',
            icon: 'VscGraph'
        },
        {
            id: 'recepciones',
            label: 'Recepciones',
            description: 'Gestionar recepciones de combustible',
            icon: 'MdOilBarrel'
        },
        {
            id: 'maquinas',
            label: 'Máquinas',
            description: 'Gestionar máquinas del sistema',
            icon: 'FaCogs'
        },
        {
            id: 'usuarios',
            label: 'Usuarios',
            description: 'Gestionar usuarios operadores',
            icon: 'FaUserCog'
        }
    ];


    const renderActiveContent = () => {
        switch (activeTab) {
            case 'principal':
                return <MainAdminOperador />;
            case 'consumos-externos':
                return <ConsumoViewAdminOperador />;
            case 'consumos-internos':
                return <HistorialMaquinas />;
            case 'graficos':
                return <GraficosPetroleo />;
            case 'recepciones':
                return <Recepciones />;
            case 'maquinas':
                return <GestionarMaquinas />;
            case 'usuarios':
                return <GestionarUsuariosOperador />;
            default:
                return <MainAdminOperador />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white pt-2">
            <UniversalHeader type="AdminOperador" />
            {/* Navegación por pestañas */}
            <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            {/* Contenido dinámico */}
            <main className="flex-1 bg-white">
                {renderActiveContent()}
            </main>
        </div>
    );
};

export default AdminOperador;