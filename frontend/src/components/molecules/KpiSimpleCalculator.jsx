import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaChartBar,
  FaDownload,
  FaCog,
  FaFileAlt,
  FaPrint
} from "react-icons/fa";
import ProductionTableComponent from "../molecules/FaenasGrid"; // El nuevo componente
import tonelajeService from "../../context/tonelajeService";

const ProductionPage = () => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [datosProduccion, setDatosProduccion] = useState([]);
  const [resumenGeneral, setResumenGeneral] = useState(null);
  const [loading, setLoading] = useState(false);

  // Inicializar con fecha de ayer
  useEffect(() => {
    const ayer = tonelajeService.getFechaAyer();
    setFechaSeleccionada(ayer);
  }, []);

  // Manejar cambios en los datos de las faenas
  const handleDataChange = (faenasData) => {
    setDatosProduccion(faenasData);
    
    // Calcular resumen general
    const resumen = faenasData.reduce((acc, faena) => {
      const totalFaena = faena.registros.reduce((faenaAcc, registro) => ({
        tonelaje: faenaAcc.tonelaje + parseFloat(registro.tonelaje),
        viajes: faenaAcc.viajes + parseInt(registro.viajes),
        registros: faenaAcc.registros + 1
      }), { tonelaje: 0, viajes: 0, registros: 0 });

      return {
        totalTonelaje: acc.totalTonelaje + totalFaena.tonelaje,
        totalViajes: acc.totalViajes + totalFaena.viajes,
        totalRegistros: acc.totalRegistros + totalFaena.registros,
        faenasConRegistros: acc.faenasConRegistros + (totalFaena.registros > 0 ? 1 : 0),
        totalFaenas: acc.totalFaenas + 1
      };
    }, { 
      totalTonelaje: 0, 
      totalViajes: 0, 
      totalRegistros: 0, 
      faenasConRegistros: 0,
      totalFaenas: 0
    });

    // Calcular rendimiento promedio
    resumen.rendimientoPromedio = resumen.totalViajes > 0 
      ? (resumen.totalTonelaje / resumen.totalViajes).toFixed(2)
      : 0;

    setResumenGeneral(resumen);
  };

  const handleFechaChange = (e) => {
    setFechaSeleccionada(e.target.value);
  };

  const exportarDatos = () => {
    if (!datosProduccion.length) {
      alert('No hay datos para exportar');
      return;
    }

    // Crear CSV estilo reporte
    let csvContent = "REPORTE DE PRODUCCIÓN DIARIA\n";
    csvContent += `Fecha: ${new Date(fechaSeleccionada).toLocaleDateString('es-CL')}\n\n`;
    csvContent += "Capacidad,Padrón,Planta,Tonelaje,Ley Ponderada,N° Viajes,Rendimiento\n";
    
    datosProduccion.forEach(faena => {
      csvContent += `\n${faena.nombre.toUpperCase()}\n`;
      faena.registros.forEach(registro => {
        const rendimiento = registro.viajes > 0 ? (registro.tonelaje / registro.viajes).toFixed(2) : 0;
        csvContent += `${registro.padron?.capacidad || 'N/A'} Ton,${registro.padron?.nombre || 'N/A'},${registro.planta?.nombre || 'N/A'},${registro.tonelaje},${registro.ley || 'N/A'}%,${registro.viajes},${rendimiento}\n`;
      });
    });

    // Totales
    if (resumenGeneral) {
      csvContent += `\nTOTAL GENERAL,,,,${resumenGeneral.totalTonelaje.toFixed(2)},,${resumenGeneral.totalViajes},${resumenGeneral.rendimientoPromedio}\n`;
    }

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_produccion_${fechaSeleccionada}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const imprimirReporte = () => {
    window.print();
  };

  const refreshData = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal estilo profesional */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Sistema de Producción Minera
                </h1>
                <p className="text-gray-600 mt-1">
                  Reporte de Producción Diaria - Envío y Control de Tonelajes
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={refreshData}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Actualizar datos"
                >
                  <FaCog />
                </button>
                <button
                  onClick={imprimirReporte}
                  disabled={!datosProduccion.length}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaPrint className="mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={exportarDatos}
                  disabled={!datosProduccion.length}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaDownload className="mr-2" />
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Panel de Control Superior */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Selector de Fecha */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaCalendarAlt className="inline mr-2 text-orange-500" />
              Fecha de Producción
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={handleFechaChange}
              max={tonelajeService.getFechaAyer()}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Datos del día anterior
            </p>
          </div>

          {/* Resumen Ejecutivo */}
          {resumenGeneral && (
            <>
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaChartBar className="mr-2 text-blue-500" />
                  Producción Total
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Toneladas:</span>
                    <span className="font-bold text-xl text-blue-600">
                      {resumenGeneral.totalTonelaje.toLocaleString('es-CL', { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Viajes:</span>
                    <span className="font-semibold text-gray-900">
                      {resumenGeneral.totalViajes.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaFileAlt className="mr-2 text-green-500" />
                  Rendimiento
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Promedio:</span>
                    <span className="font-bold text-xl text-green-600">
                      {resumenGeneral.rendimientoPromedio}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    ton/viaje
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaCog className="mr-2 text-purple-500" />
                  Estado Operacional
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Faenas Activas:</span>
                    <span className="font-semibold text-purple-600">
                      {resumenGeneral.faenasConRegistros}/{resumenGeneral.totalFaenas}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Registros:</span>
                    <span className="font-semibold text-gray-900">
                      {resumenGeneral.totalRegistros}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Componente Principal - Tabla estilo PDF */}
        {fechaSeleccionada && (
          <ProductionTableComponent
            fechaProduccion={fechaSeleccionada}
            onDataChange={handleDataChange}
          />
        )}

        {/* Información de cumplimiento (como en el PDF) */}
        {resumenGeneral && resumenGeneral.totalRegistros > 0 && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              Cumplimiento de Camiones a la Fecha
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {((resumenGeneral.faenasConRegistros / resumenGeneral.totalFaenas) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-blue-600">Faenas Completadas</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {resumenGeneral.totalViajes}
                  </div>
                  <div className="text-sm text-green-600">Viajes Realizados</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">
                    {resumenGeneral.rendimientoPromedio}
                  </div>
                  <div className="text-sm text-orange-600">Eficiencia (ton/viaje)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instrucciones de uso */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            📋 Instrucciones de Uso:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-800">
            <ul className="space-y-1">
              <li>• Seleccione la fecha de producción (día anterior)</li>
              <li>• Cada fila representa un padrón específico por faena</li>
              <li>• Haga clic en "Registrar" para ingresar datos de producción</li>
            </ul>
            <ul className="space-y-1">
              <li>• Los datos se pueden modificar una sola vez (auditoría)</li>
              <li>• Use "Exportar CSV" para generar reportes</li>
              <li>• Los totales se calculan automáticamente por planta</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer estilo reporte */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>&copy; {new Date().getFullYear()} Minera 3H</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>Sistema de Gestión de Producción</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Versión 2.0.0</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span>Reporte generado: {new Date().toLocaleString('es-CL')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductionPage;