import _ from 'lodash';
import {
  getCreatedAtKey,
  getHasManyModel,
  getHasManyNotNestedModels,
  getHasOneModel,
  getHasOneNotNestedModels,
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
    this.setEntityOnKey = this.setEntityOnKey.bind(this);
    this.removeEntityFromKey = this.removeEntityFromKey.bind(this);
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

  protected static initialize(item: Record<string, any>) {
    return new this(this.prototype.parseDynamoAttributes(item));
  }

  protected static createPaginator(method, opts) {
    return new DynamoPaginator({
      method,
      opts,
      tableName: this._tableName,
      initializer: this.initialize.bind(this),
    });
  }

  protected static prepareEntityAttributeNameAndValue(opts) {
    const newOpts = _.cloneDeep(opts);

    let attributeName;
    let attributeValue;
    let counter = 0;
    do {
      attributeName = `#_entityName${counter}`;
      attributeValue = `:_entityName${counter}`;
      counter += 1;
    } while (
      newOpts?.ExpressionAttributeNames?.[attributeName] != null
      || newOpts?.ExpressionAttributeValues?.[attributeValue] != null
    );

    if (newOpts.ExpressionAttributeNames == null) {
      newOpts.ExpressionAttributeNames = {};
    }

    if (newOpts.ExpressionAttributeValues == null) {
      newOpts.ExpressionAttributeValues = {};
    }

    newOpts.ExpressionAttributeNames[attributeName] = '_entityName';
    newOpts.ExpressionAttributeValues[attributeValue] = this._entityName;

    return {
      opts: newOpts,
      attributeName,
      attributeValue,
    };
  }

  protected static prepareEntityExpression(opts, key) {
    const {
      opts: newOpts,
      attributeName,
      attributeValue,
    } = this.prepareEntityAttributeNameAndValue(opts);

    if (newOpts?.[key]) {
      newOpts[key] = `${newOpts[key]} and ${attributeName} = ${attributeValue}`;
    } else {
      newOpts[key] = `${attributeName} = ${attributeValue}`;
    }

    return newOpts;
  }

  protected static prepareOptsForScanAndQuery(opts) {
    return this.prepareEntityExpression(opts, 'FilterExpression');
  }

  protected static prepareOptsForDelete(opts) {
    return this.prepareEntityExpression(opts, 'ConditionExpression');
  }

  protected static _query(opts: AWS.DynamoDB.QueryInput) {
    return this._dynamodb.query(this.prepareOptsForScanAndQuery(opts)).promise();
  }

  protected static _scan(opts: AWS.DynamoDB.ScanInput) {
    return this._dynamodb.scan(this.prepareOptsForScanAndQuery(opts)).promise();
  }

  protected get primaryKeyDynamoDBValue() {
    if (this._primaryKey == null) return undefined;

    return `${this._entityName}-${this[this._primaryKey]}`;
  }

  protected get secondaryKeyDynamoDBValue() {
    if (this._secondaryKey == null) return undefined;

    return `${this._entityName}-${this[this._secondaryKey]}`;
  }

  protected get finalDynamoDBKey() {
    const key = {};
    if (this._primaryKey) {
      key[this._primaryKey] = this.primaryKeyDynamoDBValue;
    }

    if (this._secondaryKey) {
      key[this._secondaryKey] = this.secondaryKeyDynamoDBValue;
    }

    return key;
  }

  protected setEntityOnKey(key: AWS.DynamoDB.DocumentClient.Key): AWS.DynamoDB.DocumentClient.Key {
    const finalKey: AWS.DynamoDB.DocumentClient.Key = {};
    [this._primaryKey, this._secondaryKey].forEach((_key) => {
      if (_key != null) {
        const value = key[_key];
        if (value != null) {
          finalKey[_key] = `${this._entityName}-${value}`;
        }
      }
    });

    return finalKey;
  }

  protected static setEntityOnKey(key: AWS.DynamoDB.DocumentClient.Key) {
    return this.prototype.setEntityOnKey(key);
  }

  protected removeEntityFromKey(key: AWS.DynamoDB.DocumentClient.Key): AWS.DynamoDB.DocumentClient.Key {
    const finalKey: AWS.DynamoDB.DocumentClient.Key = {};
    [this._primaryKey, this._secondaryKey].forEach((_key) => {
      if (_key != null) {
        const value = key[_key];
        if (value != null) {
          finalKey[_key] = key[_key].toString().replace(`${this._entityName}-`, '');
        }
      }
    });

    return finalKey;
  }

  protected static removeEntityFromKey(key: AWS.DynamoDB.DocumentClient.Key) {
    return this.prototype.removeEntityFromKey(key);
  }

  // ---------------- TABLE SUPPORT METHODS ----------------

  // ---------------- TABLE METHODS ----------------
  static async deleteItem(key: AWS.DynamoDB.DocumentClient.Key) {
    const response = await this._dynamodb.delete(
      this.prepareOptsForDelete({
        TableName: this._tableName,
        Key: this.setEntityOnKey(key),
        ReturnValues: 'ALL_OLD',
      }),
    ).promise();

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
      Key: this.setEntityOnKey(key),
    }).promise();

    if (item) return this.initialize(item);

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
    let attributes = this.validatedAttributes;

    if (Object.keys(attributes).length === 0) {
      throw new Error('You cannot save an instance with no attributes at all.');
    }

    attributes._entityName = this._entityName;
    attributes = {
      ...attributes,
      ...this.finalDynamoDBKey,
    };

    return attributes;
  }

  parseDynamoAttributes(item: Record<string, any>) {
    delete item._entityName;

    return {
      ...item,
      ...this.removeEntityFromKey(item),
    };
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
      Key: this.finalDynamoDBKey,
    }).promise();

    if (item) {
      this.attributes = this.parseDynamoAttributes(item);
    } else {
      throw new Error('Record not found.');
    }
  }

  get relationsUpdateAttributes() {
    const hasOneEntities = getHasOneNotNestedModels(this).reduce((agg, m) => {
      if (this[`_noInitializer${_.capitalize(m)}`] == null) return agg;

      const {
        opts: {
          foreignKey = undefined,
        } = {},
      } = getHasOneModel(this, m) || {};

      const value = this[m];
      if (foreignKey && this._primaryKey) {
        value[foreignKey] = this.primaryKeyDynamoDBValue;
        this[foreignKey] = this.primaryKeyDynamoDBValue;
      }

      return agg.concat([value]);
    }, [] as DynamoEntity[]);

    const hasManyEntities = getHasManyNotNestedModels(this).reduce((agg, m) => {
      if (this[`_noInitializer${_.capitalize(m)}`] == null) return agg;

      const {
        opts: {
          foreignKey = undefined,
        } = {},
      } = getHasManyModel(this, m) || {};

      let value = this[m];
      if (foreignKey) {
        value = value.map((v) => {
          if (this._primaryKey) {
            v[foreignKey] = this.primaryKeyDynamoDBValue;
            this[foreignKey] = this.primaryKeyDynamoDBValue;
          }
          return v;
        });
      }

      return agg.concat(value);
    }, [] as DynamoEntity[]);

    return hasOneEntities.concat(hasManyEntities).map((entity) => ({
      Update: {
        ...entity.updateAttributes,
      },
    }));
  }

  get createAttributes() {
    if (!this.valid) throw new Error('The instance is invalid');

    if (this._primaryKey == null) throw new Error('Primary Key property should be set');
    if (this._secondaryKey == null) throw new Error('Secondary Key property should be set');

    const item = this.dynamoAttributes;

    const now = new Date().toISOString();

    if (this._createdAtKey) item[this._createdAtKey] = now;
    if (this._updatedAtKey) item[this._updatedAtKey] = now;

    return {
      TableName: this._tableName,
      Item: item,
    };
  }

  async create() {
    // THIS NEED TO COME BEFORE THE CREATE ATTRIBUTES!
    const relAttributes = this.relationsUpdateAttributes;
    const attributes = this.createAttributes;

    const transactItems = [
      {
        Put: this.createAttributes,
      },
      ...relAttributes,
    ];

    await this._dynamodb.transactWrite({
      TransactItems: transactItems,
    }).promise();

    this.attributes = this.parseDynamoAttributes(attributes.Item);
    return this;
  }

  get updateAttributes() {
    if (!this.valid) throw new Error('The instance is invalid');

    if (this._primaryKey == null) throw new Error('Primary Key property should be set');
    if (this._secondaryKey == null) throw new Error('Secondary Key property should be set');

    const item = this.dynamoAttributes;

    const opts = Object.entries(item).reduce((agg, [key, value]) => {
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
      opts.UpdateExpression = `${opts.UpdateExpression}, #${this._createdAtKey} = if_not_exists(#${this._createdAtKey}, :${this._createdAtKey})`;
    }

    if (this._updatedAtKey) {
      opts.ExpressionAttributeNames[`#${this._updatedAtKey}`] = this._updatedAtKey;
      opts.ExpressionAttributeValues[`:${this._updatedAtKey}`] = now;
      opts.UpdateExpression = `${opts.UpdateExpression}, #${this._updatedAtKey} = :${this._updatedAtKey}`;
    }

    const ret: AWS.DynamoDB.DocumentClient.Update = {
      TableName: this._tableName,
      Key: this.finalDynamoDBKey,
      ...opts,
    };

    return ret;
  }

  async update() {
    // THIS NEED TO BE CALLED IN THIS ORDER!
    const relAttributes = this.relationsUpdateAttributes;
    const attributes = this.updateAttributes;

    const transactItems = [
      {
        Update: attributes,
      },
      ...relAttributes,
    ];

    await this._dynamodb.transactWrite({
      TransactItems: transactItems,
    }).promise();

    const {
      Item: item,
    } = await this._dynamodb.get({
      TableName: attributes.TableName,
      Key: attributes.Key,
    }).promise();

    if (item) this.attributes = this.parseDynamoAttributes(item);
    return this;
  }

  // ---------------- INSTANCE METHODS ----------------
}
