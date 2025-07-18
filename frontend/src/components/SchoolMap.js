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
  <div className="school-map-container">
    <h3 className="school-map-title">🏫 School Map</h3>
    <svg
      width="300"
      height="220"
      style={{
        background: "#fdfaf6",
        display: "block",
        margin: "0 auto",
        border: "2px solid #ddd",
        borderRadius: "8px",
      }}
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
            fill="#ffffff"
            stroke="#7a9e9f"
            strokeWidth={2}
            rx={6}
            ry={6}
          />
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="13"
            pointerEvents="none"
            fill="#4b4b4b"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>

    {/* Button List */}
    <div className="room-buttons">
      {rooms.map(({ id, name }) => (
        <button
          key={id}
          className="room-button"
          onClick={() => onSelectRoom(id)}
        >
          🚪 Go to {name}
        </button>
      ))}
    </div>
  </div>
);

export default SchoolMap;
