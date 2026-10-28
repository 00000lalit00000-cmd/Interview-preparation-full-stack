import { useState } from "react";
import Modal from "./components/Modal";
import "./App.css";

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="app">
      <h2>React modal</h2>
      <button className="open-button" onClick={() => setIsOpen(true)}>
        Open
      </button>
      <Modal title="Welcome" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <p>The modal component is created using React</p>
      </Modal>
    </div>
  );
}
