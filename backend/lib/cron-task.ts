import * as cdk from 'aws-cdk-lib';
import { Duration, StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { EventBus, EventField, Rule, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import { LambdaFunction, SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnPipe } from 'aws-cdk-lib/aws-pipes';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { CfnSchedule } from 'aws-cdk-lib/aws-scheduler';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'node:path';


interface BackendStackProps extends StackProps {
  readonly scenesTable: Table;
  readonly generatedStoriesTable: Table;
  readonly frontEndURL: string;
  readonly secret: Secret;
  readonly emailTopic: Topic;
  readonly bedtimeCron: string;
}

export class CronTaskStack extends Construct {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id);

    const openAIAPIKEY = props.secret;

    const storiesEventBus = new EventBus(this, 'ai-stories');

    // Stories Bucket
    const audioBucket = new Bucket(this, 'StoriesAudioBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Table to store all characters
    const scenesTable = props.scenesTable;
    const generatedStories = props.generatedStoriesTable;

    // Create SNS topic for emails
    const emailTopic = props.emailTopic;
    // emailTopic.grantPublish(new ServicePrincipal('events.amazonaws.com'));

    // need to create role and policy for scheduler to invoke the lambda function
    const schedulerRole = new Role(this, 'scheduler-role', {
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
    });

    // Function that creates stories using OpenAI API.
    const createStoryFunc: NodejsFunction = new NodejsFunction(this, 'scheduled-lambda-function', {
      memorySize: 196,
      timeout: Duration.minutes(5),
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src', 'create-story/index.ts'),
      environment: {
        openAIARN: openAIAPIKEY.secretArn,
        SCENES_TABLE: scenesTable.tableName,
        STORIES_TABLE: generatedStories.tableName,
      },
    });

    // Function to create images using stable fusion
    const createImagesForStoryFunc: NodejsFunction = new NodejsFunction(this, 'generate-images-for-story', {
      memorySize: 196,
      timeout: Duration.minutes(5),
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src', 'generate-images-for-story/index.ts'),
      environment: {
        openAIARN: openAIAPIKEY.secretArn,
        STORIES_TABLE: generatedStories.tableName,
        BUCKET_NAME: audioBucket.bucketName,
      },
    });

    // Function to create audio using Amazon Polly
    const createAudioForStoryFunc: NodejsFunction = new NodejsFunction(this, 'generate-audio-for-story', {
      memorySize: 196,
      timeout: Duration.minutes(5),
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src', 'generate-audio-for-story/index.ts'),
      environment: {
        STORIES_TABLE: generatedStories.tableName,
        BUCKET_NAME: audioBucket.bucketName,
      },
    });

    createAudioForStoryFunc.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: ['polly:SynthesizeSpeech'],
      })
    );

    audioBucket.grantReadWrite(createAudioForStoryFunc);
    audioBucket.grantReadWrite(createImagesForStoryFunc);

    // Create consumer to listen to StoryGenerated Event
    const storyGeneratedRule = new Rule(this, 'StoryGeneratedRule', {
      description: 'Listen to StoryGenerated events',
      eventPattern: {
        source: ['ai.stories'],
        detailType: ['StoryGenerated'],
      },
      eventBus: storiesEventBus,
    });

    // Rules for StoryGeneratedRule, generate image, audio and fire SNS topic.
    storyGeneratedRule.addTarget(new LambdaFunction(createImagesForStoryFunc));
    storyGeneratedRule.addTarget(new LambdaFunction(createAudioForStoryFunc));
    storyGeneratedRule.addTarget(
      new SnsTopic(emailTopic, {
        message: RuleTargetInput.fromText(`Nueva historia: ${props.frontEndURL}/story/${EventField.fromPath('$.detail.id')}`),
      })
    );

    // Create schedule that will run every day at bed time.
    new CfnSchedule(this, 'my-schedule', {
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      scheduleExpression: props.bedtimeCron,
      description: 'Fires to trigger a new story',
      target: {
        arn: createStoryFunc.functionArn,
        roleArn: schedulerRole.roleArn,
      },
    });

    // Permissions
    createStoryFunc.grantInvoke(schedulerRole);

    // permissions for stories table
    generatedStories.grantWriteData(createStoryFunc);
    generatedStories.grantWriteData(createImagesForStoryFunc);
    generatedStories.grantWriteData(createAudioForStoryFunc);

    scenesTable.grantReadData(createStoryFunc);

    // Permissions to read secrets
    openAIAPIKEY.grantRead(createStoryFunc);
    openAIAPIKEY.grantRead(createImagesForStoryFunc);

    // permissions to create signed urls for content
    audioBucket.grantWrite(createAudioForStoryFunc);
    audioBucket.grantWrite(createImagesForStoryFunc);

    // create IAM role with permission to read from sourceStream and write to targetStream
    const pipeRole = new Role(this, 'FilterPipeRole', {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
    });

    pipeRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [generatedStories.tableStreamArn as string],
        actions: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
      })
    );

    storiesEventBus.grantPutEventsTo(pipeRole);

    new CfnPipe(this, 'NewStoryPipe', {
      roleArn: pipeRole.roleArn,
      source: generatedStories.tableStreamArn as string,
      target: storiesEventBus.eventBusArn,

      targetParameters: {
        eventBridgeEventBusParameters: {
          detailType: 'StoryGenerated',
          source: 'ai.stories',
        },
        inputTemplate: `{
          "id": "<$.dynamodb.NewImage.id.S>",
          "title": "<$.dynamodb.NewImage.title.S>",
          "scene": "<$.dynamodb.NewImage.scene.S>",
          "description": "<$.dynamodb.NewImage.description.S>"
        }`,
      },
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: StartingPosition.LATEST,
          batchSize: 1,
        },
        filterCriteria: {
          filters: [
            {
              pattern: '{"eventName" : ["INSERT"] }',
            },
          ],
        },
      },
    });
  }
}
