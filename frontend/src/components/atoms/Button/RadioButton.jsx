import React from "react";

const RadioButton = ({ label, checked, onChange, name, value }) => {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer w-full">
      <span className="text-sm">{label}</span>
      <div
        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${
          checked ? "border-orange-500" : "border-gray-300"
        }`}
      >
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="hidden"
        />
        {checked && (
          <div className="w-3 h-3 rounded-full bg-orange-500 transition-all duration-200" />
        )}
      </div>
    </label>
  );
};

export default RadioButton;

