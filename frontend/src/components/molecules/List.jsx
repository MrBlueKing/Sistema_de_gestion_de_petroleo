// src/components/molecules/List.jsx
import React from "react";
import Button from "../atoms/Button/Button";

const List = ({ items, onItemSelect }) => {
  if (!items || items.length === 0) {
    return <div className="text-center p-4">No hay elementos disponibles</div>;
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Button
          className="bg-orange-600 hover:bg-orange-500 shadow-none flex items-center justify-center"
          key={item.id}
          onClick={() => onItemSelect && onItemSelect(item)}
          variant="item"
          text={item.nombre}
        />
      ))}
    </div>
  );
};


export default List;
