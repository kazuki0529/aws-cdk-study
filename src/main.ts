import path from 'path';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { App, Duration, RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import { ComparisonOperator, Metric, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { FilterPattern, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { BlockPublicAccess, Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const func = new NodejsFunction(this, 'hello-world', {
      entry: path.join(__dirname, 'lambda/hello-world.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      logRetention: RetentionDays.THREE_MONTHS,
    });

    // エラー検知用のメトリクスフィルターを追加
    const alertTopic = new Topic(this, 'alert-topic', {
      fifo: false,
    });
    alertTopic.addSubscription(new EmailSubscription('xxxxx@email.com'));

    const metricNamespace = 'LogMetrics';
    const metricName = 'Error';
    func.logGroup.addMetricFilter('error-metric-filter', {
      metricNamespace,
      metricName,
      filterPattern: FilterPattern.literal('ERROR'),
    });

    const metric = new Metric({
      namespace: metricNamespace,
      metricName,
      period: Duration.minutes(1),
      statistic: 'Sum',
    });

    metric.createAlarm(this, 'error-alarm', {
      alarmName: 'error-alarm',
      evaluationPeriods: 1,
      threshold: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      actionsEnabled: true,
    }).addAlarmAction(new SnsAction(alertTopic));


    const bucket = new Bucket(this, 'bucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const unzip = new PythonFunction(this, 'unzip', {
      entry: path.join(__dirname, 'lambda/unzip'),
      ephemeralStorageSize: Size.gibibytes(4),
      memorySize: 4096,
      runtime: Runtime.PYTHON_3_12,
      logRetention: RetentionDays.THREE_MONTHS,
    });
    bucket.grantReadWrite(unzip);
    bucket.addEventNotification(EventType.OBJECT_CREATED_PUT, new LambdaDestination(unzip), {
      suffix: '.zip',
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'aws-cdk-study-dev', { env: devEnv });
// new MyStack(app, 'aws-cdk-study-prod', { env: prodEnv });

app.synth();