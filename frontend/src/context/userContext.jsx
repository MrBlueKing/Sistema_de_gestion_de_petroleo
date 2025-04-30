import React, { createContext, useState, useEffect } from "react";
import axios from "../lib/axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      if (token) {
        try {
          //console.log("Obteniendo datos del usuario con token:", token);
          
          // Primera opción: usando axios directamente para ver la respuesta completa
          const response = await axios.get("/api/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          //console.log("Respuesta completa de /api/user:", response);
          //console.log("Datos del usuario recibidos:", response.data);
          
          // Verificar si falta id_faena
          if (!response.data.id_faena) {
            //console.log("⚠️ id_faena no está presente en los datos recibidos");
            
            // Opción alternativa: hacer una petición fetch nativa para comparar
            console.log("Intentando con fetch nativo para comparar resultados...");
            try {
              const fetchResponse = await fetch("http://127.0.0.1:8000/api/user", {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json"
                },
                credentials: "include"
              });
              
              const fetchData = await fetchResponse.json();
              //console.log("Datos obtenidos con fetch nativo:", fetchData);
              
              // Si con fetch sí tenemos id_faena pero con axios no, hay un problema en axios
              if (fetchData.id_faena && !response.data.id_faena) {
                console.log("⚠️ Fetch tiene id_faena pero axios no. Usando datos de fetch.");
                setUser(fetchData);
              } else {
                // Si ambos carecen de id_faena, es un problema del backend
                console.log("Ambos métodos carecen de id_faena. Usando respuesta original.");
                setUser(response.data);
              }
            } catch (fetchError) {
              console.error("Error con fetch nativo:", fetchError);
              setUser(response.data); // Usar los datos originales de axios
            }
          } else {
            // Todo está bien, id_faena está presente
            //console.log("✅ id_faena está presente en los datos recibidos");
            setUser(response.data);
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};