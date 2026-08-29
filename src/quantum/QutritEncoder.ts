/**
 * Quantum Qutrit (3-level quantum system) Encoder
 * 
 * Maps classical trinary (0,1,2) and quantum superposition states
 * onto the Trinity Keystore's α-β-γ vector structure.
 * 
 * Theoretical Foundation:
 * - Qutrits are 3-level quantum systems (vs. qubits which are 2-level)
 * - Our Trinity Keystore provides three orthogonal basis vectors
 * - Encoding: |0⟩ → α-vector, |1⟩ → β-vector, |2⟩ → γ-vector
 * - Superposition: |ψ⟩ = c₀|0⟩ + c₁|1⟩ + c₂|2⟩ where |c₀|² + |c₁|² + |c₂|² = 1
 */

import { TrinityKeystore } from '../App';

export interface QutritState {
  /** Amplitude for |0⟩ state (complex number: real + imaginary) */
  alpha: { real: number; imag: number };
  /** Amplitude for |1⟩ state (complex number: real + imaginary) */
  beta: { real: number; imag: number };
  /** Amplitude for |2⟩ state (complex number: real + imaginary) */
  gamma: { real: number; imag: number };
  /** Classical base-3 digit (0, 1, or 2) if collapsed */
  classicalValue?: number;
  /** Probability distribution [P(0), P(1), P(2)] */
  probabilities: [number, number, number];
}

export interface QutritRegister {
  /** Array of qutrit states */
  qutrits: QutritState[];
  /** Entanglement metadata */
  entangled: boolean;
  /** Coherence time (simulation parameter, ms) */
  coherenceTime: number;
  /** Creation timestamp */
  created: number;
}

export class QutritEncoder {
  private trinityVector: ReturnType<typeof TrinityKeystore.getVector>;
  private readonly NORMALIZATION_TOLERANCE = 1e-10;

  constructor() {
    this.trinityVector = TrinityKeystore.getVector();
  }

  /**
   * Create a qutrit in a computational basis state
   * |0⟩, |1⟩, or |2⟩
   * 
   * @param state - 0, 1, or 2
   * @returns QutritState representing the basis state
   */
  createBasisState(state: 0 | 1 | 2): QutritState {
    const zero = { real: 0, imag: 0 };
    const one = { real: 1, imag: 0 };

    switch (state) {
      case 0:
        return {
          alpha: one,
          beta: zero,
          gamma: zero,
          classicalValue: 0,
          probabilities: [1, 0, 0],
        };
      case 1:
        return {
          alpha: zero,
          beta: one,
          gamma: zero,
          classicalValue: 1,
          probabilities: [0, 1, 0],
        };
      case 2:
        return {
          alpha: zero,
          beta: zero,
          gamma: one,
          classicalValue: 2,
          probabilities: [0, 0, 1],
        };
    }
  }

  /**
   * Create an equal superposition (Hadamard-like for qudits)
   * |ψ⟩ = (1/√3)(|0⟩ + |1⟩ + |2⟩)
   * 
   * @returns QutritState in equal superposition
   */
  createEqualSuperposition(): QutritState {
    const amplitude = 1 / Math.sqrt(3);
    return {
      alpha: { real: amplitude, imag: 0 },
      beta: { real: amplitude, imag: 0 },
      gamma: { real: amplitude, imag: 0 },
      probabilities: [1 / 3, 1 / 3, 1 / 3],
    };
  }

  /**
   * Create a qutrit in an arbitrary superposition state
   * Automatically normalizes amplitudes
   * 
   * @param alphaAmplitude - Complex amplitude for |0⟩
   * @param betaAmplitude - Complex amplitude for |1⟩
   * @param gammaAmplitude - Complex amplitude for |2⟩
   * @returns Normalized QutritState
   */
  createSuperposition(
    alphaAmplitude: { real: number; imag: number },
    betaAmplitude: { real: number; imag: number },
    gammaAmplitude: { real: number; imag: number }
  ): QutritState {
    // Calculate normalization factor: √(|α|² + |β|² + |γ|²)
    const alphaMag = this.complexMagnitude(alphaAmplitude);
    const betaMag = this.complexMagnitude(betaAmplitude);
    const gammaMag = this.complexMagnitude(gammaAmplitude);

    const normFactor = Math.sqrt(
      alphaMag * alphaMag + betaMag * betaMag + gammaMag * gammaMag
    );

    if (normFactor < this.NORMALIZATION_TOLERANCE) {
      throw new Error('Cannot normalize qutrit: zero amplitude');
    }

    // Normalize
    const alpha = this.scaleComplex(alphaAmplitude, 1 / normFactor);
    const beta = this.scaleComplex(betaAmplitude, 1 / normFactor);
    const gamma = this.scaleComplex(gammaAmplitude, 1 / normFactor);

    // Calculate probabilities: |amplitude|²
    const prob0 = this.complexMagnitude(alpha) ** 2;
    const prob1 = this.complexMagnitude(beta) ** 2;
    const prob2 = this.complexMagnitude(gamma) ** 2;

    return {
      alpha,
      beta,
      gamma,
      probabilities: [prob0, prob1, prob2],
    };
  }

  /**
   * Encode a classical trinary digit into a qutrit basis state
   * 
   * @param trinaryDigit - String of '0', '1', '2'
   * @returns QutritState
   */
  encodeTrinaryDigit(trinaryDigit: string): QutritState {
    if (!/^[0-2]$/.test(trinaryDigit)) {
      throw new Error(`Invalid trinary digit: ${trinaryDigit}. Must be 0, 1, or 2.`);
    }
    return this.createBasisState(parseInt(trinaryDigit, 10) as 0 | 1 | 2);
  }

  /**
   * Encode a trinary string into a qutrit register
   * Each digit → one qutrit
   * 
   * @param trinaryString - String of trinary digits (e.g., "012120")
   * @returns QutritRegister containing multiple qutrit states
   */
  encodeTrinaryString(trinaryString: string): QutritRegister {
    if (!/^[0-2]*$/.test(trinaryString)) {
      throw new Error(`Invalid trinary string: ${trinaryString}. Must contain only 0, 1, 2.`);
    }

    const qutrits = Array.from(trinaryString).map((digit) =>
      this.encodeTrinaryDigit(digit)
    );

    return {
      qutrits,
      entangled: false,
      coherenceTime: 1000, // Default coherence time in ms
      created: Date.now(),
    };
  }

  /**
   * Measure a qutrit in the computational basis
   * Returns a classical value (0, 1, or 2) based on probability
   * 
   * @param qutrit - QutritState to measure
   * @returns Classical measurement result (0, 1, or 2)
   */
  measureComputationalBasis(qutrit: QutritState): number {
    const [p0, p1, p2] = qutrit.probabilities;
    const random = Math.random();

    if (random < p0) return 0;
    if (random < p0 + p1) return 1;
    return 2;
  }

  /**
   * Measure an entire qutrit register
   * 
   * @param register - QutritRegister to measure
   * @returns Classical trinary string result (e.g., "012120")
   */
  measureRegister(register: QutritRegister): string {
    return register.qutrits.map((q) => this.measureComputationalBasis(q)).join('');
  }

  /**
   * Apply a qutrit phase gate (single-qutrit operation)
   * Multiplies amplitudes by e^(i*π*k/3) where k = 0,1,2
   * 
   * @param qutrit - QutritState to transform
   * @param k - Phase parameter (0, 1, 2)
   * @returns Transformed QutritState
   */
  applyPhaseGate(qutrit: QutritState, k: number): QutritState {
    const angle = (Math.PI * k) / 3;
    const phase = { real: Math.cos(angle), imag: Math.sin(angle) };

    return {
      alpha: this.multiplyComplex(qutrit.alpha, phase),
      beta: this.multiplyComplex(qutrit.beta, phase),
      gamma: this.multiplyComplex(qutrit.gamma, phase),
      probabilities: qutrit.probabilities,
    };
  }

  /**
   * Apply a cyclic permutation gate (SWAP-like for qutrits)
   * |0⟩ → |1⟩ → |2⟩ → |0⟩
   * 
   * @param qutrit - QutritState to transform
   * @returns Cyclically permuted QutritState
   */
  applyCyclicGate(qutrit: QutritState): QutritState {
    return {
      alpha: qutrit.gamma,
      beta: qutrit.alpha,
      gamma: qutrit.beta,
      probabilities: [
        qutrit.probabilities[2],
        qutrit.probabilities[0],
        qutrit.probabilities[1],
      ],
    };
  }

  /**
   * Tensor product of two qutrit states (creates entanglement)
   * Used for multi-qutrit gates
   * 
   * @param qutrit1 - First qutrit
   * @param qutrit2 - Second qutrit
   * @returns Entangled two-qutrit state representation
   */
  tensorProduct(
    qutrit1: QutritState,
    qutrit2: QutritState
  ): { amplitudes: Map<string, { real: number; imag: number }>; basis: string[] } {
    const amplitudes = new Map<string, { real: number; imag: number }>();
    const basis = ['00', '01', '02', '10', '11', '12', '20', '21', '22'];

    const states1 = [qutrit1.alpha, qutrit1.beta, qutrit1.gamma];
    const states2 = [qutrit2.alpha, qutrit2.beta, qutrit2.gamma];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const basisLabel = `${i}${j}`;
        amplitudes.set(
          basisLabel,
          this.multiplyComplex(states1[i], states2[j])
        );
      }
    }

    return { amplitudes, basis };
  }

  /**
   * Convert qutrit state to Trinity Keystore vector representation
   * Maps amplitude magnitudes to cryptographic salt values
   * 
   * @param qutrit - QutritState to convert
   * @returns Object with cryptographic vector components
   */
  toTrinityVector(
    qutrit: QutritState
  ): { alpha: string; beta: string; gamma: string; parity: number } {
    const vector = TrinityKeystore.getVector();

    // Use probability distribution as entropy source
    const [p0, p1, p2] = qutrit.probabilities;
    const entropy = -(p0 * Math.log2(p0 + 1e-10) +
      p1 * Math.log2(p1 + 1e-10) +
      p2 * Math.log2(p2 + 1e-10));

    // Parity based on measurement probability bias
    const parity = p0 > p1 && p0 > p2 ? 0.9999 : 0.5;

    return {
      alpha: `α-${this.hashAmplitude(qutrit.alpha)}-${entropy.toFixed(4)}`,
      beta: `β-${this.hashAmplitude(qutrit.beta)}-${entropy.toFixed(4)}`,
      gamma: `γ-${this.hashAmplitude(qutrit.gamma)}-${entropy.toFixed(4)}`,
      parity,
    };
  }

  /**
   * Extract classical trinary representation from qutrit probabilities
   * Uses maximum likelihood estimation
   * 
   * @param qutrit - QutritState
   * @returns Most likely classical value (0, 1, or 2)
   */
  classicalCollapse(qutrit: QutritState): number {
    const [p0, p1, p2] = qutrit.probabilities;
    return p0 > p1 && p0 > p2 ? 0 : p1 > p2 ? 1 : 2;
  }

  /**
   * Simulate decoherence: gradually collapse superposition toward computational basis
   * 
   * @param qutrit - QutritState
   * @param decoherenceTime - Time elapsed in coherence period (0-1)
   * @returns Partially decohered QutritState
   */
  simulateDecoherence(qutrit: QutritState, decoherenceTime: number): QutritState {
    const decay = Math.exp(-decoherenceTime);
    const collapsed = this.classicalCollapse(qutrit);
    const basis = this.createBasisState(collapsed as 0 | 1 | 2);

    // Interpolate between superposition and basis state
    const interpolate = (superposed: { real: number; imag: number }, basisState: { real: number; imag: number }) => ({
      real: superposed.real * decay + basisState.real * (1 - decay),
      imag: superposed.imag * decay + basisState.imag * (1 - decay),
    });

    return {
      alpha: interpolate(qutrit.alpha, basis.alpha),
      beta: interpolate(qutrit.beta, basis.beta),
      gamma: interpolate(qutrit.gamma, basis.gamma),
      probabilities: qutrit.probabilities,
    };
  }

  /**
   * Verify qutrit normalization
   * |α|² + |β|² + |γ|² should equal 1
   * 
   * @param qutrit - QutritState to verify
   * @returns Normalization check (true if normalized within tolerance)
   */
  isNormalized(qutrit: QutritState): boolean {
    const [p0, p1, p2] = qutrit.probabilities;
    const total = p0 + p1 + p2;
    return Math.abs(total - 1) < this.NORMALIZATION_TOLERANCE;
  }

  // ==================== Private Helper Methods ====================

  private complexMagnitude(c: { real: number; imag: number }): number {
    return Math.sqrt(c.real * c.real + c.imag * c.imag);
  }

  private scaleComplex(
    c: { real: number; imag: number },
    scalar: number
  ): { real: number; imag: number } {
    return {
      real: c.real * scalar,
      imag: c.imag * scalar,
    };
  }

  private multiplyComplex(
    c1: { real: number; imag: number },
    c2: { real: number; imag: number }
  ): { real: number; imag: number } {
    return {
      real: c1.real * c2.real - c1.imag * c2.imag,
      imag: c1.real * c2.imag + c1.imag * c2.real,
    };
  }

  private hashAmplitude(amplitude: { real: number; imag: number }): string {
    const combined = amplitude.real.toString() + amplitude.imag.toString();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Keep as 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export default QutritEncoder;
