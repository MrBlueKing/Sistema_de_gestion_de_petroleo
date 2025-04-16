import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../Api/authApi";
import { storeSession } from "../../../utils/session";
import Icon from "../../atoms/Icons/Icon3h";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import LoadingOverlay from "../../atoms/FeedBack/Loading";
import ErrorMessage from "../../atoms/FeedBack/ErrorMessage";
import icono from "../../../assets/icono.png";
import { FaUser, FaLock } from "react-icons/fa";
import { UserContext } from "../../../context/userContext"; // ✅ Importar contexto

const LoginScreen = () => {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext); // ✅ Obtener función del contexto

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
      default:
        navigate("/");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { token, user } = await login({ rut, password });
      storeSession({ token, user });
      setUser(user); // ✅ Actualizar el contexto con los datos del usuario
      redirectByRole(user.rol || "desconocido");
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
          text={isLoading ? "Cargando..." : "Ingresar"}
          color="orange"
          rounded="full"
          className="w-full text-white font-bold py-3 px-4"
          type="submit"
          disabled={isLoading}
        />
      </form>
    </div>
  );
};

export default LoginScreen;
