import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

let cachedKey: string | null = null;

export async function getClaudeApiKey(): Promise<string> {
  if (cachedKey) return cachedKey;

  // On Lambda: fetch from Secrets Manager using the attached IAM role
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
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

  // Local dev: read from .env
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set in .env");
  cachedKey = key;
  return key;
}
