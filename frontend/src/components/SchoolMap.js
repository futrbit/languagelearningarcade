import React from "react";
import "../styles.css";

const rooms = [
  { id: "classroom1", name: "English Class" },
  { id: "arcade", name: "Game Room" },
  { id: "library", name: "Library" },
  { id: "media", name: "Media Room" },
];

const SchoolMap = ({ onSelectRoom }) => (
  <div className="school-map-container">
    <h3 className="school-map-title">🏫 School Map</h3>
    <div className="room-buttons">
      {rooms.map(({ id, name }) => (
        <button
          key={id}
          className="room-button"
          onClick={() => onSelectRoom(id)}
          aria-label={`Select ${name} room`}
        >
          🚪 {name}
        </button>
      ))}
    </div>
  </div>
);

export default SchoolMap;
