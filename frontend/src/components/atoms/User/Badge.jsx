// Descripción: Componente de Badge reutilizable en React
const Badge = () => {
    return (
      <div className="ml-2 relative w-10 h-10">
        <div className="absolute inset-0 bg-red-600 flex flex-col justify-center items-center">
          <span className="text-white text-xs font-bold">3H</span>
        </div>
        <div className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
      </div>
    );
  };
  
  export default Badge;
  