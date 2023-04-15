
import express, { NextFunction, Request, Response } from "express";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, SubscribeCommand } from '@aws-sdk/client-sns';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuid } from 'uuid';

const app = express();

app.disable('x-powered-by');
app.disable('etag');

app.use(express.json());

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

app.get("/story/:id", async (req, res, next) => {
  const storyId: string = req.params.id;
  const command = new GetItemCommand({
    TableName: process.env.STORIES_TABLE || '',
    Key: marshall({
      id: storyId,
    }),
    ProjectionExpression: 'description, title, audioURL, thumbnail',
  });

  try {
    let data = await dynamoClient.send(command);
    if (data.Item) {
      res.send(unmarshall(data.Item));
    } else {
      res.status(404).send("Not Found");
    }
  } catch (error) {
    next(error);
  }
});

app.post("/subscribe", async (req, res, next) => {
  let email = req.body.email;
  let topicArn: string = process.env.SNS_TOPIC_ARN || '';
  console.log(email, topicArn);

  try {
    let command = new SubscribeCommand({
      Protocol: 'email',
      TopicArn: topicArn,
      Endpoint: email,
    });
    await snsClient.send(command);
    res.send("ok");
  } catch (error) {
    next(error);
  }
});

app.post("/scene", async (req, res, next) => {
  let description = req.body.description;

  try {
    let command = new PutItemCommand({
      TableName: process.env.SCENES_TABLE || '',
      Item: marshall({
        id: uuid(),
        description: description,
      }),
    });
    await dynamoClient.send(command);
    res.send("ok");
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

export default app;
