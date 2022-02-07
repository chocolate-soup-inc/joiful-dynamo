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

/** @internal */
export const dynamodbDocumentClient = new AWS.DynamoDB.DocumentClient(dynamoOptions);

const tableMetadataKey = Symbol('table');

type Options = {
  documentClient?: AWS.DynamoDB.DocumentClient;
};

/**
 * Sets the dynamodb table and its document client for this class.
 * @param {String} name - The DynamoDB table name to which records of this classe should be saved to and retrieved from.
 * @param {Object} [opts] - The options object. Accepts only the documentClient property right now.
 * @param {AWS.DynamoDB.DocumentClient} [opts.documentClient] - The AWS DynamoDB Dcoument Client to be used. If not set, it will use the default one.
 * @example
 * ```
 * @table('test-table')
 * class Model extends Entity {
 * }
 *
 * const model = new Model({ attr1: '1', attr2: '2' });
 * model.create(); // This will create the record in the 'test-table' DynamoDB table.
 * ```
 *
 * @category Class Decorators
 */
export function table(name: string, opts?: Options) {
  return (constructor: Function) => {
    // CONSTRUCTOR IS ACTUALLY THE CLASS ITSELF
    if (name == null) throw new TypeError('Name is required in the table decorator');

    const dynamodb = opts?.documentClient || dynamodbDocumentClient;

    Reflect.defineMetadata(tableMetadataKey, {
      name,
      dynamodb,
    }, constructor);
  };
}

/** @internal */
export const getTableProps = (target: any): { name: string, dynamodb: AWS.DynamoDB.DocumentClient } => {
  return Reflect.getMetadata(tableMetadataKey, target);
};

/** @internal */
export const getTableName = (target: any): string => {
  return getTableProps(target).name;
};

/** @internal */
export const getTableDynamoDbInstance = (target: any): AWS.DynamoDB.DocumentClient => {
  return getTableProps(target).dynamodb;
};
