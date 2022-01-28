/* eslint-disable no-await-in-loop */
import Joi from 'joi';
import _ from 'lodash';
import { getAliasTarget } from '../decorators/aliases';
import { transformCompositeKeys } from '../decorators/compositeKey';
import {
  getHasOneModel,
  getHasOneModels,
  setHasOneDescriptors,
} from '../decorators/hasOne';
import {
  getCreatedAtKey,
  getPrimaryKey,
  getProps,
  getSecondaryKey,
  getUpdatedAtKey,
} from '../decorators/prop';
import { getTableDynamoDbInstance, getTableName } from '../decorators/table';
import { getPropertyValidate, joiSchema, validateAttributes } from '../decorators/validate';
import { isObject } from '../utils/isObject';
import { DynamoPaginator } from './DynamoPaginator';

type QueryOptions = {
  IndexName: AWS.DynamoDB.DocumentClient.IndexName;
  Limit?: AWS.DynamoDB.DocumentClient.PositiveIntegerObject;
  ProjectionExpression?: AWS.DynamoDB.DocumentClient.ProjectionExpression;
  FilterExpression?: AWS.DynamoDB.DocumentClient.ConditionExpression;
  KeyConditionExpression?: AWS.DynamoDB.DocumentClient.KeyExpression;
  ExpressionAttributeNames?: AWS.DynamoDB.DocumentClient.ExpressionAttributeNameMap;
  ExpressionAttributeValues?: AWS.DynamoDB.DocumentClient.ExpressionAttributeValueMap;
};

type ScanOptions = {
  IndexName?: AWS.DynamoDB.DocumentClient.IndexName;
  Limit?: AWS.DynamoDB.DocumentClient.PositiveIntegerObject;
  // TotalSegments?: AWS.DynamoDB.DocumentClient.ScanTotalSegments;
  // Segment?: AWS.DynamoDB.DocumentClient.ScanSegment;
  ProjectionExpression?: AWS.DynamoDB.DocumentClient.ProjectionExpression;
  FilterExpression?: AWS.DynamoDB.DocumentClient.ConditionExpression;
  ExpressionAttributeNames?: AWS.DynamoDB.DocumentClient.ExpressionAttributeNameMap;
  ExpressionAttributeValues?: AWS.DynamoDB.DocumentClient.ExpressionAttributeValueMap;
};

function transformData(target: any, item: Record<string, any>): Record<string, any> {
  const modelsDescriptors = getHasOneModels(target);

  const aliasedItem = Object.entries(item).reduce(
    (agg, [key, value]: [string, any]) => {
      if (modelsDescriptors?.includes(key) && isObject(value)) {
        agg[getAliasTarget(target, key)] = transformData(
          getHasOneModel(target, key).model,
          value,
        );
      } else {
        agg[getAliasTarget(target, key)] = value;
      }
      return agg;
    },
    {} as Record<string, any>,
  );

  return transformCompositeKeys(target, aliasedItem);
}

export class Entity {
  protected _attributes: Record<string, any> = {};

  protected _originalAttributes: Record<string, any> = {};

  protected _error: Joi.ValidationError | undefined;

  [key: string]: any;

  constructor(item: Record<string, any> = {}) {
    this.setHasOneDescriptors();
    this.setPropDescriptors();
    this.attributes = item;

    this.getAttribute = this.getAttribute.bind(this);
    this.setAttribute = this.setAttribute.bind(this);
  }

  protected setAttributeDescriptor(key) {
    if (Object.getOwnPropertyDescriptor(this, key) == null) {
      Object.defineProperty(this, key, {
        get() {
          return this.getAttribute(key);
        },
        set(v) {
          this.setAttribute(key, v);
        },
        configurable: true,
      });
    }
  }

  protected setHasOneDescriptors() {
    setHasOneDescriptors(this);
  }

  protected setPropDescriptors() {
    const propDescriptors = getProps(this);

    for (const key of propDescriptors) {
      this.setAttributeDescriptor(key);
    }
  }

  get completeAttributes(): Record<string, any> {
    const finalAttributes = _.cloneDeep(this.attributes);

    const modelsDescriptors = getHasOneModels(this);
    if (modelsDescriptors) {
      for (const model of modelsDescriptors) {
        const modelData = this[model].attributes;
        if (!_.isEmpty(modelData)) {
          finalAttributes[model] = modelData;
        }
      }
    }

    return finalAttributes;
  }

  get attributes(): Record<string, any> {
    return this._attributes || {};
  }

  set attributes(attributes: Record<string, any>) {
    for (const [key, value] of Object.entries(attributes)) {
      this.setAttributeDescriptor(key);
      this[key] = value;
    }
  }

  protected getAttribute(key: string): any {
    const target = getAliasTarget(this, key);

    return this.attributes[target];
  }

  protected setAttribute(key: string, value: any): void {
    this._originalAttributes[key] = value;

    const target = getAliasTarget(this, key);

    try {
      const joi = getPropertyValidate(this, target);
      if (joi) {
        const joiValidatedValue = Joi.attempt(value, joi, {
          convert: true,
          dateFormat: 'iso',
        });
        this._attributes[target] = joiValidatedValue;
      } else {
        this._attributes[target] = value;
      }
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        delete this._attributes[target];
      } else {
        throw error;
      }
    }
  }

  static get dynamodb() {
    return getTableDynamoDbInstance(this);
  }

  static get tableName() {
    return getTableName(this);
  }

  static get entityName() {
    return this.name;
  }

  static get primaryKey() {
    return getPrimaryKey(this);
  }

  static get secondaryKey() {
    return getSecondaryKey(this);
  }

  static get createdAtKey() {
    return getCreatedAtKey(this);
  }

  static get updatedAtKey() {
    return getUpdatedAtKey(this);
  }

  // static batchWriteItem() {

  // }

  static async deleteItem(key: AWS.DynamoDB.DocumentClient.Key) {
    const response = await this.dynamodb.delete({
      TableName: this.tableName,
      Key: key,
      ReturnValues: 'ALL_OLD',
    }).promise();

    if (response.Attributes == null) {
      throw new Error('Item does not exist.');
    }

    return response.Attributes;
  }

  static async getItem(key: AWS.DynamoDB.DocumentClient.Key) {
    const {
      Item: item,
    } = await this.dynamodb.get({
      TableName: this.tableName,
      Key: key,
    }).promise();

    if (item) {
      return new this(item);
    }

    return item;
  }

  protected static createPaginator(method, opts) {
    return new DynamoPaginator({
      method,
      opts,
      entityClass: this,
      tableName: this.tableName,
    });
  }

  protected static _query(opts: AWS.DynamoDB.QueryInput) {
    return this.dynamodb.query(opts).promise();
  }

  static async query(opts: QueryOptions) {
    const paginator = this.createPaginator(this._query.bind(this), opts);
    await paginator.next();
    return paginator;
  }

  static async queryAll(opts: QueryOptions) {
    const paginator = await this.createPaginator(this._query.bind(this), opts);
    return paginator.getAll();
  }

  protected static _scan(opts: AWS.DynamoDB.ScanInput) {
    return this.dynamodb.scan(opts).promise();
  }

  static async scan(opts?: ScanOptions) {
    const paginator = this.createPaginator(this._scan.bind(this), opts);
    await paginator.next();
    return paginator;
  }

  static async scanAll(opts?: ScanOptions) {
    const paginator = await this.createPaginator(this._scan.bind(this), opts);
    return paginator.getAll();
  }

  protected static get joiSchema() {
    return joiSchema(this);
  }

  static transformData(item: Record<string, any>): Record<string, any> {
    return transformData(this, item);
  }

  static validate(item: Record<string, any>) {
    return validateAttributes(this, this.transformData(item));
  }

  get dynamodb() {
    return getTableDynamoDbInstance(this.constructor);
  }

  get tableName() {
    return getTableName(this.constructor);
  }

  get entityName() {
    return this.constructor.name;
  }

  get primaryKey() {
    return getPrimaryKey(this.constructor);
  }

  get secondaryKey() {
    return getSecondaryKey(this.constructor);
  }

  get createdAtKey() {
    return getCreatedAtKey(this.constructor);
  }

  get updatedAtKey() {
    return getUpdatedAtKey(this.constructor);
  }

  get joiSchema() {
    return joiSchema(this);
  }

  transformData(): Record<string, any> {
    return transformData(this, this.completeAttributes);
  }

  get transformedData() {
    return this.transformData();
  }

  validate() {
    this._error = undefined;
    try {
      validateAttributes(this, this.transformData());
      return true;
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        this._error = error;
        return false;
      }

      throw error;
    }
  }

  get valid() {
    return this.validate();
  }

  get error() {
    return this._error;
  }

  async load() {
    const pk = this.primaryKey;
    const sk = this.secondaryKey;

    if (pk == null || sk == null) {
      throw new Error('primary key and/or secondary key props not set');
    }

    const {
      Item: item,
    } = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        [pk]: this.getAttribute(pk),
        [sk]: this.getAttribute(sk),
      },
    }).promise();

    if (item) {
      this.attributes = item;
    } else {
      throw new Error('Record not found.');
    }
  }

  protected get specialKeys() {
    return {
      primaryKey: this.primaryKey,
      secondaryKey: this.secondaryKey,
      createdAtKey: this.createdAtKey,
      updatedAtKey: this.updatedAtKey,
      now: new Date().toISOString(),
    };
  }

  async create() {
    if (!this.valid) throw new Error('The instasnce is invalid');
    const {
      primaryKey,
      secondaryKey,
      createdAtKey,
      updatedAtKey,
      now,
    } = this.specialKeys;

    if (primaryKey == null) throw new Error('Primary Key property should be set');
    if (secondaryKey == null) throw new Error('Secondary Key property should be set');

    const item = this.completeAttributes;

    if (createdAtKey) item[createdAtKey] = now;
    if (updatedAtKey) item[updatedAtKey] = now;

    await this.dynamodb.put({
      TableName: this.tableName,
      Item: item,
    }).promise();

    this.attributes = item;
    return this;
  }

  async update() {
    if (!this.valid) throw new Error('The instasnce is invalid');

    const {
      primaryKey,
      secondaryKey,
      createdAtKey,
      updatedAtKey,
      now,
    } = this.specialKeys;

    if (primaryKey == null) throw new Error('Primary Key property should be set');
    if (secondaryKey == null) throw new Error('Secondary Key property should be set');

    const opts = Object.entries(this.completeAttributes).reduce((agg, [key, value]) => {
      if ([primaryKey, secondaryKey, createdAtKey, updatedAtKey].includes(key)) return agg;

      const {
        UpdateExpression: expression,
        ExpressionAttributeNames: names = {},
        ExpressionAttributeValues: values = {},
      } = agg;

      names[`#${key}`] = key;
      values[`:${key}`] = value;

      agg.ExpressionAttributeNames = names;
      agg.ExpressionAttributeValues = values;

      if (expression == null) {
        agg.UpdateExpression = `SET #${key} = :${key}`;
      } else {
        agg.UpdateExpression = `${expression}, #${key} = :${key}`;
      }

      return agg;
    }, {} as {
      UpdateExpression: AWS.DynamoDB.DocumentClient.UpdateExpression;
      ExpressionAttributeNames: AWS.DynamoDB.DocumentClient.ExpressionAttributeNameMap;
      ExpressionAttributeValues: AWS.DynamoDB.DocumentClient.ExpressionAttributeValueMap;
    });

    if (opts.UpdateExpression == null) {
      // NOTHING BEING SET, THROW ERROR
      throw new Error('You cannot save an instance with no attributes at all.');
    }

    if (createdAtKey) {
      opts.ExpressionAttributeNames[`#${createdAtKey}`] = createdAtKey;
      opts.ExpressionAttributeValues[`:${createdAtKey}`] = now;
      // eslint-disable-next-line max-len
      opts.UpdateExpression = `${opts.UpdateExpression}, #${createdAtKey} = if_not_exists(#${createdAtKey}, :${createdAtKey})`;
    }

    if (updatedAtKey) {
      opts.ExpressionAttributeNames[`#${updatedAtKey}`] = updatedAtKey;
      opts.ExpressionAttributeValues[`:${updatedAtKey}`] = now;
      opts.UpdateExpression = `${opts.UpdateExpression}, #${updatedAtKey} = :${updatedAtKey}`;
    }

    const {
      Attributes: newAttributes,
    } = await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        [primaryKey]: this.getAttribute(primaryKey),
        [secondaryKey]: this.getAttribute(secondaryKey),
      },
      ReturnValues: 'ALL_NEW',
      ...opts,
    }).promise();

    if (newAttributes == null) throw new Error('Error updating the item');
    this.attributes = newAttributes;
    return this;
  }

  async save({ overwrite = false }: { overwrite?: boolean; }) {
    if (overwrite) return this.create;
    return this.update;
  }
}
