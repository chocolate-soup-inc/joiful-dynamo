/* eslint-disable no-await-in-loop */
import _ from 'lodash';
import {
  getCreatedAtKey,
  getHasManyModel,
  getHasManyNotNestedModels,
  getHasOneModel,
  getHasOneNotNestedModels,
  getPrimaryKey,
  getRelationDescriptors,
  getSecondaryKey,
  getTableDynamoDbInstance,
  getTableName,
  getUpdatedAtKey,
  validateAttributes,
} from '../Decorators';
import { getBelongsToModel, getBelongsToModels, getHasFromBelong } from '../Decorators/belongsTo';
import { getParentForeignKeys, getForeignKeys } from '../Decorators/relationHelpers';
import { QueryOptions, ScanOptions } from '../utils/DynamoEntityTypes';
import { BasicEntity } from './BasicEntity';
import { DynamoPaginator } from './DynamoPaginator';

export class DynamoEntity extends BasicEntity {
  /**
   * Entity constructor.
   * @param {Record<string, any>} item - Object containing initial attributes to be set.
   * @returns {Entity} - New entity instance
   */
  constructor(item?: Record<string, any>) {
    super(item);

    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);
    this.update = this.update.bind(this);
    this.load = this.load.bind(this);
    this.removeEntityFromKey = this.removeEntityFromKey.bind(this);
  }

  // ---------------- BASIC SETTINGS ----------------

  /** @internal */
  get _dynamodb() { return getTableDynamoDbInstance(this.constructor); }

  /** @internal */
  static get _dynamodb() { return this.prototype._dynamodb; }

  /** @internal */
  get _tableName() { return getTableName(this.constructor); }

  /** @internal */
  static get _tableName() { return this.prototype._tableName; }

  /** @internal */
  get _entityName() { return this.constructor.name; }

  /** @internal */
  static get _entityName() { return this.name; }

  /** @internal */
  get _primaryKey() { return getPrimaryKey(this); }

  /** @internal */
  static get _primaryKey() { return this.prototype._primaryKey; }

  /** @internal */
  get _secondaryKey() { return getSecondaryKey(this); }

  /** @internal */
  static get _secondaryKey() { return this.prototype._secondaryKey; }

  /** @internal */
  get _createdAtKey() { return getCreatedAtKey(this); }

  /** @internal */
  static get _createdAtKey() { return this.prototype._createdAtKey; }

  /** @internal */
  get _updatedAtKey() { return getUpdatedAtKey(this); }

  /** @internal */
  static get _updatedAtKey() { return this.prototype._updatedAtKey; }

  // ---------------- BASIC SETTINGS ----------------

  // ---------------- TABLE SUPPORT METHODS ----------------

  protected static initialize(item: Record<string, any>) {
    if (item._entityName === this._entityName) {
      return new this(this.prototype.parseDynamoAttributes(item));
    }

    for (const relationDescriptor of getRelationDescriptors(this.prototype)) {
      const {
        model: ModelClass,
      } = relationDescriptor;

      if (item._entityName === ModelClass.name) {
        return new ModelClass(ModelClass.prototype.parseDynamoAttributes(item));
      }
    }

    throw new Error('Queried a non recognized entity');
  }

  protected static createPaginator(method, opts) {
    return new DynamoPaginator({
      method,
      opts,
      tableName: this._tableName,
      initializer: this.initialize.bind(this),
    });
  }

  protected prepareEntityAttributeNameAndValue(opts) {
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

  protected prepareEntityExpression(opts, key: string) {
    if (
      Object.values(opts?.ExpressionAttributeNames || {}).includes('_entityName')
      || (opts?.[key] || '').includes('_entityName')
    ) {
      return opts;
    }

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

  protected prepareOptsForScanAndQuery(opts) {
    return this.prepareEntityExpression(opts, 'FilterExpression');
  }

  protected static prepareOptsForScanAndQuery(opts) {
    return this.prototype.prepareOptsForScanAndQuery(opts);
  }

  protected prepareOptsForDelete(opts) {
    return this.prepareEntityExpression(opts, 'ConditionExpression');
  }

  protected static prepareOptsForDelete(opts) {
    return this.prototype.prepareOptsForDelete(opts);
  }

  protected static async _query(opts: AWS.DynamoDB.QueryInput) {
    const queryParams = this.prepareOptsForScanAndQuery(opts);

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('QUERY PARAMS', queryParams);
    }

    const response = await this._dynamodb.query(queryParams).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('QUERY RESPONSE', response);
    }

    return response;
  }

  protected static async _queryWithChildrenRecords(opts: AWS.DynamoDB.QueryInput) {
    const {
      opts: newOpts,
      attributeName,
      attributeValue,
    } = this.prototype.prepareEntityAttributeNameAndValue(opts);

    const attributeValues: string[] = [attributeValue];

    for (const relationDescriptor of getRelationDescriptors(this.prototype)) {
      const {
        opts: descriptorOpts,
        model: ModelClass,
        propertyKey: relationName,
      } = relationDescriptor;

      if (descriptorOpts?.indexName === opts.IndexName) {
        const key = `:_relationDescriptor_${relationName}`;
        newOpts.ExpressionAttributeValues[key] = ModelClass.name;
        attributeValues.push(key);
      }
    }

    const customFilter = `${attributeName} in (${attributeValues.join(', ')})`;

    if (newOpts?.FilterExpression) {
      newOpts.FilterExpression = `${newOpts.FilterExpression} and ${customFilter}`;
    } else {
      newOpts.FilterExpression = customFilter;
    }

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('QUERY RELATED PARAMS', newOpts);
    }

    const response = await this._dynamodb.query(newOpts).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('QUERY RELATED RESPONSE', response);
    }

    return response;
  }

  protected static async _scan(opts: AWS.DynamoDB.ScanInput) {
    const scanOpts = this.prepareOptsForScanAndQuery(opts);

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('SCAN PARAMS', scanOpts);
    }

    const response = await this._dynamodb.scan(scanOpts).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('SCAN RESPONSE', response);
    }

    return response;
  }

  /** @internal */
  protected get transfomedKey() {
    const key = {};
    const newValue = validateAttributes(this, this.transformedAttributes, false);

    if (this._primaryKey != null) key[this._primaryKey] = newValue[this._primaryKey];
    if (this._secondaryKey != null) key[this._secondaryKey] = newValue[this._secondaryKey];

    return key;
  }

  protected get primaryKeyDynamoDBValue() {
    if (this._primaryKey == null) return undefined;

    const currentValue = this.transfomedKey[this._primaryKey];
    if (currentValue == null) return undefined;

    return `${this._entityName}-${currentValue}`;
  }

  protected get secondaryKeyDynamoDBValue() {
    if (this._secondaryKey == null) return undefined;

    const currentValue = this.transfomedKey[this._secondaryKey];
    if (currentValue == null) return undefined;

    return `${this._entityName}-${currentValue}`;
  }

  /**
   * Returns the dynamodb key based on the primary and secondary key without the entityName added to them.
   */
  get dbKey() {
    return this.transfomedKey;
  }

  /**
   * Returns the dynamodb key based on the primary and secondary key already with the entityName added to them.
   */
  get transformedDBKey() {
    const key: Record<string, any> = {};

    if (this._secondaryKey != null && getForeignKeys(this).includes(this._secondaryKey)) {
      key[this._secondaryKey] = this.primaryKeyDynamoDBValue;
    }

    if (this._primaryKey) {
      key[this._primaryKey] = this.primaryKeyDynamoDBValue;
    }

    if (this._secondaryKey && key[this._secondaryKey] == null) {
      const parentForeignKeys = getParentForeignKeys(this);
      if (Object.keys(parentForeignKeys).includes(this._secondaryKey)) {
        const v = this.transfomedKey[this._secondaryKey];
        if (v == null) {
          key[this._secondaryKey] = v;
        } else {
          key[this._secondaryKey] = `${parentForeignKeys[this._secondaryKey]}-${v}`;
        }
      } else {
        key[this._secondaryKey] = this.secondaryKeyDynamoDBValue;
      }
    }

    return key;
  }

  protected static transformedDBKey(key: AWS.DynamoDB.DocumentClient.Key) {
    return new this(key).transformedDBKey;
  }

  protected removeEntityFromKey(key: AWS.DynamoDB.DocumentClient.Key): AWS.DynamoDB.DocumentClient.Key {
    const finalKey: AWS.DynamoDB.DocumentClient.Key = {};
    [this._primaryKey, this._secondaryKey].forEach((_key) => {
      if (_key != null) {
        const entityName = getParentForeignKeys(this)[_key] || this._entityName;
        const value = key[_key];
        if (value != null) {
          finalKey[_key] = key[_key].toString().replace(`${entityName}-`, '');
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
  /**
   * Deletes an item with the specified key from the database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property">aws-sdk documentclient delete method</a>.
   * @param {AWS.DynamoDB.DocumentClient.Key} key - This argument should be the key before preparing it to save to the database. See example for more details.
   * @remarks
   * &nbsp;
   * - The model primary key and secondary key are automatically converted to the pattern of how data is saved to the database.
   * - If the record does not exist, it throws an error. If the record exists, it returns the attributes of the delete object as it is on the AWS SDK response.
   *
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   * }
   *
   * await Model.deleteItem({ pk: '1', sk: '2' }); // This will delete a record in the database with pk as 'Model-1' and sk as 'Model-2'.
   * ```
   */
  static async deleteItem(key: AWS.DynamoDB.DocumentClient.Key) {
    const deleteParams = this.prepareOptsForDelete({
      TableName: this._tableName,
      Key: this.transformedDBKey(key),
      ReturnValues: 'ALL_OLD',
    });

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('DELETE PARAMS', deleteParams);
    }

    const response = await this._dynamodb.delete(deleteParams).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('DELETE RESPONSE', response);
    }

    if (response.Attributes == null) {
      throw new Error('Item does not exist.');
    }

    return response.Attributes;
  }

  /**
   * Retrieve an item with the specified key from the database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property">aws-sdk documentclient get method</a>.
   * @param {AWS.DynamoDB.DocumentClient.Key} key - This argument should be the key before preparing it to save to the database. See example for more details.
   * @param {boolean} [includeRelated = false] - If this argument is true, the related children will be included. This will only work for children with a foreign key and index set. For each children group (hasOne or hasMany) a query on the foreign key index will be made.
   * @remarks
   * &nbsp;
   * - The model primary key and secondary key are automatically converted to the pattern of how data is saved to the database.
   * - If the record does not exist, it throws an error. If the record exists, it returns a new instance of the model with the attributes already set.
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   * }
   *
   * const instance = await Model.getItem({ pk: '1', sk: '2' }); // This will retrieve a record in the database with pk as 'Model-1' and sk as 'Model-2'.
   * console.log(instance.pk) // '1'
   * ```
   */
  static async getItem(key: AWS.DynamoDB.DocumentClient.Key, includeRelated = false) {
    const getParams = {
      TableName: this._tableName,
      Key: this.transformedDBKey(key),
    };

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('GET PARAMS', getParams);
    }

    const response = await this._dynamodb.get(getParams).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('GET RESPONSE', response);
    }

    const {
      Item: item,
    } = response;

    if (item) {
      const instance = this.initialize(item);
      if (includeRelated) await instance.queryRelated();
      return instance;
    }

    return undefined;
  }

  /**
   * Queries the database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property">aws-sdk documentclient query method</a>.
   * @param {QueryOptions} opts - A list of options to be used by the query method. Similar to do the options from <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property">aws-sdk documentclient query metod]</a>
   * @returns {DynamoPaginator} - A paginator instance.
   * @remarks
   * &nbsp;
   * - It automatically filter the results to return only the ones matching the current class entity name using a condition expression.
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   * }
   *
   * const paginator = await Model.query({
   *   IndexName: 'bySk',
   *   KeyConditionExpression: 'sk = :v',
   *   ExpressionAttributeValues: {
   *     ':v': 'TestModel-query-2',
   *   },
   * });
   *
   * console.log(paginator.items) // Returns an array of instances of Model class.
   * console.log(paginator.morePages) // Boolean meaning if there are more records available or not.
   * await paginator.next(); // Fetches the next page if it exists.
   * console.log(paginator.items) // Returns an array of all fetched instances of Model class.
   * console.log(paginator.lastPageItems) // Returns an array of last page fetched instances of Model class.
   * ```
   */
  static async query(opts: QueryOptions) {
    const paginator = this.createPaginator(this._query.bind(this), opts);
    await paginator.next();
    return paginator;
  }

  /**
   * Queries the database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property">aws-sdk documentclient query method</a>.
   * @param {QueryOptions} opts - A list of options to be used by the query method. Similar to do the options from <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property">aws-sdk documentclient query metod]</a>
   * @returns {DynamoPaginator} - A paginator instance.
   * @remarks
   * &nbsp;
   * - It automatically filter the results to return only the ones matching the current class entity, and all the children records who are related to the current class through the same index being used with a condition expression.
   * - The children are not initialized in the parent model (this could be done through an improvement to the library, but is not implemented yet.)
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   *
   *   @hasMany(HasManyChild, { nestedObject: false, foreignKey: 'fk', indexName: 'byFK' })
   *   children: HasManyChild[]
   *
   *   @hasOne(HasOneChild, { nestedObject: false, foreignKey: 'fk2', indexName: 'byFK2' })
   *   child: HasOneChild
   * }
   *
   * const paginator = await Model.queryWithChildrenRecords({
   *   IndexName: 'byFK',
   *   KeyConditionExpression: 'fk = :v',
   *   ExpressionAttributeValues: {
   *     ':v': 'Model-1',
   *   },
   * });
   *
   * console.log(paginator.items) // Returns an array of instances of Model class and HasManyChild class. As HasOneChild is related through another foreignKey, it is excluded.
   * console.log(paginator.morePages) // Boolean meaning if there are more records available or not.
   * await paginator.next(); // Fetches the next page if it exists.
   * console.log(paginator.items) // Returns an array of all fetched instances of Model and HasManyChild classes.
   * console.log(paginator.lastPageItems) // Returns an array of last page fetched instances of Model and HasManyChild classes.
   * ```
   */
  static async queryWithChildrenRecords(opts: QueryOptions) {
    const paginator = this.createPaginator(this._queryWithChildrenRecords.bind(this), opts);
    await paginator.next();
    return paginator;
  }

  /**
   * Similar to the {@link Entity.query | query method}, but automatically queries all the pages until there are no more records.
   * @returns {DynamoPaginator} - A paginator instance.
   */
  static async queryAll(opts: QueryOptions) {
    const paginator = await this.createPaginator(this._query.bind(this), opts);
    return paginator.getAll();
  }

  /**
   * Similar to the {@link Entity.queryWithChildrenRecords | query with children records method}, but automatically queries all the pages until there are no more records.
   * @returns {DynamoPaginator} - A paginator instance.
   */
  static async queryAllWithChildrenRecords(opts: QueryOptions) {
    const paginator = await this.createPaginator(this._queryWithChildrenRecords.bind(this), opts);
    return paginator.getAll();
  }

  /**
   * Scans the database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property">aws-sdk documentclient scan method</a>.
   * @param {ScanOptions} opts - A list of options to be used by the scan method. Similar to do the options from <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property">aws-sdk documentclient scan metod]</a>
   * @returns {DynamoPaginator} - A paginator instance.
   * @remarks
   * &nbsp;
   * - It automatically filter the results to return only the ones matching the current class entity name using a condition expression.
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   * }
   *
   * const paginator = await Model.scan();
   *
   * console.log(paginator.items) // Returns an array of instances of Model class.
   * console.log(paginator.morePages) // Boolean meaning if there are more records available or not.
   * await paginator.next(); // Fetches the next page if it exists.
   * console.log(paginator.items) // Returns an array of all fetched instances of Model class.
   * console.log(paginator.lastPageItems) // Returns an array of last page fetched instances of Model class.
   * ```
   */
  static async scan(opts?: ScanOptions) {
    const paginator = this.createPaginator(this._scan.bind(this), opts);
    await paginator.next();
    return paginator;
  }

  /**
   * Similar to the {@link Entity.scan | scan method}, but automatically queries all the pages until there are no more records.
   * @returns {DynamoPaginator} - A paginator instance.
   */
  static async scanAll(opts?: ScanOptions) {
    const paginator = await this.createPaginator(this._scan.bind(this), opts);
    return paginator.getAll();
  }
  // ---------------- TABLE METHODS ----------------

  // ---------------- INSTANCE SUPPORT METHODS ----------------

  toJSON() {
    if (this.valid) {
      return {
        key: this.dbKey,
        data: this.transformedAttributes,
        validatedData: this.validatedAttributes,
      };
    }

    return {
      key: this.dbKey,
      error: this.error?.message,
      data: this.transformedAttributes,
    };
  }

  /** @internal */
  get dynamoAttributes() {
    let attributes = this.validatedAttributes;

    if (Object.keys(attributes).length === 0) {
      throw new Error('You cannot save an instance with no attributes at all.');
    }

    attributes._entityName = this._entityName;
    attributes = {
      ...attributes,
      ...this.transformedDBKey,
    };

    for (const key of getForeignKeys(this)) {
      attributes[key] = this.primaryKeyDynamoDBValue;
    }

    return attributes;
  }

  /** @internal */
  parseDynamoAttributes(item: Record<string, any>) {
    delete item._entityName;

    return {
      ...item,
      ...this.removeEntityFromKey(item),
    };
  }

  /** @internal */
  async queryRelated() {
    for (const { listMethod, itemMethod, type } of [{
      listMethod: getHasManyNotNestedModels,
      itemMethod: getHasManyModel,
      type: 'hasMany',
    }, {
      listMethod: getHasOneNotNestedModels,
      itemMethod: getHasOneModel,
      type: 'hasOne',
    }, {
      listMethod: getBelongsToModels,
      itemMethod: getBelongsToModel,
      type: 'belongsTo',
    }]) {
      const modelNames = listMethod(this);

      for (const modelName of modelNames) {
        const {
          model: ChildModel,
          opts: {
            foreignKey = undefined,
            indexName = undefined,
            parentPropertyOnChild = undefined,
          } = {},
        } = itemMethod(this, modelName) || {};

        if (foreignKey != null && indexName != null) {
          let fkValue = this[foreignKey];
          if ([this._primaryKey, this._secondaryKey].includes(foreignKey)) {
            fkValue = this.transformedDBKey[foreignKey];
          }

          const {
            items,
          } = await ChildModel.queryAll({
            IndexName: indexName,
            ExpressionAttributeNames: {
              '#_fk': foreignKey,
            },
            ExpressionAttributeValues: {
              ':_fk': fkValue,
            },
            KeyConditionExpression: '#_fk = :_fk',
          });

          if (parentPropertyOnChild) {
            items.forEach((item) => {
              item[parentPropertyOnChild] = this;
            });

            if (type === 'hasMany') {
              this[modelName] = items;
            } else if (type === 'hasOne') {
              // eslint-disable-next-line prefer-destructuring
              this[modelName] = items[0];
            } else if (type === 'belongsTo') {
              const {
                propertyKey,
                type: parentType,
              } = getHasFromBelong(this, foreignKey, indexName, parentPropertyOnChild) || {};

              for (const parent of items) {
                if (propertyKey) {
                  if (parentType === 'hasOne') {
                    parent[propertyKey] = this;
                  } else if (parentType === 'hasMany') {
                    parent[propertyKey] = [this];
                  }
                }

                this[modelName] = parent;
              }
            }
          }
        }
      }
    }
  }

  // ---------------- INSTANCE SUPPORT METHODS ----------------

  // ---------------- INSTANCE METHODS ----------------

  /**
   * Retrieve current item data from the database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property">aws-sdk documentclient get method</a>.
   * @param {boolean} [includeRelated = false] - If this argument is true, the related children will be included. This will only work for children with a foreign key and index set. For each children group (hasOne or hasMany) a query on the foreign key index will be made.
   * @remarks
   * &nbsp;
   * - The model primary key and secondary key are automatically converted to the pattern of how data is saved to the database.
   * - If the record does not exist, it throws an error. If the record exists, it updates the current instance attributes and return the instance.
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   * }
   *
   * const instance = new Model({ pk: '1', sk: '2' });
   * await instance.load();
   * console.log(instance.otherAttributeFromDatabase) // value loaded from the database.
   * ```
   */
  async load(includeRelated = false) {
    const pk = this._primaryKey;
    // const sk = this._secondaryKey;

    // if (pk == null || sk == null) {
    if (pk == null) {
      throw new Error('primary key and/or secondary key props not set');
    }

    const loadParams = {
      TableName: this._tableName,
      Key: this.transformedDBKey,
    };

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('LOAD PARAMS', loadParams);
    }

    const response = await this._dynamodb.get(loadParams).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('LOAD RESPONSE', response);
    }

    const {
      Item: item,
    } = response;

    if (item) {
      this.attributes = this.parseDynamoAttributes(item);
      if (includeRelated) await this.queryRelated();
    } else {
      throw new Error('Record not found.');
    }
  }

  /** @internal */
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

  /** @internal */
  get createAttributes() {
    if (!this.valid) throw new Error('The instance is invalid');

    if (this._primaryKey == null) throw new Error('Primary Key property should be set');
    // if (this._secondaryKey == null) throw new Error('Secondary Key property should be set');

    const item = this.dynamoAttributes;

    const now = new Date().toISOString();

    if (this._createdAtKey) item[this._createdAtKey] = now;
    if (this._updatedAtKey) item[this._updatedAtKey] = now;

    return {
      TableName: this._tableName,
      Item: item,
    };
  }

  /**
   * Creates the current item in database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property">aws-sdk documentclient put method</a>.
   * @remarks
   * &nbsp;
   * - The model primary key and secondary key are automatically converted to the pattern of how data is saved to the database.
   * - The createdAt and updatedAt are also set if the class contains a prop for them.
   * - A _entity column is also added to the attributes with the current class name.
   * - If the record already exists, it gets overwritten.
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   * }
   *
   * const instance = new Model({ pk: '1', sk: '2' });
   * await instance.create();
   * ```
   */
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

    const createParams = {
      TransactItems: transactItems,
    };

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('CREATE PARAMS', createParams);
    }

    const response = await this._dynamodb.transactWrite(createParams).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('CREATE RESPONSE', response);
    }

    this.attributes = this.parseDynamoAttributes(attributes.Item);
    return this;
  }

  /** @internal */
  get updateAttributes() {
    if (!this.valid) throw new Error('The instance is invalid');

    if (this._primaryKey == null) throw new Error('Primary Key property should be set');
    // if (this._secondaryKey == null) throw new Error('Secondary Key property should be set');

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
      Key: this.transformedDBKey,
      ...opts,
    };

    return ret;
  }

  /**
   * Updates or creates the current item in database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property">aws-sdk documentclient update method</a>.
   * @remarks
   * &nbsp;
   * - The model primary key and secondary key are automatically converted to the pattern of how data is saved to the database.
   * - If the record is new, the createdAt is set.
   * - If the record is new or not, the updatedAt is set.
   * - A _entity column is also added to the attributes with the current class name.
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   * }
   *
   * const instance = new Model({ pk: '1', sk: '2' });
   * await instance.update();
   * ```
   */
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

    const updateParams = {
      TransactItems: transactItems,
    };

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('UPDATE PARAMS', updateParams);
    }

    const response = await this._dynamodb.transactWrite(updateParams).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('UPDATE RESPONSE', response);
    }

    const getParams = {
      TableName: attributes.TableName,
      Key: attributes.Key,
    };

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('GET PARAMS', getParams);
    }

    const getResponse = await this._dynamodb.get(getParams).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('GET RESPONSE', getResponse);
    }

    const {
      Item: item,
    } = getResponse;

    if (item) this.attributes = this.parseDynamoAttributes(item);
    return this;
  }

  /**
   * Deletes this record from the database using the <a target="_blank" href="https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property">aws-sdk documentclient delete method</a>.
   * @remarks
   * &nbsp;
   * - The model primary key and secondary key are automatically converted to the pattern of how data is saved to the database.
   * - If the record does not exist, it throws an error. If the record exists, it returns the attributes of the delete object as it is on the AWS SDK response.
   *
   * @example
   * ```
   * class Model extends Entity {
   *   @prop({ primaryKey: true });
   *   pk: string;
   *
   *   @prop({ secondaryKey: true });
   *   sk: string;
   * }
   *
   * const instance = new Model({ pk: '1', sk: '2' });
   * await instance.delete(); // This will delete a record in the database with pk as 'Model-1' and sk as 'Model-2'.
   * ```
   */
  async delete() {
    const deleteParams = this.prepareOptsForDelete({
      TableName: this._tableName,
      Key: this.transformedDBKey,
      ReturnValues: 'ALL_OLD',
    });

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('DELETE PARAMS', deleteParams);
    }

    const response = await this._dynamodb.delete(deleteParams).promise();

    if (process.env.JOIFUL_DYNAMO_DEBUG) {
      console.log('DELETE RESPONSE', response);
    }

    if (response.Attributes == null) {
      throw new Error('Item does not exist.');
    }

    return response.Attributes;
  }

  // ---------------- INSTANCE METHODS ----------------
}
