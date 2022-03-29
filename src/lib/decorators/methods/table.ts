import {
  DynamoDB,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { setTableDynamoDbInstance, setTableName } from '../reflections/table';

const isTest = process.env.JEST_WORKER_ID;
const isLocal = process.env.IS_LOCAL;

const dynamoOptions: DynamoDBClientConfig = {};

if (process.env.JOIFUL_DYNAMODB_DEBUG) {
  dynamoOptions.logger = console;
}

if (isTest || isLocal) {
  if (isTest) {
    dynamoOptions.endpoint = `http://localhost:${process.env.JEST_DYNAMODB_PORT || '4567'}`;
  } else if (isLocal) {
    dynamoOptions.endpoint = `http://localhost:${process.env.LOCAL_DYNAMODB_PORT || '3456'}`;
  }

  dynamoOptions.region = 'local-env';
  dynamoOptions.credentials = {
    accessKeyId: 'fakeMyKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  };
}

/** @internal */
export const dynamodbDocumentClient = DynamoDBDocumentClient.from(
  new DynamoDB(dynamoOptions),
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  },
);

export type TableOptions = {
  documentClient?: DynamoDBDocumentClient;
};

/**
 * Sets the dynamodb table and its document client for this class.
 * @param {String} name - The DynamoDB table name to which records of this classe should be saved to and retrieved from.
 * @param {Object} [opts] - The options object. Accepts only the documentClient property right now.
 * @param {DynamoDBClient} [opts.documentClient] - The AWS DynamoDB Dcoument Client to be used. If not set, it will use the default one.
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
export function table(name: string, opts?: TableOptions) {
  return (constructor: Function) => {
    // CONSTRUCTOR IS ACTUALLY THE CLASS ITSELF
    if (name == null) throw new TypeError('Name is required in the table decorator');

    const dynamodb = opts?.documentClient || dynamodbDocumentClient;

    setTableName(constructor, name);
    setTableDynamoDbInstance(constructor, dynamodb);
  };
}
