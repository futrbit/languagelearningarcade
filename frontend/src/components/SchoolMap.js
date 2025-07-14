// src/components/SchoolMap.js
import React from "react";
import "../styles.css";

const rooms = [
  { id: "classroom1", name: "English Class", x: 10, y: 10, width: 120, height: 80 },
  { id: "arcade", name: "Game Room", x: 150, y: 10, width: 120, height: 80 },
  { id: "library", name: "Library", x: 10, y: 110, width: 120, height: 80 },
  { id: "media", name: "Media Room", x: 150, y: 110, width: 120, height: 80 },
];

const SchoolMap = ({ onSelectRoom }) => (
  <div className="section-border">
    <h3>School Map</h3>
    <svg
      width="300"
      height="220"
      className="section-border"
      style={{ background: "var(--background-color)" }}
      aria-label="Interactive school map"
    >
      {rooms.map(({ id, name, x, y, width, height }) => (
        <g
          key={id}
          onClick={() => onSelectRoom(id)}
          style={{ cursor: "pointer" }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSelectRoom(id);
          }}
          role="button"
          aria-label={`Select ${name} room`}
        >
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="#fff"
            stroke="var(--primary-color)"
            strokeWidth={2}
          />
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="14"
            pointerEvents="none"
            fill="var(--text-color)"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>
  </div>
);

export default SchoolMap;