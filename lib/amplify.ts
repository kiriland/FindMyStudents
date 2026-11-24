import { Amplify } from "aws-amplify";

import { amplifyConfig } from "./amplify-config";

// Keeps the Cognito session in cookies so the server can read it (ADR 0001).
Amplify.configure(amplifyConfig, { ssr: true });
