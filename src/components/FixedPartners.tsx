import React, { useState } from "react";
import { Player, TeamType } from "../types";

interface FixedPartner {
  id: string;
  player1Id: string;
  player2Id: string;
  type: TeamType;
}

interface FixedPartnersProps {
  allPlayers: Player[];
  fixedPartners: FixedPartner[];
  onFixedPartnersChange: (partners: FixedPartner[]) => void;
}

export const FixedPartners: React.FC<FixedPartnersProps> = ({
  allPlayers,
  fixedPartners,
  onFixedPartnersChange,
}) => {
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>("");
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>("");

  // 이미 선택된 플레이어 ID 목록
  const usedPlayerIds = new Set<string>();
  fixedPartners.forEach((partner) => {
    usedPlayerIds.add(partner.player1Id);
    usedPlayerIds.add(partner.player2Id);
  });

  // 선택 가능한 플레이어 목록 (이미 선택된 플레이어 제외)
  const availablePlayers = allPlayers.filter((p) => !usedPlayerIds.has(p.id));

  // 선택 가능한 플레이어 목록 (player1이 선택된 경우 player2는 player1 제외)
  const getAvailablePlayersForPlayer2 = () => {
    if (!selectedPlayer1) {
      return availablePlayers;
    }
    return availablePlayers.filter((p) => p.id !== selectedPlayer1);
  };

  const handleAddPartner = () => {
    if (!selectedPlayer1 || !selectedPlayer2) {
      return;
    }

    const player1 = allPlayers.find((p) => p.id === selectedPlayer1);
    const player2 = allPlayers.find((p) => p.id === selectedPlayer2);

    if (!player1 || !player2) {
      return;
    }

    // 팀 타입 결정
    let teamType: TeamType;
    if (player1.gender === "M" && player2.gender === "M") {
      teamType = "MD";
    } else if (player1.gender === "F" && player2.gender === "F") {
      teamType = "WD";
    } else {
      teamType = "XD";
    }

    const newPartner: FixedPartner = {
      id: `${selectedPlayer1}-${selectedPlayer2}-${Date.now()}`,
      player1Id: selectedPlayer1,
      player2Id: selectedPlayer2,
      type: teamType,
    };

    onFixedPartnersChange([...fixedPartners, newPartner]);
    setSelectedPlayer1("");
    setSelectedPlayer2("");
  };

  const handleRemovePartner = (id: string) => {
    onFixedPartnersChange(fixedPartners.filter((p) => p.id !== id));
  };

  const getPlayerName = (id: string) => {
    return allPlayers.find((p) => p.id === id)?.name || id;
  };

  const getTeamTypeLabel = (type: TeamType) => {
    switch (type) {
      case "MD":
        return "남복";
      case "WD":
        return "여복";
      case "XD":
        return "혼복";
      default:
        return type;
    }
  };

  return (
    <div className="fixed-partners-section">
      <h3>파트너 고정</h3>
      <div className="partner-select-group">
        <select
          value={selectedPlayer1}
          onChange={(e) => {
            setSelectedPlayer1(e.target.value);
            setSelectedPlayer2(""); // player1이 변경되면 player2 초기화
          }}
          className="partner-select"
        >
          <option value="">선택하세요</option>
          {availablePlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        <select
          value={selectedPlayer2}
          onChange={(e) => setSelectedPlayer2(e.target.value)}
          className="partner-select"
          disabled={!selectedPlayer1}
        >
          <option value="">선택하세요</option>
          {getAvailablePlayersForPlayer2().map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        <button
          className="add-partner-button"
          onClick={handleAddPartner}
          disabled={!selectedPlayer1 || !selectedPlayer2}
        >
          +
        </button>
      </div>

      {fixedPartners.length > 0 && (
        <div className="fixed-partners-list">
          {fixedPartners.map((partner) => (
            <div key={partner.id} className="fixed-partner-item">
              <span className="partner-names">
                {getPlayerName(partner.player1Id)} /{" "}
                {getPlayerName(partner.player2Id)}
              </span>
              <span className="partner-type">
                {getTeamTypeLabel(partner.type)}
              </span>
              <button
                className="remove-partner-button"
                onClick={() => handleRemovePartner(partner.id)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
