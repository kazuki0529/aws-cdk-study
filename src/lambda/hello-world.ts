import { Context } from 'aws-lambda';

export const handler: any = async (event: any, context: Context) => {
  console.log('Hello, world!');
  console.log('event:', event);
  console.log('context:', context);
  return {
    statusCode: 200,
    body: JSON.stringify('Hello, world!'),
  };
};