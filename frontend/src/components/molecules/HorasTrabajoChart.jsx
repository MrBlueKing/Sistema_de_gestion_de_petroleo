import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend
} from 'recharts';
import { FiArrowDownCircle } from 'react-icons/fi';


const BarrilesTrabajoChart = () => {
  // Datos de ejemplo para filtros
  const faenas = ['Todas', 'Faena Norte', 'Faena Sur', 'Faena Central'];
  const tiposMaquina = ['Todos', 'Tipo A', 'Tipo B', 'Tipo C'];
  
  // Estados para filtros y datos
  const [faenaSeleccionada, setFaenaSeleccionada] = useState('Todas');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Todos');
  const [datos, setDatos] = useState([
    { id: 1, nombre: 'Equipo A', horas: 230, limite: 250, faena: 'Faena Norte', tipo: 'Tipo A', ultMantencion: '15/03/2025' },
    { id: 2, nombre: 'Equipo B', horas: 185, limite: 250, faena: 'Faena Sur', tipo: 'Tipo A', ultMantencion: '20/03/2025' },
    { id: 3, nombre: 'Equipo C', horas: 120, limite: 250, faena: 'Faena Central', tipo: 'Tipo B', ultMantencion: '01/04/2025' },
    { id: 4, nombre: 'Equipo D', horas: 246, limite: 250, faena: 'Faena Norte', tipo: 'Tipo B', ultMantencion: '05/04/2025' },
    { id: 5, nombre: 'Equipo E', horas: 420, limite: 500, faena: 'Faena Sur', tipo: 'Tipo C', ultMantencion: '10/04/2025' },
    { id: 6, nombre: 'Equipo F', horas: 500, limite: 500, faena: 'Faena Central', tipo: 'Tipo C', ultMantencion: '15/04/2025' },
  ]);
  
  // Función para realizar mantenimiento (reiniciar horas)
  const realizarMantenimiento = (equipoId) => {
    // Copia de los datos actuales
    const nuevosDatos = datos.map(equipo => {
      if (equipo.id === equipoId) {
        return {
          ...equipo,
          horas: 0, // Reiniciamos las horas
          ultMantencion: new Date().toLocaleDateString() // Actualizamos la fecha de mantenimiento
        };
      }
      return equipo;
    });
    
    setDatos(nuevosDatos);
    
    // Mostramos una notificación temporal
    alert(`Mantenimiento registrado para ${datos.find(e => e.id === equipoId).nombre}`);
  };

  // Filtrar datos según selecciones
  const datosFiltrados = datos.filter(item => {
    return (faenaSeleccionada === 'Todas' || item.faena === faenaSeleccionada) && 
           (tipoSeleccionado === 'Todos' || item.tipo === tipoSeleccionado);
  });

  // Función para determinar color basado en porcentaje de uso
  const getNivelColor = (horas, limite) => {
    const porcentaje = (horas / limite) * 100;
    if (porcentaje < 50) return '#22c55e'; // Verde
    if (porcentaje < 80) return '#eab308'; // Amarillo
    if (porcentaje < 95) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  };

  // Componente de tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const porcentaje = Math.round((d.horas / d.limite) * 100);
      const horasRestantes = d.limite - d.horas;
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-bold text-lg mb-2">{d.nombre}</p>
          <div className="space-y-1">
            <p><span className="font-medium">Nivel:</span> {porcentaje}%</p>
            <p><span className="font-medium">Horas trabajadas:</span> {d.horas}</p>
            <p><span className="font-medium">Capacidad total:</span> {d.limite} horas</p>
            <p className={horasRestantes <= 20 ? "text-red-500 font-bold" : "text-blue-500"}>
              {horasRestantes <= 0 ? "¡Barril lleno!" : `Horas restantes: ${horasRestantes}`}
            </p>
            <p className="text-gray-600"><span className="font-medium">Faena:</span> {d.faena}</p>
            <p className="text-gray-600"><span className="font-medium">Tipo:</span> {d.tipo}</p>
            <p className="text-gray-600"><span className="font-medium">Última mantención:</span> {d.ultMantencion}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Componente personalizado para los barriles
  const BarrilCustom = (props) => {
    const { x, y, width, height, value, payload } = props;
    const nivelColor = getNivelColor(value, payload.limite);
    const barrelWidth = width * 0.7;
    const barrelX = x + (width - barrelWidth) / 2;

    // Calculamos la altura máxima que puede tener un barril
    const maxBarrelHeight = height * 0.85;
    
    // Calculamos la altura proporcional del barril según su límite
    // Usando como referencia el mayor límite posible (500 horas)
    const barrelHeightRatio = payload.limite / 500;
    const barrelBodyHeight = maxBarrelHeight * barrelHeightRatio;
    
    // Ajustamos la posición Y para que todos los barriles estén alineados en la parte inferior
    const barrelY = y + (height - barrelBodyHeight);
    
    // Calculamos la altura del líquido en proporción a las horas trabajadas
    const porcentaje = value / payload.limite;
    const oilHeight = barrelBodyHeight * porcentaje;
    const oilY = barrelY + (barrelBodyHeight - oilHeight);
    
    return (
      <g>
        {/* Barril base */}
        <rect
          x={barrelX}
          y={barrelY}
          width={barrelWidth}
          height={barrelBodyHeight}
          fill="#e5e7eb"
          stroke="#9ca3af"
          strokeWidth={1}
          rx={barrelWidth * 0.15}
        />
        
        {/* Anillos decorativos del barril */}
        <rect
          x={barrelX}
          y={barrelY + barrelBodyHeight * 0.2}
          width={barrelWidth}
          height={2}
          fill="#9ca3af"
        />
        <rect
          x={barrelX}
          y={barrelY + barrelBodyHeight * 0.8}
          width={barrelWidth}
          height={2}
          fill="#9ca3af"
        />
        
        {/* Relleno del barril */}
        {value > 0 && (
          <rect
            x={barrelX + 4}
            y={oilY}
            width={barrelWidth - 8}
            height={oilHeight}
            fill={nivelColor}
            rx={(barrelWidth - 8) * 0.1}
          />
        )}
        
        {/* Efecto de brillo en la parte superior del líquido */}
        {value > 0 && (
          <ellipse
            cx={barrelX + barrelWidth / 2}
            cy={oilY}
            rx={(barrelWidth - 8) / 2}
            ry={5}
            fill={nivelColor}
            opacity="0.7"
          />
        )}
        
        {/* Texto del porcentaje dentro del barril */}
        <text
          x={barrelX + barrelWidth / 2}
          y={barrelY + barrelBodyHeight / 2 - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold"
          fill="#1f2937"
          fontSize="12"
        >
          {Math.round((value / payload.limite) * 100)}%
        </text>
        
        {/* Botón de mantenimiento */}
        <g 
          onClick={() => realizarMantenimiento(payload.id)}
          style={{ cursor: 'pointer' }}
          className="hover:opacity-90"
        >
          <rect
            x={barrelX + (barrelWidth - 70) / 2}
            y={barrelY + barrelBodyHeight / 2 + 5}
            width={70}
            height={20}
            rx={4}
            fill={value > payload.limite * 0.8 ? "#ef4444" : "#3b82f6"}
            stroke="#ffffff"
            strokeWidth={1}
          />
          <text
            x={barrelX + barrelWidth / 2 + 8}
            y={barrelY + barrelBodyHeight / 2 + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize="8"
          >
            Mantención
          </text>
          <FiArrowDownCircle
            x={barrelX + barrelWidth / 2 - 30}
            y={barrelY + barrelBodyHeight / 2 + 8}
            width={12}
            height={12}
            color="#ffffff"
          />
        </g>
        
        {/* Etiqueta con el límite en la parte superior del barril */}
        <text
          x={barrelX + barrelWidth / 2}
          y={barrelY - 10}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="10"
        >
          Límite: {payload.limite}h
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Monitoreo de Horas de Trabajo por Equipo</h2>
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Faena</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={faenaSeleccionada}
            onChange={(e) => setFaenaSeleccionada(e.target.value)}
          >
            {faenas.map(faena => (
              <option key={faena} value={faena}>{faena}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Máquina</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={tipoSeleccionado}
            onChange={(e) => setTipoSeleccionado(e.target.value)}
          >
            {tiposMaquina.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
        <div style={{ width: '100%', height: 450 }}>
          <ResponsiveContainer>
            <BarChart
              data={datosFiltrados}
              margin={{ top: 20, right: 30, left: 30, bottom: 70 }}
              barGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="nombre" 
                tick={{ fill: '#4b5563' }}
                axisLine={{ stroke: '#9ca3af' }}
              />
              <YAxis 
                domain={[0, 550]} 
                tick={{ fill: '#4b5563' }}
                axisLine={{ stroke: '#9ca3af' }}
                label={{ 
                  value: 'Horas', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: '#4b5563',
                  offset: -10
                }}
              />
              
              {/* Líneas de referencia */}
              <ReferenceLine y={250} stroke="#6366f1" strokeWidth={2} strokeDasharray="3 3" label={{
                value: '250 hrs',
                position: 'right',
                fill: '#6366f1',
                fontSize: 12
              }} />
              
              <ReferenceLine y={500} stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" label={{
                value: '500 hrs',
                position: 'right',
                fill: '#8b5cf6',
                fontSize: 12
              }} />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              
              <Bar
                name="Horas Trabajadas"
                dataKey="horas"
                shape={<BarrilCustom />}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
        <div>
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> &lt; 50%
          <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full ml-4 mr-1"></span> 50% - 80%
          <span className="inline-block w-3 h-3 bg-orange-500 rounded-full ml-4 mr-1"></span> 80% - 95%
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-4 mr-1"></span> &gt; 95%
        </div>
        <div>
          Última actualización: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default BarrilesTrabajoChart;