import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { FilterExpressions } from 'dynamodb-toolbox/dist/lib/expressionBuilder';
import { ProjectionAttributes } from 'dynamodb-toolbox/dist/lib/projectionBuilder';
export interface DeleteOptions {
    conditions?: FilterExpressions;
    capacity?: DocumentClient.ReturnConsumedCapacity;
    metrics?: DocumentClient.ReturnItemCollectionMetrics;
    returnValues?: DocumentClient.ReturnValue;
    include?: string[];
    execute?: boolean;
    parse?: boolean;
}
export interface GetOptions {
    consistent?: boolean;
    capacity?: DocumentClient.ReturnConsumedCapacity;
    attributes?: ProjectionAttributes;
    include?: string[];
    execute?: boolean;
    parse?: boolean;
}
export interface PutOptions {
    conditions?: FilterExpressions;
    capacity?: DocumentClient.ReturnConsumedCapacity;
    metrics?: DocumentClient.ReturnItemCollectionMetrics;
    returnValues?: DocumentClient.ReturnValue;
    include?: string[];
    execute?: boolean;
    parse?: boolean;
}
export interface UpdateOptions {
    conditions?: FilterExpressions;
    capacity?: DocumentClient.ReturnConsumedCapacity;
    metrics?: DocumentClient.ReturnItemCollectionMetrics;
    returnValues?: DocumentClient.ReturnValue;
    include?: string[];
    execute?: boolean;
    parse?: boolean;
}
export interface BatchWriteOptions {
    capacity?: DocumentClient.ReturnConsumedCapacity;
    metrics?: DocumentClient.ReturnItemCollectionMetrics;
    execute?: boolean;
    parse?: boolean;
}
