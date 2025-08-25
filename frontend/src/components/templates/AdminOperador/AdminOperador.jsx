import React, { useState } from 'react';
import MainAdminOperador from "../../organisms/AdminOperador/MainAdminOperador";
import AsignarMaquinasAdminOperador from "../../organisms/AdminOperador/AsignarMaquinasOperador";
import GestionarMaquinas from "../../organisms/AdminOperador/GestionarMaquinasOperador";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";
import TabNavigation from "../../molecules/TabNavigation";
import ConsumoViewAdminOperador from "../../organisms/AdminOperador/ConsumoView";

const AdminOperador = () => {
    // 🆕 Estado para manejar las pestañas
    const [activeTab, setActiveTab] = useState('dashboard'); // ✅ Mantener 'dashboard' como inicial

    // 🎨 Configuración de las pestañas - CORREGIDA
    const tabs = [
        {
            id: 'dashboard', // ✅ Corregido: debe coincidir con el switch
            label: 'Panel Administrativo',
            icon: 'FaListAlt',
            description: 'Vista general de cargas y operaciones'
        },
        {
            id: 'vista-consumo', // ✅ Corregido: ID consistente
            label: 'Consumos de Máquinas',
            icon: 'FaGasPump', // ✅ Cambiado a icono más apropiado
            description: 'Vista de consumos de máquinas'
        },
        {
            id: 'asignar-maquinas',
            label: 'Asignar Máquinas',
            icon: 'FaUserPlus',
            description: 'Asignar máquinas a operadores'
        },
        {
            id: 'gestionar-maquinas', // ✅ Corregido: debe coincidir con el switch
            label: 'Gestionar Máquinas',
            icon: 'FaCogs', // ✅ Cambiado para diferenciarlo
            description: 'Añadir y configurar nuevas máquinas'
        }
    ];

    // 🎨 Función para renderizar el contenido según la pestaña activa
    const renderActiveContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <MainAdminOperador />;
            case 'vista-consumo': // ✅ Corregido: ahora coincide con el ID del tab
                return <ConsumoViewAdminOperador />;
            case 'asignar-maquinas':
                return <AsignarMaquinasAdminOperador />;
            case 'gestionar-maquinas':
                return <GestionarMaquinas />;
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