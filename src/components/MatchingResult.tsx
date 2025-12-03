import React, { useRef } from "react";
import { MatchingResult as MatchingResultType } from "../types";
import { getGradeLabel } from "../utils/grade";
// @ts-ignore
import html2canvas from "html2canvas";

interface MatchingResultProps {
  result: MatchingResultType;
  players: Array<{ id: string; name: string; gender: string }>;
}

export const MatchingResult: React.FC<MatchingResultProps> = ({
  result,
  players,
}) => {
  const matchesByRoundRef = useRef<HTMLDivElement | null>(null);

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || id;
  };

  const getPlayerNameWithGrade = (id: string, matchPlayers: any[]) => {
    const player = matchPlayers.find((p) => p.id === id);
    if (!player) return id;
    const name = player.name;
    const gradeLabel = getGradeLabel(player.grade);
    return `${name} ${gradeLabel}`;
  };

  const downloadAllRoundsAsImage = async () => {
    const matchesByRoundElement = matchesByRoundRef.current;
    if (!matchesByRoundElement) return;

    try {
      const canvas = await html2canvas(matchesByRoundElement, {
        backgroundColor: "#ffffff",
        scale: 2, // 고해상도
        logging: false,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `전체_라운드_매칭.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("이미지 저장 중 오류 발생:", error);
      alert("이미지 저장 중 오류가 발생했습니다.");
    }
  };

  const getTeamTypeLabel = (type: string) => {
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

  // 라운드별로 그룹화
  const matchesByRound = result.matches.reduce((acc, match) => {
    if (!acc[match.roundIndex]) {
      acc[match.roundIndex] = [];
    }
    acc[match.roundIndex].push(match);
    return acc;
  }, {} as Record<number, typeof result.matches>);

  const maxGames = Math.max(...Object.values(result.playerGameCounts));
  const minGames = Math.min(...Object.values(result.playerGameCounts));

  return (
    <div className="matching-result">
      <h2>매칭 결과</h2>

      <div className="result-summary">
        <div className="summary-item">
          <strong>총 게임 수:</strong> {result.totalGames}게임
        </div>
        <div className="summary-item">
          <strong>총 라운드 수:</strong> {result.totalRounds}라운드
        </div>
        <div className="summary-item">
          <strong>게임 수 범위:</strong> {minGames} ~ {maxGames}게임 (차이:{" "}
          {maxGames - minGames}게임)
        </div>
      </div>

      <div className="player-stats">
        <h3>참가자별 게임 수</h3>
        <div className="stats-grid">
          {Object.entries(result.playerGameCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([playerId, count]) => (
              <div key={playerId} className="stat-item">
                <span>{getPlayerName(playerId)}</span>
                <span className="count">{count}게임</span>
              </div>
            ))}
        </div>
      </div>

      <div className="matches-by-round" ref={matchesByRoundRef}>
        <div className="matches-by-round-header">
          <h3>라운드별 매칭</h3>
          <button
            className="download-all-rounds-button"
            onClick={downloadAllRoundsAsImage}
            title="전체 라운드 매칭 이미지로 저장"
          >
            📥 이미지 저장
          </button>
        </div>
        {Object.entries(matchesByRound)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([round, matches]) => (
            <div key={round} className="round-section">
              <h4>라운드 {round}</h4>
              <div className="matches-grid">
                {matches.map((match, idx) => {
                  const gameType = match.teamA.type; // 두 팀은 같은 타입이므로 teamA의 타입 사용

                  return (
                    <div key={idx} className="match-card">
                      <div className="court-label">코트 {match.courtIndex}</div>
                      <div className="match-body">
                        <div className="game-type-label">
                          {getTeamTypeLabel(gameType)}
                        </div>
                        <div className="match-line">
                          <div className="team">
                            <div className="team-players">
                              {getPlayerNameWithGrade(
                                match.teamA.player1Id,
                                match.players
                              )}{" "}
                              /{" "}
                              {getPlayerNameWithGrade(
                                match.teamA.player2Id,
                                match.players
                              )}
                            </div>
                          </div>
                          <div className="vs">VS</div>
                          <div className="team">
                            <div className="team-players">
                              {getPlayerNameWithGrade(
                                match.teamB.player1Id,
                                match.players
                              )}{" "}
                              /{" "}
                              {getPlayerNameWithGrade(
                                match.teamB.player2Id,
                                match.players
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
