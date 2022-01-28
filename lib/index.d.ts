import { Entity, Table } from 'dynamodb-toolbox';
import { TableConstructor } from 'dynamodb-toolbox/dist/classes/Table';
import * as Joi from 'joi';
import { JoifulEntityConstructor } from './lib/createEntity';
declare type JDEntity = {
    entity: Entity<{}>;
    joi: Joi.ObjectSchema<any>;
    model: any;
};
declare const jd: {
    configureTable: (params: TableConstructor, reuse?: boolean) => Table;
    createEntity: (params: JoifulEntityConstructor) => {
        entity: Entity<{}>;
        joi: Joi.ObjectSchema<{}>;
        model: any;
    };
    entities: Record<string, JDEntity>;
    table?: Table;
};
export default jd;
