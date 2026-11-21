import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "us-east-1",
  maxAttempts: 2,
  requestHandler: { connectionTimeout: 3000, requestTimeout: 10_000 },
  // Keeps checksum parameters out of signed picture links.
  responseChecksumValidation: "WHEN_REQUIRED",
});
