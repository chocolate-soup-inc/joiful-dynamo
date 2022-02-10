import { QueryOptions, ScanOptions } from '../utils/DynamoEntityTypes';
import { BasicEntity } from './BasicEntity';
import { DynamoPaginator } from './DynamoPaginator';
export declare class DynamoEntity extends BasicEntity {
    /**
     * Entity constructor.
     * @param {Record<string, any>} item - Object containing initial attributes to be set.
     * @returns {Entity} - New entity instance
     */
    constructor(item?: Record<string, any>);
    /** @internal */
    get _dynamodb(): import("aws-sdk/clients/dynamodb").DocumentClient;
    /** @internal */
    static get _dynamodb(): import("aws-sdk/clients/dynamodb").DocumentClient;
    /** @internal */
    get _tableName(): string;
    /** @internal */
    static get _tableName(): string;
    /** @internal */
    get _entityName(): string;
    /** @internal */
    static get _entityName(): string;
    /** @internal */
    get _primaryKey(): string | undefined;
    /** @internal */
    static get _primaryKey(): string | undefined;
    /** @internal */
    get _secondaryKey(): string | undefined;
    /** @internal */
    static get _secondaryKey(): string | undefined;
    /** @internal */
    get _createdAtKey(): string | undefined;
    /** @internal */
    static get _createdAtKey(): string | undefined;
    /** @internal */
    get _updatedAtKey(): string | undefined;
    /** @internal */
    static get _updatedAtKey(): string | undefined;
    protected static initialize(item: Record<string, any>): any;
    protected static createPaginator(method: any, opts: any): DynamoPaginator;
    protected static prepareEntityAttributeNameAndValue(opts: any): {
        opts: any;
        attributeName: any;
        attributeValue: any;
    };
    protected static prepareEntityExpression(opts: any, key: any): any;
    protected static prepareOptsForScanAndQuery(opts: any): any;
    protected static prepareOptsForDelete(opts: any): any;
    protected static _query(opts: AWS.DynamoDB.QueryInput): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.QueryOutput, import("aws-sdk").AWSError>>;
    protected static _queryWithChildrenRecords(opts: AWS.DynamoDB.QueryInput): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.QueryOutput, import("aws-sdk").AWSError>>;
    protected static _scan(opts: AWS.DynamoDB.ScanInput): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.ScanOutput, import("aws-sdk").AWSError>>;
    protected get primaryKeyDynamoDBValue(): string | undefined;
    protected get secondaryKeyDynamoDBValue(): string | undefined;
    protected get finalDynamoDBKey(): {};
    protected setEntityOnKey(key: AWS.DynamoDB.DocumentClient.Key): AWS.DynamoDB.DocumentClient.Key;
    protected static setEntityOnKey(key: AWS.DynamoDB.DocumentClient.Key): import("aws-sdk/clients/dynamodb").DocumentClient.Key;
    protected removeEntityFromKey(key: AWS.DynamoDB.DocumentClient.Key): AWS.DynamoDB.DocumentClient.Key;
    protected static removeEntityFromKey(key: AWS.DynamoDB.DocumentClient.Key): import("aws-sdk/clients/dynamodb").DocumentClient.Key;
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
    static deleteItem(key: AWS.DynamoDB.DocumentClient.Key): Promise<import("aws-sdk/clients/dynamodb").DocumentClient.AttributeMap>;
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
    static getItem(key: AWS.DynamoDB.DocumentClient.Key, includeRelated?: boolean): Promise<any>;
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
    static query(opts: QueryOptions): Promise<DynamoPaginator>;
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
    static queryWithChildrenRecords(opts: QueryOptions): Promise<DynamoPaginator>;
    /**
     * Similar to the {@link Entity.query | query method}, but automatically queries all the pages until there are no more records.
     * @returns {DynamoPaginator} - A paginator instance.
     */
    static queryAll(opts: QueryOptions): Promise<DynamoPaginator>;
    /**
     * Similar to the {@link Entity.queryWithChildrenRecords | query with children records method}, but automatically queries all the pages until there are no more records.
     * @returns {DynamoPaginator} - A paginator instance.
     */
    static queryAllWithChildrenRecords(opts: QueryOptions): Promise<DynamoPaginator>;
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
    static scan(opts?: ScanOptions): Promise<DynamoPaginator>;
    /**
     * Similar to the {@link Entity.scan | scan method}, but automatically queries all the pages until there are no more records.
     * @returns {DynamoPaginator} - A paginator instance.
     */
    static scanAll(opts?: ScanOptions): Promise<DynamoPaginator>;
    /** @internal */
    get dynamoAttributes(): Record<string, any>;
    /** @internal */
    parseDynamoAttributes(item: Record<string, any>): {
        [x: string]: any;
    };
    /** @internal */
    queryRelated(): Promise<void>;
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
    load(includeRelated?: boolean): Promise<void>;
    /** @internal */
    get relationsUpdateAttributes(): {
        Update: {
            Key: import("aws-sdk/clients/dynamodb").DocumentClient.Key;
            UpdateExpression: string;
            TableName: string;
            ConditionExpression?: string | undefined;
            ExpressionAttributeNames?: import("aws-sdk/clients/dynamodb").DocumentClient.ExpressionAttributeNameMap | undefined;
            ExpressionAttributeValues?: import("aws-sdk/clients/dynamodb").DocumentClient.ExpressionAttributeValueMap | undefined;
            ReturnValuesOnConditionCheckFailure?: string | undefined;
        };
    }[];
    /** @internal */
    get createAttributes(): {
        TableName: string;
        Item: Record<string, any>;
    };
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
    create(): Promise<this>;
    /** @internal */
    get updateAttributes(): import("aws-sdk/clients/dynamodb").DocumentClient.Update;
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
    update(): Promise<this>;
}
