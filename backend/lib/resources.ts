import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export class DDBTables extends Construct {
  public readonly scenesTable: Table;
  public readonly generatedStories: Table;
  public readonly emailTopic: Topic;
  public readonly secret: Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    // Table to store all scenes
    this.scenesTable = new Table(this, `AiStory-Scenes`, {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Table to store generated stories
    this.generatedStories = new Table(this, `AiStory-Stories`, {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
      stream: StreamViewType.NEW_IMAGE,
    });

    this.emailTopic = new Topic(this, 'EmailTopic');
    this.secret = new Secret(this, 'Secret');

    new cdk.CfnOutput(this, 'SecretArn', {
      value: this.secret.secretArn,
    });
  }
}
