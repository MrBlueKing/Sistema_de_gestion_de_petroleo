// Descripción: Componente de botón de icono reutilizable en React
const IconButton = ({ icon, label, onClick, active }) => (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-3 w-full text-sm rounded-lg ${active ? 'bg-blue-800' : 'hover:bg-gray-800'}`}
    >
      {icon}
      {label}
    </button>
  );
  
  export default IconButton;
  