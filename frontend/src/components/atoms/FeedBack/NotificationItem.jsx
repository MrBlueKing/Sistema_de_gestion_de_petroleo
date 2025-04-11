// Este componente es el item de la notificacion que se usa en el menu desplegable de notificaciones del header de la pagina de administrador
const NotificationItem = ({ message, time }) => (
  <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
    <p className="text-sm">{message}</p>
    <p className="text-xs text-gray-500 mt-1">Hace {time}</p>
  </div>
);
export default NotificationItem;