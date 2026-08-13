import React from 'react';
import DominoGame from './components/DominoGame'; // 1. Importas el componente

export default function App() {
  return (
    <main className="w-full min-h-screen">
      {/* 2. Lo renderizas aquí como cualquier etiqueta */}
      <DominoGame />
    </main>
  );
}
