import * as cdk from "aws-cdk-lib";
import { GridVoiceStack } from "../lib/grid-voice-stack.js";
import * as dotenv from "dotenv";

dotenv.config();

const app = new cdk.App();

new GridVoiceStack(app, "GridVoiceStack", {
  description: "Infra for Grid Voice AI commentary platform",
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});
