/**
 * Qutrit Gate Operations & Unitary Transformations
 * 
 * Implements quantum gates optimized for 3-level systems (qutrits).
 * These gates manipulate qutrit states through unitary transformations
 * and enable quantum algorithms on the Trinity Keystore.
 */

import { QutritState, QutritRegister } from './QutritEncoder';

export interface UnitaryMatrix {
  /** 3x3 complex matrix representation */
  matrix: Array<Array<{ real: number; imag: number }>>;
  /** Gate name/identifier */
  name: string;
  /** Hermitian (self-adjoint) check */
  isHermitian: boolean;
  /** Unitary (preserves norm) check */
  isUnitary: boolean;
}

export interface TwoQutritGate {
  /** 9x9 unitary matrix for two-qutrit operations */
  matrix: Array<Array<{ real: number; imag: number }>>;
  /** Gate name */
  name: string;
  /** Whether gate creates entanglement */
  entangles: boolean;
}

export class QutritGateOperations {
  private readonly TOLERANCE = 1e-10;

  /**
   * Single-qutrit identity gate
   * Leaves state unchanged: I|ψ⟩ = |ψ⟩
   */
  getIdentityGate(): UnitaryMatrix {
    return {
      name: 'Identity (I)',
      isHermitian: true,
      isUnitary: true,
      matrix: [
        [{ real: 1, imag: 0 }, { real: 0, imag: 0 }, { real: 0, imag: 0 }],
        [{ real: 0, imag: 0 }, { real: 1, imag: 0 }, { real: 0, imag: 0 }],
        [{ real: 0, imag: 0 }, { real: 0, imag: 0 }, { real: 1, imag: 0 }],
      ],
    };
  }

  /**
   * Qutrit shift gate (increment mod 3)
   * |0⟩ → |1⟩, |1⟩ → |2⟩, |2⟩ → |0⟩
   * Used for cyclic rotation in computational basis
   */
  getShiftGate(): UnitaryMatrix {
    return {
      name: 'Shift (X)',
      isHermitian: false,
      isUnitary: true,
      matrix: [
        [{ real: 0, imag: 0 }, { real: 0, imag: 0 }, { real: 1, imag: 0 }],
        [{ real: 1, imag: 0 }, { real: 0, imag: 0 }, { real: 0, imag: 0 }],
        [{ real: 0, imag: 0 }, { real: 1, imag: 0 }, { real: 0, imag: 0 }],
      ],
    };
  }

  /**
   * Qutrit clock gate (phase increment)
   * Applies e^(2πi/3) phase progressively: |j⟩ → e^(2πij/3)|j⟩
   * Analogous to Z gate in qubits
   */
  getClockGate(): UnitaryMatrix {
    const omega = { real: Math.cos((2 * Math.PI) / 3), imag: Math.sin((2 * Math.PI) / 3) };
    const omegaSq = {
      real: Math.cos((4 * Math.PI) / 3),
      imag: Math.sin((4 * Math.PI) / 3),
    };

    return {
      name: 'Clock (Z)',
      isHermitian: false,
      isUnitary: true,
      matrix: [
        [{ real: 1, imag: 0 }, { real: 0, imag: 0 }, { real: 0, imag: 0 }],
        [{ real: 0, imag: 0 }, omega.real, omega.imag],
        [{ real: 0, imag: 0 }, omegaSq.real, omegaSq.imag],
      ],
    };
  }

  /**
   * Qutrit Fourier Transform gate
   * Maps computational basis to Fourier basis
   * F|j⟩ = (1/√3) Σₖ e^(2πijk/3)|k⟩
   */
  getFourierGate(): UnitaryMatrix {
    const factor = 1 / Math.sqrt(3);
    const omega = Math.exp((2 * Math.PI * 1i) / 3);

    const matrix: Array<Array<{ real: number; imag: number }>> = [];
    for (let j = 0; j < 3; j++) {
      const row: Array<{ real: number; imag: number }> = [];
      for (let k = 0; k < 3; k++) {
        const angle = (2 * Math.PI * j * k) / 3;
        row.push({
          real: factor * Math.cos(angle),
          imag: factor * Math.sin(angle),
        });
      }
      matrix.push(row);
    }

    return {
      name: 'Quantum Fourier Transform (QFT)',
      isHermitian: false,
      isUnitary: true,
      matrix,
    };
  }

  /**
   * Qutrit Hadamard-like gate (equal superposition creator)
   * Creates uniform superposition: H|j⟩ = (1/√3)(|0⟩ + |1⟩ + |2⟩)
   */
  getHadamardLikeGate(): UnitaryMatrix {
    const factor = 1 / Math.sqrt(3);
    return {
      name: 'Hadamard-like (H)',
      isHermitian: true,
      isUnitary: true,
      matrix: [
        [{ real: factor, imag: 0 }, { real: factor, imag: 0 }, { real: factor, imag: 0 }],
        [{ real: factor, imag: 0 }, { real: factor, imag: 0 }, { real: factor, imag: 0 }],
        [{ real: factor, imag: 0 }, { real: factor, imag: 0 }, { real: factor, imag: 0 }],
      ],
    };
  }

  /**
   * Qutrit balanced phase gate
   * Applies balanced phases to each basis state
   * Useful for quantum algorithms
   */
  getBalancedPhaseGate(): UnitaryMatrix {
    const omega = { real: Math.cos((2 * Math.PI) / 3), imag: Math.sin((2 * Math.PI) / 3) };
    const omegaSq = {
      real: Math.cos((4 * Math.PI) / 3),
      imag: Math.sin((4 * Math.PI) / 3),
    };

    return {
      name: 'Balanced Phase',
      isHermitian: false,
      isUnitary: true,
      matrix: [
        [{ real: 1, imag: 0 }, { real: 0, imag: 0 }, { real: 0, imag: 0 }],
        [{ real: 0, imag: 0 }, omega.real, omega.imag],
        [{ real: 0, imag: 0 }, omegaSq.real, omegaSq.imag],
      ],
    };
  }

  /**
   * Apply a unitary gate to a qutrit state
   * New state: |ψ'⟩ = U|ψ⟩
   * 
   * @param qutrit - Input qutrit state
   * @param gate - Unitary gate to apply
   * @returns Transformed qutrit state
   */
  applyGate(qutrit: QutritState, gate: UnitaryMatrix): QutritState {
    const amplitudes = [qutrit.alpha, qutrit.beta, qutrit.gamma];
    const result = [
      { real: 0, imag: 0 },
      { real: 0, imag: 0 },
      { real: 0, imag: 0 },
    ];

    // Matrix-vector multiplication: result = matrix × amplitudes
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const product = this.multiplyComplex(gate.matrix[i][j], amplitudes[j]);
        result[i] = this.addComplex(result[i], product);
      }
    }

    // Recalculate probabilities
    const probabilities: [number, number, number] = [
      this.complexMagnitude(result[0]) ** 2,
      this.complexMagnitude(result[1]) ** 2,
      this.complexMagnitude(result[2]) ** 2,
    ];

    return {
      alpha: result[0],
      beta: result[1],
      gamma: result[2],
      probabilities,
    };
  }

  /**
   * Compose two single-qutrit gates into one
   * Resulting gate applies left gate first, then right gate: (G₂ ∘ G₁)
   * 
   * @param gate1 - First gate to apply
   * @param gate2 - Second gate to apply
   * @returns Composed gate
   */
  composeGates(gate1: UnitaryMatrix, gate2: UnitaryMatrix): UnitaryMatrix {
    const composed = this.matrixMultiply(gate2.matrix, gate1.matrix);

    return {
      name: `${gate2.name} ∘ ${gate1.name}`,
      isHermitian: false,
      isUnitary: true,
      matrix: composed,
    };
  }

  /**
   * Create a controlled qutrit gate (CU)
   * If control qutrit is |1⟩, apply U to target
   * 
   * @param gate - Gate to apply conditionally
   * @returns 9x9 controlled gate matrix
   */
  getControlledGate(gate: UnitaryMatrix): TwoQutritGate {
    const matrix: Array<Array<{ real: number; imag: number }>> = [];

    // 9x9 matrix for two-qutrit system
    for (let i = 0; i < 9; i++) {
      const row: Array<{ real: number; imag: number }> = [];
      for (let j = 0; j < 9; j++) {
        if (i === j) {
          // Identity block (when control is not |1⟩)
          row.push(i < 6 || i >= 9 ? { real: 1, imag: 0 } : { real: 0, imag: 0 });
        } else if (i >= 3 && i < 6 && j >= 3 && j < 6) {
          // Controlled gate block (when control is |1⟩)
          row.push(gate.matrix[i - 3][j - 3]);
        } else {
          row.push({ real: 0, imag: 0 });
        }
      }
      matrix.push(row);
    }

    return {
      name: `Controlled-${gate.name}`,
      entangles: true,
      matrix,
    };
  }

  /**
   * Create a controlled-SWAP (Fredkin-like) gate for qutrits
   * Swaps two qutrit states if control is |2⟩
   */
  getControlledSwapGate(): TwoQutritGate {
    const matrix: Array<Array<{ real: number; imag: number }>> = [];

    for (let i = 0; i < 9; i++) {
      const row: Array<{ real: number; imag: number }> = [];
      for (let j = 0; j < 9; j++) {
        let value = { real: 0, imag: 0 };

        if (i === j && i < 6) {
          // Identity for non-|2⟩ control
          value = { real: 1, imag: 0 };
        } else if (i >= 6 && j >= 6) {
          // SWAP block for control = |2⟩
          const a = i - 6; // 0-2
          const b = j - 6; // 0-2
          if ((a < 3 && b < 3) && Math.floor(a / 3) === Math.floor(b / 3)) {
            // Swap qutrit states
            if (a % 3 === (b / 3) % 3 && (a / 3) % 3 === b % 3) {
              value = { real: 1, imag: 0 };
            }
          }
        }

        row.push(value);
      }
      matrix.push(row);
    }

    return {
      name: 'Controlled-SWAP',
      entangles: true,
      matrix,
    };
  }

  /**
   * Conjugate a gate by another: G₁† ∘ U ∘ G₁
   * Useful for basis transformations
   * 
   * @param gate - Gate to conjugate
   * @param conjugator - Gate to conjugate by
   * @returns Conjugated gate
   */
  conjugateGate(gate: UnitaryMatrix, conjugator: UnitaryMatrix): UnitaryMatrix {
    const conjugatorDagger = this.conjugateTranspose(conjugator.matrix);
    const temp = this.matrixMultiply(conjugatorDagger, gate.matrix);
    const result = this.matrixMultiply(temp, conjugator.matrix);

    return {
      name: `${conjugator.name}† ∘ ${gate.name} ∘ ${conjugator.name}`,
      isHermitian: gate.isHermitian,
      isUnitary: gate.isUnitary,
      matrix: result,
    };
  }

  /**
   * Get the inverse (dagger) of a gate
   * For unitary gates: U† = U⁻¹
   * 
   * @param gate - Gate to invert
   * @returns Inverted gate
   */
  invertGate(gate: UnitaryMatrix): UnitaryMatrix {
    return {
      name: `${gate.name}†`,
      isHermitian: gate.isHermitian,
      isUnitary: gate.isUnitary,
      matrix: this.conjugateTranspose(gate.matrix),
    };
  }

  /**
   * Verify gate properties
   * 
   * @param gate - Gate to verify
   * @returns Verification results with Hermitian and unitary status
   */
  verifyGate(
    gate: UnitaryMatrix
  ): { isHermitian: boolean; isUnitary: boolean; unitaryError: number } {
    const identity = this.matrixMultiply(
      gate.matrix,
      this.conjugateTranspose(gate.matrix)
    );

    // Check if result is identity (within tolerance)
    let unitaryError = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const expected = i === j ? 1 : 0;
        const actual = this.complexMagnitude(identity[i][j]);
        unitaryError += Math.abs(actual - expected);
      }
    }

    // Check if Hermitian (A = A†)
    let isHermitian = true;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const diff = this.subtractComplex(
          gate.matrix[i][j],
          this.conjugate(gate.matrix[j][i])
        );
        if (this.complexMagnitude(diff) > this.TOLERANCE) {
          isHermitian = false;
          break;
        }
      }
    }

    return {
      isHermitian,
      isUnitary: unitaryError < this.TOLERANCE,
      unitaryError,
    };
  }

  // ==================== Private Helper Methods ====================

  private multiplyComplex(
    a: { real: number; imag: number },
    b: { real: number; imag: number }
  ): { real: number; imag: number } {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real,
    };
  }

  private addComplex(
    a: { real: number; imag: number },
    b: { real: number; imag: number }
  ): { real: number; imag: number } {
    return {
      real: a.real + b.real,
      imag: a.imag + b.imag,
    };
  }

  private subtractComplex(
    a: { real: number; imag: number },
    b: { real: number; imag: number }
  ): { real: number; imag: number } {
    return {
      real: a.real - b.real,
      imag: a.imag - b.imag,
    };
  }

  private conjugate(c: { real: number; imag: number }): { real: number; imag: number } {
    return {
      real: c.real,
      imag: -c.imag,
    };
  }

  private complexMagnitude(c: { real: number; imag: number }): number {
    return Math.sqrt(c.real * c.real + c.imag * c.imag);
  }

  private conjugateTranspose(
    matrix: Array<Array<{ real: number; imag: number }>>
  ): Array<Array<{ real: number; imag: number }>> {
    const result: Array<Array<{ real: number; imag: number }>> = [];
    for (let j = 0; j < matrix[0].length; j++) {
      const row: Array<{ real: number; imag: number }> = [];
      for (let i = 0; i < matrix.length; i++) {
        row.push(this.conjugate(matrix[i][j]));
      }
      result.push(row);
    }
    return result;
  }

  private matrixMultiply(
    a: Array<Array<{ real: number; imag: number }>>,
    b: Array<Array<{ real: number; imag: number }>>
  ): Array<Array<{ real: number; imag: number }>> {
    const result: Array<Array<{ real: number; imag: number }>> = [];

    for (let i = 0; i < a.length; i++) {
      const row: Array<{ real: number; imag: number }> = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = { real: 0, imag: 0 };
        for (let k = 0; k < b.length; k++) {
          sum = this.addComplex(sum, this.multiplyComplex(a[i][k], b[k][j]));
        }
        row.push(sum);
      }
      result.push(row);
    }

    return result;
  }
}

export default QutritGateOperations;
