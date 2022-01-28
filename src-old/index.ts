import { Entity, Table } from 'dynamodb-toolbox';
import { TableConstructor } from 'dynamodb-toolbox/dist/classes/Table';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import * as Joi from 'joi';
import createEntity, { JoifulEntityConstructor } from './createEntity';

type JDEntity = {
  entity: Entity<{}>;
  joi: Joi.ObjectSchema<any>;
  model: any;
};

const jd: {
  configureTable: (params: TableConstructor, reuse?: boolean) => Table;
  createEntity: (params: JoifulEntityConstructor) => {
    entity: Entity<{}>;
    joi: Joi.ObjectSchema<{}>;
    model: any;
  };
  entities: Record<string, JDEntity>;
  table?: Table;
} = {
  configureTable(params, reuse = false) {
    if (reuse && this.table) return this.table;

    const DocumentClient = new DynamoDB.DocumentClient();

    this.table = new Table({
      // partitionKey: 'pk',
      DocumentClient,
      ...params,
    });

    Object.entries(this.entities).forEach(([, value]: [string, JDEntity]) => {
      try {
        value.entity.table = this.table;
      } catch (error) {
        if (!error.message.includes('This entity is already assigned a Table')) throw error;
      }
    });

    return this.table;
  },
  createEntity,
  entities: {},
};

export default jd;
