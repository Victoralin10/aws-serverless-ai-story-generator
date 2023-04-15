
import { createServer, proxy } from 'aws-serverless-express';
import app from './app';
import { Context } from 'aws-lambda';

const server = createServer(app);

export function handler(event: any, context: Context) {
  context.callbackWaitsForEmptyEventLoop = false;
  return proxy(server, event, context)
}
