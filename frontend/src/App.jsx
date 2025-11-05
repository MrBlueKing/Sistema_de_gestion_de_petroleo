import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/Routes";
import './App.css';
import { UserProvider } from "./context/userContext";

const App = () => {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  );
};

export default App;
