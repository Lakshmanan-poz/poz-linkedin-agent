import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const cache: Record<string, string> = {};

async function getSecret(secretId: string): Promise<string> {
  if (cache[secretId]) return cache[secretId];
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  cache[secretId] = JSON.parse(response.SecretString!).api_key;
  return cache[secretId];
}

export async function getClaudeApiKey(): Promise<string> {
  return getSecret("/poz-social-media-agent/claude-api-key");
}

export async function getOpenAIApiKey(): Promise<string> {
  return getSecret("/poz-social-media-agent/openai-api-key");
}
