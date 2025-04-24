const Title = ({ children, icon: Icon }) => {
    return (
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
        {Icon && <Icon className="mr-2" size={20} />}
        {children}
      </h2>
    );
  };
  
  export default Title;  // Asegúrate que esta línea exista