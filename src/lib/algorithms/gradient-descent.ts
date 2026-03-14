import type { AnimationStep, NeuronScene, StepResult } from '../animation-engine';

/**
 * Generates a StepResult for gradient descent on a 2-D loss surface.
 *
 * A point descends a quadratic loss surface, updating its position with each step.
 * The loss function is a rotated elliptic paraboloid: L(x,y) = a·rx² + b·ry²
 *
 * Steps produced:
 *   compare → compute gradient at current position
 *   swap    → update position (take a gradient step)
 *   sorted  → convergence checkpoint
 *   done    → optimization complete
 */

const LEARNING_RATE = 0.06;
const MAX_STEPS = 80;
const CONVERGENCE_THRESHOLD = 0.001;

const fmt = (v: number) => v.toFixed(4);

interface SurfaceParams {
  a: number;
  b: number;
  angle: number;
  centerX: number;
  centerY: number;
}

interface DescentState {
  posX: number;
  posY: number;
  currentLoss: number;
  iteration: number;
  path: Array<{ x: number; y: number }>;
  surface: SurfaceParams;
}

function lossFn(s: SurfaceParams, x: number, y: number): number {
  const cosA = Math.cos(s.angle);
  const sinA = Math.sin(s.angle);
  const rx = cosA * (x - s.centerX) + sinA * (y - s.centerY);
  const ry = -sinA * (x - s.centerX) + cosA * (y - s.centerY);
  return s.a * rx * rx + s.b * ry * ry;
}

function gradientFn(s: SurfaceParams, x: number, y: number): { dx: number; dy: number } {
  const cosA = Math.cos(s.angle);
  const sinA = Math.sin(s.angle);
  const rx = cosA * (x - s.centerX) + sinA * (y - s.centerY);
  const ry = -sinA * (x - s.centerX) + cosA * (y - s.centerY);
  const dRx = 2 * s.a * rx;
  const dRy = 2 * s.b * ry;
  const dx = dRx * cosA - dRy * sinA;
  const dy = dRx * sinA + dRy * cosA;
  return { dx, dy };
}

function initDescent(seed: number[]): DescentState {
  // Use seed values for deterministic surface and starting position
  const s0 = seed.length > 0 ? seed[0] : Math.random();
  const s1 = seed.length > 1 ? seed[1] : Math.random();
  const s2 = seed.length > 2 ? seed[2] : Math.random();
  const s3 = seed.length > 3 ? seed[3] : Math.random();
  const s4 = seed.length > 4 ? seed[4] : Math.random();
  const s5 = seed.length > 5 ? seed[5] : Math.random();

  const surface: SurfaceParams = {
    a: 0.5 + s0 * 2,
    b: 1 + s1 * 4,
    angle: s2 * Math.PI,
    centerX: (s3 - 0.5) * 2,
    centerY: (s4 - 0.5) * 2,
  };

  const posX = (s5 - 0.5) * 4;
  const posY = ((seed.length > 6 ? seed[6] : Math.random()) - 0.5) * 4;

  return {
    posX,
    posY,
    currentLoss: lossFn(surface, posX, posY),
    iteration: 0,
    path: [{ x: posX, y: posY }],
    surface,
  };
}

function makeScene(state: DescentState): NeuronScene {
  const grad = gradientFn(state.surface, state.posX, state.posY);
  const gradMag = Math.sqrt(grad.dx * grad.dx + grad.dy * grad.dy);

  const lossPath = state.path.map(p => ({
    x: p.x,
    y: p.y,
    loss: lossFn(state.surface, p.x, p.y),
  }));

  return {
    type: 'neuron',
    variant: 'gradient-descent',
    inputs: [state.posX, state.posY],
    weights: [state.surface.a, state.surface.b, state.surface.angle],
    bias: LEARNING_RATE,
    weightedSum: gradMag,
    output: state.currentLoss,
    currentExample: state.iteration,
    // Gradient descent-specific fields
    lossPath,
    currentPosition: {
      x: state.posX,
      y: state.posY,
      loss: state.currentLoss,
    },
    learningRate: LEARNING_RATE,
    surfaceParams: { ...state.surface },
    gradient: grad,
  };
}

export function generateGradientDescentSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];
  const state = initDescent(arr);

  const initialScene = makeScene(state);

  // Intro
  steps.push({
    type: 'compare',
    indices: [0],
    description: `Gradient descent init — lr=${LEARNING_RATE}, start=(${fmt(state.posX)}, ${fmt(state.posY)}), loss=${fmt(state.currentLoss)}`,
    sceneUpdate: makeScene(state),
  });

  let converged = false;

  for (let i = 0; i < MAX_STEPS && !converged; i++) {
    // Compute gradient
    const grad = gradientFn(state.surface, state.posX, state.posY);
    const gradMag = Math.sqrt(grad.dx * grad.dx + grad.dy * grad.dy);

    steps.push({
      type: 'compare',
      indices: [i],
      description: `Step ${i + 1}: pos=(${fmt(state.posX)}, ${fmt(state.posY)}), ∇L=(${fmt(grad.dx)}, ${fmt(grad.dy)}), |∇L|=${fmt(gradMag)}`,
      sceneUpdate: makeScene(state),
    });

    // Update position
    const prevX = state.posX;
    const prevY = state.posY;
    state.posX -= LEARNING_RATE * grad.dx;
    state.posY -= LEARNING_RATE * grad.dy;
    // Clamp to [-3, 3]
    state.posX = Math.max(-3, Math.min(3, state.posX));
    state.posY = Math.max(-3, Math.min(3, state.posY));
    state.currentLoss = lossFn(state.surface, state.posX, state.posY);
    state.path.push({ x: state.posX, y: state.posY });
    state.iteration++;

    steps.push({
      type: 'swap',
      indices: [i],
      description: `Update: (${fmt(prevX)}, ${fmt(prevY)}) → (${fmt(state.posX)}, ${fmt(state.posY)}), loss=${fmt(state.currentLoss)}`,
      sceneUpdate: makeScene(state),
    });

    // Check convergence every 5 steps
    if ((i + 1) % 5 === 0 || state.currentLoss <= CONVERGENCE_THRESHOLD) {
      if (state.currentLoss <= CONVERGENCE_THRESHOLD) {
        converged = true;
        steps.push({
          type: 'sorted',
          indices: Array.from({ length: state.iteration }, (_, idx) => idx),
          description: `Converged at step ${state.iteration}! Loss=${fmt(state.currentLoss)} ≤ ${CONVERGENCE_THRESHOLD}. Minimum found at (${fmt(state.posX)}, ${fmt(state.posY)}).`,
          sceneUpdate: makeScene(state),
        });
      } else {
        steps.push({
          type: 'sorted',
          indices: [i],
          description: `Checkpoint at step ${state.iteration}: loss=${fmt(state.currentLoss)}, distance to min=${fmt(Math.sqrt((state.posX - state.surface.centerX) ** 2 + (state.posY - state.surface.centerY) ** 2))}`,
          sceneUpdate: makeScene(state),
        });
      }
    }
  }

  // Done
  steps.push({
    type: 'done',
    indices: [],
    description: converged
      ? `Gradient descent converged in ${state.iteration} steps. Final loss=${fmt(state.currentLoss)}, position=(${fmt(state.posX)}, ${fmt(state.posY)})`
      : `Gradient descent stopped after ${state.iteration} steps. Final loss=${fmt(state.currentLoss)}, lr=${LEARNING_RATE}`,
    sceneUpdate: makeScene(state),
  });

  return { steps, initialScene };
}
