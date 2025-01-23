import { Context } from 'aws-lambda';

export const handler: any = async (event: any, context: Context) => {
  console.log('Hello, world!');
  console.log('event:', event);
  console.log('context:', context);
  // NOTE:エラー発報用にわざとエラーを発生させる
  throw new Error('This is an error');
  // return {
  //   statusCode: 200,
  //   body: JSON.stringify('Hello, world!'),
  // };
};