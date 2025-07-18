import React from "react";
import "../styles.css";

const SchoolMap = ({ onSelectRoom }) => {
  const rooms = [
    { id: "classroom1", label: "Classroom 1" },
    { id: "arcade", label: "Game Room" },
    { id: "library", label: "Library" },
    { id: "media", label: "Media Room" },
  ];

  return (
    <div className="school-map-container">
      <h2 className="school-map-title">School Map</h2>
      <div className="room-buttons">
        {rooms.map((room) => (
          <button
            key={room.id}
            className="room-button"
            onClick={() => onSelectRoom(room.id)}
          >
            {room.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SchoolMap;
