import React from 'react';

const InputIcon = ({ icon, position }) => {
  return (
    <div className={`absolute ${position} text-gray-500`}>
      {icon}
    </div>
  );
};

export default InputIcon;
