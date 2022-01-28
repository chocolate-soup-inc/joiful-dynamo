import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Entity } from 'dynamodb-toolbox';
import { queryOptions, scanOptions } from 'dynamodb-toolbox/dist/classes/Table';
import * as Joi from 'joi';
import {
  BatchWriteOptions,
  DeleteOptions, GetOptions, PutOptions, UpdateOptions,
} from './dynamodbToolboxTypes';

function createJDModel(
  entity: Entity<{}>,
  joi: Joi.ObjectSchema<{}>,
  attributesAliases: Record<string, undefined | string | string[]>,
  beforeValidate: (attributes: Record<string, any>) => Partial<Record<string, any>> = (attributes) => attributes,
) {
  const jdValidate = (item: Record<string, any>, throwError: boolean = true) => {
    const attributes = beforeValidate(item);
    const { error, warning, value } = joi.validate(attributes || item, {
      convert: true,
    });

    if (error) {
      if (throwError) throw error;
      // eslint-disable-next-line no-console
      // console.error(error);
    }
    // eslint-disable-next-line no-console
    if (warning) console.warn('Validation Warning', warning);
    return value;
  };

  const deleteFunc = (
    item: Record<string, any>,
    options?: DeleteOptions,
    params?: DocumentClient.DeleteItemInput,
  ) => entity.delete(item, options, params);

  const get = (
    item: Record<string, any>,
    options?: GetOptions,
    params?: DocumentClient.GetItemInput,
  ) => entity.get(item, options, params);

  const put = (
    item: Record<string, any>,
    options?: PutOptions,
    params?: DocumentClient.PutItemInput,
  ) => {
    const validatedItem = jdValidate(item);
    return entity.put(validatedItem, options, params);
  };

  const update = (
    item: Record<string, any>,
    options?: UpdateOptions,
    params?: DocumentClient.UpdateItemInput,
  ) => {
    const validatedItem = jdValidate(item);
    return entity.update(validatedItem, options, params);
  };

  const query = async (
    pk: Record<string, any>,
    options?: queryOptions,
    params?: DocumentClient.QueryInput,
  ) => entity.query(pk, options, params);

  const scan = (
    options?: scanOptions,
    params?: DocumentClient.ScanInput,
  ) => entity.scan(options, params);

  const batchWrite = (
    items: Record<string, any>[],
    batchWriteOptions?: BatchWriteOptions,
    params?: DocumentClient.BatchWriteItemInput,
  ) => entity.table.batchWrite(items, batchWriteOptions, params);

  const getTransformedAttributes = async (attributes: Record<string, any>) => {
    const joiTransformedAttributes = jdValidate(attributes, false);
    const dynamodbTransformedAttributes = await entity.put(joiTransformedAttributes, {
      execute: false,
    });

    return dynamodbTransformedAttributes?.Item;
  };

  const allAttributesList = Object.entries(attributesAliases).reduce(
    (agg: (string | undefined)[], [key, aliases]: [string, undefined | string | string[]]) => {
      agg.push(key);
      if (aliases == null) {
        return agg;
      }

      if (typeof aliases === 'string') {
        agg.push(aliases);
        return agg;
      }

      return agg.concat(aliases);
    },
    [] as string[],
  );

  const getFieldAlias = (fieldName: string) => {
    for (const [key, value] of Object.entries(attributesAliases)) {
      if (
        (typeof value === 'string' && value === fieldName)
        || (Array.isArray(value) && value.includes(fieldName))
      ) {
        return key;
      }
    }

    return fieldName;
  };

  const jdModel = class JDModel {
    _attributes: Record<string | symbol, any> = {};

    _validatedAttributes: Record<string | symbol, any> = {};

    entity: Entity<{}>;

    joi: Joi.ObjectSchema<{}>;

    constructor(item?: Record<string, any>) {
      if (item) {
        for (const [key, value] of Object.entries(item)) {
          this.attributes[getFieldAlias(key)] = value;
        }
      }

      this.entity = entity;
      this.joi = joi;

      // eslint-disable-next-line no-constructor-return
      return new Proxy(this, {
        get(target, name, receiver) {
          if (Reflect.has(target, name)) {
            return Reflect.get(target, name, receiver);
          }

          const stringName = name.toString();
          if (allAttributesList.includes(stringName)) {
            return target._attributes[getFieldAlias(stringName)];
          }

          throw new Error(`${String(name)} is not a valid attribute.`);
        },
        set(target, name, value, receiver) {
          if (Reflect.has(target, name)) {
            return Reflect.set(target, name, value, receiver);
          }

          const stringName = name.toString();
          if (allAttributesList.includes(stringName)) {
            target._attributes[getFieldAlias(stringName)] = value;
            return true;
          }
          throw new Error(`${String(name)} is not a valid attribute.`);
        },
      });
    }

    get attributes() {
      return this._attributes;
    }

    set attributes(attributes) {
      this._attributes = attributes;
    }

    get validatedAttributes() {
      return this._validatedAttributes;
    }

    static validate = jdValidate;

    static batchWrite = batchWrite;

    static delete = deleteFunc;

    static get = get;

    static put = put;

    static update = update;

    static query = query;

    static async queryAll(
      pk: Record<string, any>,
      options: queryOptions,
      params: DocumentClient.QueryInput,
    ) {
      let queryResponse = await query(pk, options, params);
      let items: Record<string, any>[] = queryResponse.Items || [];

      while (queryResponse.LastEvaluatedKey != null) {
        queryResponse = queryResponse.next();
        items = items.concat(queryResponse.Items);
      }

      return {
        ...queryResponse,
        Items: items,
      };
    }

    static scan = scan;

    static async scanAll(
      options: scanOptions,
      params: DocumentClient.ScanInput,
    ) {
      let queryResponse = await scan(options, params);
      let items: Record<string, any>[] = queryResponse.Items || [];

      while (queryResponse.LastEvaluatedKey != null) {
        queryResponse = queryResponse.next();
        items = items.concat(queryResponse.Items);
      }

      return {
        ...queryResponse,
        Items: items,
      };
    }

    static getTransformedAttributes = getTransformedAttributes;

    validate() {
      const value = jdValidate(this.attributes);
      this._validatedAttributes = value;
      return value;
    }

    delete(option: DeleteOptions, params: DocumentClient.DeleteItemInput) {
      return deleteFunc(this.attributes, option, params);
    }

    get(option: GetOptions, params: DocumentClient.GetItemInput) {
      return get(this.attributes, option, params);
    }

    put(options: PutOptions, params: DocumentClient.PutItemInput) {
      return put(this.attributes, options, params);
    }

    update(options: UpdateOptions, params: DocumentClient.UpdateItemInput) {
      return update(this.attributes, options, params);
    }

    getTransformedAttributes() {
      return getTransformedAttributes(this.attributes);
    }
  };

  return jdModel;
}

export default createJDModel;
