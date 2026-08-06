import React from "react";

/**
 * Safely resolves the Web Crypto API in a cross-environment compatible manner.
 *
 * Direct references to global variables like `window.crypto` will throw a ReferenceError
 * in server-side / Node.js environments if `window` is undefined. This helper checks
 * both `window` and `globalThis` safely using typeof checks before accessing properties.
 *
 * @returns {Crypto | undefined} The Crypto object if available, otherwise undefined.
 */
const getCrypto = (): Crypto | undefined => {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    return globalThis.crypto;
  }
  return undefined;
};

/**
 * --- 27D Trinity Keystore System ---
 *
 * SECURITY COMPLIANCE NOTE:
 * Math.random() is NOT cryptographically secure and is highly predictable, making it
 * entirely unsuitable for cryptographic salts, keys, or security-sensitive vectors.
 *
 * This module generates random cryptographic salts using `crypto.getRandomValues()`,
 * which leverages the OS-level cryptographically secure pseudo-random number generator (CSPRNG).
 */
export const TrinityKeystore = {
  /**
   * Generates a secure vector with randomized, cryptographically safe alpha, beta, and gamma salts.
   *
   * @returns {{ alpha: string; beta: string; gamma: string; parity: number }} Secure vector object.
   * @throws {Error} If no cryptographically secure random number generator is available in the environment.
   */
  getVector: () => {
    const salt = () => {
      const cryptoInstance = getCrypto();
      if (!cryptoInstance) {
        throw new Error(
          "Cryptographically secure random number generator (Web Crypto API) is not available in this environment.",
        );
      }
      const array = new Uint32Array(1);
      cryptoInstance.getRandomValues(array);
      return array[0].toString(36);
    };

    return {
      alpha: `α-${salt()}`,
      beta: `β-${salt()}`,
      gamma: `γ-${salt()}`,
      parity: 0.9999,
    };
  },
};

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Quantum Trinity Keystore</h1>
      <p>Secure vector generator loaded.</p>
    </div>
  );
}
