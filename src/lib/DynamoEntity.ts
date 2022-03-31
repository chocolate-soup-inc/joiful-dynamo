/* eslint-disable no-await-in-loop */
import {
  DeleteCommand,
  DeleteCommandInput,
  GetCommand,
  GetCommandInput,
  QueryCommandInput,
  ScanCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommandInput,
  paginateScan,
  paginateQuery,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

import _ from 'lodash';
import { Relation } from './decorators/reflections/relations';

import { DynamoPaginator } from './DynamoPaginator';

import {
  Entity,
  entityColumnName,
} from './Entity';

type TransactWriteItems = TransactWriteCommandInput['TransactItems'];

type TransactUpdateInput = Omit<UpdateCommandInput, 'UpdateExpression'> & {
  UpdateExpression: string;
};

type ScanOptions = Omit<ScanCommandInput, 'TableName'> & {
  TableName?: string;
};

type QueryOptions = Omit<QueryCommandInput, 'TableName'> & {
  TableName?: string;
};

function isQueryInput(opts: QueryCommandInput | ScanCommandInput): opts is QueryCommandInput {
  return Object.keys(opts).includes('KeyConditionExpression');
}
export class DynamoEntity extends Entity {
  protected static get childrenRelations() {
    return this.prototype.childrenRelations;
  }

  protected static initialize(item: Record<string, any>): DynamoEntity {
    if (item[entityColumnName] === this._entityName) {
      return new this(item);
    }

    const targetEntity = this.childrenRelations.find((relation) => (
      relation.entityName === item[entityColumnName]
    ));

    if (targetEntity != null) return new targetEntity.Model(item);

    throw new Error('Queried a non recognized entity.');
  }

  static addEntitiesToFilterExpression(
    opts: QueryCommandInput | ScanCommandInput,
    entityNames: string[] = [],
  ): QueryCommandInput | ScanCommandInput {
    if (
      Object.values(opts.ExpressionAttributeNames || []).includes(entityColumnName)
      || Object.values(opts.FilterExpression || '').includes(entityColumnName)
      || (
        isQueryInput(opts)
        && Object.values(opts.KeyConditionExpression || '').includes(entityColumnName)
      )
    ) {
      // Entity Name column is already in the query
      return opts;
    }

    if (!entityNames.includes(this._entityName)) entityNames.push(this._entityName);

    opts.ExpressionAttributeNames = {
      ...opts.ExpressionAttributeNames,
      [`#${entityColumnName}`]: entityColumnName,
    };

    opts.ExpressionAttributeValues = {
      ...entityNames.reduce((acc, entityName) => ({
        [`:_${entityColumnName}_${entityName}`]: entityName,
        ...acc,
      }), {} as Record<string, any>),
      ...opts.ExpressionAttributeValues,
    };

    const filterExpression = `#${entityColumnName} in (${entityNames.map((entityName) => `:_${entityColumnName}_${entityName}`).join(', ')})`;

    if (opts.FilterExpression) {
      opts.FilterExpression = `${opts.FilterExpression} AND ${filterExpression}`;
    } else {
      opts.FilterExpression = filterExpression;
    }

    return opts;
  }

  protected static generateCommandParams(params?: ScanOptions | QueryOptions, entityNames?: string[]) {
    const finalParams: QueryCommandInput | ScanCommandInput = {
      TableName: this._tableName || '',
      ...(params || {}),
    };

    return this.addEntitiesToFilterExpression(finalParams, entityNames);
  }

  protected static createPaginator(commandParams: QueryCommandInput | ScanCommandInput) {
    const method = isQueryInput(commandParams) ? paginateQuery : paginateScan;
    const paginator = method({
      client: this._dynamodb,
      pageSize: commandParams.Limit || 100,
    }, commandParams);
    return new DynamoPaginator(paginator, this.initialize.bind(this));
  }

  static async scan(opts?: ScanOptions) {
    const paginator = this.createPaginator(this.generateCommandParams(opts));
    await paginator.next();
    return paginator;
  }

  static async scanAll(opts?: ScanOptions) {
    const paginator = this.createPaginator(this.generateCommandParams(opts));
    await paginator.getAll();
    return paginator;
  }

  static async query(opts: QueryOptions) {
    const paginator = this.createPaginator(this.generateCommandParams(opts));
    await paginator.next();
    return paginator;
  }

  static async queryAll(opts: QueryOptions) {
    const paginator = this.createPaginator(this.generateCommandParams(opts));
    await paginator.getAll();
    return paginator;
  }

  async loadWithRelated() {
    const relations = this.childrenRelations.concat(this.parentRelations);

    const queries: {
      queryOpts: QueryCommandInput;
      relation: Relation;
    }[] = [];

    for (const relation of relations) {
      const {
        opts,
        foreignKey,
      } = relation;

      if (
        opts?.nestedObject !== true
        && opts?.indexName != null
        && foreignKey != null
      ) {
        const transformedAttributes = this.transformAttributes();
        queries.push({
          queryOpts: {
            TableName: this._tableName,
            IndexName: opts?.indexName,
            ExpressionAttributeNames: { '#fk': foreignKey },
            ExpressionAttributeValues: { ':fk': `${this._entityPrefix}${transformedAttributes[foreignKey] || this[foreignKey]}` },
            KeyConditionExpression: '#fk = :fk',
          },
          relation,
        });
      }
    }

    for (const [key, groupedRelations] of Object.entries(
      _.groupBy(queries, (i) => JSON.stringify(i.queryOpts)),
    )) {
      let result: Record<string, any>[] | undefined = [];

      if (key != null && typeof key === 'string') {
        const queryOpts = JSON.parse(key);
        ({
          Items: result,
        } = await this._dynamodb.send(new QueryCommand(queryOpts)));
      }

      if (result && result.length > 0) {
        const myAttributes = result.find((r) => r[entityColumnName] === this._entityName);

        if (myAttributes) {
          this.attributes = myAttributes;
        }

        for (const { relation } of groupedRelations) {
          if (relation.propertyName != null) {
            const relationItems = result.filter((item) => (
              item[entityColumnName] === relation.entityName
            ));

            if (relation.type === 'hasMany') {
              this[relation.propertyName] = relationItems.map((item) => relation.Model.initialize(_.cloneDeep(item)));
            } else if (relation.type === 'hasOne') {
              this[relation.propertyName] = relation.Model.initialize(_.cloneDeep(relationItems[0]));
            } else if (relation.type === 'belongsTo') {
              this[relation.propertyName] = relation.Model.initialize(_.cloneDeep(relationItems[0]));
            }
          }
        }
      }
    }

    return this;
  }

  get entityConditionExpressionOpts() {
    return {
      ExpressionAttributeNames: {
        [`#${entityColumnName}`]: entityColumnName,
      },
      ExpressionAttributeValues: {
        [`:${entityColumnName}`]: this._entityName,
      },
      ConditionExpression: `#${entityColumnName} = :${entityColumnName}`,
    };
  }

  async delete(opts?: DeleteCommandInput) {
    try {
      const response = await this._dynamodb.send(new DeleteCommand({
        TableName: this._tableName || '',
        Key: this.dbKey,
        ReturnValues: 'ALL_OLD',
        ...this.entityConditionExpressionOpts,
        ...opts,
      }));

      if (response.Attributes == null) throw new Error('Record not found.');
      return response;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Record not found.');
      }

      throw error;
    }
  }

  static async deleteItem(key: Record<string, any>, opts?: DeleteCommandInput) {
    const instance = new this(key);
    return instance.delete(opts);
  }

  async load(opts?: GetCommandInput) {
    const {
      Item: item,
    } = await this._dynamodb.send(new GetCommand({
      TableName: this._tableName || '',
      Key: this.dbKey,
      ...opts,
    }));

    if (item) {
      this.attributes = item;
      return this;
    }

    throw new Error('Record not found.');
  }

  static async getItem(key: Record<string, any>, opts?: GetCommandInput) {
    const instance = new this(key);
    return instance.load(opts);
  }

  static async getItemWithRelated(key: Record<string, any>) {
    const instance = new this(key);
    return instance.loadWithRelated();
  }

  protected createTransactions(tableName?: string): TransactWriteItems {
    let transactions: TransactWriteItems = [];

    const attributes = this.dbAttributes;

    Object.entries(attributes).forEach(([key]) => {
      const childRelation = this.childrenRelations.find((rel) => rel.propertyName === key);
      if (childRelation) {
        if (childRelation.type === 'hasMany') {
          this[key].forEach((i) => {
            transactions = (transactions || []).concat(i.updateTransactions() || []);
          });
        } else if (childRelation.type === 'hasOne') {
          transactions = (transactions || []).concat(this[key].updateTransactions() || []);
        }
        delete attributes[key];
      }
    });

    transactions.push({
      Put: {
        TableName: tableName || this._tableName || '',
        Item: attributes,
      },
    });

    return transactions.filter((i) => !_.isEmpty(i));
  }

  async create() {
    await this._dynamodb.send(new TransactWriteCommand({
      TransactItems: this.createTransactions(),
    }));

    return this;
  }

  static async create(attributes: Record<string, any>) {
    const instance = new this(attributes);
    return instance.create();
  }

  protected updateTransactions(tableName?: string): TransactWriteItems {
    let transactions: TransactWriteItems = [];

    const attributes = this.dbAttributes;

    Object.entries(attributes).forEach(([key]) => {
      const childRelation = this.childrenRelations.find((rel) => rel.propertyName === key);
      if (childRelation) {
        if (childRelation.type === 'hasMany') {
          this[key].forEach((i) => {
            transactions = (transactions || []).concat(i.updateTransactions() || []);
          });
        } else if (childRelation.type === 'hasOne') {
          transactions = (transactions || []).concat(this[key].updateTransactions() || []);
        }
        delete attributes[key];
      }
    });

    const updateAttributes = Object.entries(attributes).reduce((acc, [key, value]) => {
      if ([this._primaryKey, this._secondaryKey, this._createdAtKey, this._updatedAtKey].includes(key)) {
        return acc;
      }

      if (acc.ExpressionAttributeNames == null) {
        acc.ExpressionAttributeNames = {};
      }
      acc.ExpressionAttributeNames[`#${key}`] = key;

      if (acc.ExpressionAttributeValues == null) {
        acc.ExpressionAttributeValues = {};
      }
      acc.ExpressionAttributeValues[`:${key}`] = value;

      if (acc.UpdateExpression == null) {
        acc.UpdateExpression = `SET #${key} = :${key}`;
      } else {
        acc.UpdateExpression += `, #${key} = :${key}`;
      }

      return acc;
    }, {} as TransactUpdateInput);

    updateAttributes.TableName = tableName || this._tableName || '';
    updateAttributes.Key = this.dbKey;

    const now = new Date().toISOString();

    if (
      updateAttributes.ExpressionAttributeNames == null
      || updateAttributes.ExpressionAttributeValues == null
      || updateAttributes.UpdateExpression == null
    ) {
      throw new Error(`Bad update attributes: ${JSON.stringify(updateAttributes)}`);
    }

    if (this._createdAtKey) {
      updateAttributes.ExpressionAttributeNames[`#${this._createdAtKey}`] = this._createdAtKey;
      updateAttributes.ExpressionAttributeValues[`:${this._createdAtKey}`] = now;
      updateAttributes.UpdateExpression = `${updateAttributes.UpdateExpression}, #${this._createdAtKey} = if_not_exists(#${this._createdAtKey}, :${this._createdAtKey})`;
    }

    if (this._updatedAtKey) {
      updateAttributes.ExpressionAttributeNames[`#${this._updatedAtKey}`] = this._updatedAtKey;
      updateAttributes.ExpressionAttributeValues[`:${this._updatedAtKey}`] = now;
      updateAttributes.UpdateExpression = `${updateAttributes.UpdateExpression}, #${this._updatedAtKey} = :${this._updatedAtKey}`;
    }

    transactions.push({
      Update: updateAttributes,
    });

    return transactions;
  }

  async update() {
    await this._dynamodb.send(new TransactWriteCommand({
      TransactItems: this.updateTransactions(),
    }));

    if (this._createdAtKey != null) {
      // THIS NEW LOAD IS NECESSARY TO CORRECTLY SET THE CREATED AT ATTRIBUTE
      const newLoad = await (this.constructor as typeof DynamoEntity).getItem(this.dbKey);
      this.setAttributes(newLoad.attributes, {
        doNotSetDirty: false,
      });
      return newLoad;
    }

    return this;
  }

  static async update(attributes: Record<string, any>) {
    const instance = new this(attributes);
    return instance.update();
  }
}
