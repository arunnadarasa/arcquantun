"""Candidate feature maps for the msk-physio kernel, costed against each other.

Three families, all measure-free at build time so the same object can be
statevector-scored offline and measured on the emulator:

  angle    - Ry/Rz angle encoding, one entangling ring
  zz       - second-order ZZ feature map (Havlicek-style), one repetition
  hea      - hardware-efficient ansatz, two layers of Ry/Rz + a CX ladder

pytket angles are HALFTURNS. Every formula carrying an explicit pi has it
divided out before it reaches a gate.
"""

from __future__ import annotations

import numpy as np
from pytket import Circuit


def angle_map(x: np.ndarray, nq: int) -> Circuit:
    c = Circuit(nq)
    for q in range(nq):
        c.Ry(float(x[q]) / np.pi, q)
    for q in range(nq - 1):
        c.CX(q, q + 1)
    for q in range(nq):
        c.Rz(float(x[q]) / (2 * np.pi), q)
    return c


def zz_map(x: np.ndarray, nq: int) -> Circuit:
    c = Circuit(nq)
    for q in range(nq):
        c.H(q)
        c.Rz(float(x[q]) / np.pi, q)
    for q in range(nq - 1):
        theta = float((np.pi - x[q]) * (np.pi - x[q + 1])) / np.pi
        c.CX(q, q + 1)
        c.Rz(theta, q + 1)
        c.CX(q, q + 1)
    return c


def hea_map(x: np.ndarray, nq: int) -> Circuit:
    c = Circuit(nq)
    for layer in range(2):
        for q in range(nq):
            c.Ry(float(x[q]) / np.pi, q)
            c.Rz(float(x[(q + layer + 1) % nq]) / (2 * np.pi), q)
        for q in range(nq - 1):
            c.CX(q, q + 1)
    return c


FAMILIES = {
    "angle": ("Angle encoding + entangling ring", angle_map),
    "zz": ("Second-order ZZ feature map", zz_map),
    "hea": ("Hardware-efficient ansatz, 2 layers", hea_map),
}


def overlap_circuit(builder, a: np.ndarray, b: np.ndarray, nq: int, *, measure: bool = True) -> Circuit:
    """Compute-uncompute overlap: p(all zeros) = |<phi(a)|phi(b)>|^2. No ancilla."""
    c = builder(a, nq)
    c.append(builder(b, nq).dagger())
    if measure:
        c.measure_all()
    return c


def ideal_overlap(builder, a: np.ndarray, b: np.ndarray, nq: int) -> float:
    c = overlap_circuit(builder, a, b, nq, measure=False)
    sv = c.get_statevector()
    return float(abs(sv[0]) ** 2)
