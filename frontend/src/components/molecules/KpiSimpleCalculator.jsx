import React, { useState, useEffect, useCallback, memo } from "react";
import { FaCalculator, FaHistory, FaInfoCircle, FaCalendarAlt, FaChartBar } from "react-icons/fa";
import { FiCheckCircle, FiInfo, FiAlertCircle, FiTruck, FiActivity, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { gerenteService } from "../../context/apiService";
import axios from '../../lib/axios';
import PropTypes from 'prop-types';

/**
 * Componente para cálculo de KPIs de producción y consumo.
 * 
 * Este componente permite ingresar datos de producción (toneladas extraídas y camionadas)
 * y calcula automáticamente KPIs relacionados con costos de petróleo y rendimientos,
 * utilizando datos de consumo obtenidos de la API.
 */
const SimpleKpiCalculator = ({
  onCalculate,
  periodo = "mensual",
  faena = "",
  setFaena
}) => {
  // Estados UI
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [infoMensaje, setInfoMensaje] = useState(null);
  const [historialVisible, setHistorialVisible] = useState(false);

  // Estados para UI de desglose de máquinas
  const [mostrarDesgloseMaquinas, setMostrarDesgloseMaquinas] = useState(false);
  const [mostrarUltimosConsumos, setMostrarUltimosConsumos] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [mostrarTodasMaquinas, setMostrarTodasMaquinas] = useState(false);

  // Estados de datos
  const [faenasDisponibles, setFaenasDisponibles] = useState([]);
  const [cargandoFaenas, setCargandoFaenas] = useState(false);
  const [mesAnterior, setMesAnterior] = useState('');
  const [historialActualizaciones, setHistorialActualizaciones] = useState([]);
  const [datosPetroleoMesAnterior, setDatosPetroleoMesAnterior] = useState(null);
  const [cargandoDatosPetroleo, setCargandoDatosPetroleo] = useState(false);

  // Datos de entrada del formulario
  const [valores, setValores] = useState({
    toneladas: "",
    camionadas: ""
  });

  // Calcular rendimiento de forma memoizada
  const rendimientoCalculado = useCallback(() => {
    const toneladas = parseFloat(valores.toneladas) || 0;
    const camionadas = parseFloat(valores.camionadas) || 0;

    if (camionadas > 0 && toneladas > 0) {
      return (toneladas / camionadas).toFixed(2);
    }
    return 0;
  }, [valores.toneladas, valores.camionadas]);

  // Efectos

  // Cargar faenas disponibles al iniciar
  useEffect(() => {
    cargarFaenasDisponibles();
  }, []);

  // Cargar datos de petróleo cuando cambia la faena
  useEffect(() => {
    if (faena) {
      cargarDatosPetroleo();
    } else {
      setDatosPetroleoMesAnterior(null);
    }
  }, [faena]);

  // Funciones

  /**
 * Función auxiliar para obtener el nombre del mes anterior
 */
  const obtenerNombreMesAnterior = () => {
    return mesAnterior;
  };
  /**
   * Carga los datos de consumo de petróleo para la faena seleccionada
   */
  const cargarDatosPetroleo = async () => {
    if (!faena) return;

    try {
      setCargandoDatosPetroleo(true);
      setError(null);

      const response = await axios.get('/api/kpis-getCostoPetroleoSinUltimosConsumos', {
        params: {
          faena: faena !== 'todas' ? faena : null
        }
      });

      if (response.data?.status === 'success') {
        const datos = response.data.data;

        // Verificar si hay datos de consumo
        if (!datos.anterior || parseFloat(datos.anterior.costo_total) <= 0) {
          // No hay datos de consumo, pero permitimos continuar con advertencia
          setDatosPetroleoMesAnterior({
            costo_total: 0,
            costo_total_horometro: 0,
            costo_total_kilometraje: 0,
            medicion_horometro: 0,
            medicion_kilometraje: 0,
            desglose_por_maquina: [],
            ultimos_consumos: []
          });

          setInfoMensaje(`Advertencia: No hay datos de consumo para ${getNombreFaena(faena)} en ${obtenerNombreMesAnterior()}. 
                         Puede continuar ingresando datos de producción, pero los KPIs relacionados con costos no serán precisos.`);
          return;
        }

        // Continuar con el proceso normal si hay datos
        setDatosPetroleoMesAnterior(datos.anterior);

        // Verificar si hay datos suficientes
        if (datos.faena_filtrada &&
          (parseFloat(datos.anterior.costo_total) <= 0 ||
            !datos.anterior.desglose_por_maquina?.length)) {
          setInfoMensaje(`Advertencia: Datos de consumo limitados para la faena seleccionada en ${obtenerNombreMesAnterior()}.`);
        } else {
          setInfoMensaje(null);
        }
      } else {
        setError('Respuesta incorrecta del servidor al obtener datos de consumo');
        setDatosPetroleoMesAnterior(null);
      }
    } catch (err) {
      console.error('Error al cargar datos de petróleo:', err);
      setError(`Error al obtener datos de consumo: ${err.message || 'Error de conexión'}`);
      setDatosPetroleoMesAnterior(null);
    } finally {
      setCargandoDatosPetroleo(false);
    }
  };

  /**
   * Carga las faenas disponibles para ingresar datos
   */
  const cargarFaenasDisponibles = async () => {
    try {
      setCargandoFaenas(true);
      setError(null);

      const resultado = await gerenteService.getFaenasDisponibles();

      if (resultado.status === 'success') {
        setFaenasDisponibles(resultado.data);

        // Obtener y formatear el mes anterior para mostrar
        const fechaActual = new Date();
        fechaActual.setMonth(fechaActual.getMonth() - 1);
        setMesAnterior(fechaActual.toLocaleString('default', { month: 'long', year: 'numeric' }));

        if (resultado.data.length === 0) {
          setInfoMensaje(`Todas las faenas ya tienen datos registrados para ${fechaActual.toLocaleString('default', { month: 'long', year: 'numeric' })}.`);
        } else if (!faena && resultado.data.length > 0) {
          // Seleccionar automáticamente la primera faena disponible
          const primeraFaena = resultado.data[0].id_faena.toString();
          if (setFaena) {
            setFaena(primeraFaena);
          }
        }
      } else {
        setError(resultado.message || 'No se pudieron cargar las faenas disponibles');
        setFaenasDisponibles([]);
      }
    } catch (err) {
      console.error('Error al cargar faenas disponibles:', err);
      setError('Error de conexión al cargar faenas disponibles');
    } finally {
      setCargandoFaenas(false);
    }
  };

  // Manejadores de eventos

  /**
   * Maneja cambios en los campos de entrada
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Validar que sea un número positivo o vacío
    if (value === "" || (parseFloat(value) >= 0 && !isNaN(value))) {
      setValores(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * Limpia el formulario
   */
  const resetForm = () => {
    setValores({
      toneladas: "",
      camionadas: ""
    });
  };

  /**
   * Maneja el cambio de faena seleccionada
   */
  const handleFaenaChange = (e) => {
    const nuevaFaena = e.target.value;
    if (setFaena) {
      setFaena(nuevaFaena);
    }
  };

  /**
   * Calcula los KPIs usando los valores ingresados y los datos de petróleo
   */
  const calcularKPIsCompletos = (valoresIngresados, datosPetroleo) => {
    // Validación de parámetros
    if (!valoresIngresados || !datosPetroleo) {
      return {
        error: "Datos insuficientes para calcular KPIs"
      };
    }

    // Inicializar objeto de resultados con valores básicos
    const resultados = {
      toneladas: parseFloat(valoresIngresados.toneladas) || 0,
      camionadas: parseFloat(valoresIngresados.camionadas) || 0,
      rendimiento: 0,
      costo_total: 0,
      costo_total_horometro: 0,
      costo_total_kilometraje: 0,
      costo_por_tonelada: 0,
      costo_por_hora: 0,
      costo_por_km: 0,
      medicion_horometro: 0,
      medicion_kilometraje: 0,
      horas_trabajadas: 0
    };

    // Extraer valores desde datos de petróleo
    const costoTotal = parseFloat(datosPetroleo.costo_total) || 0;
    const costoTotalHorometro = parseFloat(datosPetroleo.costo_total_horometro) || 0;
    const costoTotalKilometraje = parseFloat(datosPetroleo.costo_total_kilometraje) || 0;
    const medicionHorometro = parseFloat(datosPetroleo.medicion_horometro) || 0;
    const medicionKilometraje = parseFloat(datosPetroleo.medicion_kilometraje) || 0;
    const toneladas = parseFloat(valoresIngresados.toneladas) || 0;
    const camionadas = parseFloat(valoresIngresados.camionadas) || 0;

    // Calcular rendimiento
    if (camionadas > 0 && toneladas > 0) {
      resultados.rendimiento = toneladas / camionadas;
    }

    // Asignar datos de medición
    resultados.costo_total = costoTotal;
    resultados.costo_total_horometro = costoTotalHorometro;
    resultados.costo_total_kilometraje = costoTotalKilometraje;
    resultados.medicion_horometro = medicionHorometro;
    resultados.medicion_kilometraje = medicionKilometraje;
    resultados.horas_trabajadas = medicionHorometro;  // Las horas trabajadas son las medidas por el horómetro

    // Calcular KPIs
    // 1. Costo por tonelada: costo total / toneladas
    if (toneladas > 0 && costoTotal > 0) {
      resultados.costo_por_tonelada = costoTotal / toneladas;
    }

    // 2. Costo por hora: preferimos usar costo específico por tipo de máquina si está disponible
    if (medicionHorometro > 0) {
      if (costoTotalHorometro > 0) {
        resultados.costo_por_hora = costoTotalHorometro / medicionHorometro;
      } else if (costoTotal > 0) {
        // Fallback al cálculo general si no hay datos específicos
        resultados.costo_por_hora = costoTotal / medicionHorometro;
      }
    }

    // 3. Costo por km: también preferimos usar costo específico si está disponible
    if (medicionKilometraje > 0) {
      if (costoTotalKilometraje > 0) {
        resultados.costo_por_km = costoTotalKilometraje / medicionKilometraje;
      } else if (costoTotal > 0) {
        // Fallback al cálculo general
        resultados.costo_por_km = costoTotal / medicionKilometraje;
      }
    }

    return resultados;
  };

  /**
   * Envía los datos al servidor
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!faena) {
      setError("Debe seleccionar una faena antes de continuar");
      return;
    }

    if (!valores.toneladas) {
      setError("Debe ingresar al menos las toneladas extraídas");
      return;
    }

    try {
      setLoading(true);
      setSuccess(null);
      setError(null);

      // Validaciones adicionales
      if (parseFloat(valores.toneladas) <= 0) {
        setError("El valor de toneladas debe ser mayor a 0");
        return;
      }

      if (!datosPetroleoMesAnterior || parseFloat(datosPetroleoMesAnterior.costo_total) <= 0) {
        setError("No hay datos de consumo de petróleo disponibles para la faena seleccionada");
        return;
      }

      // Calcular KPIs combinando datos ingresados con datos de petróleo
      const datosCompletos = calcularKPIsCompletos(valores, datosPetroleoMesAnterior);

      if (datosCompletos.error) {
        setError(datosCompletos.error);
        return;
      }

      // Preparar datos para enviar al API
      const datos = {
        valores_entrada: {
          toneladas_extraidas: parseFloat(valores.toneladas) || 0,
          camionadas: parseFloat(valores.camionadas) || 0,
          rendimiento: datosCompletos.rendimiento || 0,
          horas_trabajadas: datosCompletos.medicion_horometro || 0, // Enviamos las horas medidas por horómetro
          // Valores calculados de costos
          petroleo_toneladas: datosCompletos.costo_por_tonelada || 0,
          petroleo_horas: datosCompletos.costo_por_hora || 0,
          petroleo_kilometros: datosCompletos.costo_por_km || 0
        },
        periodo: periodo,
        faena: faena
      };

      // Enviar datos al servidor
      const resultadoAPI = await gerenteService.calcularKpis(datos);

      if (resultadoAPI?.status === 'success') {
        setSuccess("Datos registrados correctamente");

        // Notificar al componente padre
        if (onCalculate && typeof onCalculate === 'function') {
          onCalculate({
            status: 'success',
            data: datosCompletos
          });
        }

        // Actualizar historial local
        const nuevaEntrada = {
          fecha: new Date().toISOString(),
          faena: faena,
          toneladas: parseFloat(valores.toneladas) || 0,
          camionadas: parseFloat(valores.camionadas) || 0,
          rendimiento: datosCompletos.rendimiento || 0,
          horas_trabajadas: datosCompletos.medicion_horometro || 0
        };

        setHistorialActualizaciones([
          nuevaEntrada,
          ...historialActualizaciones.slice(0, 4)  // Mantener solo las últimas 5 entradas
        ]);

        // Limpiar formulario y recargar faenas disponibles
        resetForm();
        cargarFaenasDisponibles();
      } else {
        setError(resultadoAPI?.message || "Error al registrar datos. Intente nuevamente.");
      }
    } catch (err) {
      console.error("Error al registrar datos:", err);
      setError("Error de conexión al guardar datos. Verifique su conexión a internet.");
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares UI

  /**
   * Obtiene el nombre de la faena a partir de su ID
   */
  const getNombreFaena = (id) => {
    const faenaEncontrada = faenasDisponibles.find(f => f.id_faena.toString() === id.toString());
    return faenaEncontrada
      ? faenaEncontrada.nombre
      : (id === '1' ? 'Cabildo' :
        id === '2' ? 'Catemu' :
          id === '3' ? 'Chincolco' :
            id === '4' ? 'Tiltil' : id);
  };

  /**
   * Formatea el tipo de máquina para mostrar en tabla
   */
  const getTipoMaquinaString = (maquina) => {
    const tipo = maquina?.tipo_medicion?.toLowerCase();
    if (tipo === 'horometro') {
      return 'Horómetro';
    } else if (tipo === 'kilometraje') {
      return 'Kilometraje';
    } else {
      return maquina?.tipo_medicion || 'Desconocido';
    }
  };

  /**
   * Calcula el porcentaje del costo total por tipo de máquina
   */
  const calcularPorcentajeTipo = (costoTipo, costoTotal) => {
    if (!costoTotal || costoTotal <= 0) return 0;
    return ((costoTipo / costoTotal) * 100).toFixed(2);
  };

  // Obtener valores calculados para previsualización
  const costoPorTonelada = parseFloat(valores.toneladas) > 0 && parseFloat(datosPetroleoMesAnterior?.costo_total) > 0
    ? (parseFloat(datosPetroleoMesAnterior.costo_total) / parseFloat(valores.toneladas))
    : 0;

  const costoPorHora = parseFloat(datosPetroleoMesAnterior?.medicion_horometro) > 0 && parseFloat(datosPetroleoMesAnterior?.costo_total_horometro) > 0
    ? (parseFloat(datosPetroleoMesAnterior.costo_total_horometro) / parseFloat(datosPetroleoMesAnterior.medicion_horometro))
    : 0;

  const costoPorKm = parseFloat(datosPetroleoMesAnterior?.medicion_kilometraje) > 0 && parseFloat(datosPetroleoMesAnterior?.costo_total_kilometraje) > 0
    ? (parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje) / parseFloat(datosPetroleoMesAnterior.medicion_kilometraje))
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Encabezado y botón de historial */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FaCalculator className="text-orange-500 mr-2" size={24} />
          <h3 className="text-xl font-semibold">Calculadora de KPIs</h3>
        </div>
        {historialActualizaciones.length > 0 && (
          <button
            onClick={() => setHistorialVisible(!historialVisible)}
            className="text-sm text-gray-600 flex items-center hover:text-orange-500 transition-colors"
            aria-label={historialVisible ? 'Ocultar historial' : 'Mostrar historial'}
          >
            <FaHistory className="mr-1" />
            {historialVisible ? 'Ocultar historial' : 'Mostrar historial'}
          </button>
        )}
      </div>

      {/* Información sobre la restricción temporal */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-blue-800 text-sm">
        <FiInfo className="inline-block mr-2" />
        <div>
          <p className="font-medium mb-1">Importante:</p>
          <p>Esta calculadora permite registrar datos de producción únicamente para el <strong>mes anterior ({mesAnterior})</strong>.</p>
          <p className="mt-1">Los datos del mes actual solo podrán ingresarse a partir del próximo mes.</p>
        </div>
      </div>

      {/* Indicador de mes para el cual se están ingresando datos */}
      <div className="mb-4 p-2 bg-orange-100 border border-orange-300 rounded-md flex items-center text-orange-800">
        <FaCalendarAlt className="mr-2 text-orange-600" />
        <span className="font-medium">Ingresando datos para: <span className="text-orange-900">{mesAnterior}</span></span>
      </div>

      {/* Mensajes informativos */}
      {infoMensaje && (
        <div className="mb-4 p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-800 text-sm flex items-start">
          <FaInfoCircle className="mr-2 mt-0.5" />
          <div>{infoMensaje}</div>
        </div>
      )}

      {/* Datos de petróleo cargados para cálculos */}
      {datosPetroleoMesAnterior && parseFloat(datosPetroleoMesAnterior.costo_total) > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="font-medium mb-2 text-gray-700">Datos de consumo para faena <span className="font-bold">{getNombreFaena(faena)}</span> ({mesAnterior})</h4>

          {/* Resumen de costos */}
          <div className="grid grid-cols-1 gap-2 text-sm mb-3">
            <div className="bg-white p-2 rounded border border-gray-200">
              <span className="font-medium">Costo total:</span>
              <span className="ml-1">${parseFloat(datosPetroleoMesAnterior.costo_total).toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* Resumen por tipo de máquina */}
          <div className="mb-3">
            <h5 className="font-medium text-sm text-gray-700 mb-1">Costos por tipo de máquina:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {parseFloat(datosPetroleoMesAnterior.costo_total_horometro) > 0 && (
                <div className="bg-white p-2 rounded border border-blue-100">
                  <div className="flex justify-between">
                    <span className="font-medium">Horómetro:</span>
                    <span>${parseFloat(datosPetroleoMesAnterior.costo_total_horometro).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex justify-between mt-1">
                    <span>Horas trabajadas: {parseFloat(datosPetroleoMesAnterior.medicion_horometro).toLocaleString('es-CL')}</span>
                    <span>{calcularPorcentajeTipo(parseFloat(datosPetroleoMesAnterior.costo_total_horometro), parseFloat(datosPetroleoMesAnterior.costo_total))}% del total</span>
                  </div>
                </div>
              )}

              {parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje) > 0 && (
                <div className="bg-white p-2 rounded border border-green-100">
                  <div className="flex justify-between">
                    <span className="font-medium">Kilometraje:</span>
                    <span>${parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex justify-between mt-1">
                    <span>KM recorridos: {parseFloat(datosPetroleoMesAnterior.medicion_kilometraje).toLocaleString('es-CL')}</span>
                    <span>{calcularPorcentajeTipo(parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje), parseFloat(datosPetroleoMesAnterior.costo_total))}% del total</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {datosPetroleoMesAnterior.desglose_por_maquina && datosPetroleoMesAnterior.desglose_por_maquina.length > 0 && (
            <div className="mt-3">
              <h5 className="font-medium text-sm text-gray-700 mb-1 flex items-center cursor-pointer"
                onClick={() => setMostrarDesgloseMaquinas(!mostrarDesgloseMaquinas)}>
                <FaChartBar className="mr-1 text-blue-500" />
                Desglose por Máquina:
                {mostrarDesgloseMaquinas ?
                  <FiChevronUp className="ml-2" /> :
                  <FiChevronDown className="ml-2" />
                }
                <span className="text-xs ml-2 text-gray-500">
                  ({datosPetroleoMesAnterior.desglose_por_maquina.length} máquinas)
                </span>
              </h5>

              {mostrarDesgloseMaquinas && (
                <div className="text-xs">
                  {/* Tabs for different machine categories */}
                  <div className="flex mb-2 border-b">
                    <button
                      className={`py-1 px-3 ${categoriaSeleccionada === 'todas' ? 'font-medium border-b-2 border-blue-500' : 'text-gray-500'}`}
                      onClick={() => setCategoriaSeleccionada('todas')}
                    >
                      Todas
                    </button>
                    <button
                      className={`py-1 px-3 ${categoriaSeleccionada === 'horometro' ? 'font-medium border-b-2 border-blue-500' : 'text-gray-500'}`}
                      onClick={() => setCategoriaSeleccionada('horometro')}
                    >
                      Horómetro
                    </button>
                    <button
                      className={`py-1 px-3 ${categoriaSeleccionada === 'kilometraje' ? 'font-medium border-b-2 border-blue-500' : 'text-gray-500'}`}
                      onClick={() => setCategoriaSeleccionada('kilometraje')}
                    >
                      Kilometraje
                    </button>
                  </div>

                  {/* Filter machines by category */}
                  {(() => {
                    const maquinasFiltradas = datosPetroleoMesAnterior.desglose_por_maquina.filter(maquina =>
                      categoriaSeleccionada === 'todas' ||
                      maquina.tipo_medicion?.toLowerCase() === categoriaSeleccionada.toLowerCase()
                    );

                    const maquinasMostradas = mostrarTodasMaquinas ?
                      maquinasFiltradas :
                      maquinasFiltradas.slice(0, 5);

                    return (
                      <>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="min-w-full bg-white">
                            <thead>
                              <tr className="bg-gray-100 border-b">
                                <th className="text-left py-1 px-2">Máquina</th>
                                <th className="text-center py-1 px-2">Tipo</th>
                                <th className="text-right py-1 px-2">Litros</th>
                                <th className="text-right py-1 px-2">Costo</th>
                                <th className="text-right py-1 px-2">Medición</th>
                              </tr>
                            </thead>
                            <tbody>
                              {maquinasMostradas.map((maquina, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                  <td className="py-1 px-2">{maquina.nombre_maquina}</td>
                                  <td className="py-1 px-2 text-center">{getTipoMaquinaString(maquina)}</td>
                                  <td className="py-1 px-2 text-right">{parseFloat(maquina.total_litros).toLocaleString('es-CL')}</td>
                                  <td className="py-1 px-2 text-right">${parseFloat(maquina.costo_total_maquina).toLocaleString('es-CL')}</td>
                                  <td className="py-1 px-2 text-right">
                                    {maquina.diferencia_medicion > 0 ?
                                      `${parseFloat(maquina.diferencia_medicion).toLocaleString('es-CL')} ${maquina.tipo_medicion?.toLowerCase() === 'kilometraje' ? 'km' : 'hrs'}` :
                                      '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Show more/less button */}
                        {maquinasFiltradas.length > 5 && (
                          <button
                            onClick={() => setMostrarTodasMaquinas(!mostrarTodasMaquinas)}
                            className="mt-2 text-blue-500 hover:text-blue-700 text-xs flex items-center"
                          >
                            {mostrarTodasMaquinas ? (
                              <>Mostrar menos <FiChevronUp className="ml-1" /></>
                            ) : (
                              <>Mostrar todas ({maquinasFiltradas.length}) <FiChevronDown className="ml-1" /></>
                            )}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Mostrar últimos consumos no incluidos */}
          {datosPetroleoMesAnterior.ultimos_consumos && datosPetroleoMesAnterior.ultimos_consumos.length > 0 && (
            <div className="mt-3">
              <h5
                className="font-medium text-sm text-gray-700 mb-1 flex items-center cursor-pointer"
                onClick={() => setMostrarUltimosConsumos(!mostrarUltimosConsumos)}
              >
                <FiInfo className="mr-1 text-amber-500" />
                Últimos consumos no incluidos en cálculos:
                {mostrarUltimosConsumos ?
                  <FiChevronUp className="ml-2" /> :
                  <FiChevronDown className="ml-2" />
                }
                <span className="text-xs ml-2 text-gray-500">
                  ({datosPetroleoMesAnterior.ultimos_consumos.length} registros)
                </span>
              </h5>

              {mostrarUltimosConsumos && (
                <div className="text-xs max-h-32 overflow-y-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-amber-50 border-b">
                        <th className="text-left py-1 px-2">Máquina</th>
                        <th className="text-center py-1 px-2">Fecha</th>
                        <th className="text-right py-1 px-2">Litros</th>
                        <th className="text-right py-1 px-2">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosPetroleoMesAnterior.ultimos_consumos.map((consumo, idx) => {
                        const costo = parseFloat(consumo.litros_consumidos) * parseFloat(consumo.precio_litro);
                        return (
                          <tr key={idx} className="border-b hover:bg-amber-50">
                            <td className="py-1 px-2">{consumo.nombre_maquina}</td>
                            <td className="py-1 px-2 text-center">{new Date(consumo.fecha_consumo).toLocaleDateString()}</td>
                            <td className="py-1 px-2 text-right">{parseFloat(consumo.litros_consumidos).toLocaleString('es-CL')}</td>
                            <td className="py-1 px-2 text-right">${costo.toLocaleString('es-CL')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-amber-600 mt-1">
                Nota: Estos consumos se agregan automáticamente al mes actual, ya que representan combustible no consumido totalmente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Historial de actualizaciones */}
      {historialVisible && historialActualizaciones.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="font-medium mb-2 text-gray-700 flex items-center">
            <FiInfo className="mr-1" /> Últimas actualizaciones
          </h4>
          <div className="text-sm max-h-40 overflow-y-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Fecha</th>
                  <th className="text-left py-1">Faena</th>
                  <th className="text-right py-1">Toneladas</th>
                  <th className="text-right py-1">Camionadas</th>
                  <th className="text-right py-1">Rendimiento</th>
                  <th className="text-right py-1">Horas</th>
                </tr>
              </thead>
              <tbody>
                {historialActualizaciones.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-100">
                    <td className="py-1">{new Date(item.fecha).toLocaleString()}</td>
                    <td className="py-1">{getNombreFaena(item.faena)}</td>
                    <td className="py-1 text-right">{item.toneladas?.toLocaleString() || '-'}</td>
                    <td className="py-1 text-right">{item.camionadas?.toLocaleString() || '-'}</td>
                    <td className="py-1 text-right">{typeof item.rendimiento === 'number' ? item.rendimiento.toFixed(2) : '-'}</td>
                    <td className="py-1 text-right">{item.horas_trabajadas?.toLocaleString() || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensajes de éxito y error */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <FiCheckCircle className="mr-2" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} aria-label="Formulario de KPIs">
        {/* Selector de faenas */}
        <div className="mb-4">
          <label htmlFor="selectFaena" className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar Faena {cargandoFaenas && <span className="text-xs text-gray-500">(Cargando...)</span>}
          </label>
          <select
            id="selectFaena"
            value={faena}
            onChange={handleFaenaChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            disabled={cargandoFaenas || faenasDisponibles.length === 0}
            aria-busy={cargandoFaenas}
            aria-invalid={!faena && valores.toneladas ? "true" : "false"}
          >
            <option value="">Seleccione una faena</option>
            {faenasDisponibles.map(f => (
              <option key={f.id_faena} value={f.id_faena}>
                {f.nombre}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Solo se muestran faenas que no tienen datos registrados para el mes anterior.
          </p>
        </div>

        {/* Campos para toneladas y camionadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="inputToneladas" className="block text-sm font-medium text-gray-700 mb-1">
              Toneladas Extraídas <span className="text-red-500">*</span>
            </label>
            <input
              id="inputToneladas"
              type="number"
              name="toneladas"
              value={valores.toneladas}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ingrese toneladas extraídas"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="inputCamionadas" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Camionadas
            </label>
            <input
              id="inputCamionadas"
              type="number"
              name="camionadas"
              value={valores.camionadas}
              onChange={handleInputChange}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ingrese cantidad de camionadas"
            />
          </div>
        </div>

        {/* Vista previa de cálculos */}
        {datosPetroleoMesAnterior && parseFloat(datosPetroleoMesAnterior.costo_total) > 0 && valores.toneladas && (
          <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
            <h4 className="font-medium mb-2 text-green-800 flex items-center">
              <FaCalculator className="mr-2 text-green-600" />
              Vista previa de KPIs calculados
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              {/* Add rendimiento here */}
              {parseFloat(valores.camionadas) > 0 && (
                <div className="bg-white p-2 rounded border border-green-100">
                  <span className="font-medium">Rendimiento:</span>
                  <span className="ml-1">
                    {rendimientoCalculado()} ton/viaje
                  </span>
                  <div className="mt-1 text-xs text-gray-500">
                    Toneladas por viaje en {mesAnterior}
                  </div>
                </div>
              )}

              <div className="bg-white p-2 rounded border border-green-100">
                <span className="font-medium">Costo por tonelada:</span>
                <span className="ml-1">
                  ${costoPorTonelada.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                </span>
              </div>

              {parseFloat(datosPetroleoMesAnterior.costo_total_horometro) > 0 && parseFloat(datosPetroleoMesAnterior.medicion_horometro) > 0 && (
                <div className="bg-white p-2 rounded border border-green-100">
                  <span className="font-medium">Costo por hora:</span>
                  <span className="ml-1">
                    ${costoPorHora.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                  </span>
                  <div className="mt-1 text-xs text-gray-500">
                    Calculado con costo específico de máquinas tipo Horómetro
                  </div>
                </div>
              )}

              {parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje) > 0 && parseFloat(datosPetroleoMesAnterior.medicion_kilometraje) > 0 && (
                <div className="bg-white p-2 rounded border border-green-100">
                  <span className="font-medium">Costo por kilómetro:</span>
                  <span className="ml-1">
                    ${costoPorKm.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                  </span>
                  <div className="mt-1 text-xs text-gray-500">
                    Calculado con costo específico de máquinas tipo Kilometraje
                  </div>
                </div>
              )}
            </div>

            {/* Información sobre medición de horas */}
            <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded border border-green-100">
              <p><strong>Nota:</strong> Las horas trabajadas ({parseFloat(datosPetroleoMesAnterior.medicion_horometro).toLocaleString('es-CL')} hrs) se obtienen
                automáticamente de las mediciones de horómetro registradas en el sistema.</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            disabled={loading}
          >
            Limpiar
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={loading || !faena || faenasDisponibles.length === 0 || cargandoDatosPetroleo}
            aria-busy={loading || cargandoDatosPetroleo}
          >
            {loading || cargandoDatosPetroleo ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
                {cargandoDatosPetroleo ? 'Cargando datos...' : 'Registrando...'}
              </>
            ) : (
              <>
                <FaCalculator className="mr-2" />
                Registrar KPIs
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Definir PropTypes para validación de props
SimpleKpiCalculator.propTypes = {
  onCalculate: PropTypes.func,
  periodo: PropTypes.string,
  faena: PropTypes.string,
  setFaena: PropTypes.func
};

// Memorizar el componente para evitar renderizados innecesarios
export default memo(SimpleKpiCalculator);