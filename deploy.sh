#!/usr/bin/env bash
# deploy.sh — Deploy POZ Social Media Agent backend to AWS Lambda
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="poz-social"
ECR_REPO="poz-social-agent"
ROLE_NAME="${STACK_NAME}-lambda-role"
WORKER_FN="${STACK_NAME}-api"

# Load .env if present
if [ -f .env ]; then
  set -o allexport; source .env; set +o allexport
fi

: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${NEXT_PUBLIC_SUPABASE_URL:?NEXT_PUBLIC_SUPABASE_URL must be set}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?NEXT_PUBLIC_SUPABASE_ANON_KEY must be set}"
: "${SUPABASE_SECRET_KEY:?SUPABASE_SECRET_KEY must be set}"
: "${JWT_SECRET:?JWT_SECRET must be set}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY must be set}"
: "${XAI_API_KEY:?XAI_API_KEY must be set}"
# ANTHROPIC_API_KEY is fetched at runtime from AWS Secrets Manager — not passed as env var

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}"

echo "======================================================"
echo "  POZ Social Agent — Lambda Deploy"
echo "  Account : ${ACCOUNT_ID}  |  Region: ${REGION}"
echo "======================================================"

# ── 1. ECR ────────────────────────────────────────────────────────────────────
echo "[1/7] ECR repository..."
aws ecr describe-repositories --repository-names "${ECR_REPO}" --region "${REGION}" \
  > /dev/null 2>&1 \
  || aws ecr create-repository --repository-name "${ECR_REPO}" --region "${REGION}" \
       --image-scanning-configuration scanOnPush=true > /dev/null

aws ecr get-login-password --region "${REGION}" \
  | docker login --username AWS --password-stdin \
      "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# ── 2. Docker build + push ────────────────────────────────────────────────────
echo "[2/7] Building and pushing container image..."
docker build --platform linux/amd64 -f Dockerfile.lambda -t "${ECR_URI}:latest" .
docker push "${ECR_URI}:latest"
IMAGE_DIGEST=$(aws ecr describe-images \
  --repository-name "${ECR_REPO}" --region "${REGION}" \
  --query 'sort_by(imageDetails,&imagePushedAt)[-1].imageDigest' --output text)
IMAGE_WITH_DIGEST="${ECR_URI}@${IMAGE_DIGEST}"
echo "  Image: ${IMAGE_WITH_DIGEST}"

# ── 3. IAM role ───────────────────────────────────────────────────────────────
echo "[3/7] IAM role..."
TRUST='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
aws iam create-role --role-name "${ROLE_NAME}" \
  --assume-role-policy-document "${TRUST}" > /dev/null 2>&1 || true

aws iam attach-role-policy --role-name "${ROLE_NAME}" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true

# Secrets Manager — read Claude key only
aws iam put-role-policy --role-name "${ROLE_NAME}" \
  --policy-name "ReadPOZClaudeKeyFromSecretsManager" \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Action\": [\"secretsmanager:GetSecretValue\", \"secretsmanager:DescribeSecret\"],
      \"Resource\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:/poz-social-media-agent/claude-api-key*\"
    }]
  }"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo "  Waiting 12s for IAM role to propagate..."
sleep 12

# ── 4. Lambda function ────────────────────────────────────────────────────────
echo "[4/7] Lambda function..."

APP_ENV="Variables={\
DATABASE_URL=${DATABASE_URL},\
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},\
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},\
SUPABASE_SECRET_KEY=${SUPABASE_SECRET_KEY},\
JWT_SECRET=${JWT_SECRET},\
OPENAI_API_KEY=${OPENAI_API_KEY},\
XAI_API_KEY=${XAI_API_KEY},\
NODE_ENV=production,\
PORT=3000\
}"

if aws lambda get-function --function-name "${WORKER_FN}" --region "${REGION}" > /dev/null 2>&1; then
  echo "  Updating Lambda..."
  aws lambda update-function-code \
    --function-name "${WORKER_FN}" --image-uri "${IMAGE_WITH_DIGEST}" \
    --region "${REGION}" > /dev/null
  aws lambda wait function-updated --function-name "${WORKER_FN}" --region "${REGION}"
  aws lambda update-function-configuration \
    --function-name "${WORKER_FN}" \
    --timeout 30 --memory-size 1024 \
    --environment "${APP_ENV}" \
    --region "${REGION}" > /dev/null
else
  echo "  Creating Lambda..."
  aws lambda create-function \
    --function-name "${WORKER_FN}" \
    --package-type Image \
    --code ImageUri="${IMAGE_WITH_DIGEST}" \
    --role "${ROLE_ARN}" \
    --timeout 30 --memory-size 1024 \
    --architectures x86_64 \
    --environment "${APP_ENV}" \
    --region "${REGION}" > /dev/null
fi
aws lambda wait function-active --function-name "${WORKER_FN}" --region "${REGION}"

# ── 5. API Gateway ────────────────────────────────────────────────────────────
echo "[5/7] API Gateway..."
API_ID=$(aws apigatewayv2 get-apis --region "${REGION}" \
  --query "Items[?Name=='${STACK_NAME}'].ApiId" --output text)

if [ -z "${API_ID}" ]; then
  API_ID=$(aws apigatewayv2 create-api \
    --name "${STACK_NAME}" \
    --protocol-type HTTP \
    --cors-configuration \
      AllowOrigins='["*"]',AllowMethods='["GET","POST","PUT","DELETE","OPTIONS"]',AllowHeaders='["*"]',MaxAge=600 \
    --region "${REGION}" \
    --query ApiId --output text)
  echo "  Created API Gateway: ${API_ID}"
fi

LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${WORKER_FN}"
INTEGRATION_URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id "${API_ID}" --region "${REGION}" \
  --query "Items[?IntegrationUri=='${INTEGRATION_URI}'].IntegrationId" --output text)

if [ -z "${INTEGRATION_ID}" ]; then
  INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id "${API_ID}" \
    --integration-type AWS_PROXY \
    --integration-uri "${INTEGRATION_URI}" \
    --payload-format-version 2.0 \
    --region "${REGION}" \
    --query IntegrationId --output text)
fi

ROUTE_EXISTS=$(aws apigatewayv2 get-routes --api-id "${API_ID}" --region "${REGION}" \
  --query "Items[?RouteKey=='\$default'].RouteId" --output text)
if [ -z "${ROUTE_EXISTS}" ]; then
  aws apigatewayv2 create-route \
    --api-id "${API_ID}" \
    --route-key '$default' \
    --target "integrations/${INTEGRATION_ID}" \
    --region "${REGION}" > /dev/null
fi

STAGE_EXISTS=$(aws apigatewayv2 get-stages --api-id "${API_ID}" --region "${REGION}" \
  --query "Items[?StageName=='\$default'].StageName" --output text)
if [ -z "${STAGE_EXISTS}" ]; then
  aws apigatewayv2 create-stage \
    --api-id "${API_ID}" \
    --stage-name '$default' \
    --auto-deploy \
    --region "${REGION}" > /dev/null
fi

aws lambda add-permission \
  --function-name "${WORKER_FN}" \
  --statement-id "apigateway-${API_ID}" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
  --region "${REGION}" > /dev/null 2>&1 || true

LAMBDA_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com"

# ── 6. Update Secrets Manager resource policy ─────────────────────────────────
echo "[6/7] Granting Lambda role access to Secrets Manager..."
aws secretsmanager put-resource-policy \
  --secret-id "/poz-social-media-agent/claude-api-key" \
  --resource-policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Sid\": \"AllowPOZRuntimeRole\",
        \"Effect\": \"Allow\",
        \"Principal\": {\"AWS\": \"arn:aws:iam::${ACCOUNT_ID}:role/Role-POZSocialMedia-AppRuntime\"},
        \"Action\": [\"secretsmanager:GetSecretValue\", \"secretsmanager:DescribeSecret\"],
        \"Resource\": \"*\"
      },
      {
        \"Sid\": \"AllowLambdaExecutionRole\",
        \"Effect\": \"Allow\",
        \"Principal\": {\"AWS\": \"arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}\"},
        \"Action\": [\"secretsmanager:GetSecretValue\", \"secretsmanager:DescribeSecret\"],
        \"Resource\": \"*\"
      },
      {
        \"Sid\": \"AllowAdminFullAccess\",
        \"Effect\": \"Allow\",
        \"Principal\": {\"AWS\": \"arn:aws:iam::${ACCOUNT_ID}:root\"},
        \"Action\": \"secretsmanager:*\",
        \"Resource\": \"*\"
      }
    ]
  }" \
  --region "${REGION}" > /dev/null && echo "  Secrets Manager policy updated"

# ── 7. Done ───────────────────────────────────────────────────────────────────
echo "[7/7] Deploy complete!"
echo ""
echo "======================================================"
echo "  POZ Social Agent — Backend Lambda URL"
echo "  ${LAMBDA_URL}"
echo ""
echo "  Add this to Vercel environment variables:"
echo "  NEXT_PUBLIC_API_URL=${LAMBDA_URL}"
echo ""
echo "  Then update next.config.ts rewrites to proxy"
echo "  /api/* → ${LAMBDA_URL}/api/*"
echo "======================================================"
