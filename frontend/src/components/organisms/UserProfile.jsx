const UserProfile = ({ name, email }) => (
    <div className="p-4 border-t border-gray-800">
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2">
          <span className="font-bold">{name.charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-gray-400">{email}</p>
        </div>
      </div>
      <button className="mt-3 flex items-center text-sm text-gray-400 hover:text-white">
        <FaSignOutAlt className="h-4 w-4 mr-2" />
        Cerrar Sesión
      </button>
    </div>
  );

export default UserProfile;