import "server-only";
import { RekognitionClient } from "@aws-sdk/client-rekognition";

export const rekognition = new RekognitionClient({
  region: "us-east-1",
  maxAttempts: 2,
  requestHandler: { connectionTimeout: 3000, requestTimeout: 10_000 },
});
