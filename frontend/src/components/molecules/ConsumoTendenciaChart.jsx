import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from "recharts";
import { FiTrendingUp, FiAlertTriangle } from "react-icons/fi";
import { consumoService } from "../../context/apiService";

// Componente Card reutilizable
const Card = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
};

// Componente Title reutilizable
const Title = ({ children, icon: Icon }) => {
  return (
    <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
      {Icon && <Icon className="mr-2" size={20} />}
      {children}
    </h2>
  );
};

const ConsumoTendenciaChart = ({ data = [], faenaSeleccionada = 'todas' }) => {
  const [loading, setLoading] = useState(!data || data.length === 0);
  const [consumoMensual, setConsumoMensual] = useState(data);
  const [error, setError] = useState(null);
  
  const NARANJA_PRINCIPAL = "#ff7b00";
  
  // Mapeo de números de mes a nombres abreviados
  const nombresMeses = {
    1: 'Ene',
    2: 'Feb',
    3: 'Mar',
    4: 'Abr',
    5: 'May',
    6: 'Jun',
    7: 'Jul',
    8: 'Ago',
    9: 'Sep',
    10: 'Oct',
    11: 'Nov',
    12: 'Dic'
  };
  
  useEffect(() => {
    // Si hay datos pasados como prop, usarlos
    if (data && data.length > 0) {
      const formattedData = data.map(item => {
        // Asegurarnos de que el mes tenga el formato correcto
        let monthName = item.month;
        
        // Si el mes viene como número, convertirlo a nombre
        if (!isNaN(item.month)) {
          monthName = nombresMeses[parseInt(item.month)] || item.month;
        } else if (item.month && item.month.length === 1 || item.month.length === 2) {
          // Si es "11" o "1", convertirlo a "Nov" o "Ene"
          monthName = nombresMeses[parseInt(item.month)] || item.month;
        }
        
        return {
          ...item,
          month: monthName
        };
      });
      
      setConsumoMensual(formattedData);
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedData = await consumoService.getConsumoMensual(faenaSeleccionada);
        
        // Verificar si hay datos
        if (fetchedData && fetchedData.length > 0) {
          // Formatear los datos si es necesario (adaptar nombres de propiedades)
          const formattedData = fetchedData.map(item => {
            // Obtener el valor del mes (podría ser un número o ya un nombre)
            const monthValue = item.month || item.mes || 'Sin mes';
            
            // Convertir números de mes a nombres
            let monthName = monthValue;
            if (!isNaN(monthValue)) {
              monthName = nombresMeses[parseInt(monthValue)] || monthValue;
            }
            
            return {
              month: monthName,
              consumo: item.consumo || (item.valor || 0)
            };
          });
          
          setConsumoMensual(formattedData);
          setError(null);
        } else {
          // Usar datos simulados como respaldo
          const demoData = [
            { month: 'Ene', consumo: 12500 },
            { month: 'Feb', consumo: 14200 },
            { month: 'Mar', consumo: 13800 },
            { month: 'Abr', consumo: 15300 },
            { month: 'May', consumo: 16200 },
            { month: 'Jun', consumo: 14900 },
            { month: 'Jul', consumo: 15600 },
            { month: 'Ago', consumo: 16500 },
            { month: 'Sep', consumo: 15800 },
            { month: 'Oct', consumo: 16300 },
            { month: 'Nov', consumo: 15900 } // Añadido noviembre
          ];
          setConsumoMensual(demoData);
        }
      } catch (err) {
        console.error("Error al cargar datos de consumo mensual:", err);
        // Usar datos simulados como respaldo en caso de error
        const demoData = [
          { month: 'Ene', consumo: 12500 },
          { month: 'Feb', consumo: 14200 },
          { month: 'Mar', consumo: 13800 },
          { month: 'Abr', consumo: 15300 },
          { month: 'May', consumo: 16200 },
          { month: 'Jun', consumo: 14900 },
          { month: 'Jul', consumo: 15600 },
          { month: 'Ago', consumo: 16500 },
          { month: 'Sep', consumo: 15800 },
          { month: 'Oct', consumo: 16300 },
          { month: 'Nov', consumo: 15900 } // Añadido noviembre
        ];
        setConsumoMensual(demoData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [data, faenaSeleccionada]);

  // Calcular automáticamente los valores mínimos y máximos para el eje Y
  const { minValue, maxValue, avgValue, hasExtremeValues } = useMemo(() => {
    if (!consumoMensual || consumoMensual.length === 0) {
      return { minValue: 0, maxValue: 100, avgValue: 50, hasExtremeValues: false };
    }
    
    const values = consumoMensual.map(item => item.consumo);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Si hay valores extremos, ajustar el rango
    // Si el máximo es mucho mayor que el promedio, ajustamos el rango
    // para mostrar mejor la mayoría de los datos
    const adjustedMin = Math.max(0, min - (avg * 0.1)); // No menor que cero
    
    // Si hay un valor extremadamente alto, limitamos el rango superior
    // a un porcentaje sobre el promedio para que la gráfica sea legible
    const isExtremeMax = max > avg * 3;
    const adjustedMax = isExtremeMax 
      ? avg * 2 // Limitamos a 2 veces el promedio si hay valores extremos
      : max + (max * 0.1); // 10% más del máximo para espacio visual
    
    return { 
      minValue: adjustedMin, 
      maxValue: adjustedMax,
      avgValue: avg,
      hasExtremeValues: isExtremeMax
    };
  }, [consumoMensual]);

  // Asegurar que los meses se muestren en orden cronológico
  const sortedData = useMemo(() => {
    if (!consumoMensual || consumoMensual.length === 0) return [];
    
    // Orden de los meses para ordenar correctamente
    const ordenMeses = {
      'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12
    };
    
    return [...consumoMensual].sort((a, b) => {
      // Si los meses ya están como abreviaturas, usamos el orden predefinido
      if (ordenMeses[a.month] && ordenMeses[b.month]) {
        return ordenMeses[a.month] - ordenMeses[b.month];
      }
      
      // Si son números, ordenar numéricamente
      if (!isNaN(a.month) && !isNaN(b.month)) {
        return parseInt(a.month) - parseInt(b.month);
      }
      
      // Si no podemos determinar el orden, mantener el orden original
      return 0;
    });
  }, [consumoMensual]);

  // Personalizar el tooltip para mostrar valores exactos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isExtreme = data.consumo > maxValue;
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{data.month}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Consumo:</span> {data.consumo.toLocaleString('es-CL')} litros
          </p>
          {isExtreme && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Este valor excede el rango mostrado en el gráfico
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <Title icon={FiTrendingUp}>Tendencia Mensual de Consumo</Title>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Cargando datos...</div>
        </div>
      </Card>
    );
  }

  // Ajustar el título según la faena seleccionada
  const chartTitle = faenaSeleccionada !== 'todas'
    ? `Tendencia Mensual - ${
        faenaSeleccionada === '1' ? 'Cabildo' :
        faenaSeleccionada === '2' ? 'Catemu' :
        faenaSeleccionada === '3' ? 'Chincolco' :
        faenaSeleccionada === '4' ? 'Tiltil' : 'Faena Seleccionada'
      }`
    : "Tendencia Mensual de Consumo";

  return (
    <Card className="mb-4">
      <Title icon={FiTrendingUp}>{chartTitle}</Title>
      
      {error ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <FiAlertTriangle size={40} className="text-orange-500 mb-4" />
          <div className="text-gray-600">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No hay datos disponibles</div>
        </div>
      ) : (
        <div className="h-64">
          {/* Indicador de valores extremos */}
          {hasExtremeValues && (
            <div className="mb-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded border border-orange-200">
              ⚠️ Este gráfico contiene valores extremos. Se ha ajustado la escala para mostrar la tendencia general.
            </div>
          )}
          
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sortedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value) => value}
              />
              <YAxis 
                domain={[minValue, maxValue]} 
                tickFormatter={(value) => value.toLocaleString('es-CL')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Área referencia para el promedio */}
              <ReferenceArea y1={avgValue} strokeOpacity={0.3} label="Promedio" />
              
              <Line
                type="monotone"
                dataKey="consumo"
                name="Consumo Total (litros)"
                stroke={NARANJA_PRINCIPAL}
                strokeWidth={2}
                dot={{ fill: NARANJA_PRINCIPAL, r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default ConsumoTendenciaChart;