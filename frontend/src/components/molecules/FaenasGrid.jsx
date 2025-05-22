import React, { useState, useEffect, useCallback } from "react";
import {
  FaTruck,
  FaIndustry,
  FaEdit,
  FaSave,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarAlt,
  FaHistory,
  FaBan,
  FaInfoCircle
} from "react-icons/fa";
import tonelajeService from "../../context/tonelajeService";

const ProductionTableComponent = ({ fechaProduccion, onDataChange }) => {
  const [faenasData, setFaenasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editandoRegistro, setEditandoRegistro] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  const [motivoCambio, setMotivoCambio] = useState("");
  const [registrandoPadron, setRegistrandoPadron] = useState(null);
  const [nuevoRegistro, setNuevoRegistro] = useState({});
  const [mostrandoHistorial, setMostrandoHistorial] = useState(null);
  const [historialData, setHistorialData] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (fechaProduccion) {
      cargarDatosFaenas();
    }
  }, [fechaProduccion]);

  const cargarDatosFaenas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener faenas disponibles y registros del día
      const [faenasResult, registrosResult] = await Promise.all([
        tonelajeService.getFaenasDisponibles(fechaProduccion),
        tonelajeService.getTonelajesDelDia(fechaProduccion)
      ]);

      if (faenasResult.status === 'success') {
        // Combinar datos de faenas con registros existentes
        const faenasConDatos = faenasResult.data.map(faena => {
          // Buscar registros existentes para esta faena
          const registrosFaena = registrosResult.status === 'success' 
            ? registrosResult.data.find(r => r.faena.id_faena === faena.id_faena)?.registros || []
            : [];

          return {
            ...faena,
            registros: registrosFaena
          };
        });

        setFaenasData(faenasConDatos);
        
        if (onDataChange) {
          onDataChange(faenasConDatos);
        }
      } else {
        setError('Error al cargar datos de faenas');
      }
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      setError('Error inesperado al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [fechaProduccion, onDataChange]);

  const iniciarRegistro = (faena, padron) => {
    setRegistrandoPadron(`${faena.id_faena}-${padron.id_padron}`);
    setNuevoRegistro({
      tonelaje: "",
      viajes: "",
      ley: ""
    });
  };

  const guardarNuevoRegistro = async (faena, padron) => {
    try {
      if (!nuevoRegistro.tonelaje || parseFloat(nuevoRegistro.tonelaje) <= 0) {
        alert('❌ Las toneladas son obligatorias y deben ser mayor a 0');
        return;
      }

      const registro = {
        id_padron: padron.id_padron,
        fecha_produccion: fechaProduccion,
        tonelaje: parseFloat(nuevoRegistro.tonelaje),
        viajes: parseInt(nuevoRegistro.viajes) || 0,
        ley: nuevoRegistro.ley ? parseFloat(nuevoRegistro.ley) : null
      };

      const resultado = await tonelajeService.registrarTonelaje(registro);

      if (resultado.status === 'success') {
        alert('✅ Registro guardado correctamente');
        setRegistrandoPadron(null);
        setNuevoRegistro({});
        await cargarDatosFaenas();
      } else {
        alert(`❌ ${resultado.message}`);
      }
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      alert('❌ Error al guardar el registro');
    }
  };

  const cancelarRegistro = () => {
    setRegistrandoPadron(null);
    setNuevoRegistro({});
  };

  const iniciarEdicion = async (registro) => {
    // Verificar si puede ser editado
    const verificacion = await tonelajeService.verificarPuedeEditar(registro.id_tonelaje);
    
    if (verificacion.status === 'success' && !verificacion.puede_editar) {
      alert(`❌ ${verificacion.mensaje}`);
      return;
    }

    setEditandoRegistro(registro.id_tonelaje);
    setDatosEdicion({
      tonelaje: registro.tonelaje.toString(),
      viajes: registro.viajes.toString(),
      ley: registro.ley ? registro.ley.toString() : ""
    });
    setMotivoCambio("");
  };

  const guardarEdicion = async (registroId) => {
    if (!motivoCambio.trim() || motivoCambio.length < 10) {
      alert('❌ El motivo del cambio debe tener al menos 10 caracteres');
      return;
    }

    // Confirmar la acción ya que solo se puede editar una vez
    const confirmar = window.confirm(
      '⚠️ IMPORTANTE: Este registro solo puede ser editado UNA VEZ. ' +
      'Después de esta modificación, no podrá ser cambiado nuevamente. ' +
      '¿Está seguro de continuar?'
    );

    if (!confirmar) return;

    try {
      const datos = {
        tonelaje: parseFloat(datosEdicion.tonelaje),
        viajes: parseInt(datosEdicion.viajes),
        ley: datosEdicion.ley ? parseFloat(datosEdicion.ley) : null
      };

      const resultado = await tonelajeService.actualizarTonelaje(registroId, datos, motivoCambio);

      if (resultado.status === 'success') {
        alert('✅ Registro actualizado correctamente. Este registro ya no podrá ser modificado nuevamente.');
        cancelarEdicion();
        await cargarDatosFaenas();
      } else {
        alert(`❌ ${resultado.message}`);
      }
    } catch (error) {
      console.error('❌ Error al actualizar:', error);
      alert('❌ Error al actualizar el registro');
    }
  };

  const cancelarEdicion = () => {
    setEditandoRegistro(null);
    setDatosEdicion({});
    setMotivoCambio("");
  };

  const verHistorial = async (registroId) => {
    try {
      const resultado = await tonelajeService.getHistorialAuditoria(registroId);
      
      if (resultado.status === 'success') {
        setHistorialData(resultado.data);
        setMostrandoHistorial(registroId);
      } else {
        alert('❌ Error al cargar historial');
      }
    } catch (error) {
      console.error('❌ Error al cargar historial:', error);
      alert('❌ Error al cargar historial');
    }
  };

  const cerrarHistorial = () => {
    setMostrandoHistorial(null);
    setHistorialData([]);
  };

  // Calcular totales por planta (como en el PDF)
  const calcularTotalesPorPlanta = () => {
    const totales = {};
    
    faenasData.forEach(faena => {
      faena.registros.forEach(registro => {
        const plantaNombre = registro.planta?.nombre || 'Sin Planta';
        
        if (!totales[plantaNombre]) {
          totales[plantaNombre] = {
            tonelaje: 0,
            viajes: 0,
            ley_ponderada: 0,
            total_ley: 0,
            count: 0
          };
        }
        
        totales[plantaNombre].tonelaje += parseFloat(registro.tonelaje);
        totales[plantaNombre].viajes += parseInt(registro.viajes);
        if (registro.ley) {
          totales[plantaNombre].total_ley += parseFloat(registro.ley) * parseFloat(registro.tonelaje);
          totales[plantaNombre].count += parseFloat(registro.tonelaje);
        }
      });
    });

    // Calcular ley ponderada
    Object.keys(totales).forEach(planta => {
      if (totales[planta].count > 0) {
        totales[planta].ley_ponderada = (totales[planta].total_ley / totales[planta].count).toFixed(2);
      }
    });

    return totales;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-3xl text-orange-500 mr-3" />
        <span className="text-lg text-gray-600">Cargando datos de producción...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <span className="text-red-700 font-medium">{error}</span>
        </div>
        <button 
          onClick={cargarDatosFaenas}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const totalesPorPlanta = calcularTotalesPorPlanta();

  return (
    <div className="space-y-6">
      {/* Header como el PDF */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center">
                <FaTruck className="mr-3" />
                Producción {new Date(fechaProduccion).toLocaleDateString('es-CL', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              <p className="text-blue-100 text-sm mt-1">Envío Diario - Registro de Producción por Faenas</p>
            </div>
            <div className="text-right">
              <FaCalendarAlt className="text-2xl" />
            </div>
          </div>
        </div>

        {/* Tabla principal estilo PDF */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="p-3 text-left font-bold text-gray-700 border-r border-gray-300">Capacidad</th>
                <th className="p-3 text-left font-bold text-gray-700 border-r border-gray-300">Padrón</th>
                <th className="p-3 text-left font-bold text-gray-700 border-r border-gray-300">Planta</th>
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-300">Tonelaje</th>
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-300">Ley Ponderada</th>
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-300">N° Viajes</th>
                <th className="p-3 text-center font-bold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {faenasData.map((faena) => (
                <React.Fragment key={faena.id_faena}>
                  {/* Header de Faena */}
                  <tr className="bg-blue-50 border-b border-gray-200">
                    <td colSpan="7" className="p-3 font-bold text-blue-800 border-r border-gray-300">
                      <FaIndustry className="inline mr-2" />
                      {faena.nombre.toUpperCase()}
                    </td>
                  </tr>
                  
                  {/* Padrones de la faena */}
                  {faena.padrones?.map((padron) => {
                    const registroExistente = faena.registros.find(r => r.padron?.id_padron === padron.id_padron);
                    const estaEditando = editandoRegistro === registroExistente?.id_tonelaje;
                    const estaRegistrando = registrandoPadron === `${faena.id_faena}-${padron.id_padron}`;

                    return (
                      <tr key={padron.id_padron} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 border-r border-gray-200 font-medium">
                          {padron.capacidad} Ton
                        </td>
                        <td className="p-3 border-r border-gray-200">
                          <div>
                            <div className="font-medium">{padron.nombre}</div>
                            <div className="text-xs text-gray-500">{padron.empresa}</div>
                          </div>
                        </td>
                        <td className="p-3 border-r border-gray-200 font-medium">
                          {padron.planta?.nombre || 'Sin Planta'}
                        </td>
                        
                        {/* Datos o formularios */}
                        {registroExistente && !estaEditando ? (
                          // Mostrar datos existentes
                          <>
                            <td className="p-3 text-center border-r border-gray-200 font-bold text-lg">
                              {parseFloat(registroExistente.tonelaje).toFixed(2)}
                            </td>
                            <td className="p-3 text-center border-r border-gray-200">
                              {registroExistente.ley ? `${parseFloat(registroExistente.ley).toFixed(2)}%` : '-'}
                            </td>
                            <td className="p-3 text-center border-r border-gray-200 font-bold">
                              {registroExistente.viajes}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                {registroExistente.fue_modificado ? (
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs flex items-center">
                                      <FaBan className="mr-1" />
                                      Modificado
                                    </span>
                                    <button
                                      onClick={() => verHistorial(registroExistente.id_tonelaje)}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                      title="Ver historial"
                                    >
                                      <FaHistory />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                      Registrado
                                    </span>
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => iniciarEdicion(registroExistente)}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        title="Editar (solo una vez)"
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        onClick={() => verHistorial(registroExistente.id_tonelaje)}
                                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                        title="Ver historial"
                                      >
                                        <FaHistory />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </>
                        ) : estaEditando ? (
                          // Modo edición
                          <>
                            <td className="p-2 border-r border-gray-200">
                              <input
                                type="number"
                                value={datosEdicion.tonelaje}
                                onChange={(e) => setDatosEdicion(prev => ({ ...prev, tonelaje: e.target.value }))}
                                className="w-full p-1 border rounded text-center"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <input
                                type="number"
                                value={datosEdicion.ley}
                                onChange={(e) => setDatosEdicion(prev => ({ ...prev, ley: e.target.value }))}
                                className="w-full p-1 border rounded text-center"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <input
                                type="number"
                                value={datosEdicion.viajes}
                                onChange={(e) => setDatosEdicion(prev => ({ ...prev, viajes: e.target.value }))}
                                className="w-full p-1 border rounded text-center"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex flex-col space-y-2">
                                <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
                                  <FaInfoCircle className="inline mr-1 text-yellow-600" />
                                  <strong>Solo se puede editar una vez</strong>
                                </div>
                                <textarea
                                  value={motivoCambio}
                                  onChange={(e) => setMotivoCambio(e.target.value)}
                                  placeholder="Motivo del cambio (mínimo 10 caracteres)..."
                                  className="w-full p-1 border rounded text-xs"
                                  rows="2"
                                />
                                <div className="flex space-x-1">
                                  <button
                                    onClick={cancelarEdicion}
                                    className="px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                                  >
                                    <FaTimes />
                                  </button>
                                  <button
                                    onClick={() => guardarEdicion(registroExistente.id_tonelaje)}
                                    className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                                    disabled={motivoCambio.length < 10}
                                  >
                                    <FaSave />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : estaRegistrando ? (
                          // Modo registro nuevo
                          <>
                            <td className="p-2 border-r border-gray-200">
                              <input
                                type="number"
                                value={nuevoRegistro.tonelaje}
                                onChange={(e) => setNuevoRegistro(prev => ({ ...prev, tonelaje: e.target.value }))}
                                className="w-full p-1 border rounded text-center"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <input
                                type="number"
                                value={nuevoRegistro.ley}
                                onChange={(e) => setNuevoRegistro(prev => ({ ...prev, ley: e.target.value }))}
                                className="w-full p-1 border rounded text-center"
                                placeholder="0.00"
                                step="0.01"
                              />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <input
                                type="number"
                                value={nuevoRegistro.viajes}
                                onChange={(e) => setNuevoRegistro(prev => ({ ...prev, viajes: e.target.value }))}
                                className="w-full p-1 border rounded text-center"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex space-x-1">
                                <button
                                  onClick={cancelarRegistro}
                                  className="px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  <FaTimes />
                                </button>
                                <button
                                  onClick={() => guardarNuevoRegistro(faena, padron)}
                                  className="px-2 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded"
                                >
                                  <FaSave />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // Sin registro
                          <>
                            <td className="p-3 text-center border-r border-gray-200 text-gray-400">0.00</td>
                            <td className="p-3 text-center border-r border-gray-200 text-gray-400">-</td>
                            <td className="p-3 text-center border-r border-gray-200 text-gray-400">0</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => iniciarRegistro(faena, padron)}
                                className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
                              >
                                Registrar
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

              {/* Totales por Planta (como en el PDF) */}
              {Object.keys(totalesPorPlanta).length > 0 && (
                <>
                  <tr className="bg-gray-200 border-t-2 border-gray-400">
                    <td colSpan="7" className="p-2 font-bold text-center text-gray-700">
                      TOTALES POR PLANTA
                    </td>
                  </tr>
                  {Object.entries(totalesPorPlanta).map(([planta, totales]) => (
                    <tr key={planta} className="bg-yellow-50 border-b border-gray-300">
                      <td className="p-3 border-r border-gray-300 font-bold">TOTAL MES</td>
                      <td className="p-3 border-r border-gray-300 font-bold">{planta}</td>
                      <td className="p-3 border-r border-gray-300 font-bold">-</td>
                      <td className="p-3 text-center border-r border-gray-300 font-bold text-lg">
                        {totales.tonelaje.toFixed(2)}
                      </td>
                      <td className="p-3 text-center border-r border-gray-300 font-bold">
                        {totales.ley_ponderada}%
                      </td>
                      <td className="p-3 text-center border-r border-gray-300 font-bold">
                        {totales.viajes}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Total
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total General */}
                  <tr className="bg-gray-800 text-white border-t-2 border-gray-600">
                    <td className="p-3 border-r border-gray-600 font-bold">TOTAL GENERAL</td>
                    <td className="p-3 border-r border-gray-600 font-bold">-</td>
                    <td className="p-3 border-r border-gray-600 font-bold">-</td>
                    <td className="p-3 text-center border-r border-gray-600 font-bold text-lg">
                      {Object.values(totalesPorPlanta).reduce((sum, t) => sum + t.tonelaje, 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center border-r border-gray-600 font-bold">
                      {Object.values(totalesPorPlanta).length > 0 
                        ? (Object.values(totalesPorPlanta).reduce((sum, t) => sum + parseFloat(t.ley_ponderada || 0), 0) / Object.values(totalesPorPlanta).length).toFixed(2)
                        : '0.00'
                      }%
                    </td>
                    <td className="p-3 text-center border-r border-gray-600 font-bold">
                      {Object.values(totalesPorPlanta).reduce((sum, t) => sum + t.viajes, 0)}
                    </td>
                    <td className="p-3 text-center">
                      <FaCheckCircle className="text-green-400" />
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer como el PDF */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <strong>Envío Diario</strong> - Cumplimiento de camiones a la fecha
            </div>
            <div className="flex items-center space-x-4">
              <span>Fecha: {new Date(fechaProduccion).toLocaleDateString('es-CL')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Historial */}
      {mostrandoHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <FaHistory className="mr-2" />
                Historial de Cambios
              </h3>
              <button
                onClick={cerrarHistorial}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {historialData.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.accion === 'creacion' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.accion === 'creacion' ? 'Creación' : 'Modificación'}
                        </span>
                        <span className="text-sm text-gray-600">{item.fecha_cambio}</span>
                      </div>
                      
                      <p className="text-sm mb-2"><strong>Motivo:</strong> {item.motivo}</p>
                      
                      {item.valores_anteriores && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Valores Anteriores:</strong>
                            <ul className="ml-4 text-gray-600">
                              <li>Tonelaje: {item.valores_anteriores.tonelaje}</li>
                              <li>Ley: {item.valores_anteriores.ley || 'N/A'}</li>
                              <li>Viajes: {item.valores_anteriores.viajes}</li>
                            </ul>
                          </div>
                          <div>
                            <strong>Valores Nuevos:</strong>
                            <ul className="ml-4 text-gray-600">
                              <li>Tonelaje: {item.valores_nuevos.tonelaje}</li>
                              <li>Ley: {item.valores_nuevos.ley || 'N/A'}</li>
                              <li>Viajes: {item.valores_nuevos.viajes}</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {historialData.length === 0 && (
                <p className="text-center text-gray-500">No hay historial disponible</p>
              )}
            </div>
          </div>
        </div>
      )}

      {faenasData.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaIndustry className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay faenas disponibles</h3>
          <p className="text-gray-600">
            No se encontraron faenas con padrones disponibles para registrar en esta fecha.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductionTableComponent;