import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

let cachedKey: string | null = null;

export async function getClaudeApiKey(): Promise<string> {
  if (cachedKey) return cachedKey;

  // Always fetch from AWS Secrets Manager — works on Lambda (IAM role) and
  // local dev (aws configure with lakshmanan-poz credentials).
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "/poz-social-media-agent/claude-api-key" })
  );

  const secret = JSON.parse(response.SecretString!);
  cachedKey = secret.api_key;
  return cachedKey!;
}
