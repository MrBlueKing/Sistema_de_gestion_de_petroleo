import React, { createContext, useState, useEffect } from "react";
import axios from "../lib/axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // ✅ para manejar errores opcionalmente

  useEffect(() => {
    const fetchUserData = async () => {
      const token = JSON.parse(localStorage.getItem("authToken"))?.token;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = response.data;

        if (!userData.id_faena) {
          console.warn("id_faena faltante, intentando con fetch...");

          try {
            const fetchResponse = await fetch("http://127.0.0.1:8000/api/user", {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              credentials: "include",
            });
            const fetchData = await fetchResponse.json();

            if (fetchData.id_faena) {
              console.warn("Fetch trajo id_faena, usando datos de fetch.");
              setUser(fetchData);
            } else {
              console.warn("Fetch también carece de id_faena, usando datos de axios.");
              setUser(userData);
            }
          } catch (fetchError) {
            console.error("Error con fetch nativo:", fetchError);
            setUser(userData);
          }
        } else {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        setError("No se pudo cargar el usuario.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};
