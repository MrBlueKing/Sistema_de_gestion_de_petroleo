import React from "react";
import { FaExclamationTriangle, FaTimes, FaTrash } from "react-icons/fa";

const ConfirmarEliminarFallaModal = ({ isOpen, falla, loading, onConfirmar, onCancelar }) => {
  if (!isOpen || !falla) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
            </div>
          </div>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Esta acción no se puede deshacer. Se eliminará la falla junto con todo su plan de reparación y seguimiento.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Falla a eliminar:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Folio:</span> #{falla.id}</p>
              <p><span className="font-medium">Equipo:</span> {falla.maquina?.nombre_maquina || "-"}</p>
              <p><span className="font-medium">Descripción:</span> {falla.descripcion}</p>
            </div>
          </div>

          <p className="text-red-600 text-sm font-medium">
            ¿Estás seguro de que deseas eliminar esta falla?
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Eliminando...
              </>
            ) : (
              <>
                <FaTrash className="w-4 h-4 mr-2" />
                Eliminar falla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarEliminarFallaModal;
