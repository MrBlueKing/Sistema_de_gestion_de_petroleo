// LoginScreen.js
import React, { useState } from "react";
import Icon from "../atoms/Icon";
import InputField from "../atoms/InputField";
import PasswordField from "../atoms/PasswordField";
import Button from "../atoms/Button";
import icono from "../../assets/icono.png"; // Ruta del icono
import { FaUser } from "react-icons/fa";

const LoginScreen = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Icon src={icono} alt="3H COOPER" size="w-32 h-40" />
      </div>

      <p className="text-center text-gray-600 mb-6">Accede al sistema</p>

      {/* Username field */}
      <InputField
        icon={<FaUser size={18} />}
        type="text"
        placeholder="Usuario"
      />

      {/* Password field */}
      <PasswordField
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      {/* Login button */}
      <Button text="Ingresar" to="/login" color="orange" rounded="full" className="w-full text-white font-bold py-3 px-4" />
    </div>
  );
};

export default LoginScreen;
