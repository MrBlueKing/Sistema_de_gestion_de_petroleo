// 🎨 Context para manejar colores de gráficos de manera centralizada
// VERSIÓN OPTIMIZADA - Elimina re-renders innecesarios sin cambiar funcionalidad
import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

// 🎨 PALETA DE COLORES CONSISTENTE
const CHART_COLORS = [
  "#f97316", // orange-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f43f5e", // rose-500
  "#6366f1", // indigo-500
  "#64748b", // slate-500
];

// Crear el contexto
const ChartColorsContext = createContext();

// 🔧 Provider del contexto - OPTIMIZADO PARA EVITAR RE-RENDERS
export const ChartColorsProvider = ({ children }) => {
  // Estados centralizados
  const [categoryColorMapping, setCategoryColorMapping] = useState({});
  const [mainChartLoaded, setMainChartLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🔧 REFS PARA CACHE DE LOGGING (evita recrear Set constantemente)
  const loggedColorsRef = useRef(new Set());
  const warnedCategoriesRef = useRef(new Set());

  // 🎨 FUNCIÓN ESTABILIZADA PARA OBTENER COLOR DE CATEGORÍA
  const getColorForCategory = useCallback((categoryName) => {
    if (!categoryName || typeof categoryName !== 'string') {
      console.warn(`🎨 ChartColorsContext: Nombre de categoría inválido:`, categoryName);
      return CHART_COLORS[0]; // Color por defecto
    }

    const color = categoryColorMapping[categoryName];
    
    if (color) {
      // ✅ Log solo una vez por categoría para evitar spam
      if (!loggedColorsRef.current.has(categoryName)) {
        console.log(`🎨 ChartColorsContext: ✅ Color encontrado para "${categoryName}": ${color}`);
        loggedColorsRef.current.add(categoryName);
      }
      return color;
    }

    // ❌ Advertir solo una vez por categoría faltante
    if (!warnedCategoriesRef.current.has(categoryName)) {
      console.warn(`🎨 ChartColorsContext: ❌ No se encontró color para "${categoryName}"`);
      console.warn(`🎨 ChartColorsContext: Categorías disponibles:`, Object.keys(categoryColorMapping));
      warnedCategoriesRef.current.add(categoryName);
    }

    return CHART_COLORS[0]; // Color por defecto
  }, [categoryColorMapping]); // SOLO depende de categoryColorMapping

  // 🎨 CALLBACK ESTABILIZADO PARA CUANDO ConsumptionPieChart NOTIFICA COLORES
  const handleMainChartLoad = useCallback((categoriasConColores) => {
    // 🔧 VALIDACIÓN TEMPRANA SILENCIOSA (evita logs innecesarios)
    if (!categoriasConColores || !Array.isArray(categoriasConColores) || categoriasConColores.length === 0) {
      return;
    }

    try {
      // 🔧 CREAR MAPEO DE COLORES
      const newMapping = {};

      categoriasConColores.forEach((categoria, index) => {
        const categoryName = categoria.name || categoria.nombre || categoria.label || `Categoría ${index + 1}`;
        
        let color = categoria.color || categoria.assignedColor || categoria.chartColor;
        
        if (!color) {
          color = CHART_COLORS[index % CHART_COLORS.length];
        }

        if (color && categoryName) {
          newMapping[categoryName] = color;
        }
      });

      // 🔧 ACTUALIZAR SOLO SI REALMENTE HAY CAMBIOS (evita re-renders innecesarios)
      setCategoryColorMapping(prevMapping => {
        const hasChanges = JSON.stringify(newMapping) !== JSON.stringify(prevMapping);
        
        if (hasChanges && Object.keys(newMapping).length > 0) {
          console.log(`🎨 ChartColorsContext: ✅ Actualizando mapeo con ${Object.keys(newMapping).length} categorías`);
          
          // 🔧 ACTUALIZAR OTROS ESTADOS EN LOTE (evita múltiples re-renders)
          setMainChartLoaded(true);
          setIsInitialized(true);
          
          // Limpiar caches de logging
          loggedColorsRef.current.clear();
          warnedCategoriesRef.current.clear();
          
          return newMapping;
        }
        
        // No hay cambios, devolver el estado anterior
        return prevMapping;
      });

    } catch (error) {
      console.error("🎨 ChartColorsContext: ❌ Error procesando datos de categorías:", error);
    }
  }, []); // SIN DEPENDENCIAS - función completamente estable

  // 🔄 FUNCIÓN ESTABILIZADA PARA RESETEAR ESTADOS
  const resetColorMapping = useCallback(() => {
    console.log("🔄 ChartColorsContext: Reseteando estados de colores");
    
    // 🔧 RESETEAR ESTADOS EN LOTE
    setCategoryColorMapping({});
    setMainChartLoaded(false);
    setIsInitialized(false);
    
    // Limpiar caches de logging
    loggedColorsRef.current.clear();
    warnedCategoriesRef.current.clear();
  }, []); // SIN DEPENDENCIAS - función completamente estable

  // 🔧 VALORES DERIVADOS MEMOIZADOS (solo cambian cuando realmente es necesario)
  const derivedValues = useMemo(() => ({
    hasValidColorMapping: Object.keys(categoryColorMapping).length > 0,
    categoryCount: Object.keys(categoryColorMapping).length,
    categoryNames: Object.keys(categoryColorMapping),
  }), [categoryColorMapping]); // SOLO depende de categoryColorMapping

  // 🔧 FUNCIÓN DE DEBUG ESTABILIZADA
  const debugInfo = useCallback(() => ({
    categoryColorMapping,
    mainChartLoaded,
    isInitialized,
    categoryCount: Object.keys(categoryColorMapping).length
  }), [categoryColorMapping, mainChartLoaded, isInitialized]);

  // 🎨 VALOR FINAL DEL CONTEXTO - ESTABILIZADO
  const contextValue = useMemo(() => ({
    // Estados básicos
    categoryColorMapping,
    mainChartLoaded,
    isInitialized,
    
    // Funciones estables (no cambian entre renders)
    getColorForCategory,
    handleMainChartLoad,
    resetColorMapping,
    debugInfo,
    
    // Valores derivados
    ...derivedValues,
  }), [
    // DEPENDENCIAS MÍNIMAS - solo lo que realmente afecta el valor
    categoryColorMapping,
    mainChartLoaded,
    isInitialized,
    getColorForCategory,
    handleMainChartLoad,
    resetColorMapping,
    debugInfo,
    derivedValues,
  ]);

  return (
    <ChartColorsContext.Provider value={contextValue}>
      {children}
    </ChartColorsContext.Provider>
  );
};

// 🪝 Hook personalizado para usar el contexto
export const useChartColors = () => {
  const context = useContext(ChartColorsContext);
  
  if (!context) {
    throw new Error('useChartColors debe ser usado dentro de un ChartColorsProvider');
  }
  
  return context;
};

export default ChartColorsContext;