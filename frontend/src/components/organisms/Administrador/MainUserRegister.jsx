import {
  FaUser,
  FaLock,
  FaIdCard,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaExclamationCircle
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import { useState, useEffect, useRef } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import Label from "../../atoms/Typography/Label";
import Alert from "../../atoms/FeedBack/Alert";


export default function Main() {
  const [rut, setRut] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [focusedFields, setFocusedFields] = useState({
    rut: false,
    firstName: false,
    lastName: false,
    role: false,
    location: false,
    password: false
  });

  const alertRef = useRef(null);

  // Scroll al mensaje
  useEffect(() => {
    if (alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [error, successMessage]);

  // Auto-desvanecer mensajes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const translateErrorMessages = (errors) => {
    const translations = {
      // Errores específicos de campos obligatorios
      "The rut field is required.": "El campo RUT es obligatorio.",
      "The firstName field is required.": "El campo nombre es obligatorio.",
      "The lastName field is required.": "El campo apellido es obligatorio.",
      "The role field is required.": "El campo rol es obligatorio.",
      "The location field is required.": "El campo ubicación es obligatorio.",
      "The password field is required.": "El campo contraseña es obligatorio.",
      // Errores de validación específicos
      "The rut has already been taken.": "El RUT ya ha sido registrado.",
      "The password field must be at least 8 characters.": "La contraseña debe tener al menos 8 caracteres.",
      // Otros errores personalizados
      "The id_faena field is required.": "La ubicación es obligatoria.",
      "The selected id rol is invalid.": "El rol seleccionado no es válido.",
    };
  
    if (typeof errors === "string") {
      return translations[errors] || errors;
    }
  
    const translated = {};
    for (const key in errors) {
      translated[key] = errors[key].map((msg) => translations[msg] || msg);
    }
  
    return translated;
  };

  const isValidRutFormat = (rut) => {
    // Verifica que el RUT no tenga puntos, guiones ni espacios
    return /^[0-9kK]+$/.test(rut);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError({});  // Limpiar los errores anteriores
    setSuccessMessage("");
  
    // Validación de campos
    const errors = {};
  
    if (!rut){
      errors.rut = "El campo RUT es obligatorio.";
    } else if (!isValidRutFormat(rut)) {
      errors.rut = "El RUT no debe contener puntos, guiones ni espacios.";
    }
    if (!firstName) errors.firstName = "El campo nombre es obligatorio.";
    if (!lastName) errors.lastName = "El campo apellido es obligatorio.";
    if (!role) errors.role = "El campo rol es obligatorio.";
    if (!location) errors.location = "El campo ubicación es obligatorio.";
    if (!password) errors.password = "El campo contraseña es obligatorio.";
  
    if (Object.keys(errors).length > 0) {
      setError(errors);
      setIsLoading(false);
      return; // Detiene la ejecución si hay errores de validación
    }
  
    const userData = {
      rut,
      nombre: firstName,
      apellido: lastName,
      id_rol: Number(role),
      id_faena: Number(location),
      password,
    };
  
    try {
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setSuccessMessage("Usuario registrado exitosamente.");
        setRut("");
        setFirstName("");
        setLastName("");
        setRole("");
        setLocation("");
        setPassword("");
      } else {
        setError(translateErrorMessages(data.errors || {})); 
      }
    } catch (error) {
      setError({ global: "Error de conexión con el servidor." });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center items-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Registro de Usuario
          </h1>
          <p className="text-gray-600">
            Complete el formulario para crear su cuenta
          </p>
        </div>

        <div className="bg-white shadow-2xl rounded-lg p-8 space-y-6">
          <div ref={alertRef} className="space-y-2">
            {error && <Alert type="error" message={error} />}
            {successMessage && <Alert type="success" message={successMessage} />}
          </div>


          <form onSubmit={handleRegister} className="space-y-4">
            {[
              {
                id: "rut",
                label: "Ingrese RUT",
                value: rut,
                icon: <FaIdCard />,
                tooltip: "Sin puntos ni guion",
                required: true
              },
              {
                id: "firstName",
                label: "Ingrese Nombres",
                value: firstName,
                icon: <FaUser />,
                required: true
              },
              {
                id: "lastName",
                label: "Ingrese Apellidos",
                value: lastName,
                icon: <FaUser />,
                required: true
              },
              {
                id: "role",
                label: "Ingrese rol del nuevo usuario",
                value: role,
                icon: <FaUser />,
                options: [
                  { label: "Administrador", value: 3 },
                  { label: "Bombero", value: 1 },
                  { label: "Gerente", value: 2 }
                ]
              },
              {
                id: "location",
                label: "Ingrese ubicación del nuevo usuario",
                value: location,
                icon: <FaMapMarkerAlt />,
                options: [
                  { label: "Cabildo", value: 1 },
                  { label: "Catemu", value: 2 },
                  { label: "Chincolco", value: 3 },
                  { label: "Tiltil", value: 4 }
                ]
              },
              {
                id: "password",
                label: "Ingrese contraseña",
                value: password,
                icon: <FaLock />,
                tooltip: "Mínimo 8 caracteres",
                required: true,
                type: "password"
              }
            ].map(
              ({
                id,
                label,
                icon,
                value,
                tooltip,
                required,
                options,
                type
              }) => (
                <div key={id}>
                  <Label
                    htmlFor={id}
                    label={label}
                    required={required}
                    tooltip={tooltip}
                    active={focusedFields[id]}
                    disabled={isLoading}
                  />
                  <InputField
                    id={id}
                    type={type || "text"}
                    placeholder={label}
                    value={value}
                    onChange={(e) => {
                      const updater = {
                        rut: setRut,
                        firstName: setFirstName,
                        lastName: setLastName,
                        role: setRole,
                        location: setLocation,
                        password: setPassword
                      };
                      updater[id](e.target.value);
                    }}
                    icon={icon}
                    options={options}
                    disabled={isLoading}
                    showPassword={id === "password" ? showPassword : undefined}
                    setShowPassword={
                      id === "password" ? setShowPassword : undefined
                    }
                    onFocus={() =>
                      setFocusedFields({ ...focusedFields, [id]: true })
                    }
                    onBlur={() =>
                      setFocusedFields({ ...focusedFields, [id]: false })
                    }
                  />
                </div>
              )
            )}

            <Button
              text={
                isLoading ? (
                  <span className="flex justify-center items-center gap-2">
                    <IoReload className="animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  "Registrar"
                )
              }
              color="orange"
              rounded="full"
              className="w-full text-white font-bold py-3 px-4 mt-2"
              type="submit"
              disabled={isLoading}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
