import 'reflect-metadata';
import AWS from 'aws-sdk';

const isTest = process.env.JEST_WORKER_ID;
const isLocal = process.env.IS_LOCAL;

const dynamoOptions: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {};

if (isTest || isLocal) {
  if (process.env.JEST_WORKER_ID) {
    dynamoOptions.endpoint = 'http://localhost:4567';
  } else if (process.env.IS_LOCAL) {
    dynamoOptions.endpoint = 'http://localhost:3456';
  }

  dynamoOptions.sslEnabled = false;
  dynamoOptions.region = 'local-env';
  dynamoOptions.credentials = new AWS.Credentials({
    accessKeyId: '123',
    secretAccessKey: '123',
  });
}
export const dynamodbDocumentClient = new AWS.DynamoDB.DocumentClient(dynamoOptions);

const tableMetadataKey = Symbol('table');

type Options = {
  documentClient?: AWS.DynamoDB.DocumentClient;
};

export function table(name: string, opts?: Options) {
  return (constructor: Function) => {
    if (name == null) throw new TypeError('Name is required in the table decorator');

    const dynamodb = opts?.documentClient || dynamodbDocumentClient;

    Reflect.defineMetadata(tableMetadataKey, {
      name,
      dynamodb,
    }, constructor);
  };
}

export const getTableProps = (target: any): { name: string, dynamodb: AWS.DynamoDB.DocumentClient } => {
  return Reflect.getMetadata(tableMetadataKey, target);
};

export const getTableName = (target: any): string => {
  return getTableProps(target).name;
};

export const getTableDynamoDbInstance = (target: any): AWS.DynamoDB.DocumentClient => {
  return getTableProps(target).dynamodb;
};
