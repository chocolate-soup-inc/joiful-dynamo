import 'reflect-metadata';
import AWS from 'aws-sdk';
/** @internal */
export declare const dynamodbDocumentClient: AWS.DynamoDB.DocumentClient;
export declare type TableOptions = {
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
export declare function table(name: string, opts?: TableOptions): (constructor: Function) => void;
/** @internal */
export declare const getTableProps: (target: any) => {
    name: string;
    dynamodb: AWS.DynamoDB.DocumentClient;
};
/** @internal */
export declare const getTableName: (target: any) => string;
/** @internal */
export declare const getTableDynamoDbInstance: (target: any) => AWS.DynamoDB.DocumentClient;
