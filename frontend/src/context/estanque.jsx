// src/context/estanqueContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./userContext";
import axios from "../lib/axios"; // Asumiendo que usas axios para las peticiones

// Crear el contexto
export const EstanqueContext = createContext();

// Crear el proveedor del contexto
export const EstanqueProvider = ({ children }) => {
  // Acceder al contexto del usuario para obtener la faena
  const { user } = useContext(UserContext);
  
  // Estados para gestionar los estanques
  const [estanques, setEstanques] = useState([]);
  const [estanqueSeleccionado, setEstanqueSeleccionado] = useState(null);
  const [stockActual, setStockActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar los estanques cuando cambia el usuario o la faena
  useEffect(() => {
    if (user && user.id_faena) {
      cargarEstanquesPorFaena(user.id_faena);
    } else {
      // Reiniciar estados si no hay usuario o faena
      setEstanques([]);
      setEstanqueSeleccionado(null);
      setStockActual(0);
      setLoading(false);
    }
  }, [user]);
  
  // Función para cargar estanques por faena
  const cargarEstanquesPorFaena = async (idFaena) => {
    try {
      setLoading(true);
      // Llamada a la API para obtener estanques
      const response = await axios.get(`/api/estanques/faena/${idFaena}`);
      
      if (response.data && response.data.success) {
        const estanquesData = response.data.estanques || [];
        setEstanques(estanquesData);
        
        // Seleccionar el primer estanque por defecto si hay alguno
        if (estanquesData.length > 0) {
          seleccionarEstanque(estanquesData[0]);
        } else {
          setEstanqueSeleccionado(null);
          setStockActual(0);
        }
      } else {
        throw new Error(response.data.message || "No se pudieron cargar los estanques");
      }
    } catch (error) {
      console.error("Error al cargar estanques:", error);
      setError("No se pudieron cargar los estanques. " + (error.message || ""));
    } finally {
      setLoading(false);
    }
  };
  
  // Función para seleccionar un estanque específico
  const seleccionarEstanque = async (estanque) => {
    try {
      setEstanqueSeleccionado(estanque);
      
      // Cargar el stock actual de este estanque
      const stockResponse = await axios.get(`/api/stock/${estanque.id_estanque}`);
      
      if (stockResponse.data && stockResponse.data.success) {
        setStockActual(stockResponse.data.stock_actual || 0);
      } else {
        throw new Error("No se pudo obtener el stock actual");
      }
    } catch (error) {
      console.error("Error al cargar stock del estanque:", error);
      setStockActual(0);
      setError("No se pudo obtener el stock actual. " + (error.message || ""));
    }
  };
  
  // Función para registrar consumo de combustible
  const registrarConsumo = async (idEstanque, litros, datosAdicionales = {}) => {
    try {
      const response = await axios.post('/api/consumos', {
        id_estanque: idEstanque,
        litros_consumidos: litros,
        ...datosAdicionales
      });
      
      if (response.data && response.data.success) {
        // Actualizar el stock local después de un consumo exitoso
        setStockActual(prev => Math.max(0, prev - litros));
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(response.data.message || "Error al registrar el consumo");
      }
    } catch (error) {
      console.error("Error al registrar consumo:", error);
      return {
        success: false,
        error: error.message || "Error al registrar el consumo"
      };
    }
  };
  
  // Exportar todos los estados y funciones necesarios
  return (
    <EstanqueContext.Provider
      value={{
        estanques,
        estanqueSeleccionado,
        stockActual,
        loading,
        error,
        seleccionarEstanque,
        cargarEstanquesPorFaena,
        registrarConsumo
      }}
    >
      {children}
    </EstanqueContext.Provider>
  );
};

// Hook personalizado para usar este contexto
export const useEstanque = () => useContext(EstanqueContext);