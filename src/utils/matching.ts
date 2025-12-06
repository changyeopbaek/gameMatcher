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
  fixedPartners: Array<{
    player1Id: string;
    player2Id: string;
    type: TeamType;
  }>,
  totalGames: number // 전체 경기 수를 받아서 혼복 팀 생성 수 결정
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
  // 혼복 팀 생성 제한: 전체 경기 수의 20%가 혼복 경기가 되도록
  const targetXDGames = Math.floor(totalGames * 0.2); // 혼복 경기 목표 수 (20%)
  const maxXDTeamsToGenerate = Math.max(targetXDGames * 3, 2); // 각 경기당 2팀 필요, 여유분 고려

  // XD(혼복) 고정 파트너만 제외 - MD/WD 고정 파트너는 혼복에 참여 가능
  const xdFixedPlayers = new Set<string>();
  for (const pair of fixedPartners) {
    if (pair.type === "XD") {
      xdFixedPlayers.add(pair.player1Id);
      xdFixedPlayers.add(pair.player2Id);
    }
  }

  // XD 고정 파트너가 아닌 선수들만 필터링 (MD/WD 고정 파트너도 혼복 가능)
  const availableMales = malePlayers.filter((p) => !xdFixedPlayers.has(p.id));
  const availableFemales = femalePlayers.filter(
    (p) => !xdFixedPlayers.has(p.id)
  );
  const maxPossibleXDTeams = availableMales.length * availableFemales.length;

  console.log("혼복 팀 생성 시작:", {
    maleCount: availableMales.length,
    femaleCount: availableFemales.length,
    totalGames,
    targetXDGames,
    maxPossible: maxPossibleXDTeams,
    willGenerate: Math.min(maxXDTeamsToGenerate, maxPossibleXDTeams),
    usedPlayers: Array.from(usedPlayers),
  });

  // 혼복 팀을 생성하되, 모든 선수가 골고루 참여하도록 라운드 로빈 방식 사용
  const actualMaxXDTeams = Math.min(maxXDTeamsToGenerate, maxPossibleXDTeams);
  const xdTeams: Team[] = [];

  // 각 선수의 혼복 팀 참여 횟수 추적
  const maleXDCount = new Map<string, number>();
  const femaleXDCount = new Map<string, number>();
  availableMales.forEach((p) => maleXDCount.set(p.id, 0));
  availableFemales.forEach((p) => femaleXDCount.set(p.id, 0));

  // 이미 생성된 팀 조합 추적 (중복 방지)
  const createdPairs = new Set<string>();

  // 고정 파트너 조합도 createdPairs에 추가
  for (const pair of fixedPartners) {
    if (pair.type === "XD") {
      createdPairs.add(`${pair.player1Id}-${pair.player2Id}`);
      createdPairs.add(`${pair.player2Id}-${pair.player1Id}`);
    }
  }

  // 라운드 로빈 방식으로 혼복 팀 생성 (참여 횟수 적은 선수 우선)
  while (xdTeams.length < actualMaxXDTeams) {
    // 참여 횟수가 가장 적은 남자 선수 찾기
    const sortedMales = [...availableMales].sort(
      (a, b) => (maleXDCount.get(a.id) || 0) - (maleXDCount.get(b.id) || 0)
    );

    let teamCreated = false;

    for (const male of sortedMales) {
      if (teamCreated) break;

      // 참여 횟수가 가장 적은 여자 선수 찾기
      const sortedFemales = [...availableFemales].sort(
        (a, b) =>
          (femaleXDCount.get(a.id) || 0) - (femaleXDCount.get(b.id) || 0)
      );

      for (const female of sortedFemales) {
        const pairKey = `${male.id}-${female.id}`;

        // 이미 생성된 조합이면 스킵
        if (createdPairs.has(pairKey)) continue;

        // 혼복 팀 생성
        const xdTeam = {
          id: generateTeamId(male.id, female.id),
          player1Id: male.id,
          player2Id: female.id,
          type: "XD" as TeamType,
        };
        xdTeams.push(xdTeam);
        createdPairs.add(pairKey);
        maleXDCount.set(male.id, (maleXDCount.get(male.id) || 0) + 1);
        femaleXDCount.set(female.id, (femaleXDCount.get(female.id) || 0) + 1);

        console.log(
          `혼복 팀 생성 (${xdTeams.length}/${actualMaxXDTeams}): ${male.id} - ${
            female.id
          } (남:${maleXDCount.get(male.id)}, 여:${femaleXDCount.get(
            female.id
          )})`
        );
        teamCreated = true;
        break;
      }
    }

    // 더 이상 생성할 수 있는 팀이 없으면 종료
    if (!teamCreated) {
      console.log("더 이상 생성할 수 있는 혼복 팀이 없습니다.");
      break;
    }
  }

  // 생성된 혼복 팀을 teams에 추가
  teams.push(...xdTeams);

  console.log("혼복 팀 생성 완료:", {
    generated: xdTeams.length,
    target: actualMaxXDTeams,
    targetGames: targetXDGames,
    maleParticipation: Object.fromEntries(maleXDCount),
    femaleParticipation: Object.fromEntries(femaleXDCount),
  });

  return teams;
}

// 팀 생성 메인 함수
export function generateTeams(
  input: MatchingInput,
  totalGames: number
): Team[] {
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
      fixedPartners,
      totalGames
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
  totalGames: number,
  targetXDGames: number = 0 // 혼복 경기 목표 수
): MatchingResult {
  const totalRounds = Math.ceil(totalGames / courts);
  const matches: MatchDetail[] = [];
  const playerGameCount: Record<string, number> = {};
  const teamUsageCount: Record<string, number> = {};
  const matchHistory: Set<string> = new Set(); // 같은 매치 반복 방지
  let xdGamesCreated = 0; // 생성된 혼복 경기 수 추적
  const xdParticipants = new Set<string>(); // 혼복에 참여한 선수 추적

  // 디버깅: schedule 단계에서 XD 팀 확인
  const xdTeams = teams.filter((t) => t.type === "XD");
  console.log("=== 매칭 스케줄링 디버깅 ===");
  console.log("전체 팀 수:", teams.length);
  console.log("XD 팀 수:", xdTeams.length);
  console.log("XD 경기 목표:", targetXDGames);
  console.log(
    "XD 팀 목록:",
    xdTeams.map((t) => t.id)
  );

  // 모든 선수 목록 (혼복 참여 체크용)
  const allPlayerIds = new Set(players.map((p) => p.id));
  const totalPlayerCount = allPlayerIds.size;

  // 혼복 분산 배치를 위한 위치 계산
  // 예: 20경기, 4혼복 → 간격 5 → 경기 2, 7, 12, 17에 배치 (0-indexed: 2, 7, 12, 17)
  const xdSlots = new Set<number>();
  if (targetXDGames > 0) {
    const interval = Math.floor(totalGames / targetXDGames);
    const offset = Math.floor(interval / 2); // 중간부터 시작
    for (let i = 0; i < targetXDGames; i++) {
      const slot = offset + i * interval;
      if (slot < totalGames) {
        xdSlots.add(slot);
      }
    }
    console.log(
      "혼복 배치 위치:",
      Array.from(xdSlots)
        .map((s) => s + 1)
        .join(", ") + " 경기"
    );
  }

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
      // 현재 최소 게임 수 계산 (게임 수 차이 1 이내 유지용)
      const gameCounts = Object.values(playerGameCount);
      const minGames = gameCounts.length > 0 ? Math.min(...gameCounts) : 0;

      // 현재 남은 경기 수와 XD 부족분 계산 (각 코트마다 재계산)
      const remainingGames = totalGames - matches.length;
      const xdDeficit = targetXDGames - xdGamesCreated;

      // 후보 팀 목록: 출전 횟수가 적은 순으로 정렬
      let candidateTeams = teams.filter((team) => {
        // 이미 이 라운드에서 사용된 선수는 제외
        if (
          usedInRound.has(team.player1Id) ||
          usedInRound.has(team.player2Id)
        ) {
          return false;
        }

        const p1Count = playerGameCount[team.player1Id] || 0;
        const p2Count = playerGameCount[team.player2Id] || 0;

        // 게임 수 균등성 체크: 최소 게임 수 + 1보다 많은 게임 수를 가진 선수는 제외
        // 이렇게 하면 최대-최소 차이가 항상 1 이내로 유지됨
        const maxAllowed = minGames + 1;
        if (p1Count > maxAllowed || p2Count > maxAllowed) {
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

      // 각 코트마다 재정렬 (남은 경기와 XD 부족분을 반영)
      candidateTeams = candidateTeams.sort((a, b) => {
        // 게임 수가 최우선이지만, 게임 수가 같을 때는 혼복 목표와 점수 분산을 고려
        const avgA =
          ((playerGameCount[a.player1Id] || 0) +
            (playerGameCount[a.player2Id] || 0)) /
          2;
        const avgB =
          ((playerGameCount[b.player1Id] || 0) +
            (playerGameCount[b.player2Id] || 0)) /
          2;

        // 1순위: 게임 수 (가장 적은 팀 우선)
        if (avgA !== avgB) {
          return avgA - avgB;
        }

        // 2순위: 혼복 경기 목표 고려 (게임 수가 같을 때)
        if (targetXDGames > 0) {
          // 혼복 경기가 부족하면 XD 팀 우선 (하지만 너무 강하지 않게)
          if (xdDeficit > 0) {
            // 남은 경기가 충분하고 XD 부족분이 클 때만 XD 우선
            // 라운드 첫 코트이거나 남은 코트가 여러 개일 때는 신중하게
            const courtsLeftInRound = courts - (court % courts);
            const shouldPrioritizeXD =
              xdDeficit >= Math.max(remainingGames * 0.25, 2) &&
              (courtsLeftInRound === courts || remainingGames > courts * 2);

            if (shouldPrioritizeXD) {
              if (a.type === "XD" && b.type !== "XD") return -1;
              if (a.type !== "XD" && b.type === "XD") return 1;
            }
          }
          // 혼복 경기가 충분하면 MD/WD 팀 우선
          else if (xdDeficit <= 0) {
            if (a.type === "XD" && b.type !== "XD") return 1;
            if (a.type !== "XD" && b.type === "XD") return -1;
          }
        }

        // 3순위: 팀 타입 (안정성을 위해)
        return a.type.localeCompare(b.type);
      });

      if (candidateTeams.length === 0) {
        console.log(
          `라운드 ${round + 1}, 코트 ${court + 1}: 후보 팀이 없어서 break`
        );
        break;
      }

      const courtsLeftInRound = courts - court;

      // ============================================
      // 새로운 접근: 모든 가능한 매치 조합을 평가하여 최적의 매치 선택
      // 점수 밸런스를 우선적으로 고려하면서 게임 수 균등도 유지
      // ============================================
      interface MatchCandidate {
        teamA: Team;
        teamB: Team;
        avgGameCount: number; // 두 팀의 평균 게임 수
        gameCountDiff: number; // 두 팀 간 게임 수 차이
        scoreDiff: number; // 급수 점수 차이
        canFillNextCourt: boolean; // 이 매치 후 다음 코트 채울 수 있는지
        xdNewParticipants: number; // 혼복 미참여자 수 (혼복 경기일 때만 유효)
        isXD: boolean; // 혼복 경기인지
      }

      const allPossibleMatches: MatchCandidate[] = [];

      // 현재 경기 인덱스 (0부터 시작)
      const currentGameIndex = matches.length + roundMatches.length;

      // 혼복 목표 달성 여부 및 현재 위치가 혼복 슬롯인지 확인
      const xdGoalReached = xdGamesCreated >= targetXDGames;
      const isXDSlot = xdSlots.has(currentGameIndex);

      // 남은 경기와 혼복 부족분 계산 (혼복 슬롯 실패 시 폴백용)
      const gamesLeft = totalGames - currentGameIndex;
      const xdShortage = targetXDGames - xdGamesCreated;
      // 혼복 슬롯이거나, 남은 경기가 혼복 부족분 이하면 혼복 허용
      const shouldAllowXD =
        isXDSlot || (!xdGoalReached && gamesLeft <= xdShortage);

      // 디버깅: 현재 상태 로그
      const xdCandidateCount = candidateTeams.filter(
        (t) => t.type === "XD"
      ).length;
      if (shouldAllowXD) {
        const reason = isXDSlot ? "혼복슬롯" : "폴백(부족분채우기)";
        console.log(
          `경기 ${
            currentGameIndex + 1
          }: 🎯${reason}!, 혼복후보팀=${xdCandidateCount}, 혼복생성=${xdGamesCreated}/${targetXDGames}`
        );
      }

      // 모든 가능한 매치 조합 생성
      for (let i = 0; i < candidateTeams.length; i++) {
        const candidate = candidateTeams[i];
        for (let j = i + 1; j < candidateTeams.length; j++) {
          const opponent = candidateTeams[j];

          // 같은 타입만 매칭 가능
          if (candidate.type !== opponent.type) continue;

          // 혼복 배치 로직:
          // - 혼복 슬롯이면 혼복 우선
          // - 남은 경기가 혼복 부족분 이하면 혼복 허용 (폴백)
          // - 혼복 목표 달성 후에는 항상 혼복 제외
          if (candidate.type === "XD") {
            if (xdGoalReached) continue; // 목표 달성 후 혼복 제외
            if (!shouldAllowXD) continue; // 혼복 허용 조건 아니면 제외
          }
          // 비혼복은 항상 후보에 포함 (혼복 슬롯에서도 폴백으로 사용 가능)

          // 선수 겹침 체크
          if (
            candidate.player1Id === opponent.player1Id ||
            candidate.player1Id === opponent.player2Id ||
            candidate.player2Id === opponent.player1Id ||
            candidate.player2Id === opponent.player2Id
          )
            continue;

          // 게임 수 계산
          const teamAGameCount =
            ((playerGameCount[candidate.player1Id] || 0) +
              (playerGameCount[candidate.player2Id] || 0)) /
            2;
          const teamBGameCount =
            ((playerGameCount[opponent.player1Id] || 0) +
              (playerGameCount[opponent.player2Id] || 0)) /
            2;
          const avgGameCount = (teamAGameCount + teamBGameCount) / 2;
          const gameCountDiff = Math.abs(teamAGameCount - teamBGameCount);

          // 점수 차이 계산
          const scoreDiff = getMatchScoreDifference(
            candidate,
            opponent,
            players
          );

          // 다음 코트 채울 수 있는지 확인
          let canFillNextCourt = true;
          if (courtsLeftInRound > 1) {
            const usedPlayers = new Set([
              candidate.player1Id,
              candidate.player2Id,
              opponent.player1Id,
              opponent.player2Id,
            ]);

            const remainingTeams = candidateTeams.filter(
              (team) =>
                !usedPlayers.has(team.player1Id) &&
                !usedPlayers.has(team.player2Id)
            );

            canFillNextCourt = false;
            for (const remainingTeam of remainingTeams) {
              const remainingOpponents = remainingTeams.filter(
                (team) =>
                  team.type === remainingTeam.type &&
                  team.id !== remainingTeam.id &&
                  team.player1Id !== remainingTeam.player1Id &&
                  team.player1Id !== remainingTeam.player2Id &&
                  team.player2Id !== remainingTeam.player1Id &&
                  team.player2Id !== remainingTeam.player2Id
              );
              if (remainingOpponents.length > 0) {
                canFillNextCourt = true;
                break;
              }
            }
          }

          // 같은 매치 반복 체크
          const matchKey = [candidate.id, opponent.id].sort().join(" vs ");
          const matchCount = Array.from(matchHistory).filter(
            (m) => m === matchKey
          ).length;
          if (matchCount >= 2) continue; // 이미 2번 매칭된 조합은 제외

          // 혼복 미참여자 수 계산 (혼복 경기일 때)
          const isXD = candidate.type === "XD";
          let xdNewParticipants = 0;
          if (isXD) {
            const matchPlayers = [
              candidate.player1Id,
              candidate.player2Id,
              opponent.player1Id,
              opponent.player2Id,
            ];
            xdNewParticipants = matchPlayers.filter(
              (pid) => !xdParticipants.has(pid)
            ).length;
          }

          allPossibleMatches.push({
            teamA: candidate,
            teamB: opponent,
            avgGameCount,
            gameCountDiff,
            scoreDiff,
            canFillNextCourt,
            xdNewParticipants,
            isXD,
          });
        }
      }

      // 디버깅: 혼복 허용 시 혼복 매치 수 확인
      if (shouldAllowXD) {
        const xdMatchCount = allPossibleMatches.filter((m) => m.isXD).length;
        console.log(
          `  → 혼복 매치 후보: ${xdMatchCount}개, 전체 매치 후보: ${allPossibleMatches.length}개`
        );
      }

      // 매치 정렬:
      // 1순위: 다음 코트 채울 수 있는지 (채울 수 있는 것 우선)
      // 2순위: 혼복 슬롯이면 혼복 최우선 선택!
      // 3순위: 평균 게임 수 (적은 순)
      // 4순위: 혼복끼리 비교 시 미참여자가 많은 매치 우선 (다양한 참여 유도)
      // 5순위: 점수 차이 (작은 순) - 점수 밸런스!
      // 6순위: 게임 수 차이 (작은 순)
      allPossibleMatches.sort((a, b) => {
        // 1순위: 다음 코트 채울 수 있는 매치 우선
        if (a.canFillNextCourt !== b.canFillNextCourt) {
          return a.canFillNextCourt ? -1 : 1;
        }

        // 2순위: 혼복 허용 조건이면 혼복 최우선!
        if (shouldAllowXD && !xdGoalReached && a.isXD !== b.isXD) {
          return a.isXD ? -1 : 1;
        }

        // 3순위: 평균 게임 수 (게임 수가 적은 팀들의 매치 우선)
        if (a.avgGameCount !== b.avgGameCount) {
          return a.avgGameCount - b.avgGameCount;
        }

        // 4순위: 혼복끼리 비교 시 미참여자가 많은 매치 우선 (다양한 참여 유도)
        if (a.isXD && b.isXD) {
          if (a.xdNewParticipants !== b.xdNewParticipants) {
            return b.xdNewParticipants - a.xdNewParticipants; // 미참여자 많은 것 우선
          }
        }

        // 5순위: 점수 차이 (급수 밸런스 - 작을수록 좋음)
        if (a.scoreDiff !== b.scoreDiff) {
          return a.scoreDiff - b.scoreDiff;
        }

        // 6순위: 게임 수 차이
        return a.gameCountDiff - b.gameCountDiff;
      });

      let teamA: Team | undefined;
      let teamB: Team | undefined;

      if (allPossibleMatches.length > 0) {
        const bestMatch = allPossibleMatches[0];
        teamA = bestMatch.teamA;
        teamB = bestMatch.teamB;
        console.log(
          `라운드 ${round + 1}, 코트 ${court + 1}: 최적 매치 선택 - ${
            teamA.type
          } (점수차: ${bestMatch.scoreDiff}, 게임수차: ${
            bestMatch.gameCountDiff
          })`
        );
      }

      if (!teamA || !teamB) {
        console.warn(
          `라운드 ${round + 1}, 코트 ${
            court + 1
          }: 가능한 매치를 찾지 못함 (후보 매치 수: ${
            allPossibleMatches.length
          })`
        );
        continue;
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

      // 혼복 경기 카운트 및 참여자 추적
      if (teamA.type === "XD") {
        xdGamesCreated++;
        // 혼복 참여자 추적
        xdParticipants.add(teamA.player1Id);
        xdParticipants.add(teamA.player2Id);
        xdParticipants.add(teamB.player1Id);
        xdParticipants.add(teamB.player2Id);
        console.log(
          `혼복 경기 생성 (${xdGamesCreated}/${targetXDGames}): 참여자 ${xdParticipants.size}/${totalPlayerCount}명`
        );
      }

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

  console.log("=== 매칭 스케줄링 완료 ===");
  console.log("생성된 XD 경기:", xdGamesCreated);
  console.log("목표 XD 경기:", targetXDGames);
  console.log("전체 경기:", matches.length);

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
    혼복목표: input.options.allowMixed
      ? `${Math.floor(totalGames * 0.2)}경기 (20%)`
      : "N/A",
  });

  // 팀 생성 (총 경기 수를 전달하여 혼복 팀 생성 수 결정)
  const teams = generateTeams(input, totalGames);
  const targetXDGames = input.options.allowMixed
    ? Math.floor(totalGames * 0.2)
    : 0;

  console.log("생성된 팀 정보:", {
    전체팀수: teams.length,
    남복: teams.filter((t) => t.type === "MD").length,
    여복: teams.filter((t) => t.type === "WD").length,
    혼복: teams.filter((t) => t.type === "XD").length,
  });

  // 매칭 스케줄링 (혼복 경기 목표 수 전달)
  const result = scheduleMatches(
    teams,
    allPlayers,
    courts,
    totalGames,
    targetXDGames
  );

  console.log("매칭 결과:", {
    생성된경기수: result.matches.length,
    요청한경기수: totalGames,
  });

  return result;
}
