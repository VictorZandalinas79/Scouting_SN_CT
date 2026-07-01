import React from 'react';
import { PITCH_W, PITCH_H, fx } from './geometry';

const LINE = 'rgba(148, 163, 184, 0.35)';
const LINE_W = 0.25;

/**
 * Campo de fútbol dibujado en SVG puro (sin imágenes), en coordenadas reales
 * (105x68). Se usa como fondo del <PitchMap/>. Ataque de izquierda a derecha:
 * portería propia a la izquierda (x=0), portería rival a la derecha (x=105).
 */
export const PitchLines: React.FC = () => {
  // Áreas: penalti 16,5 m; área pequeña 5,5 m; punto de penalti 11 m.
  const boxDepth = 16.5;
  const boxWidth = 40.32;
  const smallDepth = 5.5;
  const smallWidth = 18.32;
  const penaltyDist = 11;
  const cy = PITCH_H / 2;
  const boxTop = (PITCH_H - boxWidth) / 2;
  const boxBottom = boxTop + boxWidth;
  const smallTop = (PITCH_H - smallWidth) / 2;
  const centerR = 9.15;

  return (
    <g fill="none" stroke={LINE} strokeWidth={LINE_W}>
      {/* Perímetro */}
      <rect x={0} y={0} width={PITCH_W} height={PITCH_H} />

      {/* Línea de medio campo */}
      <line x1={PITCH_W / 2} y1={0} x2={PITCH_W / 2} y2={PITCH_H} />

      {/* Círculo central + punto */}
      <circle cx={PITCH_W / 2} cy={cy} r={centerR} />
      <circle cx={PITCH_W / 2} cy={cy} r={0.5} fill={LINE} stroke="none" />

      {/* Área grande izquierda */}
      <rect x={0} y={boxTop} width={boxDepth} height={boxWidth} />
      {/* Área pequeña izquierda */}
      <rect x={0} y={smallTop} width={smallDepth} height={smallWidth} />
      {/* Punto de penalti izquierdo */}
      <circle cx={penaltyDist} cy={cy} r={0.5} fill={LINE} stroke="none" />
      {/* Arco del área izquierda */}
      <path
        d={`M ${boxDepth} ${cy - 7} A ${centerR} ${centerR} 0 0 1 ${boxDepth} ${cy + 7}`}
      />

      {/* Área grande derecha */}
      <rect x={PITCH_W - boxDepth} y={boxTop} width={boxDepth} height={boxWidth} />
      {/* Área pequeña derecha */}
      <rect x={PITCH_W - smallDepth} y={smallTop} width={smallDepth} height={smallWidth} />
      {/* Punto de penalti derecho */}
      <circle cx={PITCH_W - penaltyDist} cy={cy} r={0.5} fill={LINE} stroke="none" />
      {/* Arco del área derecha */}
      <path
        d={`M ${PITCH_W - boxDepth} ${cy - 7} A ${centerR} ${centerR} 0 0 0 ${PITCH_W - boxDepth} ${cy + 7}`}
      />

      {/* Porterías (pequeño saliente) */}
      <rect x={-1.2} y={boxTop + boxWidth / 2 - 3.66} width={1.2} height={7.32} />
      <rect x={PITCH_W} y={boxBottom - boxWidth / 2 - 3.66} width={1.2} height={7.32} />
    </g>
  );
};

interface PitchProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Contenedor SVG con el campo dibujado. Los hijos se pintan encima usando el
 * mismo sistema de coordenadas (105x68), así que se posicionan con fx()/fy().
 */
export const Pitch: React.FC<PitchProps> = ({ children, className }) => {
  return (
    <svg
      viewBox={`${-2} ${-2} ${PITCH_W + 4} ${PITCH_H + 4}`}
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect
        x={-2}
        y={-2}
        width={PITCH_W + 4}
        height={PITCH_H + 4}
        fill="#0d1424"
        rx={1.5}
      />
      <PitchLines />
      {children}
    </svg>
  );
};

// Re-export para comodidad de quien importe desde Pitch.
export { fx } from './geometry';
