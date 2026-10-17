import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";
import Home from './pages/Home';
import Dashboard from "./pages/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />
  },
  {
    path: "dashboard",
    element: <Dashboard />
  }
]);

export default function App() {
    return (
      <RouterProvider router={router} />
  );
}