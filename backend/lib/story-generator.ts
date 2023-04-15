import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DDBTables } from './resources';
import { WebApp } from './webapp';
import { CronTaskStack } from './cron-task';


interface BackendStackProps extends StackProps {
  readonly bedtimeCron: string;
}

export class StoryGeneratorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const resources = new DDBTables(this, `Resources`);

    const webApp = new WebApp(this, `WebStack`, {
      generatedStoriesTable: resources.generatedStories,
      scenesTable: resources.scenesTable,
      snsEmailTopic: resources.emailTopic,
      region: this.region,
    });

    new CronTaskStack(this, `CronTask`, {
      scenesTable: resources.scenesTable,
      generatedStoriesTable: resources.generatedStories,
      frontEndURL: webApp.applicationURL,
      bedtimeCron: props.bedtimeCron,
      emailTopic: resources.emailTopic,
      secret: resources.secret,
    });
  }
}
