import React from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const iconMap = {
  success: <FaCheckCircle className="text-green-600 mt-0.5" />,
  error: <FaExclamationCircle className="text-red-600 mt-0.5" />,
  warning: <FaExclamationTriangle className="text-yellow-600 mt-0.5" />,
  info: <FaInfoCircle className="text-blue-600 mt-0.5" />,
};

const colorMap = {
  success: "bg-green-100 text-green-800 border border-green-300",
  error: "bg-red-100 text-red-800 border border-red-300",
  warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  info: "bg-blue-100 text-blue-800 border border-blue-300",
};

export default function Alert({ type = "info", message }) {
  const messagesArray = () => {
    if (!message) return [];

    if (typeof message === "string") {
      return [message];
    }

    if (Array.isArray(message)) {
      return message;
    }

    if (typeof message === "object") {
      return Object.values(message).flat();
    }

    return [String(message)];
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 text-sm rounded-md shadow-sm animate-fade-in ${colorMap[type]} transition-all duration-300`}
    >
      <div className="pt-1">{iconMap[type]}</div>
      <div className="space-y-1">
        {messagesArray().map((msg, idx) => (
          <p key={idx} className="leading-snug">
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}
