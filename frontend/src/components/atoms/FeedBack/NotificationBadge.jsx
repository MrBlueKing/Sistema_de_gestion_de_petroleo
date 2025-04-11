// Este componente es el icono de la campana que se usa en el header de la pagina.
const NotificationBadge = ({ count }) => (
    count > 0 && (
      <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
        {count}
      </span>
    )
  );
  
export default NotificationBadge;