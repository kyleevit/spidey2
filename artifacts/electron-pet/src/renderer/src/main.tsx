import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import DesktopPet from "@/DesktopPet";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DesktopPet />
  </StrictMode>
);
