import {
  Player,
  Team,
  MatchDetail,
  MatchingInput,
  MatchingResult,
  TeamType,
} from "../types";
import { getGradeScore } from "./grade";

// 팀 ID 생성
function generateTeamId(player1Id: string, player2Id: string): string {
  return [player1Id, player2Id].sort().join("-");
}

// 팀 점수 계산 (두 선수의 급수 점수 합계)
function getTeamScore(team: Team, players: Player[]): number {
  const player1 = players.find((p) => p.id === team.player1Id);
  const player2 = players.find((p) => p.id === team.player2Id);

  if (!player1 || !player2) return 0;

  return getGradeScore(player1.grade) + getGradeScore(player2.grade);
}

// 매치 점수 차이 계산
function getMatchScoreDifference(
  teamA: Team,
  teamB: Team,
  players: Player[]
): number {
  const scoreA = getTeamScore(teamA, players);
  const scoreB = getTeamScore(teamB, players);
  return Math.abs(scoreA - scoreB);
}

// 팀 생성: 남복 & 여복만
function generateSameGenderTeams(
  players: Player[],
  type: TeamType,
  fixedPartners: Array<{ player1Id: string; player2Id: string; type: TeamType }>
): Team[] {
  const teams: Team[] = [];
  const usedPlayers = new Set<string>();
  const fixedPairs = fixedPartners.filter((p) => p.type === type);

  // 고정 파트너 팀 먼저 생성
  for (const pair of fixedPairs) {
    if (
      players.find((p) => p.id === pair.player1Id) &&
      players.find((p) => p.id === pair.player2Id)
    ) {
      teams.push({
        id: generateTeamId(pair.player1Id, pair.player2Id),
        player1Id: pair.player1Id,
        player2Id: pair.player2Id,
        type: type,
      });
      usedPlayers.add(pair.player1Id);
      usedPlayers.add(pair.player2Id);
    }
  }

  // 남은 선수들로 팀 생성
  const availablePlayers = players.filter((p) => !usedPlayers.has(p.id));
  for (let i = 0; i < availablePlayers.length; i++) {
    for (let j = i + 1; j < availablePlayers.length; j++) {
      teams.push({
        id: generateTeamId(availablePlayers[i].id, availablePlayers[j].id),
        player1Id: availablePlayers[i].id,
        player2Id: availablePlayers[j].id,
        type: type,
      });
    }
  }

  return teams;
}

// 팀 생성: 혼복 포함
function generateAllTeams(
  malePlayers: Player[],
  femalePlayers: Player[],
  fixedPartners: Array<{ player1Id: string; player2Id: string; type: TeamType }>
): Team[] {
  const teams: Team[] = [];
  const usedPlayers = new Set<string>();
  const maxTeamsPerPlayer = 10; // 한 선수가 참여할 수 있는 최대 팀 수

  // 고정 파트너 팀 먼저 생성
  for (const pair of fixedPartners) {
    const player1 = [...malePlayers, ...femalePlayers].find(
      (p) => p.id === pair.player1Id
    );
    const player2 = [...malePlayers, ...femalePlayers].find(
      (p) => p.id === pair.player2Id
    );

    if (player1 && player2) {
      teams.push({
        id: generateTeamId(pair.player1Id, pair.player2Id),
        player1Id: pair.player1Id,
        player2Id: pair.player2Id,
        type: pair.type,
      });
      usedPlayers.add(pair.player1Id);
      usedPlayers.add(pair.player2Id);
    }
  }

  const playerTeamCount = new Map<string, number>();

  // 남복 팀
  for (let i = 0; i < malePlayers.length; i++) {
    if (usedPlayers.has(malePlayers[i].id)) continue;
    for (let j = i + 1; j < malePlayers.length; j++) {
      if (usedPlayers.has(malePlayers[j].id)) continue;
      const count1 = playerTeamCount.get(malePlayers[i].id) || 0;
      const count2 = playerTeamCount.get(malePlayers[j].id) || 0;
      if (count1 < maxTeamsPerPlayer && count2 < maxTeamsPerPlayer) {
        teams.push({
          id: generateTeamId(malePlayers[i].id, malePlayers[j].id),
          player1Id: malePlayers[i].id,
          player2Id: malePlayers[j].id,
          type: "MD",
        });
        playerTeamCount.set(malePlayers[i].id, count1 + 1);
        playerTeamCount.set(malePlayers[j].id, count2 + 1);
      }
    }
  }

  // 여복 팀
  for (let i = 0; i < femalePlayers.length; i++) {
    if (usedPlayers.has(femalePlayers[i].id)) continue;
    for (let j = i + 1; j < femalePlayers.length; j++) {
      if (usedPlayers.has(femalePlayers[j].id)) continue;
      const count1 = playerTeamCount.get(femalePlayers[i].id) || 0;
      const count2 = playerTeamCount.get(femalePlayers[j].id) || 0;
      if (count1 < maxTeamsPerPlayer && count2 < maxTeamsPerPlayer) {
        teams.push({
          id: generateTeamId(femalePlayers[i].id, femalePlayers[j].id),
          player1Id: femalePlayers[i].id,
          player2Id: femalePlayers[j].id,
          type: "WD",
        });
        playerTeamCount.set(femalePlayers[i].id, count1 + 1);
        playerTeamCount.set(femalePlayers[j].id, count2 + 1);
      }
    }
  }

  // 혼복 팀
  // 혼복 팀은 별도의 카운터를 사용하여 남복/여복 팀 생성과 독립적으로 관리
  const xdTeamCount = new Map<string, number>();
  const maxXdTeamsPerPlayer = 100; // 혼복 팀은 충분히 많이 생성 가능

  console.log("혼복 팀 생성 시작:", {
    maleCount: malePlayers.length,
    femaleCount: femalePlayers.length,
    usedPlayers: Array.from(usedPlayers),
  });

  for (const male of malePlayers) {
    // 고정 파트너로 완전히 고정된 경우만 제외 (혼복 고정 파트너가 아닌 경우)
    // 하지만 혼복 팀 생성 시에는 usedPlayers 체크를 하지 않음 (다양한 조합을 위해)
    const xdCount1 = xdTeamCount.get(male.id) || 0;
    if (xdCount1 >= maxXdTeamsPerPlayer) {
      console.log(`남자 ${male.id}는 혼복 팀 수 제한에 걸림: ${xdCount1}`);
      continue;
    }

    for (const female of femalePlayers) {
      // 고정 파트너로 완전히 고정된 경우만 제외 (혼복 고정 파트너가 아닌 경우)
      const xdCount2 = xdTeamCount.get(female.id) || 0;
      if (xdCount2 >= maxXdTeamsPerPlayer) {
        continue;
      }

      // 고정 파트너로 이미 같은 조합이 있으면 스킵 (중복 방지)
      const isFixedPair = fixedPartners.some(
        (p) =>
          ((p.player1Id === male.id && p.player2Id === female.id) ||
            (p.player1Id === female.id && p.player2Id === male.id)) &&
          p.type === "XD"
      );
      if (isFixedPair) {
        console.log(`고정 파트너로 이미 존재: ${male.id} - ${female.id}`);
        continue;
      }

      // 혼복 팀 생성
      const xdTeam = {
        id: generateTeamId(male.id, female.id),
        player1Id: male.id,
        player2Id: female.id,
        type: "XD" as TeamType,
      };
      teams.push(xdTeam);
      xdTeamCount.set(male.id, xdCount1 + 1);
      xdTeamCount.set(female.id, xdCount2 + 1);
      console.log(`혼복 팀 생성: ${male.id} - ${female.id}`);
    }
  }

  console.log("혼복 팀 생성 완료:", {
    xdTeamCount: teams.filter((t) => t.type === "XD").length,
  });

  return teams;
}

// 팀 생성 메인 함수
export function generateTeams(input: MatchingInput): Team[] {
  const { malePlayers, femalePlayers, options, fixedPartners = [] } = input;

  // 디버깅: 5가지 체크 포인트
  console.log("=== 팀 생성 디버깅 ===");
  console.log("1. TeamType에 XD가 있는지:", ("XD" as TeamType) === "XD");
  console.log("2. options.allowMixed:", options.allowMixed);
  console.log("3. malePlayers.length:", malePlayers.length);
  console.log("4. femalePlayers.length:", femalePlayers.length);
  console.log("5. fixedPartners:", fixedPartners);

  if (!options.allowMixed) {
    // 남복 & 여복만
    const mdTeams = generateSameGenderTeams(malePlayers, "MD", fixedPartners);
    const wdTeams = generateSameGenderTeams(femalePlayers, "WD", fixedPartners);
    const allTeams = [...mdTeams, ...wdTeams];
    console.log("팀 생성 결과 (혼복 미허용):", {
      MD: mdTeams.length,
      WD: wdTeams.length,
      total: allTeams.length,
    });
    return allTeams;
  } else {
    // 남복 & 여복 & 혼복 모두
    const allTeams = generateAllTeams(
      malePlayers,
      femalePlayers,
      fixedPartners
    );
    const xdTeams = allTeams.filter((t) => t.type === "XD");
    console.log("팀 생성 결과 (혼복 허용):", {
      MD: allTeams.filter((t) => t.type === "MD").length,
      WD: allTeams.filter((t) => t.type === "WD").length,
      XD: xdTeams.length,
      total: allTeams.length,
    });
    if (xdTeams.length === 0) {
      console.warn("⚠️ 혼복 팀이 생성되지 않았습니다!");
    }
    return allTeams;
  }
}

// 매칭 스케줄링
export function scheduleMatches(
  teams: Team[],
  players: Player[],
  courts: number,
  totalGames: number
): MatchingResult {
  const totalRounds = Math.ceil(totalGames / courts);
  const matches: MatchDetail[] = [];
  const playerGameCount: Record<string, number> = {};
  const teamUsageCount: Record<string, number> = {};
  const matchHistory: Set<string> = new Set(); // 같은 매치 반복 방지

  // 디버깅: schedule 단계에서 XD 팀 확인
  const xdTeams = teams.filter((t) => t.type === "XD");
  console.log("=== 매칭 스케줄링 디버깅 ===");
  console.log("전체 팀 수:", teams.length);
  console.log("XD 팀 수:", xdTeams.length);
  console.log(
    "XD 팀 목록:",
    xdTeams.map((t) => t.id)
  );

  // 초기화
  players.forEach((p) => {
    playerGameCount[p.id] = 0;
  });
  teams.forEach((t) => {
    teamUsageCount[t.id] = 0;
  });

  // 라운드별 매칭
  for (let round = 0; round < totalRounds; round++) {
    const usedInRound = new Set<string>();
    const roundMatches: MatchDetail[] = [];

    // 각 코트에 게임 배정
    for (
      let court = 0;
      court < courts && round * courts + court < totalGames;
      court++
    ) {
      // 현재 최대 게임 수 계산
      const gameCounts = Object.values(playerGameCount);
      const maxGames = gameCounts.length > 0 ? Math.max(...gameCounts) : 0;

      // 후보 팀 목록: 출전 횟수가 적은 순으로 정렬
      let candidateTeams = teams.filter((team) => {
        // 이미 이 라운드에서 사용된 선수는 제외
        if (
          usedInRound.has(team.player1Id) ||
          usedInRound.has(team.player2Id)
        ) {
          return false;
        }

        // 게임 수 균등성 체크: 최대 게임 수보다 1게임 이상 많은 선수가 포함된 팀은 제외
        const p1Count = playerGameCount[team.player1Id] || 0;
        const p2Count = playerGameCount[team.player2Id] || 0;

        // 최대 게임 수와의 차이가 1을 넘지 않도록 제한
        if (maxGames > 0 && (p1Count > maxGames || p2Count > maxGames)) {
          return false;
        }

        return true;
      });

      // 디버깅: XD 팀 필터링 확인
      if (round === 0 && court === 0) {
        const xdCandidates = candidateTeams.filter((t) => t.type === "XD");
        console.log("후보 팀 중 XD 팀 수:", xdCandidates.length);
        if (xdCandidates.length === 0 && xdTeams.length > 0) {
          console.warn("⚠️ XD 팀이 후보에서 필터링되었습니다!");
        }
      }

      candidateTeams = candidateTeams.sort((a, b) => {
        // 게임 수가 최우선이지만, 게임 수가 같을 때는 점수 분산을 고려
        const avgA =
          ((playerGameCount[a.player1Id] || 0) +
            (playerGameCount[a.player2Id] || 0)) /
          2;
        const avgB =
          ((playerGameCount[b.player1Id] || 0) +
            (playerGameCount[b.player2Id] || 0)) /
          2;

        // 게임 수가 최우선
        return avgA - avgB;
      });

      if (candidateTeams.length === 0) {
        console.log(
          `라운드 ${round + 1}, 코트 ${court + 1}: 후보 팀이 없어서 break`
        );
        break;
      }

      // 첫 번째 팀 선택 (매칭 가능한 팀 중에서 선택)
      // 같은 타입의 상대 팀이 있는 팀만 선택
      let teamA: Team | undefined;
      for (const candidate of candidateTeams) {
        const potentialOpponents = candidateTeams.filter(
          (team) =>
            team.type === candidate.type &&
            team.id !== candidate.id &&
            team.player1Id !== candidate.player1Id &&
            team.player1Id !== candidate.player2Id &&
            team.player2Id !== candidate.player1Id &&
            team.player2Id !== candidate.player2Id
        );
        if (potentialOpponents.length > 0) {
          teamA = candidate;
          console.log(
            `라운드 ${round + 1}, 코트 ${court + 1}: teamA 선택 - ${
              teamA.type
            } (${teamA.id}), 가능한 상대: ${potentialOpponents.length}개`
          );
          break;
        }
      }

      if (!teamA) {
        console.warn(
          `라운드 ${round + 1}, 코트 ${
            court + 1
          }: 매칭 가능한 teamA를 찾지 못함`
        );
        continue;
      }

      let teamB: Team | undefined;
      let attempts = 0;
      const maxAttempts = Math.min(50, candidateTeams.length);

      // 두 번째 팀 선택 (같은 타입, 겹치지 않고, 게임 수 균등성이 최우선, 그 다음 점수 밸런스)
      const teamAGameCount =
        ((playerGameCount[teamA.player1Id] || 0) +
          (playerGameCount[teamA.player2Id] || 0)) /
        2;

      const compatibleTeams = candidateTeams
        .slice(attempts + 1)
        .filter((team) => {
          // 같은 타입의 팀끼리만 매칭 (MD vs MD, WD vs WD, XD vs XD)
          return (
            team.type === teamA!.type &&
            team.player1Id !== teamA!.player1Id &&
            team.player1Id !== teamA!.player2Id &&
            team.player2Id !== teamA!.player1Id &&
            team.player2Id !== teamA!.player2Id
          );
        });

      console.log(
        `라운드 ${round + 1}, 코트 ${court + 1}: compatibleTeams 수 - ${
          compatibleTeams.length
        }`
      );

      if (compatibleTeams.length === 0) {
        console.warn(
          `라운드 ${round + 1}, 코트 ${
            court + 1
          }: compatibleTeams가 없어서 경기 생성 불가`
        );
      }

      const sortedCompatibleTeams = compatibleTeams
        .map((team) => {
          const teamBGameCount =
            ((playerGameCount[team.player1Id] || 0) +
              (playerGameCount[team.player2Id] || 0)) /
            2;
          return {
            team,
            gameCountDiff: Math.abs(teamAGameCount - teamBGameCount), // 게임 수 차이
            scoreDiff: getMatchScoreDifference(teamA!, team, players), // 점수 차이
            avgGameCount: teamBGameCount,
          };
        })
        .sort((a, b) => {
          // 1순위: 게임 수 차이 (가장 작은 차이가 최우선)
          const gameDiffA = a.gameCountDiff;
          const gameDiffB = b.gameCountDiff;

          // 게임 수 차이가 0 또는 1 이내일 때는 점수 밸런스를 우선 고려
          // 게임 수가 비슷하면 등급 점수 차이를 더 중요하게 고려
          if (gameDiffA <= 1 && gameDiffB <= 1) {
            // 둘 다 게임 수 차이가 1 이내면 점수 차이를 우선 고려
            if (a.scoreDiff !== b.scoreDiff) {
              return a.scoreDiff - b.scoreDiff;
            }
            // 점수 차이도 같으면 게임 수 차이로 결정
            if (gameDiffA !== gameDiffB) {
              return gameDiffA - gameDiffB;
            }
          } else if (gameDiffA <= 1) {
            // A만 게임 수 차이가 1 이내면 A를 우선 (점수 밸런스를 고려할 수 있음)
            return -1;
          } else if (gameDiffB <= 1) {
            // B만 게임 수 차이가 1 이내면 B를 우선
            return 1;
          } else {
            // 둘 다 게임 수 차이가 1보다 크면 게임 수 차이를 우선
            if (gameDiffA !== gameDiffB) {
              return gameDiffA - gameDiffB;
            }
            // 게임 수 차이가 같으면 점수 차이로 결정
            if (a.scoreDiff !== b.scoreDiff) {
              return a.scoreDiff - b.scoreDiff;
            }
          }
          // 3순위: 출전 횟수가 적은 순
          return a.avgGameCount - b.avgGameCount;
        });

      while (
        attempts < maxAttempts &&
        !teamB &&
        sortedCompatibleTeams.length > 0
      ) {
        const candidateB = sortedCompatibleTeams[0]?.team;

        if (candidateB) {
          // 같은 매치 반복 체크 (최대 2회까지 허용)
          const matchKey = [teamA.id, candidateB.id].sort().join(" vs ");
          const matchCount = Array.from(matchHistory).filter(
            (m) => m === matchKey
          ).length;

          if (matchCount < 2) {
            teamB = candidateB;
            console.log(
              `라운드 ${round + 1}, 코트 ${court + 1}: teamB 선택 - ${
                candidateB.type
              } (${candidateB.id})`
            );
          } else {
            // 다음 후보 팀으로 시도
            sortedCompatibleTeams.shift();
            if (sortedCompatibleTeams.length === 0) {
              attempts++;
              if (attempts < candidateTeams.length - 1) {
                teamA = candidateTeams[attempts];
              }
            }
          }
        } else {
          attempts++;
          if (attempts < candidateTeams.length - 1) {
            teamA = candidateTeams[attempts];
          }
        }
      }

      if (!teamB) {
        console.warn(
          `라운드 ${round + 1}, 코트 ${court + 1}: teamB를 찾지 못해서 continue`
        );
        continue;
      }

      // 매치 생성
      const match: MatchDetail = {
        roundIndex: round + 1,
        courtIndex: court + 1,
        teamAId: teamA.id,
        teamBId: teamB.id,
        teamA,
        teamB,
        players: [
          players.find((p) => p.id === teamA.player1Id)!,
          players.find((p) => p.id === teamA.player2Id)!,
          players.find((p) => p.id === teamB.player1Id)!,
          players.find((p) => p.id === teamB.player2Id)!,
        ],
      };

      roundMatches.push(match);
      const matchKey = [teamA.id, teamB.id].sort().join(" vs ");
      matchHistory.add(matchKey);

      // 출전 횟수 업데이트
      [
        teamA.player1Id,
        teamA.player2Id,
        teamB.player1Id,
        teamB.player2Id,
      ].forEach((id) => {
        playerGameCount[id] = (playerGameCount[id] || 0) + 1;
        usedInRound.add(id);
      });

      teamUsageCount[teamA.id] = (teamUsageCount[teamA.id] || 0) + 1;
      teamUsageCount[teamB.id] = (teamUsageCount[teamB.id] || 0) + 1;
    }

    matches.push(...roundMatches);
  }

  return {
    matches,
    playerGameCounts: playerGameCount,
    totalGames: matches.length,
    totalRounds,
  };
}

// 전체 매칭 프로세스
export function generateMatching(input: MatchingInput): MatchingResult {
  const { malePlayers, femalePlayers, courts, hours, gamesPerHour } = input;

  const totalGames = courts * hours * gamesPerHour;
  const allPlayers = [...malePlayers, ...femalePlayers];

  console.log("=== 매칭 생성 시작 ===");
  console.log("입력 정보:", {
    남자수: malePlayers.length,
    여자수: femalePlayers.length,
    코트: courts,
    시간: hours,
    시간당게임: gamesPerHour,
    총게임: totalGames,
    혼복허용: input.options.allowMixed,
  });

  // 팀 생성
  const teams = generateTeams(input);

  console.log("생성된 팀 정보:", {
    전체팀수: teams.length,
    남복: teams.filter((t) => t.type === "MD").length,
    여복: teams.filter((t) => t.type === "WD").length,
    혼복: teams.filter((t) => t.type === "XD").length,
  });

  // 매칭 스케줄링
  const result = scheduleMatches(teams, allPlayers, courts, totalGames);

  console.log("매칭 결과:", {
    생성된경기수: result.matches.length,
    요청한경기수: totalGames,
  });

  return result;
}
