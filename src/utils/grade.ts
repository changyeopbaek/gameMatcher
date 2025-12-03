import { Grade } from "../types";

// 급수별 점수 매핑
export const GRADE_SCORES: Record<Grade, number> = {
  초심: 10,
  D조: 15,
  C조: 20,
  B조: 25,
  A조: 30,
};

// 급수 점수 가져오기
export function getGradeScore(grade: Grade): number {
  return GRADE_SCORES[grade];
}

// 모든 급수 목록
export const ALL_GRADES: Grade[] = ["초심", "D조", "C조", "B조", "A조"];

// 급수를 영어로 변환
export function getGradeLabel(grade: Grade): string {
  switch (grade) {
    case "초심":
      return "Beginner";
    case "D조":
      return "D";
    case "C조":
      return "C";
    case "B조":
      return "B";
    case "A조":
      return "A";
    default:
      return grade;
  }
}
