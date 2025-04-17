import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Importa el estilo del DatePicker
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es"; // Para la localización en español

// Registra el idioma español
registerLocale("es", es);

const ConsumoForm = ({ formData, handleChange, handleSubmit }) => {

  return (
    <div className="flex flex-col space-y-3">
                 
      <InputField
        placeholder="Horómetro"
        value={formData.horometro}
        onChange={(e) => handleChange("horometro", e.target.value)}
        className="bg-white rounded-full"
      />
      <InputField
        placeholder="Numeral Inicial"
        value={formData.numeralInicial}
        onChange={(e) => handleChange("numeralInicial", e.target.value)}
        className="bg-white rounded-full"
      />
      <InputField
        placeholder="Numeral Final"
        value={formData.numeralFinal}
        onChange={(e) => handleChange("numeralFinal", e.target.value)}
        className="bg-white rounded-full"
      />
      <InputField
        placeholder="Litros"
        value={formData.litros}
        onChange={(e) => handleChange("litros", e.target.value)}
        className="bg-white rounded-full"
      />
      
      <InputField
        placeholder="Observación"
        isTextarea={true}
        value={formData.observacion}
        onChange={(e) => handleChange("observacion", e.target.value)}
        className="bg-white rounded-3xl px-4 py-2 min-h-[80px]"
      />

      <div className="flex justify-center mt-2">
        <Button
          text="Ingresar Consumo"
          color="orange"
          onClick={handleSubmit}
          className="bg-orange-700 hover:bg-orange-600 text-white text-sm px-6 py-2 rounded-full"
        />
      </div>
    </div>
  );
};

export default ConsumoForm;
