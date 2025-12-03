import { useState } from "react";
import {
  Player,
  MatchingInput,
  MatchingResult as MatchingResultType,
  MatchingOptions,
  TeamType,
} from "./types";
import { generateMatching } from "./utils/matching";
import { PlayerInput } from "./components/PlayerInput";
import { MatchingResult } from "./components/MatchingResult";
import { FixedPartners } from "./components/FixedPartners";
import "./App.css";

function App() {
  const [malePlayers, setMalePlayers] = useState<Player[]>([]);
  const [femalePlayers, setFemalePlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<number>(1);
  const [hours, setHours] = useState<number>(1);
  const [gamesPerHour, setGamesPerHour] = useState<number>(4);
  const [options, setOptions] = useState<MatchingOptions>({
    allowMixed: false,
    allowPartnerFixed: false,
  });
  const [result, setResult] = useState<MatchingResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [fixedPartners, setFixedPartners] = useState<
    Array<{ id: string; player1Id: string; player2Id: string; type: TeamType }>
  >([]);

  const handleReset = () => {
    setError(null);

    if (result) {
      // 결과가 있을 때는 fade-out 애니메이션 후 리셋
      setIsResetting(true);
      setTimeout(() => {
        setMalePlayers([]);
        setFemalePlayers([]);
        setCourts(1);
        setHours(1);
        setGamesPerHour(4);
        setOptions({
          allowMixed: false,
          allowPartnerFixed: false,
        });
        setResult(null);
        setFixedPartners([]);
        setIsResetting(false);
      }, 1200); // CSS transition 시간과 맞춤 (더 부드럽게)
    } else {
      // 결과가 없으면 즉시 리셋
      setMalePlayers([]);
      setFemalePlayers([]);
      setCourts(2);
      setHours(2);
      setGamesPerHour(4);
      setOptions({
        allowMixed: false,
        allowPartnerFixed: false,
      });
      setResult(null);
      setFixedPartners([]);
    }
  };

  const handleGenerate = () => {
    setError(null);
    setIsResetting(false); // 리셋 상태 초기화

    if (malePlayers.length === 0 && femalePlayers.length === 0) {
      setError("최소 1명 이상의 참가자가 필요합니다.");
      return;
    }

    if (courts <= 0 || hours <= 0 || gamesPerHour <= 0) {
      setError("코트 수, 시간, 시간당 게임 수는 1 이상이어야 합니다.");
      return;
    }

    const totalPlayers = malePlayers.length + femalePlayers.length;
    const totalGames = courts * hours * gamesPerHour;
    const totalSlots = totalGames * 4;

    if (totalSlots < totalPlayers) {
      setError(
        "총 슬롯 수가 참가자 수보다 적습니다. 코트 수, 시간, 또는 시간당 게임 수를 늘려주세요."
      );
      return;
    }

    try {
      const input: MatchingInput = {
        malePlayers,
        femalePlayers,
        courts,
        hours,
        gamesPerHour,
        options,
        fixedPartners: options.allowPartnerFixed
          ? fixedPartners.map((p) => ({
              player1Id: p.player1Id,
              player2Id: p.player2Id,
              type: p.type,
            }))
          : undefined,
      };

      const matchingResult = generateMatching(input);
      // 기존 결과가 있어도 새로 생성된 결과로 덮어쓰기 (재생성)
      // 결과를 강제로 업데이트하기 위해 먼저 null로 설정 후 새 결과 설정
      if (result) {
        setResult(null);
        // 다음 프레임에서 새 결과 설정하여 강제 리렌더링
        requestAnimationFrame(() => {
          setResult(matchingResult);
        });
      } else {
        setResult(matchingResult);
      }
    } catch (err) {
      setError(
        `매칭 생성 중 오류가 발생했습니다: ${
          err instanceof Error ? err.message : "알 수 없는 오류"
        }`
      );
    }
  };

  const allPlayers = [...malePlayers, ...femalePlayers];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Matcher</h1>
        <p>공정하고 균등한 게임 매칭생성기</p>
      </header>

      <div className={`app-container ${result ? "has-result" : "no-result"}`}>
        <div className="input-section">
          <h2>매칭 설정</h2>

          <div className="form-group">
            <label>
              코트 수:
              <input
                type="number"
                min="1"
                value={courts}
                onChange={(e) => setCourts(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              운동 시간 (시간):
              <input
                type="number"
                min="1"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              시간당 게임 수:
              <input
                type="number"
                min="1"
                value={gamesPerHour}
                onChange={(e) => setGamesPerHour(Number(e.target.value))}
              />
            </label>
            <small>1코트에서 1시간 동안 진행되는 게임 수 (기본: 4게임)</small>
          </div>

          <div className="options-section">
            <h3>옵션</h3>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.allowMixed}
                  onChange={(e) =>
                    setOptions({ ...options, allowMixed: e.target.checked })
                  }
                />
                혼복 허용 (미선택 시 ONLY 남복 & 여복)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={options.allowPartnerFixed}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      allowPartnerFixed: e.target.checked,
                    })
                  }
                />
                파트너 고정
              </label>
            </div>
          </div>

          <PlayerInput
            players={malePlayers}
            gender="M"
            onPlayersChange={setMalePlayers}
          />
          {malePlayers.length > 0 && (
            <div className="player-count-info">
              남자 참가자: {malePlayers.length}명
            </div>
          )}

          <PlayerInput
            players={femalePlayers}
            gender="F"
            onPlayersChange={setFemalePlayers}
          />
          {femalePlayers.length > 0 && (
            <div className="player-count-info">
              여자 참가자: {femalePlayers.length}명
            </div>
          )}

          {options.allowPartnerFixed && (
            <FixedPartners
              allPlayers={allPlayers}
              fixedPartners={fixedPartners}
              onFixedPartnersChange={setFixedPartners}
            />
          )}

          <div className="button-group">
            <button className="reset-button" onClick={handleReset}>
              리셋
            </button>
            <button className="generate-button" onClick={handleGenerate}>
              매칭 생성
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        {result && (
          <div
            className={`result-section ${isResetting ? "fade-out" : "fade-in"}`}
          >
            <MatchingResult result={result} players={allPlayers} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
