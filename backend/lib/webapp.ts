import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnOutput, StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Topic } from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';

interface FrontEndStackProps extends StackProps {
  readonly generatedStoriesTable: Table;
  readonly scenesTable: Table;
  readonly snsEmailTopic: Topic;
  readonly region: string;
}

export class WebApp extends Construct {
  public readonly applicationURL: string;

  constructor(scope: Construct, id: string, props: FrontEndStackProps) {
    super(scope, id);

    const generatedStoriesTable = props.generatedStoriesTable;
    const scenesTable = props.scenesTable;
    const emailTopic = props.snsEmailTopic;

    // Api
    const apiFunction: NodejsFunction = new NodejsFunction(this, 'WebApiFunction', {
      memorySize: 196,
      timeout: cdk.Duration.seconds(29),
      runtime: Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/web-api/index.ts'),
      environment: {
        STORIES_TABLE: generatedStoriesTable.tableName,
        SCENES_TABLE: scenesTable.tableName,
        SNS_TOPIC_ARN: emailTopic.topicArn,
      },
    });

    const apiGateway = new apigw.LambdaRestApi(this, 'ApiGateway', {
      handler: apiFunction,
      proxy: true,
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'api',
      },
    });

    // Frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new cloudfrontOrigins.HttpOrigin(`${apiGateway.restApiId}.execute-api.${props.region}.amazonaws.com`, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        },
      },
      errorResponses: [{
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
      }],
    });

    // Deployments
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/build'))],
      destinationBucket: frontendBucket,
      distribution: distribution,
    });

    // Permissions
    generatedStoriesTable.grantReadData(apiFunction);
    scenesTable.grantReadWriteData(apiFunction);

    // Allow lambda function to subscribe emails to SNS topic
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sns:Subscribe'],
      resources: [emailTopic.topicArn],
    }));

    this.applicationURL = `https://${distribution.distributionDomainName}`;

    new CfnOutput(this, `AppUrl`, {
      value: this.applicationURL,
    });
  }
}
