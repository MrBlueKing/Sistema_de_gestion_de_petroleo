import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { FaHome } from "react-icons/fa";

registerLocale("es", es);

const FormRecepcion = ({ formData, handleChange, handleSubmit }) => {
   return (
    <div className="flex flex-col space-y-8">
      

      <InputField
        placeholder="N° Guía de Despacho"
        value={formData.numeroGuia}
        onChange={(e) => handleChange("numeroGuia", e.target.value)}
        className="bg-white rounded-full"
      />

      <InputField
        placeholder="Litros Recibidos"
        value={formData.litrosRecibidos}
        onChange={(e) => handleChange("litrosRecibidos", e.target.value)}
        className="bg-white rounded-full"
      />

      <InputField
        placeholder="Recibo Conforme"
        value={formData.reciboConforme}
        onChange={(e) => handleChange("reciboConforme", e.target.value)}
        className="bg-white rounded-full"
      />

      <InputField
        placeholder="Observación"
        isTextarea={true}
        value={formData.observacion}
        onChange={(e) => handleChange("observacion", e.target.value)}
        className="bg-white rounded-3xl px-4 py-2 min-h-[80px]"
      />

<div className="flex items-center mt-2">
  <Button
    to="/Bombero"
    className="bg-transparent hover:bg-transparent p-0 m-0 shadow-none"
    icon={<FaHome className="w-15 h-15 text-white" />}
  />
  <Button
    text="Ingresar Recepción"
    color="orange"
    onClick={handleSubmit}
    className="bg-orange-700 hover:bg-orange-700 text-white text-sm px-6 py-2 rounded-full ml-auto"
  />
</div>

    </div>
  );
};

export default FormRecepcion;
