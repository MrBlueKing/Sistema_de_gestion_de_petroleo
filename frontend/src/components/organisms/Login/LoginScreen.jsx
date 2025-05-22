import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../Api/authApi";
import axios from "../../../lib/axios";
import { storeSession } from "../../../utils/session";
import Icon from "../../atoms/Icons/Icon3h";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import LoadingOverlay from "../../atoms/FeedBack/Loading";
import ErrorMessage from "../../atoms/FeedBack/ErrorMessage";
import icono from "../../../assets/icono.png";
import { FaUser, FaLock } from "react-icons/fa";
import { UserContext } from "../../../context/userContext";

const LoginScreen = () => {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const redirectByRole = (rol) => {
    switch (rol) {
      case "admin":
        navigate("/administrador");
        break;
      case "bombero":
        navigate("/bombero");
        break;
      case "gerente":
        navigate("/gerente");
        break;
      case "toneladas":
        navigate("/IngresoToneladas");
        break;
      default:
        navigate("/");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Login inicial para obtener el token
      const { token, user } = await login({ rut, password });

      // Guarda el token, expiración y rol (pero no los datos completos del usuario)
      storeSession({ token, user });

      try {
        // Ahora obtenemos los datos completos y actualizados del usuario
        console.log("Obteniendo datos completos del usuario...");
        const response = await axios.get("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Datos obtenidos de /api/user:", response.data);

        // Actualizamos el contexto con los datos completos
        setUser(response.data);

        // Redirigimos basándonos en el rol
        redirectByRole(response.data.rol || user.rol || "desconocido");
      } catch (userDataError) {
        console.error("Error al obtener datos completos del usuario:", userDataError);
        // Si falla la obtención de datos completos, usamos los datos básicos
        setUser(user);
        redirectByRole(user.rol || "desconocido");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("RUT o contraseña incorrectos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md p-8">
      <LoadingOverlay isLoading={isLoading} message="Iniciando sesión..." />

      <div className="flex justify-center mb-6">
        <Icon src={icono} alt="3H COOPER" size="w-32 h-40" />
      </div>

      <p className="text-center text-gray-600 mb-6">Accede al sistema</p>
      <ErrorMessage message={error} />

      <form onSubmit={handleLogin}>
        <InputField
          type="text"
          placeholder="RUT"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          icon={<FaUser />}
          disabled={isLoading}
        />
        <InputField
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<FaLock />}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          disabled={isLoading}
        />
        <Button
          text={<span className="text-white">{isLoading ? "Cargando..." : "Ingresar"}</span>}
          color="orange"
          rounded="full"
          className="w-full font-bold py-3 px-4"
          type="submit"
          disabled={isLoading}
        />
      </form>
    </div>
  );
};

export default LoginScreen;