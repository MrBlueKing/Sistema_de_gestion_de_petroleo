// Este IconButton se usa como un boton de icono en el sistema, por ejemplo en el sidebar de la pagina de administrador. Este componente es un boton que recibe un icono y una funcion onClick como props. El icono se renderiza dentro del boton y al hacer click en el boton se ejecuta la funcion onClick.
const IconButton = ({ onClick, icono}) => {
  return (
    <button onClick={onClick} className="p-2 cursor-pointer">
      {icono}
    </button>
  );
};

export default IconButton ;
