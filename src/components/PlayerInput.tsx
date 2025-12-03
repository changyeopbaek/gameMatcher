import React, { useState } from "react";
import { Player, Gender, Grade } from "../types";
import { ALL_GRADES } from "../utils/grade";

interface PlayerInputProps {
  players: Player[];
  gender: Gender;
  onPlayersChange: (players: Player[]) => void;
}

export const PlayerInput: React.FC<PlayerInputProps> = ({
  players,
  gender,
  onPlayersChange,
}) => {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerGrade, setNewPlayerGrade] = useState<Grade>("D조");

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: `${gender}-${Date.now()}-${Math.random()}`,
        name: newPlayerName.trim(),
        gender,
        grade: newPlayerGrade,
      };
      onPlayersChange([...players, newPlayer]);
      setNewPlayerName("");
      setNewPlayerGrade("D조");
    }
  };

  const removePlayer = (id: string) => {
    onPlayersChange(players.filter((p) => p.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addPlayer();
    }
  };

  const updatePlayerGrade = (id: string, grade: Grade) => {
    onPlayersChange(players.map((p) => (p.id === id ? { ...p, grade } : p)));
  };

  return (
    <div className="player-input-section">
      <h3>{gender === "M" ? "남자" : "여자"} 참가자</h3>
      <div className="add-player">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="이름 입력"
        />
        <select
          value={newPlayerGrade}
          onChange={(e) => setNewPlayerGrade(e.target.value as Grade)}
          className="grade-select"
        >
          {ALL_GRADES.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
        <button onClick={addPlayer}>추가</button>
      </div>
      <div className="player-list">
        {players.map((player) => (
          <div key={player.id} className="player-item">
            <span>{player.name}</span>
            <select
              value={player.grade}
              onChange={(e) =>
                updatePlayerGrade(player.id, e.target.value as Grade)
              }
              className="grade-select-small"
            >
              {ALL_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            <button onClick={() => removePlayer(player.id)}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
};
