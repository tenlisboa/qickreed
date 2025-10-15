import { startAssessment } from "../actions";

export async function POST() {
  await startAssessment();
}
