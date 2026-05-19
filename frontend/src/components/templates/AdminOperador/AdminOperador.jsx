import React, { useState, useEffect } from 'react';
import TabNavigation from '../../molecules/TabNavigation';
import UniversalHeader from '../../organisms/Todos/UniversalHeader';
import { useAuth, RoleBasedComponent } from '../../../routes/PrivateRoutes';

// Importar los componentes de vista
import MainAdminOperador from '../../organisms/AdminOperador/MainAdminOperador';
import ConsumoViewAdminOperador from '../../organisms/AdminOperador/AdminCargasView';
import GestionarMaquinas from '../../organisms/AdminOperador/GestionarMaquinasOperador';
import GestionarUsuariosOperador from '../../organisms/AdminOperador/GestionarUsuariosOperador';
import GraficosPetroleo from '../../organisms/Gerente/Graficos'
import HistorialMaquinas from '../../organisms/Todos/HistorialMaquinas';
import Recepciones from '../../organisms/Gerente/VerificacionIngresos';
import { ProduccionKPIs, ProduccionGraficos, ProduccionTablas, ProduccionCompleta } from '../../organisms/Gerente/ProduccionDashboard';
import PanelMantenimiento from '../../organisms/Mantenimiento/PanelMantenimiento';

const AdminOperador = () => {
    const [activeTab, setActiveTab] = useState('principal');
    const { user, hasRole } = useAuth();

    // 📋 Configuración de permisos por rol
    const rolePermissions = {
        // Gerente: Acceso completo a todo
        gerente: ['consumos-externos', 'consumos-internos', 'graficos', 'recepciones', 'produccion'],

        // Admin Operador: Acceso completo (rol original)
        admin_operador: ['principal', 'consumos-externos', 'consumos-internos', 'graficos', 'recepciones', 'maquinas', 'usuarios'],

        // Jefe de Mina: Acceso a vistas operacionales y gráficos
        JefeMina: ['consumos-internos', 'graficos', 'recepciones'],

        // Planificador: Acceso a consumos, gráficos, máquinas y mantenimiento
        planificador: ['consumos-internos', 'mantenimiento']
    };

    // 🎯 Mapeo de roles a tipos de header
    const getHeaderTypeForRole = () => {
        const userRole = user?.rol;
        switch (userRole) {
            case 'gerente':
                return 'gerente-operaciones';
            case 'admin_operador':
                return 'AdminOperador';
            case 'JefeMina':
                return 'JefeMina';
            case 'planificador':
                return 'planificador';
            default:
                return 'AdminOperador'; // Fallback
        }
    };

    // Obtener las pestañas permitidas para el rol actual
    const getAllowedTabs = () => {
        const userRole = user?.rol;
        const allowedTabIds = rolePermissions[userRole] || ['principal'];

        return tabs.filter(tab => allowedTabIds.includes(tab.id));
    };

    // Verificar si el usuario puede ver una pestaña específica
    const canViewTab = (tabId) => {
        const userRole = user?.rol;
        const allowedTabs = rolePermissions[userRole] || ['principal'];
        return allowedTabs.includes(tabId);
    };

    // Configuración de pestañas completa
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
            label: 'Consumos Generales',
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
            id: 'produccion',
            label: 'Producción',
            description: 'KPIs, gráficos y tablas de producción minera',
            icon: 'FaIndustry'
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
        },
        {
            id: 'mantenimiento',
            label: 'Mantenimiento',
            description: 'Panel de mantenciones y estado de equipos',
            icon: 'FaCogs'
        }
    ];

    // Asegurar que la pestaña activa esté permitida
    const allowedTabs = getAllowedTabs();

    // Si la pestaña activa no está permitida, cambiar a la primera permitida
    React.useEffect(() => {
        const isCurrentTabAllowed = allowedTabs.find(tab => tab.id === activeTab);
        if (!isCurrentTabAllowed && allowedTabs.length > 0) {
            setActiveTab(allowedTabs[0].id);
        }
    }, [activeTab, allowedTabs]);

    const renderActiveContent = () => {
        // Verificar permisos antes de mostrar el contenido
        if (!canViewTab(activeTab)) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🚫</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Acceso Denegado</h3>
                        <p className="text-gray-500">No tienes permisos para ver esta sección.</p>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'principal':
                return <MainAdminOperador />;

            case 'consumos-externos':
                return (
                    <RoleBasedComponent
                        allowedRoles={['gerente', 'admin_operador', 'JefeMina', 'planificador']}
                        showUnauthorized={true}
                    >
                        <ConsumoViewAdminOperador />
                    </RoleBasedComponent>
                );

            case 'consumos-internos':
                return (
                    <RoleBasedComponent
                        allowedRoles={['gerente', 'admin_operador', 'JefeMina', 'planificador']}
                        showUnauthorized={true}
                    >
                        <HistorialMaquinas />
                    </RoleBasedComponent>
                );

            case 'graficos':
                return (
                    <RoleBasedComponent
                        allowedRoles={['gerente', 'admin_operador', 'JefeMina', 'planificador']}
                        showUnauthorized={true}
                    >
                        <GraficosPetroleo />
                    </RoleBasedComponent>
                );

            case 'recepciones':
                return (
                    <RoleBasedComponent
                        allowedRoles={['gerente', 'admin_operador', 'JefeMina']}
                        showUnauthorized={true}
                    >
                        <Recepciones />
                    </RoleBasedComponent>
                );

            case 'produccion':
                return (
                    <RoleBasedComponent
                        allowedRoles={['gerente', 'admin_operador', 'JefeMina']}
                        showUnauthorized={true}
                    >
                        <ProduccionCompleta />
                    </RoleBasedComponent>
                );

            case 'maquinas':
                return (
                    <RoleBasedComponent
                        allowedRoles={['gerente', 'admin_operador', 'planificador']}
                        showUnauthorized={true}
                    >
                        <GestionarMaquinas />
                    </RoleBasedComponent>
                );

            case 'usuarios':
                return (
                    <RoleBasedComponent
                        allowedRoles={['gerente', 'admin_operador']}
                        showUnauthorized={true}
                    >
                        <GestionarUsuariosOperador />
                    </RoleBasedComponent>
                );

            case 'mantenimiento':
                return (
                    <RoleBasedComponent
                        allowedRoles={['gerente', 'admin_operador', 'JefeMina', 'planificador']}
                        showUnauthorized={true}
                    >
                        <PanelMantenimiento />
                    </RoleBasedComponent>
                );

            default:
                return <MainAdminOperador />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white pt-2">
            <UniversalHeader type={getHeaderTypeForRole()} />

            {/* Navegación por pestañas - Solo mostrar las permitidas para el rol actual */}
            <TabNavigation
                tabs={allowedTabs}
                activeTab={activeTab}
                onTabChange={(tabId) => {
                    // Verificar que la pestaña seleccionada esté permitida
                    if (canViewTab(tabId)) {
                        setActiveTab(tabId);
                    }
                }}
            />

            {/* Contenido dinámico */}
            <main className="flex-1 bg-white">
                {renderActiveContent()}
            </main>
        </div>
    );
};

export default AdminOperador;