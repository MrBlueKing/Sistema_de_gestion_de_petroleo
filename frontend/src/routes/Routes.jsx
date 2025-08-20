import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import PrivateRoute from "./PrivateRoutes";

// 👤 Importaciones Gerente
import GerentePage from "../pages/Gerente/GerentePage";
import GraficosPetroleo from "../components/organisms/Gerente/Graficos";
import MainMantenimiento from "../components/organisms/Gerente/MainMantenimiento";
import MainSimulacion from "../components/organisms/Gerente/MainSimulacion";
import GestionProduccion from "../components/organisms/Gerente/GestionProduccion";
import VerificacionIngresos from "../components/organisms/Gerente/VerificacionIngresos";
import ConsumoView from "../components/organisms/Gerente/ConsumoView";

// 🛠️ Importaciones Administrador
import AdministradorPage from "../pages/Administrador/AdministradorPage";
import AdministradorUserRegister from "../components/templates/Administrador/AdministradorUserRegister";
import GestionarTipoMaquina from "../pages/Administrador/GestionarTipoMaquina";
import GestionarMaquinaCategoria from "../pages/Administrador/GestionarMaquinCategoriaPage";
import GestionarPersonal from "../pages/Administrador/GestionarPersonalPage";
import GestionarPermisoPersonalInterno from "../pages/Administrador/GestionarPermisoPersonalPage";
import GestionarPersonalExternoPersonalPage from "../pages/Administrador/GestionarPersonalExternoPage";
import GestionarMaquinasPermiso from "../pages/Administrador/GestionarMaquinasPermisoPage";

// 🚒 Importaciones Bombero
import BomberoPage from "../pages/Bombero/BomberoPage";
import BomberoRecepcionPage from "../pages/Bombero/BomberoRecepcionPage";
import BomberoNavigation from "../pages/Bombero/BomberoNavigation";
import BomberoIngresoExterno from "../pages/Bombero/BomberoIngresoExterno";
import BomberoConsumoPage from "../components/organisms/Bombero/ConsumoView"
import BomberoRecepciones from "../components/organisms/Bombero/RecepcionesView"
import HistorialMaquinasView from "../components/organisms/Bombero/HistorialMaquinasView";

// ⚖️ Importaciones Distpach (Toneladas)
import Distpach from "../pages/Distpach/MenuPrincipalDistpach";

// 🔧 Importaciones Mantenimiento
import Mantenimiento from "../pages/Mantencion/MenuPrincipalMantencion";
import MenuPrincipalDistpach from "../pages/Distpach/MenuPrincipalDistpach";


// Importaciones OperadorVehiculo 
import OperadorVehiculo from "../pages/OperadorVehiculo/MenuPrincipalOperadorVehiculo";
import FormularioOperador from "../components/templates/OperadorVehiculo/FormularioAsignacionVehiculo";

// Importaciones AdministradorOperadorVehiculo
import MenuPrincipalAdminOperador from "../pages/AdminOperador/MenuPrincipalAdminOperador";

const AppRoutes = () => {
  return (
    <Routes>
      {/* 
      |--------------------------------------------------------------------------
      | 🏠 RUTAS PÚBLICAS
      |--------------------------------------------------------------------------
      */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      {/* 
      |--------------------------------------------------------------------------
      | 👤 RUTAS DEL GERENTE
      |--------------------------------------------------------------------------
      */}
      <Route
        path="/gerente"
        element={
          <PrivateRoute requiredRole="gerente">
            <GerentePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/gerente/graficos"
        element={
          <PrivateRoute requiredRole="gerente">
            <GraficosPetroleo />
          </PrivateRoute>
        }
      />

      <Route
        path="/gerente/mantenimiento"
        element={
          <PrivateRoute requiredRole="gerente">
            <MainMantenimiento />
          </PrivateRoute>
        }
      />

      <Route
        path="/gerente/VerificacionIngresos"
        element={
          <PrivateRoute requiredRole="gerente">
            <VerificacionIngresos />
          </PrivateRoute>
        }
      />

      <Route
        path="/gerente/simulacion"
        element={
          <PrivateRoute requiredRole="gerente">
            <MainSimulacion />
          </PrivateRoute>
        }
      />

      <Route
        path="/gerente/produccion"
        element={
          <PrivateRoute requiredRole="gerente">
            <GestionProduccion />
          </PrivateRoute>
        }
      />

      <Route
        path="/gerente/consumo-historial"
        element={
          <PrivateRoute requiredRole="gerente">
            <ConsumoView />
          </PrivateRoute>
        }
      />

      {/* 
      |--------------------------------------------------------------------------
      | 🛠️ RUTAS DEL ADMINISTRADOR
      |--------------------------------------------------------------------------
      */}
      <Route
        path="/administrador"
        element={
          <PrivateRoute requiredRole="admin">
            <AdministradorPage />
          </PrivateRoute>
        }
      />

      {/* Alias para administrador (mantener compatibilidad) */}
      <Route
        path="/inicio"
        element={
          <PrivateRoute requiredRole="admin">
            <AdministradorPage />
          </PrivateRoute>
        }
      />

      {/* Gestión de Usuarios */}
      <Route
        path="/administrador/registro-usuario"
        element={
          <PrivateRoute requiredRole="admin">
            <AdministradorUserRegister />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua para compatibilidad */}
      <Route
        path="/registroUsuario"
        element={
          <PrivateRoute requiredRole="admin">
            <AdministradorUserRegister />
          </PrivateRoute>
        }
      />

      {/* Gestión de Personal */}
      <Route
        path="/administrador/personal-interno"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarPersonal />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/GestionarPersonalInterno"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarPersonal />
          </PrivateRoute>
        }
      />

      <Route
        path="/administrador/permisos-personal"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarPermisoPersonalInterno />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/GestionarPermisoPersonalInterno"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarPermisoPersonalInterno />
          </PrivateRoute>
        }
      />

      <Route
        path="/administrador/personal-externo"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarPersonalExternoPersonalPage />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/GestionarPersonalExterno"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarPersonalExternoPersonalPage />
          </PrivateRoute>
        }
      />

      {/* Gestión de Maquinaria */}
      <Route
        path="/administrador/tipos-maquina"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarTipoMaquina />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/AñadirTipoMaquina"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarTipoMaquina />
          </PrivateRoute>
        }
      />

      <Route
        path="/administrador/categorias-maquina"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarMaquinaCategoria />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/GestionarMaquinaCategoria"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarMaquinaCategoria />
          </PrivateRoute>
        }
      />

      {/* Ruta para gestionar permisos de maquinas. */}
      <Route
        path="/GestionarPermisoMaquinas"
        element={
          <PrivateRoute requiredRole="admin">
            <GestionarMaquinasPermiso />
          </PrivateRoute>
        }
      />

      {/* 
      |--------------------------------------------------------------------------
      | 🚒 RUTAS DEL BOMBERO
      |--------------------------------------------------------------------------
      */}
      <Route
        path="/bombero"
        element={
          <PrivateRoute requiredRoles={["bombero", "asistente_bombero"]}>
            <BomberoPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/bombero/recepcion"
        element={
          <PrivateRoute requiredRoles={["bombero"]}>
            <BomberoRecepcionPage />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/bomberoRecepcion"
        element={
          <PrivateRoute requiredRoles={["bombero", "asistente_bombero"]}>
            <BomberoRecepcionPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/bombero/navegacion"
        element={
          <PrivateRoute requiredRoles={["bombero", "asistente_bombero"]}>
            <BomberoNavigation />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/BomberoNavigation"
        element={
          <PrivateRoute requiredRoles={["bombero", "asistente_bombero"]}>
            <BomberoNavigation />
          </PrivateRoute>
        }
      />

      <Route
        path="/bombero/ingreso-externo"
        element={
          <PrivateRoute requiredRoles={["bombero", "asistente_bombero"]}>
            <BomberoIngresoExterno />
          </PrivateRoute>
        }
      />

      <Route
        path="/bombero/recepciones"
        element={
          <PrivateRoute requiredRoles={["bombero", "asistente_bombero"]}>
            <BomberoRecepciones />
          </PrivateRoute>
        }
      />

      <Route
        path="/bombero/consumos"
        element={
          <PrivateRoute requiredRoles={["bombero", "asistente_bombero"]}>
            <BomberoConsumoPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/bombero/historial-maquinas"
        element={
          <PrivateRoute requiredRoles={["bombero"]}>
            <HistorialMaquinasView />
          </PrivateRoute>
        }
      />


      {/* 
      |--------------------------------------------------------------------------
      | ⚖️ RUTAS DE DISTPACH (TONELADAS)
      |--------------------------------------------------------------------------
      */}
      <Route
        path="/distpach"
        element={
          <PrivateRoute requiredRole="toneladas">
            <Distpach />
          </PrivateRoute>
        }
      />

      <Route
        path="/distpach/toneladas"
        element={
          <PrivateRoute requiredRole="toneladas">
            <Distpach />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/IngresoToneladas"
        element={
          <PrivateRoute requiredRole="toneladas">
            <Distpach />
          </PrivateRoute>
        }
      />

      {/* 
      |--------------------------------------------------------------------------
      | 🔧 RUTAS DE MANTENIMIENTO
      |--------------------------------------------------------------------------
      */}
      <Route
        path="/mantenimiento"
        element={
          <PrivateRoute requiredRole="planificador">
            <Mantenimiento />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/Mantenimiento"
        element={
          <PrivateRoute requiredRole="planificador">
            <Mantenimiento />
          </PrivateRoute>
        }
      />

      {/* 
      |--------------------------------------------------------------------------
      | 🔧 RUTAS DE Operador de Vehículo
      |--------------------------------------------------------------------------
      */}
      <Route
        path="/OperadorVehiculo"
        element={
          <PrivateRoute requiredRole="OperadorVehiculo">
            <OperadorVehiculo />
          </PrivateRoute>
        }
      />
      <Route
        path="/FormularioOperador"
        element={
          <PrivateRoute requiredRole="OperadorVehiculo">
            <FormularioOperador />
          </PrivateRoute>
        }
      />

      {/* Mantener ruta antigua */}
      <Route
        path="/Mantenimiento"
        element={
          <PrivateRoute requiredRole="planificador">
            <Mantenimiento />
          </PrivateRoute>
        }
      />


      {/* 
      |--------------------------------------------------------------------------
      | 🔧 RUTAS DE ADMINISTRADOR DE OPERADOR DE VEHICULOS
      |--------------------------------------------------------------------------
      */}
      <Route
        path="/AdministradorOPeradorVehiculo"
        element={
          <PrivateRoute requiredRole="admin_operador">
            <MenuPrincipalAdminOperador />
          </PrivateRoute>
        }
      />
      {/* 
      |--------------------------------------------------------------------------
      | 🚫 RUTA 404 - NO ENCONTRADA
      |--------------------------------------------------------------------------
      */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Página no encontrada
              </h1>
              <p className="text-gray-600 mb-4">
                La página que buscas no existe o ha sido movida.
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Volver atrás
              </button>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;