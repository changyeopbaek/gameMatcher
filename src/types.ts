export type Gender = "M" | "F";
export type TeamType = "MD" | "WD" | "XD"; // Men's Doubles, Women's Doubles, Mixed Doubles
export type Grade = "초심" | "D조" | "C조" | "B조" | "A조";

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  grade: Grade; // 필수로 변경
  preferPartnerId?: string;
}

export interface Team {
  id: string;
  player1Id: string;
  player2Id: string;
  type: TeamType;
}

export interface Match {
  roundIndex: number;
  courtIndex: number;
  teamAId: string;
  teamBId: string;
}

export interface MatchDetail extends Match {
  teamA: Team;
  teamB: Team;
  players: Player[];
}

export interface MatchingOptions {
  allowMixed: boolean; // 혼복 허용 여부
  allowPartnerFixed: boolean; // 파트너 고정 허용 여부
}

export interface MatchingInput {
  malePlayers: Player[];
  femalePlayers: Player[];
  courts: number;
  hours: number;
  gamesPerHour: number;
  options: MatchingOptions;
  fixedPartners?: Array<{
    player1Id: string;
    player2Id: string;
    type: TeamType;
  }>;
}

export interface MatchingResult {
  matches: MatchDetail[];
  playerGameCounts: Record<string, number>;
  totalGames: number;
  totalRounds: number;
}
