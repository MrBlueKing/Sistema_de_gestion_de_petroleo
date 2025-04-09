const UserGreeting = ({ userName }) => {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 rounded-md flex items-center">
        <span>Bienvenido: {userName}</span>
      </div>
    );
  };
  
  export default UserGreeting;
  