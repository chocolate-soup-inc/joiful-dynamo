import {
  getCreatedAtKey,
  getPrimaryKey,
  getSecondaryKey,
  getTableDynamoDbInstance,
  getTableName,
  getUpdatedAtKey,
} from '../decorators';
import { QueryOptions, ScanOptions } from '../DynamoEntityTypes';
import { BasicEntity } from './BasicEntity';
import { DynamoPaginator } from './DynamoPaginator';

export class DynamoEntity extends BasicEntity {
  constructor(item?: Record<string, any>) {
    super(item);

    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.load = this.load.bind(this);
  }

  // ---------------- BASIC SETTINGS ----------------

  get _dynamodb() { return getTableDynamoDbInstance(this.constructor); }

  static get _dynamodb() { return this.prototype._dynamodb; }

  get _tableName() { return getTableName(this.constructor); }

  static get _tableName() { return this.prototype._tableName; }

  get _entityName() { return this.constructor.name; }

  static get _entityName() { return this.name; }

  get _primaryKey() { return getPrimaryKey(this); }

  static get _primaryKey() { return this.prototype._primaryKey; }

  get _secondaryKey() { return getSecondaryKey(this); }

  static get _secondaryKey() { return this.prototype._secondaryKey; }

  get _createdAtKey() { return getCreatedAtKey(this); }

  static get _createdAtKey() { return this.prototype._createdAtKey; }

  get _updatedAtKey() { return getUpdatedAtKey(this); }

  static get _updatedAtKey() { return this.prototype._updatedAtKey; }

  // ---------------- BASIC SETTINGS ----------------

  // ---------------- TABLE SUPPORT METHODS ----------------

  protected static createPaginator(method, opts) {
    return new DynamoPaginator({
      method,
      opts,
      entityClass: this,
      tableName: this._tableName,
    });
  }

  protected static _query(opts: AWS.DynamoDB.QueryInput) {
    return this._dynamodb.query(opts).promise();
  }

  protected static _scan(opts: AWS.DynamoDB.ScanInput) {
    return this._dynamodb.scan(opts).promise();
  }

  // ---------------- TABLE SUPPORT METHODS ----------------

  // ---------------- TABLE METHODS ----------------
  static async deleteItem(key: AWS.DynamoDB.DocumentClient.Key) {
    const response = await this._dynamodb.delete({
      TableName: this._tableName,
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
    } = await this._dynamodb.get({
      TableName: this._tableName,
      Key: key,
    }).promise();

    if (item) {
      return new this(item);
    }

    return item;
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

  static async scan(opts?: ScanOptions) {
    const paginator = this.createPaginator(this._scan.bind(this), opts);
    await paginator.next();
    return paginator;
  }

  static async scanAll(opts?: ScanOptions) {
    const paginator = await this.createPaginator(this._scan.bind(this), opts);
    return paginator.getAll();
  }
  // ---------------- TABLE METHODS ----------------

  // ---------------- INSTANCE SUPPORT METHODS ----------------

  get dynamoAttributes() {
    const attributes = this.validatedAttributes;

    if (Object.keys(attributes).length === 0) {
      throw new Error('You cannot save an instance with no attributes at all.');
    }

    attributes.entityName = this._entityName;

    return attributes;
  }

  // ---------------- INSTANCE SUPPORT METHODS ----------------

  // ---------------- INSTANCE METHODS ----------------

  async load() {
    const pk = this._primaryKey;
    const sk = this._secondaryKey;

    if (pk == null || sk == null) {
      throw new Error('primary key and/or secondary key props not set');
    }

    const {
      Item: item,
    } = await this._dynamodb.get({
      TableName: this._tableName,
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

  async create() {
    if (!this.valid) throw new Error('The instance is invalid');

    if (this._primaryKey == null) throw new Error('Primary Key property should be set');
    if (this._secondaryKey == null) throw new Error('Secondary Key property should be set');

    const item = this.dynamoAttributes;

    const now = new Date().toISOString();

    if (this._createdAtKey) item[this._createdAtKey] = now;
    if (this._updatedAtKey) item[this._updatedAtKey] = now;

    await this._dynamodb.put({
      TableName: this._tableName,
      Item: item,
    }).promise();

    this.attributes = item;
    return this;
  }

  async update() {
    if (!this.valid) throw new Error('The instance is invalid');

    if (this._primaryKey == null) throw new Error('Primary Key property should be set');
    if (this._secondaryKey == null) throw new Error('Secondary Key property should be set');

    const opts = Object.entries(this.dynamoAttributes).reduce((agg, [key, value]) => {
      if ([this._primaryKey, this._secondaryKey, this._createdAtKey, this._updatedAtKey].includes(key)) return agg;

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

    const now = new Date().toISOString();

    if (this._createdAtKey) {
      opts.ExpressionAttributeNames[`#${this._createdAtKey}`] = this._createdAtKey;
      opts.ExpressionAttributeValues[`:${this._createdAtKey}`] = now;
      // eslint-disable-next-line max-len
      opts.UpdateExpression = `${opts.UpdateExpression}, #${this._createdAtKey} = if_not_exists(#${this._createdAtKey}, :${this._createdAtKey})`;
    }

    if (this._updatedAtKey) {
      opts.ExpressionAttributeNames[`#${this._updatedAtKey}`] = this._updatedAtKey;
      opts.ExpressionAttributeValues[`:${this._updatedAtKey}`] = now;
      opts.UpdateExpression = `${opts.UpdateExpression}, #${this._updatedAtKey} = :${this._updatedAtKey}`;
    }

    const {
      Attributes: newAttributes,
    } = await this._dynamodb.update({
      TableName: this._tableName,
      Key: {
        [this._primaryKey]: this.getAttribute(this._primaryKey),
        [this._secondaryKey]: this.getAttribute(this._secondaryKey),
      },
      ReturnValues: 'ALL_NEW',
      ...opts,
    }).promise();

    if (newAttributes == null) throw new Error('Error updating the item');
    this.attributes = newAttributes;
    return this;
  }

  // ---------------- INSTANCE METHODS ----------------
}
