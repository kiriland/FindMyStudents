import assert from "node:assert/strict";
import { afterEach, test, mock } from "node:test";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getClasses } from "../lib/classes.ts";

const originalTable = process.env.DYNAMODB_TABLE_NAME;

afterEach(() => {
  mock.restoreAll();
  if (originalTable === undefined) delete process.env.DYNAMODB_TABLE_NAME;
  else process.env.DYNAMODB_TABLE_NAME = originalTable;
});

test("loads every page and queries only Baruch courses", async () => {
  process.env.DYNAMODB_TABLE_NAME = "test-classes";
  const nextKey = { school: "Baruch College", courseCode: "CIS 3400" };
  const first = { ...nextKey, title: "Database Management Systems" };
  const second = { school: "Baruch College", courseCode: "CIS 4160", title: "Web Engineering" };
  let requests = 0;
  mock.method(DynamoDBDocumentClient.prototype, "send", async (command) => {
    assert.equal(command.input.TableName, "test-classes");
    assert.equal(command.input.KeyConditionExpression, "school = :school");
    assert.equal(command.input.ExpressionAttributeValues[":school"], "Baruch College");
    if (requests++ === 0) {
      assert.equal(command.input.ExclusiveStartKey, undefined);
      return { Items: [first], LastEvaluatedKey: nextKey };
    }
    assert.deepEqual(command.input.ExclusiveStartKey, nextKey);
    return { Items: [second] };
  });
  assert.deepEqual(await getClasses(), [first, second]);
  assert.equal(requests, 2);
});

test("returns an empty list for an empty table", async () => {
  process.env.DYNAMODB_TABLE_NAME = "test-classes";
  mock.method(DynamoDBDocumentClient.prototype, "send", async () => ({}));
  assert.deepEqual(await getClasses(), []);
});

test("reports missing configuration without contacting AWS", async () => {
  delete process.env.DYNAMODB_TABLE_NAME;
  const send = mock.method(DynamoDBDocumentClient.prototype, "send");
  await assert.rejects(getClasses(), /DYNAMODB_TABLE_NAME/);
  assert.equal(send.mock.callCount(), 0);
});

test("does not replace AWS errors with sample data", async () => {
  process.env.DYNAMODB_TABLE_NAME = "test-classes";
  const denied = new Error("Access denied");
  mock.method(DynamoDBDocumentClient.prototype, "send", async () => { throw denied; });
  await assert.rejects(getClasses(), (error) => error === denied);
});
