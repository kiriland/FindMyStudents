import "server-only";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1",
  maxAttempts: 2,
  requestHandler: { connectionTimeout: 3000, requestTimeout: 5000 },
});

export const db = DynamoDBDocumentClient.from(client);
