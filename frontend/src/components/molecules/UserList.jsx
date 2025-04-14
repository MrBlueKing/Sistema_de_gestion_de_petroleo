// src/components/organisms/UserList.jsx
import React from "react";
import UserButton from "../atoms/Button/UserButton";

const UserList = ({ usuarios }) => {
  return (
    <div className="flex flex-col space-y-3">
      {usuarios.map(usuario => (
        <UserButton 
          key={usuario.id} 
          text={usuario.nombre} 
          onClick={() => console.log(`Seleccionado: ${usuario.nombre}`)}
        />
      ))}
    </div>
  );
};

export default UserList;