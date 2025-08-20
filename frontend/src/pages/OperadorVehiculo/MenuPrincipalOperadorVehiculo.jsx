import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGasPump,
  FaTruck,
  FaPlus,
  FaHistory,
  FaUser,
  FaBuilding,
} from "react-icons/fa";
import UniversalHeader from "../../components/organisms/Todos/UniversalHeader";
import { useOperadorData } from "../../hook/OperadorVehiculo/useOperadorData";
import FormularioAsignacionVehiculo from "../../components/templates/OperadorVehiculo/FormularioAsignacionVehiculo";
import HistorialCollapsible from "../../components/molecules/HistorialCollapsible";
import { useHistorialConsumos } from "../../hook/Bombero/useHistorialConsumos";
import { useConsumosMensuales } from "../../hook/OperadorVehiculo/useConsumosMensuales";


const MenuPrincipalOperadorVehiculo = () => {
  const navigate = useNavigate();
  const { loading, usuario, maquinaAsignada, error: errorOperador } = useOperadorData();

  // 🆕 Estado para controlar qué vista mostrar
  const [vistaActiva, setVistaActiva] = useState('ingreso'); // 'ingreso' o 'historial'

  // 🆕 Hook para historial de consumos
  const {
    loadingHistorial,
    errorHistorial,
    historialConsumos,
    tieneHistorial,
    ultimoConsumo,
    penultimoConsumo,
    cantidadConsumos,
    cargarHistorialConsumos
  } = useHistorialConsumos();

  // 🆕 Hook para consumos mensuales
  const {
    loadingMensuales,
    errorMensuales,
    consumosMensuales,
    estadisticasMensuales,
    cargarConsumosMensuales
  } = useConsumosMensuales();

  // 🆕 Cargar historial cuando tengamos la máquina
  useEffect(() => {
    if (maquinaAsignada?.id_maquina) {
      cargarHistorialConsumos(maquinaAsignada.id_maquina, 10); // Cargar más registros para el historial
    }
  }, [maquinaAsignada?.id_maquina, cargarHistorialConsumos]);

  // 🆕 Cargar estadísticas mensuales cuando tengamos la máquina
  useEffect(() => {
    if (maquinaAsignada?.id_maquina) {
      cargarHistorialConsumos(maquinaAsignada.id_maquina);
      cargarConsumosMensuales(maquinaAsignada.id_maquina); // 🆕 NUEVA LLAMADA
    }
  }, [maquinaAsignada?.id_maquina, cargarHistorialConsumos, cargarConsumosMensuales]);


  // Detectar tipo de medición de la máquina
  const tipoMedicion = maquinaAsignada?.tipo_maquina === 'Generador' ? 'Horometro' : 'Kilometraje';

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-base sm:text-lg font-medium">Cargando panel...</p>
          <p className="text-gray-500 text-sm mt-1">Preparando información del vehículo</p>
        </div>
      </div>
    );
  }

  // Validar datos necesarios
  if (!usuario?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de autenticación</h2>
          <p className="text-gray-600 mb-4">No se pudieron cargar los datos del usuario.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // 🆕 Componente para mostrar estadísticas mensuales
  const EstadisticasMensuales = () => {
    if (loadingMensuales) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm text-blue-600">Cargando estadísticas mensuales...</span>
          </div>
        </div>
      );
    }

    if (errorMensuales) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-600">Error al cargar estadísticas mensuales</span>
          </div>
        </div>
      );
    }

    if (!estadisticasMensuales) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-3a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-600">Sin datos de consumo para comparar</span>
          </div>
        </div>
      );
    }

    const { mesActual, mesAnterior, comparacion } = estadisticasMensuales;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <FaGasPump className="text-blue-600" size={14} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">Consumo Mensual</h4>
            <p className="text-xs text-gray-500">Comparación mes actual vs anterior</p>
          </div>
        </div>

        {/* GRID DE ESTADÍSTICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* MES ACTUAL */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">Mes Actual</span>
              <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {mesActual.litros.toLocaleString('es-ES', { maximumFractionDigits: 1 })} L
            </div>
            <div className="text-xs text-green-700">
              {mesActual.cantidad} registro{mesActual.cantidad !== 1 ? 's' : ''}
            </div>

            {/* DESGLOSE INTERNO/EXTERNO */}
            {(mesActual.internos > 0 || mesActual.externos > 0) && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="flex justify-between text-xs text-green-700">
                  <span>Internos: {mesActual.internos.toFixed(1)}L</span>
                  <span>Externos: {mesActual.externos.toFixed(1)}L</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 🆕 MODIFICAR tu componente HistorialMediciones existente
  const HistorialMediciones = () => (
    <div className="space-y-4">
      {/* Título de la sección */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <FaHistory className="text-blue-500 text-3xl mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-800">Historial de Mediciones</h3>
        </div>
        { console.log('Datos enviados a his:',{ultimoConsumo, penultimoConsumo, tipoMedicion, loading, cantidadConsumos})}
        {/* Tu componente HistorialCollapsible ORIGINAL - SIN CAMBIOS */}
        <HistorialCollapsible
          ultimoConsumo={ultimoConsumo}
          penultimoConsumo={penultimoConsumo}
          tipoMedicion={tipoMedicion}
          loading={loadingHistorial}
          error={errorHistorial}
          cantidadConsumos={cantidadConsumos}
        />

        {/* 🆕 ESTADÍSTICAS MENSUALES - NUEVA SECCIÓN */}
        <EstadisticasMensuales />

        {/* Estado cuando no hay historial (MANTENER LO QUE YA TIENES) */}
        {!loadingHistorial && !tieneHistorial && (
          <div className="text-center py-8">
            <FaHistory className="text-gray-300 text-4xl mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">Sin historial disponible</h4>
            <p className="text-gray-400 text-sm">
              Aún no hay registros de mediciones para este vehículo
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalHeader type="operador" />

      {/* 🆕 HERO SECTION CON INFO DEL USUARIO Y VEHÍCULO */}
      <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full mb-3 sm:mb-4">
              <FaGasPump className="text-white text-lg sm:text-2xl" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
              ¡Hola, {usuario?.nombre || 'Usuario'}! 👋
            </h1>
            <p className="text-orange-100 text-sm sm:text-base lg:text-lg max-w-md mx-auto mb-4">
              Sistema de Gestión de Combustible
            </p>

            {/* INFO DEL VEHÍCULO EN EL HERO */}
            {maquinaAsignada && (
              <div className="bg-white bg-opacity-10 rounded-lg p-3 sm:p-4 max-w-md mx-auto">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <FaTruck className="text-orange-500 opacity-80" />
                    <span className="text-orange-500 font-medium">
                      {maquinaAsignada?.maquina?.maquina_interna?.nombre || 'Vehículo'}
                    </span>
                  </div>
                  <span className="text-orange-500 bg-opacity-20 px-2 py-1 rounded text-xs font-bold">
                    {maquinaAsignada?.maquina?.maquina_interna?.patente || 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🆕 NAVEGACIÓN POR TABS - 2 BOTONES HORIZONTALES */}
      <div className="container mx-auto px-2 py-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {/* BOTÓN INGRESO */}
              <button
                onClick={() => setVistaActiva('ingreso')}
                className={`
                  flex-1 py-4 px-6 text-center font-semibold transition-all duration-200
                  ${vistaActiva === 'ingreso'
                    ? 'bg-orange-500 text-white border-b-2 border-orange-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }
                `}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaPlus className={`text-lg ${vistaActiva === 'ingreso' ? 'text-white' : 'text-orange-500'}`} />
                  <span className="text-base sm:text-lg">Registrar Carga</span>
                </div>
                {vistaActiva === 'ingreso' && (
                  <p className="text-orange-100 text-xs mt-1">Ingresa una nueva carga externa</p>
                )}
              </button>

              {/* BOTÓN HISTORIAL */}
              <button
                onClick={() => setVistaActiva('historial')}
                className={`
                  flex-1 py-4 px-6 text-center font-semibold transition-all duration-200
                  ${vistaActiva === 'historial'
                    ? 'bg-orange-500 text-white border-b-2 border-orange-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }
                `}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaHistory className={`text-lg ${vistaActiva === 'historial' ? 'text-white' : 'text-blue-500'}`} />
                  <span className="text-base sm:text-lg">Historial</span>
                </div>
                {vistaActiva === 'historial' && (
                  <p className="text-orange-100 text-xs mt-1">Ver cargas anteriores</p>
                )}
              </button>
            </div>
          </div>

          {/* 🆕 INDICADOR VISUAL DEL TAB ACTIVO */}
          <div className="h-1 bg-gray-100 relative">
            <div
              className={`absolute h-full bg-orange-500 transition-all duration-300 ease-in-out ${vistaActiva === 'ingreso'
                ? 'w-1/2 left-0'
                : 'w-1/2 left-1/2'
                }`}
            />
          </div>
        </div>

        {/* 🆕 CONTENIDO DINÁMICO SEGÚN EL TAB SELECCIONADO */}
        <div className="transition-all duration-300">
          {vistaActiva === 'ingreso' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* TU FORMULARIO ORIGINAL */}
              <FormularioAsignacionVehiculo />
            </div>
          )}

          {vistaActiva === 'historial' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* TU COMPONENTE HISTORIALCOLLAPSIBLE */}
              <HistorialMediciones />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPrincipalOperadorVehiculo;