import Entity, { EntityAttributeConfig, EntityConstructor } from 'dynamodb-toolbox/dist/classes/Entity';
import { DynamoDBTypes } from 'dynamodb-toolbox/dist/classes/Table';
import * as Joi from 'joi';
export interface JoifulEntityAttributeConfig extends EntityAttributeConfig {
    validate?: Joi.SchemaLike | Joi.SchemaLike[];
    aliases?: string | string[];
}
export declare type JoifulEntityCompositeAttributes = [
    string,
    number,
    (DynamoDBTypes | JoifulEntityAttributeConfig)?
];
export interface JoifulEntityAttributes {
    [attr: string]: DynamoDBTypes | JoifulEntityAttributeConfig | JoifulEntityCompositeAttributes;
}
export interface JoifulEntityConstructor extends EntityConstructor {
    attributes: JoifulEntityAttributes;
    beforeValidate?: (attributes: Record<string, any>) => Record<string, any>;
    joiExtensions?: (joi: Joi.ObjectSchema) => Joi.ObjectSchema;
}
declare function createEntity(params: JoifulEntityConstructor): {
    entity: Entity<{}>;
    joi: Joi.ObjectSchema<any>;
    model: {
        new (item?: Record<string, any>): {
            _attributes: Record<string | symbol, any>;
            _validatedAttributes: Record<string | symbol, any>;
            entity: Entity<{}>;
            joi: Joi.ObjectSchema<{}>;
            attributes: Record<string | symbol, any>;
            readonly validatedAttributes: Record<string | symbol, any>;
            validate(): {};
            delete(option: import("./dynamodbToolboxTypes").DeleteOptions, params: import("aws-sdk/clients/dynamodb").DocumentClient.DeleteItemInput): Promise<any>;
            get(option: import("./dynamodbToolboxTypes").GetOptions, params: import("aws-sdk/clients/dynamodb").DocumentClient.GetItemInput): Promise<any>;
            put(options: import("./dynamodbToolboxTypes").PutOptions, params: import("aws-sdk/clients/dynamodb").DocumentClient.PutItemInput): Promise<any>;
            update(options: import("./dynamodbToolboxTypes").UpdateOptions, params: import("aws-sdk/clients/dynamodb").DocumentClient.UpdateItemInput): Promise<import("aws-sdk/clients/dynamodb").DocumentClient.UpdateItemInput | import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.UpdateItemOutput, import("aws-sdk/lib/error").AWSError>>;
            getTransformedAttributes(): Promise<any>;
        };
        validate: (item: Record<string, any>, throwError?: boolean) => {};
        batchWrite: (items: Record<string, any>[], batchWriteOptions?: import("./dynamodbToolboxTypes").BatchWriteOptions, params?: import("aws-sdk/clients/dynamodb").DocumentClient.BatchWriteItemInput) => Promise<any>;
        delete: (item: Record<string, any>, options?: import("./dynamodbToolboxTypes").DeleteOptions, params?: import("aws-sdk/clients/dynamodb").DocumentClient.DeleteItemInput) => Promise<any>;
        get: (item: Record<string, any>, options?: import("./dynamodbToolboxTypes").GetOptions, params?: import("aws-sdk/clients/dynamodb").DocumentClient.GetItemInput) => Promise<any>;
        put: (item: Record<string, any>, options?: import("./dynamodbToolboxTypes").PutOptions, params?: import("aws-sdk/clients/dynamodb").DocumentClient.PutItemInput) => Promise<any>;
        update: (item: Record<string, any>, options?: import("./dynamodbToolboxTypes").UpdateOptions, params?: import("aws-sdk/clients/dynamodb").DocumentClient.UpdateItemInput) => Promise<import("aws-sdk/clients/dynamodb").DocumentClient.UpdateItemInput | import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.UpdateItemOutput, import("aws-sdk/lib/error").AWSError>>;
        query: (pk: Record<string, any>, options?: import("dynamodb-toolbox/dist/classes/Table").queryOptions, params?: import("aws-sdk/clients/dynamodb").DocumentClient.QueryInput) => Promise<any>;
        queryAll(pk: Record<string, any>, options: import("dynamodb-toolbox/dist/classes/Table").queryOptions, params: import("aws-sdk/clients/dynamodb").DocumentClient.QueryInput): Promise<any>;
        scan: (options?: import("dynamodb-toolbox/dist/classes/Table").scanOptions, params?: import("aws-sdk/clients/dynamodb").DocumentClient.ScanInput) => Promise<any>;
        scanAll(options: import("dynamodb-toolbox/dist/classes/Table").scanOptions, params: import("aws-sdk/clients/dynamodb").DocumentClient.ScanInput): Promise<any>;
        getTransformedAttributes: (attributes: Record<string, any>) => Promise<any>;
    };
};
export default createEntity;
