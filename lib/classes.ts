import "server-only";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { QueryCommandInput, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";

export type Course = {
  school: string;
  courseCode: string;
  title: string;
  credits: number;
  description: string;
  sourceUrl: string;
};

const client = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  maxAttempts: 2,
  requestHandler: { connectionTimeout: 3000, requestTimeout: 5000 },
}));

export async function getClasses(): Promise<Course[]> {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error("DYNAMODB_TABLE_NAME is not set.");
  }

  const classes: Course[] = [];
  let lastKey: QueryCommandInput["ExclusiveStartKey"];

  do {
    const result: QueryCommandOutput = await client.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "school = :school",
      ExpressionAttributeValues: { ":school": "Baruch College" },
      ExclusiveStartKey: lastKey,
    }));

    classes.push(...(result.Items || []) as Course[]);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return classes;
}
