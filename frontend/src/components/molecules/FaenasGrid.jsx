import React, { useState, useEffect, useCallback } from "react";
import {
  FaTruck,
  FaIndustry,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarAlt,
  FaHistory,
  FaBan,
  FaInfoCircle,
  FaSave,
  FaEdit,
  FaTimes,
  FaCheck
} from "react-icons/fa";
import tonelajeService from "../../context/tonelajeService";

const ProductionTableComponent = ({ fechaProduccion, onDataChange }) => {
  const [faenasData, setFaenasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState({});
  const [guardandoTodos, setGuardandoTodos] = useState(false);
  const [mostrandoHistorial, setMostrandoHistorial] = useState(null);
  const [historialData, setHistorialData] = useState([]);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState({});

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

        // Inicializar datos del formulario
        const datosIniciales = {};
        faenasConDatos.forEach(faena => {
          faena.padrones?.forEach(padron => {
            const registroExistente = faena.registros.find(r => r.padron?.id_padron === padron.id_padron);
            datosIniciales[padron.id_padron] = {
              tonelaje: registroExistente ? registroExistente.tonelaje.toString() : "",
              ley: registroExistente ? (registroExistente.ley ? registroExistente.ley.toString() : "") : "",
              viajes: registroExistente ? registroExistente.viajes.toString() : "",
              id_tonelaje: registroExistente ? registroExistente.id_tonelaje : null,
              fue_modificado: registroExistente ? registroExistente.fue_modificado : false
            };
          });
        });

        setFaenasData(faenasConDatos);
        setDatosFormulario(datosIniciales);
        
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

  // Manejar cambios en los inputs
  const handleInputChange = (padronId, campo, valor) => {
    setDatosFormulario(prev => ({
      ...prev,
      [padronId]: {
        ...prev[padronId],
        [campo]: valor
      }
    }));
  };

  // Función para obtener registros válidos para guardar
  const obtenerRegistrosParaGuardar = () => {
    const registrosValidos = [];
    const registrosInvalidos = [];

    faenasData.forEach(faena => {
      faena.padrones?.forEach(padron => {
        const datos = datosFormulario[padron.id_padron];
        
        if (!datos || datos.fue_modificado) return;

        // Solo procesar si hay datos ingresados
        if (datos.tonelaje || datos.viajes) {
          // Validaciones
          if (!datos.tonelaje || parseFloat(datos.tonelaje) <= 0) {
            registrosInvalidos.push({
              padron: padron.nombre,
              faena: faena.nombre,
              error: 'Tonelaje requerido'
            });
            return;
          }

          if (!datos.viajes || parseInt(datos.viajes) <= 0) {
            registrosInvalidos.push({
              padron: padron.nombre,
              faena: faena.nombre,
              error: 'Número de viajes requerido'
            });
            return;
          }

          registrosValidos.push({
            padron,
            faena,
            datos,
            esActualizacion: datos.id_tonelaje !== null
          });
        }
      });
    });

    return { registrosValidos, registrosInvalidos };
  };

  // Guardar todos los registros
  const guardarTodosLosRegistros = async () => {
    const { registrosValidos, registrosInvalidos } = obtenerRegistrosParaGuardar();

    // Mostrar errores de validación si los hay
    if (registrosInvalidos.length > 0) {
      const errores = registrosInvalidos.map(r => `${r.faena} - ${r.padron}: ${r.error}`).join('\n');
      alert(`❌ Errores de validación:\n\n${errores}`);
      return;
    }

    if (registrosValidos.length === 0) {
      alert('⚠️ No hay registros para guardar. Ingrese al menos un tonelaje y número de viajes.');
      return;
    }

    // Verificar si hay actualizaciones que requieren motivo
    const actualizaciones = registrosValidos.filter(r => r.esActualizacion);
    let motivoGlobal = null;

    if (actualizaciones.length > 0) {
      motivoGlobal = prompt(
        `Se van a actualizar ${actualizaciones.length} registro(s) existente(s).\n\n` +
        "Ingrese el motivo del cambio (mínimo 10 caracteres):"
      );
      
      if (!motivoGlobal || motivoGlobal.length < 10) {
        alert('❌ El motivo del cambio debe tener al menos 10 caracteres');
        return;
      }

      const confirmar = window.confirm(
        `⚠️ IMPORTANTE: Los registros modificados solo pueden ser editados UNA VEZ.\n\n` +
        `Se van a procesar:\n` +
        `• ${registrosValidos.length - actualizaciones.length} nuevos registros\n` +
        `• ${actualizaciones.length} actualizaciones (no podrán modificarse nuevamente)\n\n` +
        '¿Está seguro de continuar?'
      );

      if (!confirmar) return;
    }

    setGuardandoTodos(true);

    try {
      let exitosos = 0;
      let fallidos = 0;
      const errores = [];

      for (const item of registrosValidos) {
        try {
          if (item.esActualizacion) {
            // Actualizar registro existente
            const datosActualizacion = {
              tonelaje: parseFloat(item.datos.tonelaje),
              viajes: parseInt(item.datos.viajes),
              ley: item.datos.ley ? parseFloat(item.datos.ley) : null
            };

            const resultado = await tonelajeService.actualizarTonelaje(
              item.datos.id_tonelaje, 
              datosActualizacion, 
              motivoGlobal
            );

            if (resultado.status === 'success') {
              exitosos++;
            } else {
              fallidos++;
              errores.push(`${item.faena.nombre} - ${item.padron.nombre}: ${resultado.message}`);
            }
          } else {
            // Crear nuevo registro
            const registro = {
              id_padron: item.padron.id_padron,
              fecha_produccion: fechaProduccion,
              tonelaje: parseFloat(item.datos.tonelaje),
              viajes: parseInt(item.datos.viajes),
              ley: item.datos.ley ? parseFloat(item.datos.ley) : null
            };

            const resultado = await tonelajeService.registrarTonelaje(registro);

            if (resultado.status === 'success') {
              exitosos++;
            } else {
              fallidos++;
              errores.push(`${item.faena.nombre} - ${item.padron.nombre}: ${resultado.message}`);
            }
          }
        } catch (error) {
          fallidos++;
          errores.push(`${item.faena.nombre} - ${item.padron.nombre}: Error inesperado`);
        }
      }

      // Mostrar mensaje de resultado
      setMensajeExito({
        exitosos,
        fallidos,
        total: registrosValidos.length,
        errores
      });
      setMostrarExito(true);

      // Recargar datos si hubo éxitos
      if (exitosos > 0) {
        await cargarDatosFaenas();
      }

    } catch (error) {
      console.error('❌ Error al guardar registros:', error);
      alert('❌ Error inesperado al guardar los registros');
    } finally {
      setGuardandoTodos(false);
    }
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

  const cerrarMensajeExito = () => {
    setMostrarExito(false);
    setMensajeExito({});
  };

  // Calcular totales por planta
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
            total_ley_tonelaje: 0,
            total_tonelaje_con_ley: 0
          };
        }
        
        const tonelaje = parseFloat(registro.tonelaje) || 0;
        const viajes = parseInt(registro.viajes) || 0;
        const ley = parseFloat(registro.ley) || 0;
        
        totales[plantaNombre].tonelaje += tonelaje;
        totales[plantaNombre].viajes += viajes;
        
        // Cálculo correcto de ley ponderada
        if (ley > 0 && tonelaje > 0) {
          totales[plantaNombre].total_ley_tonelaje += (ley * tonelaje);
          totales[plantaNombre].total_tonelaje_con_ley += tonelaje;
        }
      });
    });

    // Calcular ley ponderada final
    Object.keys(totales).forEach(planta => {
      if (totales[planta].total_tonelaje_con_ley > 0) {
        totales[planta].ley_ponderada = (
          totales[planta].total_ley_tonelaje / 
          totales[planta].total_tonelaje_con_ley
        ).toFixed(2);
      } else {
        totales[planta].ley_ponderada = "0.00";
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
  const { registrosValidos, registrosInvalidos } = obtenerRegistrosParaGuardar();

  return (
    <div className="space-y-6">
      {/* Header exacto como el PDF */}
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
              <p className="text-blue-100 text-sm mt-1">Envío Diario - Cumplimiento de camiones a la fecha</p>
            </div>
            <div className="text-right">
              <FaCalendarAlt className="text-2xl" />
            </div>
          </div>
        </div>

        {/* Botón de Guardar Global */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {registrosValidos.length > 0 && (
                <span className="text-green-600 font-medium">
                  {registrosValidos.length} registro(s) listo(s) para guardar
                </span>
              )}
              {registrosInvalidos.length > 0 && (
                <span className="text-red-600 font-medium ml-3">
                  {registrosInvalidos.length} registro(s) con errores
                </span>
              )}
            </div>
            <button
              onClick={guardarTodosLosRegistros}
              disabled={guardandoTodos || registrosValidos.length === 0}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all duration-200 flex items-center shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {guardandoTodos ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Guardando registros...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Guardar Todos los Registros ({registrosValidos.length})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabla EXACTA como el PDF - FORMULARIO DIRECTO */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-400">
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-400">Capacidad</th>
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-400">Padrón</th>
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-400">Planta</th>
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-400">Tonelaje</th>
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-400">Ley Ponderada</th>
                <th className="p-3 text-center font-bold text-gray-700 border-r border-gray-400">N° Viajes</th>
                <th className="p-3 text-center font-bold text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody>
              {faenasData.map((faena) => (
                <React.Fragment key={faena.id_faena}>
                  {/* Header de Faena */}
                  <tr className="bg-blue-50 border-b border-gray-300">
                    <td colSpan="7" className="p-3 font-bold text-blue-800 border-r border-gray-400 text-center">
                      <FaIndustry className="inline mr-2" />
                      {faena.nombre.toUpperCase()}
                    </td>
                  </tr>
                  
                  {/* TODOS los padrones con inputs directos */}
                  {faena.padrones?.map((padron) => {
                    const datos = datosFormulario[padron.id_padron] || {};
                    const tieneRegistroExistente = datos.id_tonelaje !== null;
                    const fueModificado = datos.fue_modificado;

                    return (
                      <tr key={padron.id_padron} className="border-b border-gray-300 hover:bg-gray-50">
                        {/* Capacidad */}
                        <td className="p-3 border-r border-gray-300 text-center font-medium">
                          {padron.capacidad} Ton
                        </td>
                        
                        {/* Padrón */}
                        <td className="p-3 border-r border-gray-300 text-center">
                          <div className="font-medium">{padron.nombre}</div>
                          <div className="text-xs text-gray-500">{padron.empresa}</div>
                        </td>
                        
                        {/* Planta */}
                        <td className="p-3 border-r border-gray-300 text-center font-medium">
                          {padron.planta?.nombre || 'N/a'}
                        </td>
                        
                        {/* Tonelaje - INPUT DIRECTO */}
                        <td className="p-2 border-r border-gray-300">
                          <input
                            type="number"
                            value={datos.tonelaje || ""}
                            onChange={(e) => handleInputChange(padron.id_padron, 'tonelaje', e.target.value)}
                            className="w-full p-2 border rounded text-center bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            placeholder="0.00"
                            step="0.01"
                            disabled={fueModificado}
                          />
                        </td>
                        
                        {/* Ley - INPUT DIRECTO */}
                        <td className="p-2 border-r border-gray-300">
                          <input
                            type="number"
                            value={datos.ley || ""}
                            onChange={(e) => handleInputChange(padron.id_padron, 'ley', e.target.value)}
                            className="w-full p-2 border rounded text-center bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            placeholder="0.00"
                            step="0.01"
                            disabled={fueModificado}
                          />
                        </td>
                        
                        {/* Viajes - INPUT DIRECTO */}
                        <td className="p-2 border-r border-gray-300">
                          <input
                            type="number"
                            value={datos.viajes || ""}
                            onChange={(e) => handleInputChange(padron.id_padron, 'viajes', e.target.value)}
                            className="w-full p-2 border rounded text-center bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            placeholder="0"
                            disabled={fueModificado}
                          />
                        </td>
                        
                        {/* Estado */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            {fueModificado ? (
                              <>
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs flex items-center">
                                  <FaBan className="mr-1" size={10} />
                                  Modificado
                                </span>
                                {tieneRegistroExistente && (
                                  <button
                                    onClick={() => verHistorial(datos.id_tonelaje)}
                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                    title="Ver historial"
                                  >
                                    <FaHistory size={12} />
                                  </button>
                                )}
                              </>
                            ) : tieneRegistroExistente ? (
                              <>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
                                  <FaCheck className="mr-1" size={10} />
                                  Registrado
                                </span>
                                <button
                                  onClick={() => verHistorial(datos.id_tonelaje)}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Ver historial"
                                >
                                  <FaHistory size={12} />
                                </button>
                              </>
                            ) : (datos.tonelaje || datos.viajes) ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                Pendiente
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                Sin datos
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

              {/* Totales por Planta */}
              {Object.keys(totalesPorPlanta).length > 0 && (
                <>
                  <tr className="bg-gray-200 border-t-2 border-gray-500">
                    <td colSpan="7" className="p-2 font-bold text-center text-gray-700 border-r border-gray-400">
                      TOTALES POR PLANTA
                    </td>
                  </tr>
                  {Object.entries(totalesPorPlanta).map(([planta, totales]) => (
                    <tr key={planta} className="bg-yellow-50 border-b border-gray-400">
                      <td className="p-3 border-r border-gray-400 font-bold text-center">TOTAL MES</td>
                      <td className="p-3 border-r border-gray-400 font-bold text-center">{planta}</td>
                      <td className="p-3 border-r border-gray-400 font-bold text-center">N/a</td>
                      <td className="p-3 text-center border-r border-gray-400 font-bold text-lg">
                        {totales.tonelaje.toFixed(2)}
                      </td>
                      <td className="p-3 text-center border-r border-gray-400 font-bold">
                        {totales.ley_ponderada}%
                      </td>
                      <td className="p-3 text-center border-r border-gray-400 font-bold">
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
                    <td className="p-3 border-r border-gray-600 font-bold text-center">Total General</td>
                    <td className="p-3 border-r border-gray-600 font-bold text-center">-</td>
                    <td className="p-3 border-r border-gray-600 font-bold text-center">-</td>
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

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <strong>Envío Diario</strong> - Cumplimiento de camiones a la fecha
            </div>
            <div className="flex items-center space-x-4">
              <span>Fecha: {new Date(fechaProduccion).toLocaleDateString('es-CL')}</span>
              <span>•</span>
              <span>% Cumplimiento: {faenasData.length > 0 ? Math.round((faenasData.filter(f => f.registros.length > 0).length / faenasData.length) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Éxito Profesional */}
      {mostrarExito && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="text-center p-8">
              {/* Icono de éxito */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <FaCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              {/* Título */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {mensajeExito.fallidos === 0 ? '¡Registros Guardados!' : 'Guardado Completado'}
              </h3>
              
              {/* Resumen */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{mensajeExito.exitosos}</div>
                    <div className="text-xs text-gray-600">Exitosos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{mensajeExito.fallidos}</div>
                    <div className="text-xs text-gray-600">Fallidos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">{mensajeExito.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>
              </div>
              
              {/* Mensaje principal */}
              <p className="text-gray-600 mb-6">
                {mensajeExito.fallidos === 0 
                  ? `Se han guardado exitosamente ${mensajeExito.exitosos} registro(s) de producción.`
                  : `Se procesaron ${mensajeExito.total} registro(s). ${mensajeExito.exitosos} fueron guardados correctamente${mensajeExito.fallidos > 0 ? ` y ${mensajeExito.fallidos} presentaron errores` : ''}.`
                }
              </p>

              {/* Lista de errores si los hay */}
              {mensajeExito.errores && mensajeExito.errores.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Errores encontrados:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {mensajeExito.errores.map((error, index) => (
                      <div key={index} className="text-xs text-red-700 mb-1">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Botón de cerrar */}
              <button
                onClick={cerrarMensajeExito}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial */}
      {mostrandoHistorial && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold flex items-center">
                <FaHistory className="mr-2 text-blue-600" />
                Historial de Cambios
              </h3>
              <button
                onClick={cerrarHistorial}
                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
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
                          <span className="text-sm text-gray-600">
                            {new Date(item.fecha_cambio).toLocaleString('es-CL')}
                          </span>
                        </div>
                        
                        <p className="text-sm mb-2">
                          <strong>Motivo:</strong> {item.motivo || 'Creación inicial'}
                        </p>
                        
                        {item.valores_anteriores && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Valores Anteriores:</strong>
                              <ul className="ml-4 text-gray-600 space-y-1">
                                <li>• Tonelaje: {item.valores_anteriores.tonelaje}</li>
                                <li>• Ley: {item.valores_anteriores.ley || 'N/A'}%</li>
                                <li>• Viajes: {item.valores_anteriores.viajes}</li>
                              </ul>
                            </div>
                            <div>
                              <strong>Valores Nuevos:</strong>
                              <ul className="ml-4 text-gray-600 space-y-1">
                                <li>• Tonelaje: {item.valores_nuevos.tonelaje}</li>
                                <li>• Ley: {item.valores_nuevos.ley || 'N/A'}%</li>
                                <li>• Viajes: {item.valores_nuevos.viajes}</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {historialData.length === 0 && (
                  <div className="text-center py-8">
                    <FaInfoCircle className="mx-auto text-gray-400 text-3xl mb-2" />
                    <p className="text-gray-500">No hay historial disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay faenas */}
      {faenasData.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FaIndustry className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay faenas disponibles</h3>
          <p className="text-gray-600">
            No se encontraron faenas con padrones disponibles para registrar en esta fecha.
          </p>
          <button
            onClick={cargarDatosFaenas}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductionTableComponent;