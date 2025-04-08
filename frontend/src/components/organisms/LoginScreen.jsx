import React from "react";
import { useState } from "react";
import { FaEye, FaRegEyeSlash, FaLock, FaUser } from "react-icons/fa";
import Button from "../atoms/Button";
import Icon from "../atoms/icon";
import icono from "../../assets/icono.png"; // Ruta del icono

const LoginScreen = () => {
    const [showPassword, setShowPassword] = useState(false);
    return(
        
            <div className="bg-white rounded-lg shadow-md p-8">
                {/* 3H COPPER Logo */}
                <div className="flex justify-center mb-6">
                    <Icon src={icono} alt="3H COOPER" size="w-32 h-40" />
                </div>

                <p className="text-center text-gray-600 mb-6">Accede al sistema</p>
                
                {/* Username field */}
                <div className="relative mb-4">
                    <div className="absolute left-3 top-3 text-gray-500">
                        <FaUser size={18} />
                    </div>
                    <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Usuario"
                    />
                </div>
                
                {/* Password field */}
                <div className="relative mb-6">
                    <div className="absolute left-3 top-3 text-gray-500">
                        <FaLock size={18} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md"
                        placeholder="Contraseña"
                    />
                    <button 
                        className="absolute right-3 top-3 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FaRegEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                </div>
                
                {/* Login button */}
                <Button text="Ingresar" to="/login" color={"orange"} rounded="full" className="w-full text-white font-bold py-3 px-4"/>
            </div>
        
    );
}

export default LoginScreen;