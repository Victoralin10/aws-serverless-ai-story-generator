#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as config from '../../config.json';
import { StoryGeneratorStack } from '../lib/story-generator';

const app = new cdk.App();

new StoryGeneratorStack(app, `${config.stage}-StoryGenerator`, {
  bedtimeCron: config.bedtimeCron,
});
