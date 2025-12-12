import { CommitPayload, GeneratedCommitMessage } from "./commitTypes";

export async function generateCommitMessage(payload: CommitPayload): Promise<GeneratedCommitMessage> {
  // For now: mock generation
  // Later: replace with actual VSCode/AI system
  const message = `Updated ${payload.filesChanged} files: ${payload.summary}`;

  return {
    message,
    timestamp: Date.now()
  };
}
