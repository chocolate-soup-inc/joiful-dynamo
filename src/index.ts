export { DynamoEntity as Entity } from './lib/DynamoEntity';
export * from './lib/DynamoPaginator';
export {
  aliasTo,
  aliases,
  compositeKey,
  hasMany,
  hasOne,
  prop,
  table,
  validate,
} from './lib/decorators/methods/index';
export { dynamodbDocumentClient as defaultDynamoDBDocumentClient } from './lib/decorators/methods/table';
