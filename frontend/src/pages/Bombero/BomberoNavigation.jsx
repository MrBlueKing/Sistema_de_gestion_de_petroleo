import React, { useState, useCallback, useMemo, useContext, useEffect } from "react";
import { UserContext } from "../../context/userContext";
import Header from "../../components/organisms/Bombero/Header";
import TipoSolicitante from "../../components/templates/Bombero/BomberoTipoSolicitante";
import Solicitante from "../../components/templates/Bombero/BomberoSolicitante";
import Maquinaria from "../../components/templates/Bombero/BomberoMaquinaria";
import Patente from "../../components/templates/Bombero/BomberoPatente";
import Consumo from "../../components/templates/Bombero/BomberoConsumo";
// 🆕 NUEVO: Componente para transferencia de estanque móvil
import TransferenciaEstanqueMovil from "../../components/templates/Bombero/BomberoTransferenciaEstanqueMovil";
import bomberoService from "../../context/bomberoService";
import axios from "../../lib/axios";

const BomberoNavigation = () => {
  // Obtener contexto del usuario
  const { user } = useContext(UserContext);
  
  // Estados para el flujo de navegación
  const [currentStep, setCurrentStep] = useState(1);
  
  // 🆕 NUEVO: Estado para controlar el tipo de flujo
  const [tipoFlujo, setTipoFlujo] = useState('normal'); // 'normal' o 'estanque_movil'
  
  // Estados para almacenar los datos ingresados en cada paso
  const [tipoSolicitante, setTipoSolicitante] = useState("");
  const [solicitante, setSolicitante] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [patenteSeleccionada, setPatenteSeleccionada] = useState("");

  // Estado para controlar si se debe limpiar el cache
  const [shouldClearCache, setShouldClearCache] = useState(false);

  // Estados para precarga MEJORADOS
  const [preloadStatus, setPreloadStatus] = useState({
    personal: { loaded: false, loading: false },
    categorias: { loaded: false, loading: false },
    maquinas: { loaded: false, loading: false },
    estanques: { loaded: false, loading: false },
    maquinasMasivas: { loaded: false, loading: false }
  });

  // Memoizar la información del usuario para evitar re-renders
  const userInfo = useMemo(() => ({
    id: user?.id,
    faena: user?.id_faena,
    nombre: user?.nombre,
    apellido: user?.apellido
  }), [user?.id, user?.id_faena, user?.nombre, user?.apellido]);

  // PASO 1: Precargar personal (interno y externo) al montar el componente
  useEffect(() => {
    const preloadPersonalData = async () => {
      if (userInfo.faena && !preloadStatus.personal.loaded && !preloadStatus.personal.loading) {
        try {
          console.log('🚀 PASO 1: Precargando personal interno y externo...');
          setPreloadStatus(prev => ({
            ...prev,
            personal: { loaded: false, loading: true }
          }));

          await Promise.all([
            bomberoService.preloadPersonalData(['interno'], userInfo.faena),
            bomberoService.preloadPersonalData(['externo'], userInfo.faena)
          ]);

          setPreloadStatus(prev => ({
            ...prev,
            personal: { loaded: true, loading: false }
          }));
          
          console.log('✅ PASO 1: Personal precargado exitosamente');
        } catch (error) {
          console.warn('⚠️ Error precargando personal:', error);
          setPreloadStatus(prev => ({
            ...prev,
            personal: { loaded: false, loading: false }
          }));
        }
      }
    };

    preloadPersonalData();
  }, [userInfo.faena, preloadStatus.personal.loaded, preloadStatus.personal.loading]);

  // PASO 2: Precargar categorías cuando se selecciona tipo solicitante
  useEffect(() => {
    const preloadCategorias = async () => {
      if (tipoSolicitante && !preloadStatus.categorias.loaded && !preloadStatus.categorias.loading) {
        try {
          console.log('🚀 PASO 2: Precargando categorías de maquinaria...');
          setPreloadStatus(prev => ({
            ...prev,
            categorias: { loaded: false, loading: true }
          }));

          await bomberoService.getCategoriasMaquinaria();

          setPreloadStatus(prev => ({
            ...prev,
            categorias: { loaded: true, loading: false }
          }));
          
          console.log('✅ PASO 2: Categorías precargadas exitosamente');
        } catch (error) {
          console.warn('⚠️ Error precargando categorías:', error);
          setPreloadStatus(prev => ({
            ...prev,
            categorias: { loaded: false, loading: false }
          }));
        }
      }
    };

    if (tipoSolicitante) {
      preloadCategorias();
    }
  }, [tipoSolicitante, preloadStatus.categorias.loaded, preloadStatus.categorias.loading]);

  // PASO 2.5: PRECARGA MASIVA DE TODAS LAS MÁQUINAS CUANDO SE SELECCIONA TIPO
  useEffect(() => {
    const preloadMasivoMaquinas = async () => {
      if (tipoSolicitante && userInfo.faena && 
          !preloadStatus.maquinasMasivas.loaded && !preloadStatus.maquinasMasivas.loading) {
        try {
          console.log('🚀 🚀 PASO 2.5: INICIANDO PRECARGA MASIVA de todas las máquinas...');
          setPreloadStatus(prev => ({
            ...prev,
            maquinasMasivas: { loaded: false, loading: true }
          }));

          await bomberoService.warmupMasivoMaquinas(tipoSolicitante, userInfo.faena);

          setPreloadStatus(prev => ({
            ...prev,
            maquinasMasivas: { loaded: true, loading: false },
            estanques: { loaded: true, loading: false }
          }));
          
          console.log('🎉 🎉 PASO 2.5: PRECARGA MASIVA completada - Usuario tendrá navegación instantánea');
        } catch (error) {
          console.warn('⚠️ Error en precarga masiva:', error);
          setPreloadStatus(prev => ({
            ...prev,
            maquinasMasivas: { loaded: false, loading: false }
          }));
        }
      }
    };

    if (tipoSolicitante && userInfo.faena) {
      preloadMasivoMaquinas();
    }
  }, [tipoSolicitante, userInfo.faena, preloadStatus.maquinasMasivas.loaded, preloadStatus.maquinasMasivas.loading]);

  // 🆕 FUNCIÓN PARA DETECTAR TIPO DE FLUJO BASADO EN CATEGORÍA
  const detectarTipoFlujo = useCallback((categoria) => {
    if (categoria.isEstanqueMovil || categoria.tipoOperacion === 'transferencia_estanque_movil' || categoria.id === 'estanque_movil') {
      return 'estanque_movil';
    }
    return 'normal';
  }, []);

  // Función optimizada para reiniciar todo el flujo
  const resetFlow = useCallback(() => {
    console.log('🔄 Reiniciando flujo de bombero');
    setCurrentStep(1);
    setTipoSolicitante("");
    setSolicitante(null);
    setCategoriaSeleccionada("");
    setPatenteSeleccionada("");
    setTipoFlujo('normal'); // 🆕 NUEVO: Resetear tipo de flujo
    setShouldClearCache(true);
    
    setPreloadStatus({
      personal: { loaded: false, loading: false },
      categorias: { loaded: false, loading: false },
      maquinas: { loaded: false, loading: false },
      estanques: { loaded: false, loading: false },
      maquinasMasivas: { loaded: false, loading: false }
    });
    
    setTimeout(() => {
      bomberoService.clearCache();
      setShouldClearCache(false);
    }, 100);
  }, []);

  // 🆕 MANEJAR PASO SIGUIENTE CON DETECCIÓN DE BIFURCACIÓN
  const handleNext = useCallback((value) => {
    console.log(`📍 Avanzando del paso ${currentStep} al ${currentStep + 1}`);
    
    if (currentStep === 1) {
      setTipoSolicitante(value);
      console.log('✅ Tipo solicitante guardado:', value);
    } else if (currentStep === 2) {
      setSolicitante(value);
      console.log('✅ Solicitante guardado:', {
        id: value?.id,
        rut: value?.rut,
        faena: value?.id_faena || userInfo.faena
      });
    } else if (currentStep === 3) {
      // 🆕 NUEVO: Detectar tipo de flujo basado en categoría seleccionada
      const nuevoTipoFlujo = detectarTipoFlujo(value);
      setTipoFlujo(nuevoTipoFlujo);
      setCategoriaSeleccionada(value);
      
      console.log('✅ Categoría guardada:', value);
      console.log('🔀 Tipo de flujo detectado:', nuevoTipoFlujo);
      
      // 🆕 BIFURCACIÓN: Si es estanque móvil, saltar directamente al paso final
      if (nuevoTipoFlujo === 'estanque_movil') {
        console.log('🚛 BIFURCACIÓN: Saltando a transferencia de estanque móvil');
        setCurrentStep(5); // Saltar directamente al paso de transferencia
        return;
      }
    } else if (currentStep === 4) {
      setPatenteSeleccionada(value);
      console.log('✅ Patente guardada:', value);
    }
    
    setCurrentStep(prev => prev + 1);
  }, [currentStep, userInfo.faena, detectarTipoFlujo]);

  // Manejar paso anterior con consideración del tipo de flujo
  const handlePrevious = useCallback(() => {
    console.log(`📍 Retrocediendo del paso ${currentStep} al ${currentStep - 1}`);
    
    // 🆕 NUEVO: Si estamos en transferencia de estanque móvil (paso 5) y venimos de bifurcación,
    // regresar al paso 3 (selección de categoría)
    if (currentStep === 5 && tipoFlujo === 'estanque_movil') {
      console.log('🔙 Regresando de transferencia estanque móvil a selección de categoría');
      setCurrentStep(3);
      setTipoFlujo('normal'); // Resetear el tipo de flujo
      return;
    }
    
    setCurrentStep(prev => prev - 1);
  }, [currentStep, tipoFlujo]);

  // Manejar finalización exitosa del flujo
  const handleFlowComplete = useCallback(() => {
    console.log('🎉 Flujo completado exitosamente');
    // Opcional: mostrar mensaje de éxito
    // Opcional: redirigir a otra página
    // resetFlow(); // Si quieres reiniciar automáticamente
  }, []);

  // Memoizar las props que se pasan a cada componente para evitar re-renders
  const tipoSolicitanteProps = useMemo(() => ({
    onNext: handleNext,
    selectedTipo: tipoSolicitante,
    preloadStatus: preloadStatus.personal
  }), [handleNext, tipoSolicitante, preloadStatus.personal]);

  const solicitanteProps = useMemo(() => ({
    tipoSolicitante,
    solicitante,
    onNext: handleNext,
    onPrevious: handlePrevious,
    userFaena: userInfo.faena,
    shouldClearCache,
    preloadStatus: preloadStatus.categorias
  }), [tipoSolicitante, solicitante, handleNext, handlePrevious, userInfo.faena, shouldClearCache, preloadStatus.categorias]);

  const maquinariaProps = useMemo(() => ({
    tipoSolicitante,
    categoriaSeleccionada,
    onNext: handleNext,
    onPrevious: handlePrevious,
    userFaena: userInfo.faena,
    preloadStatus: preloadStatus.maquinasMasivas
  }), [tipoSolicitante, categoriaSeleccionada, handleNext, handlePrevious, userInfo.faena, preloadStatus.maquinasMasivas]);

  const patenteProps = useMemo(() => ({
    tipoSolicitante,
    categoriaSeleccionada,
    patenteSeleccionada,
    solicitante,
    onNext: handleNext,
    onPrevious: handlePrevious,
    userFaena: userInfo.faena,
    maquinasPrecargadas: preloadStatus.maquinasMasivas.loaded
  }), [tipoSolicitante, categoriaSeleccionada, patenteSeleccionada, solicitante, handleNext, handlePrevious, userInfo.faena, preloadStatus.maquinasMasivas.loaded]);

  const consumoProps = useMemo(() => ({
    tipoSolicitante,
    solicitante,
    categoriaSeleccionada,
    patenteSeleccionada,
    onPrevious: handlePrevious,
    onComplete: handleFlowComplete,
    resetFlow,
    userInfo,
    idFaena: userInfo.faena,
    preloadedEstanques: preloadStatus.estanques
  }), [
    tipoSolicitante, 
    solicitante, 
    categoriaSeleccionada, 
    patenteSeleccionada, 
    handlePrevious, 
    handleFlowComplete, 
    resetFlow, 
    userInfo,
    preloadStatus.estanques
  ]);

  // 🆕 NUEVO: Props para componente de transferencia de estanque móvil
  const transferenciaEstanqueMovilProps = useMemo(() => ({
    tipoSolicitante,
    solicitante,
    categoriaSeleccionada,
    onPrevious: handlePrevious,
    onComplete: handleFlowComplete,
    resetFlow,
    userInfo,
    idFaena: userInfo.faena,
    preloadedEstanques: preloadStatus.estanques
  }), [
    tipoSolicitante,
    solicitante,
    categoriaSeleccionada,
    handlePrevious,
    handleFlowComplete,
    resetFlow,
    userInfo,
    preloadStatus.estanques
  ]);

  // 🆕 RENDERIZAR EL PASO CORRESPONDIENTE CON BIFURCACIÓN
  const renderStep = useMemo(() => {
    // 🆕 NUEVO: Si estamos en paso 5 y es transferencia de estanque móvil
    if (currentStep === 5 && tipoFlujo === 'estanque_movil') {
      return <TransferenciaEstanqueMovil {...transferenciaEstanqueMovilProps} />;
    }
    
    // Flujo normal
    switch (currentStep) {
      case 1:
        return <TipoSolicitante {...tipoSolicitanteProps} />;
      case 2:
        return <Solicitante {...solicitanteProps} />;
      case 3:
        return <Maquinaria {...maquinariaProps} />;
      case 4:
        return <Patente {...patenteProps} />;
      case 5:
        return <Consumo {...consumoProps} />;
      default:
        return <TipoSolicitante {...tipoSolicitanteProps} />;
    }
  }, [
    currentStep, 
    tipoFlujo,
    tipoSolicitanteProps, 
    solicitanteProps, 
    maquinariaProps, 
    patenteProps, 
    consumoProps,
    transferenciaEstanqueMovilProps
  ]);

  // Return principal del componente
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header centralizado */}
      <Header className="fixed top-0 left-0 right-0 z-10" />
      
      {/* Container principal con padding-top para compensar el header fijo */}
      <div>
        {/* Contenido principal */}
        <div className="container mx-auto">
          {renderStep}
        </div>
       


      </div>
    </div>
  );
};

export default React.memo(BomberoNavigation);