import React from "react";
import QuantumScene from "./components/QuantumScene";

// --- 27D Trinity Keystore System ---
export const TrinityKeystore = {
  getVector: () => {
    const salt = () => {
      const arr = new Uint32Array(1);
      const c =
        typeof window !== "undefined"
          ? window.crypto
          : typeof crypto !== "undefined"
            ? crypto
            : undefined;
      if (c && c.getRandomValues) {
        c.getRandomValues(arr);
      } else {
        arr[0] = Math.floor(Math.random() * 0xffffffff);
      }
      return arr[0].toString(36);
    };
    return {
      alpha: `α-${salt()}`,
      beta: `β-${salt()}`,
      gamma: `γ-${salt()}`,
      parity: 0.9999,
    };
  },
};

export const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <QuantumScene />
    </div>
  );
};

export default App;
