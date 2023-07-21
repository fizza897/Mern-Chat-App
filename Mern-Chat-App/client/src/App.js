import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Form from "./modules/Form/Form";
import Dashboard from "./modules/Dashboard/Dashboard";

const ProtectedRoute = ({ children, auth = false }) => {
  const isLoggedIn = localStorage.getItem("user:token") !== null || false;
  console.log("isLoggedIn", isLoggedIn);
  if (!isLoggedIn && auth) {
    return <Navigate to={"/users/sign_in"} />;
  } else if (
    isLoggedIn &&
    ["/users/sign_in", "/users/sign_up"].includes(window.location.pathname)
  ) {
    return <Navigate to={"/"} />;
  }
  return children;
};

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute auth={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/sign_in"
          element={
            <ProtectedRoute>
              <Form isSignInPage={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/sign_up"
          element={
            <ProtectedRoute>
              <Form isSignInPage={false} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
