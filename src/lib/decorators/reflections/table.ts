import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import 'reflect-metadata';

import {
  DYNAMODB_KEY,
  TABLE_KEY,
} from './metadataKeys';

/** @internal */
export const getTableName = (target: any): string => {
  return Reflect.getMetadata(TABLE_KEY, target);
};

/** @internal */
export const setTableName = (target: any, tableName: string): void => {
  Reflect.defineMetadata(TABLE_KEY, tableName, target);
};

/** @internal */
export const getTableDynamoDbInstance = (target: any): DynamoDBDocumentClient => {
  return Reflect.getMetadata(DYNAMODB_KEY, target);
};

/** @internal */
export const setTableDynamoDbInstance = (target: any, dynamodb: DynamoDBDocumentClient): void => {
  Reflect.defineMetadata(DYNAMODB_KEY, dynamodb, target);
};
