import { readFile } from "node:fs/promises";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const tableName = process.env.DYNAMODB_TABLE_NAME;
if (!tableName) {
  throw new Error("Set DYNAMODB_TABLE_NAME in .env.local before running the seed.");
}

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const db = DynamoDBDocumentClient.from(client);
const classes = JSON.parse(await readFile(new URL("../data/classes.json", import.meta.url), "utf8"));

try {
  const { Table } = await client.send(new DescribeTableCommand({ TableName: tableName }));
  const keys = Table?.KeySchema;
  if (!keys?.some((key) => key.AttributeName === "school" && key.KeyType === "HASH") ||
      !keys.some((key) => key.AttributeName === "courseCode" && key.KeyType === "RANGE")) {
    throw new Error("The table must use school (String) as its partition key and courseCode (String) as its sort key.");
  }

  for (const course of classes) {
    try {
      await db.send(new PutCommand({
        TableName: tableName,
        Item: course,
        ConditionExpression: "attribute_not_exists(school) AND attribute_not_exists(courseCode)",
      }));
      console.log(`Added ${course.courseCode}`);
    } catch (error) {
      if (error.name !== "ConditionalCheckFailedException") throw error;
      console.log(`Skipped ${course.courseCode}: already exists`);
    }
  }
} catch (error) {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  client.destroy();
}
