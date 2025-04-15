import React, { useEffect, useState } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";

registerLocale("es", es);

const FormRecepcion = ({ formData, handleChange, handleSubmit }) => {
  const [fechaHora, setFechaHora] = useState("");

  useEffect(() => {
    const formatDateToLocalInput = (date) => {
      const pad = (num) => String(num).padStart(2, "0");
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    let localFormatted;
    if (!formData.fechaHora) {
      const now = new Date();
      localFormatted = formatDateToLocalInput(now);
    } else {
      const savedDate = new Date(formData.fechaHora);
      localFormatted = formatDateToLocalInput(savedDate);
    }

    setFechaHora(localFormatted);
    handleChange("fechaHora", localFormatted);
  }, [formData.fechaHora]);

  const handleFechaHoraChange = (date) => {
    const pad = (num) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const localFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;

    setFechaHora(localFormatted);
    handleChange("fechaHora", localFormatted);
  };

  return (
    <div className="flex flex-col space-y-3">
      <DatePicker
        selected={fechaHora ? new Date(fechaHora) : null}
        onChange={handleFechaHoraChange}
        showTimeSelect
        timeIntervals={1}
        timeCaption="Hora"
        dateFormat="dd/MM/yyyy HH:mm"
        locale="es"
        placeholderText="Selecciona una fecha"
        className="w-full text-sm bg-white border border-gray-300 rounded-full px-4 py-2"
        wrapperClassName="w-full"
      />

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

      <div className="flex justify-center mt-2">
        <Button
          text="Ingresar Recepción"
          color="orange"
          onClick={handleSubmit}
          className="bg-orange-700 hover:bg-orange-600 text-white text-sm px-6 py-2 rounded-full"
        />
      </div>
    </div>
  );
};

export default FormRecepcion;
