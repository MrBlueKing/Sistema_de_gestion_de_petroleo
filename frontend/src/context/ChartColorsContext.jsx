// 🎨 Context para manejar colores de gráficos de manera centralizada
// VERSIÓN MODIFICADA - Permite carga de datos tributados
import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

// 🎨 PALETA DE COLORES CONSISTENTE
const CHART_COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ef4444", "#06b6d4", "#84cc16", "#f43f5e", "#6366f1", "#64748b"
];

const ChartColorsContext = createContext();

export const ChartColorsProvider = ({ children }) => {
  // Estados centralizados
  const [categoryColorMapping, setCategoryColorMapping] = useState({});
  const [mainChartLoaded, setMainChartLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🆕 NUEVO: Estado para manejar cuando el principal completa sin datos
  const [mainChartCompleted, setMainChartCompleted] = useState(false);
  const [mainChartHasData, setMainChartHasData] = useState(false);

  // 🔧 REFS PARA CACHE DE LOGGING
  const loggedColorsRef = useRef(new Set());
  const warnedCategoriesRef = useRef(new Set());

  // 🎨 FUNCIÓN ESTABILIZADA PARA OBTENER COLOR DE CATEGORÍA
  const getColorForCategory = useCallback((categoryName) => {
    if (!categoryName || typeof categoryName !== 'string') {
      console.warn(`🎨 ChartColorsContext: Nombre de categoría inválido:`, categoryName);
      return CHART_COLORS[0];
    }

    const color = categoryColorMapping[categoryName];
    
    if (color) {
      if (!loggedColorsRef.current.has(categoryName)) {
        console.log(`🎨 ChartColorsContext: ✅ Color encontrado para "${categoryName}": ${color}`);
        loggedColorsRef.current.add(categoryName);
      }
      return color;
    }

    if (!warnedCategoriesRef.current.has(categoryName)) {
      console.warn(`🎨 ChartColorsContext: ❌ No se encontró color para "${categoryName}"`);
      warnedCategoriesRef.current.add(categoryName);
    }

    return CHART_COLORS[0];
  }, [categoryColorMapping]);

  // 🔧 CALLBACK MODIFICADO PARA MANEJAR CASOS SIN DATOS
  const handleMainChartLoad = useCallback((categoriasConColores) => {
    console.log('🎨 ChartColorsContext: handleMainChartLoad llamado', {
      categorias: categoriasConColores?.length || 0,
      hayDatos: categoriasConColores && Array.isArray(categoriasConColores) && categoriasConColores.length > 0
    });

    // Marcar como completado siempre
    setMainChartCompleted(true);
    
    if (!categoriasConColores || !Array.isArray(categoriasConColores) || categoriasConColores.length === 0) {
      // 🆕 CASO SIN DATOS: El principal completó pero sin datos
      console.log('🎨 ChartColorsContext: Principal completado SIN datos, permitiendo carga de datos tributados');
      setMainChartHasData(false);
      setMainChartLoaded(false); // No hay datos principales
      setCategoryColorMapping({}); // Limpiar mapeo anterior
      setIsInitialized(true); // Pero sí inicializar para permitir siguiente paso
      return;
    }

    // 🔧 CASO CON DATOS: Procesar normalmente
    try {
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

      if (Object.keys(newMapping).length > 0) {
        console.log('✅ ChartColorsContext: Mapeo de colores creado exitosamente:', newMapping);
        setCategoryColorMapping(newMapping);
        setMainChartLoaded(true);
        setMainChartHasData(true);
        setIsInitialized(true);
        
        // Limpiar logs para nueva sesión
        loggedColorsRef.current.clear();
        warnedCategoriesRef.current.clear();
      }
    } catch (error) {
      console.error('❌ ChartColorsContext: Error procesando categorías:', error);
    }
  }, []);

  // 🆕 NUEVO: Callback para notificar que el principal completó sin datos
  const handleMainChartNoData = useCallback(() => {
    console.log('🎨 ChartColorsContext: Principal reporta NO HAY DATOS, habilitando carga de tributados');
    setMainChartCompleted(true);
    setMainChartHasData(false);
    setMainChartLoaded(false);
    setIsInitialized(true); // Importante: permitir que continúe el flujo
    setCategoryColorMapping({});
  }, []);

  // 🔧 FUNCIÓN DE RESET MODIFICADA
  const resetColorMapping = useCallback(() => {
    console.log('🔄 ChartColorsContext: Reseteando todo el estado');
    setCategoryColorMapping({});
    setMainChartLoaded(false);
    setMainChartCompleted(false); // 🆕 NUEVO
    setMainChartHasData(false);   // 🆕 NUEVO
    setIsInitialized(false);
    loggedColorsRef.current.clear();
    warnedCategoriesRef.current.clear();
  }, []);

  // 🔧 VALORES DERIVADOS MODIFICADOS
  const derivedValues = useMemo(() => ({
    hasValidColorMapping: Object.keys(categoryColorMapping).length > 0,
    categoryCount: Object.keys(categoryColorMapping).length,
    categoryNames: Object.keys(categoryColorMapping),
    
    // 🆕 NUEVOS: Estados para coordinación mejorada
    compactChartCanLoad: mainChartCompleted, // Puede cargar si el principal ya completó (con o sin datos)
    allowTributedDataLoad: mainChartCompleted && !mainChartHasData, // Específicamente para datos tributados
  }), [categoryColorMapping, mainChartCompleted, mainChartHasData]);

  // 🔧 FUNCIÓN DE DEBUG ACTUALIZADA
  const debugInfo = useCallback(() => ({
    categoryColorMapping,
    mainChartLoaded,
    mainChartCompleted,
    mainChartHasData,
    isInitialized,
    categoryCount: Object.keys(categoryColorMapping).length,
    compactChartCanLoad: derivedValues.compactChartCanLoad,
    allowTributedDataLoad: derivedValues.allowTributedDataLoad,
  }), [categoryColorMapping, mainChartLoaded, mainChartCompleted, mainChartHasData, isInitialized, derivedValues]);

  // 🎨 VALOR FINAL DEL CONTEXTO
  const contextValue = useMemo(() => ({
    // Estados básicos
    categoryColorMapping,
    mainChartLoaded,
    mainChartCompleted,      // 🆕 NUEVO
    mainChartHasData,        // 🆕 NUEVO
    isInitialized,
    
    // Funciones estables
    getColorForCategory,
    handleMainChartLoad,
    handleMainChartNoData,   // 🆕 NUEVO
    resetColorMapping,
    debugInfo,
    
    // Valores derivados
    ...derivedValues,
  }), [
    categoryColorMapping,
    mainChartLoaded,
    mainChartCompleted,
    mainChartHasData,
    isInitialized,
    getColorForCategory,
    handleMainChartLoad,
    handleMainChartNoData,
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

export const useChartColors = () => {
  const context = useContext(ChartColorsContext);
  
  if (!context) {
    throw new Error('useChartColors debe ser usado dentro de un ChartColorsProvider');
  }
  
  return context;
};

export default ChartColorsContext;