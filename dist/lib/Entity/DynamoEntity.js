"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoEntity = void 0;
/* eslint-disable no-await-in-loop */
const lodash_1 = __importDefault(require("lodash"));
const Decorators_1 = require("../Decorators");
const belongsTo_1 = require("../Decorators/belongsTo");
const BasicEntity_1 = require("./BasicEntity");
const DynamoPaginator_1 = require("./DynamoPaginator");
class DynamoEntity extends BasicEntity_1.BasicEntity {
    /**
     * Entity constructor.
     * @param {Record<string, any>} item - Object containing initial attributes to be set.
     * @returns {Entity} - New entity instance
     */
    constructor(item) {
        super(item);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.load = this.load.bind(this);
        this.setEntityOnKey = this.setEntityOnKey.bind(this);
        this.removeEntityFromKey = this.removeEntityFromKey.bind(this);
    }
    // ---------------- BASIC SETTINGS ----------------
    /** @internal */
    get _dynamodb() { return (0, Decorators_1.getTableDynamoDbInstance)(this.constructor); }
    /** @internal */
    static get _dynamodb() { return this.prototype._dynamodb; }
    /** @internal */
    get _tableName() { return (0, Decorators_1.getTableName)(this.constructor); }
    /** @internal */
    static get _tableName() { return this.prototype._tableName; }
    /** @internal */
    get _entityName() { return this.constructor.name; }
    /** @internal */
    static get _entityName() { return this.name; }
    /** @internal */
    get _primaryKey() { return (0, Decorators_1.getPrimaryKey)(this); }
    /** @internal */
    static get _primaryKey() { return this.prototype._primaryKey; }
    /** @internal */
    get _secondaryKey() { return (0, Decorators_1.getSecondaryKey)(this); }
    /** @internal */
    static get _secondaryKey() { return this.prototype._secondaryKey; }
    /** @internal */
    get _createdAtKey() { return (0, Decorators_1.getCreatedAtKey)(this); }
    /** @internal */
    static get _createdAtKey() { return this.prototype._createdAtKey; }
    /** @internal */
    get _updatedAtKey() { return (0, Decorators_1.getUpdatedAtKey)(this); }
    /** @internal */
    static get _updatedAtKey() { return this.prototype._updatedAtKey; }
    // ---------------- BASIC SETTINGS ----------------
    // ---------------- TABLE SUPPORT METHODS ----------------
    static initialize(item) {
        // console.log(this, item._entityName, this._entityName);
        if (item._entityName === this._entityName) {
            return new this(this.prototype.parseDynamoAttributes(item));
        }
        for (const relationDescriptor of (0, Decorators_1.getRelationDescriptors)(this.prototype)) {
            const { model: ModelClass, } = relationDescriptor;
            if (item._entityName === ModelClass.name) {
                return new ModelClass(ModelClass.prototype.parseDynamoAttributes(item));
            }
        }
        throw new Error('Queried a non recognized entity');
    }
    static createPaginator(method, opts) {
        return new DynamoPaginator_1.DynamoPaginator({
            method,
            opts,
            tableName: this._tableName,
            initializer: this.initialize.bind(this),
        });
    }
    static prepareEntityAttributeNameAndValue(opts) {
        var _a, _b;
        const newOpts = lodash_1.default.cloneDeep(opts);
        let attributeName;
        let attributeValue;
        let counter = 0;
        do {
            attributeName = `#_entityName${counter}`;
            attributeValue = `:_entityName${counter}`;
            counter += 1;
        } while (((_a = newOpts === null || newOpts === void 0 ? void 0 : newOpts.ExpressionAttributeNames) === null || _a === void 0 ? void 0 : _a[attributeName]) != null
            || ((_b = newOpts === null || newOpts === void 0 ? void 0 : newOpts.ExpressionAttributeValues) === null || _b === void 0 ? void 0 : _b[attributeValue]) != null);
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
    static prepareEntityExpression(opts, key) {
        const { opts: newOpts, attributeName, attributeValue, } = this.prepareEntityAttributeNameAndValue(opts);
        if (newOpts === null || newOpts === void 0 ? void 0 : newOpts[key]) {
            newOpts[key] = `${newOpts[key]} and ${attributeName} = ${attributeValue}`;
        }
        else {
            newOpts[key] = `${attributeName} = ${attributeValue}`;
        }
        return newOpts;
    }
    static prepareOptsForScanAndQuery(opts) {
        return this.prepareEntityExpression(opts, 'FilterExpression');
    }
    static prepareOptsForDelete(opts) {
        return this.prepareEntityExpression(opts, 'ConditionExpression');
    }
    static _query(opts) {
        return this._dynamodb.query(this.prepareOptsForScanAndQuery(opts)).promise();
    }
    static _queryWithChildrenRecords(opts) {
        const { opts: newOpts, attributeName, attributeValue, } = this.prepareEntityAttributeNameAndValue(opts);
        const attributeValues = [attributeValue];
        for (const relationDescriptor of (0, Decorators_1.getRelationDescriptors)(this.prototype)) {
            const { opts: descriptorOpts, model: ModelClass, propertyKey: relationName, } = relationDescriptor;
            if ((descriptorOpts === null || descriptorOpts === void 0 ? void 0 : descriptorOpts.indexName) === opts.IndexName) {
                const key = `:_relationDescriptor_${relationName}`;
                newOpts.ExpressionAttributeValues[key] = ModelClass.name;
                attributeValues.push(key);
            }
        }
        const customFilter = `${attributeName} in (${attributeValues.join(', ')})`;
        if (newOpts === null || newOpts === void 0 ? void 0 : newOpts.FilterExpression) {
            newOpts.FilterExpression = `${newOpts.FilterExpression} and ${customFilter}`;
        }
        else {
            newOpts.FilterExpression = customFilter;
        }
        return this._dynamodb.query(newOpts).promise();
    }
    static _scan(opts) {
        return this._dynamodb.scan(this.prepareOptsForScanAndQuery(opts)).promise();
    }
    get primaryKeyDynamoDBValue() {
        if (this._primaryKey == null)
            return undefined;
        return `${this._entityName}-${this[this._primaryKey]}`;
    }
    get secondaryKeyDynamoDBValue() {
        if (this._secondaryKey == null)
            return undefined;
        return `${this._entityName}-${this[this._secondaryKey]}`;
    }
    get finalDynamoDBKey() {
        const key = {};
        if (this._primaryKey) {
            key[this._primaryKey] = this.primaryKeyDynamoDBValue;
        }
        if (this._secondaryKey) {
            key[this._secondaryKey] = this.secondaryKeyDynamoDBValue;
        }
        return key;
    }
    setEntityOnKey(key) {
        const finalKey = {};
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
    static setEntityOnKey(key) {
        return this.prototype.setEntityOnKey(key);
    }
    removeEntityFromKey(key) {
        const finalKey = {};
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
    static removeEntityFromKey(key) {
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
    static async deleteItem(key) {
        const response = await this._dynamodb.delete(this.prepareOptsForDelete({
            TableName: this._tableName,
            Key: this.setEntityOnKey(key),
            ReturnValues: 'ALL_OLD',
        })).promise();
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
    static async getItem(key, includeRelated = false) {
        const response = await this._dynamodb.get({
            TableName: this._tableName,
            Key: this.setEntityOnKey(key),
        }).promise();
        const { Item: item, } = response;
        if (item) {
            const instance = this.initialize(item);
            if (includeRelated)
                await instance.queryRelated();
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
    static async query(opts) {
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
    static async queryWithChildrenRecords(opts) {
        const paginator = this.createPaginator(this._queryWithChildrenRecords.bind(this), opts);
        await paginator.next();
        return paginator;
    }
    /**
     * Similar to the {@link Entity.query | query method}, but automatically queries all the pages until there are no more records.
     * @returns {DynamoPaginator} - A paginator instance.
     */
    static async queryAll(opts) {
        const paginator = await this.createPaginator(this._query.bind(this), opts);
        return paginator.getAll();
    }
    /**
     * Similar to the {@link Entity.queryWithChildrenRecords | query with children records method}, but automatically queries all the pages until there are no more records.
     * @returns {DynamoPaginator} - A paginator instance.
     */
    static async queryAllWithChildrenRecords(opts) {
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
    static async scan(opts) {
        const paginator = this.createPaginator(this._scan.bind(this), opts);
        await paginator.next();
        return paginator;
    }
    /**
     * Similar to the {@link Entity.scan | scan method}, but automatically queries all the pages until there are no more records.
     * @returns {DynamoPaginator} - A paginator instance.
     */
    static async scanAll(opts) {
        const paginator = await this.createPaginator(this._scan.bind(this), opts);
        return paginator.getAll();
    }
    // ---------------- TABLE METHODS ----------------
    // ---------------- INSTANCE SUPPORT METHODS ----------------
    /** @internal */
    get dynamoAttributes() {
        let attributes = this.validatedAttributes;
        if (Object.keys(attributes).length === 0) {
            throw new Error('You cannot save an instance with no attributes at all.');
        }
        attributes._entityName = this._entityName;
        attributes = Object.assign(Object.assign({}, attributes), this.finalDynamoDBKey);
        return attributes;
    }
    /** @internal */
    parseDynamoAttributes(item) {
        delete item._entityName;
        return Object.assign(Object.assign({}, item), this.removeEntityFromKey(item));
    }
    /** @internal */
    async queryRelated() {
        const hasManyNotNestedModels = (0, Decorators_1.getHasManyNotNestedModels)(this);
        for (const modelName of hasManyNotNestedModels) {
            const { model: ChildModel, opts: { foreignKey = undefined, indexName = undefined, parentPropertyOnChild = undefined, } = {}, } = (0, Decorators_1.getHasManyModel)(this, modelName) || {};
            if (foreignKey != null && indexName != null) {
                const { items: children, } = await ChildModel.queryAll({
                    IndexName: indexName,
                    ExpressionAttributeNames: {
                        '#_fk': foreignKey,
                    },
                    ExpressionAttributeValues: {
                        ':_fk': this[foreignKey],
                    },
                    KeyConditionExpression: '#_fk = :_fk',
                });
                if (parentPropertyOnChild) {
                    children.forEach((child) => {
                        child[parentPropertyOnChild] = this;
                    });
                }
                this[modelName] = children;
            }
        }
        const hasOneNotNestedModels = (0, Decorators_1.getHasOneNotNestedModels)(this);
        for (const modelName of hasOneNotNestedModels) {
            const { model: ChildModel, opts: { foreignKey = undefined, indexName = undefined, parentPropertyOnChild = undefined, } = {}, } = (0, Decorators_1.getHasOneModel)(this, modelName) || {};
            if (foreignKey != null && indexName != null) {
                const { items: children, } = await ChildModel.queryAll({
                    IndexName: indexName,
                    ExpressionAttributeNames: {
                        '#_fk': foreignKey,
                    },
                    ExpressionAttributeValues: {
                        ':_fk': this[foreignKey],
                    },
                    KeyConditionExpression: '#_fk = :_fk',
                });
                if (parentPropertyOnChild) {
                    children[0][parentPropertyOnChild] = this;
                }
                // eslint-disable-next-line prefer-destructuring
                this[modelName] = children[0];
            }
        }
        const belongsToModels = (0, belongsTo_1.getBelongsToModels)(this);
        for (const modelName of belongsToModels) {
            const { model: ParentModel, opts: { foreignKey = undefined, indexName = undefined, parentPropertyOnChild = undefined, } = {}, } = (0, belongsTo_1.getBelongsToModel)(this, modelName) || {};
            if (foreignKey != null && indexName != null) {
                const { items: [parent], } = await ParentModel.queryAll({
                    IndexName: indexName,
                    ExpressionAttributeNames: {
                        '#_fk': foreignKey,
                    },
                    ExpressionAttributeValues: {
                        ':_fk': this[foreignKey],
                    },
                    KeyConditionExpression: '#_fk = :_fk',
                });
                const { propertyKey, type, } = (0, belongsTo_1.getHasFromBelong)(this, foreignKey, indexName, parentPropertyOnChild) || {};
                if (propertyKey) {
                    if (type === 'hasOne') {
                        parent[propertyKey] = this;
                    }
                    else if (type === 'hasMany') {
                        parent[propertyKey] = [this];
                    }
                }
                // eslint-disable-next-line prefer-destructuring
                this[modelName] = parent;
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
        const sk = this._secondaryKey;
        if (pk == null || sk == null) {
            throw new Error('primary key and/or secondary key props not set');
        }
        const { Item: item, } = await this._dynamodb.get({
            TableName: this._tableName,
            Key: this.finalDynamoDBKey,
        }).promise();
        if (item) {
            this.attributes = this.parseDynamoAttributes(item);
            if (includeRelated)
                await this.queryRelated();
        }
        else {
            throw new Error('Record not found.');
        }
    }
    /** @internal */
    get relationsUpdateAttributes() {
        const hasOneEntities = (0, Decorators_1.getHasOneNotNestedModels)(this).reduce((agg, m) => {
            if (this[`_noInitializer${lodash_1.default.capitalize(m)}`] == null)
                return agg;
            const { opts: { foreignKey = undefined, } = {}, } = (0, Decorators_1.getHasOneModel)(this, m) || {};
            const value = this[m];
            if (foreignKey && this._primaryKey) {
                value[foreignKey] = this.primaryKeyDynamoDBValue;
                this[foreignKey] = this.primaryKeyDynamoDBValue;
            }
            return agg.concat([value]);
        }, []);
        const hasManyEntities = (0, Decorators_1.getHasManyNotNestedModels)(this).reduce((agg, m) => {
            if (this[`_noInitializer${lodash_1.default.capitalize(m)}`] == null)
                return agg;
            const { opts: { foreignKey = undefined, } = {}, } = (0, Decorators_1.getHasManyModel)(this, m) || {};
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
        }, []);
        return hasOneEntities.concat(hasManyEntities).map((entity) => ({
            Update: Object.assign({}, entity.updateAttributes),
        }));
    }
    /** @internal */
    get createAttributes() {
        if (!this.valid)
            throw new Error('The instance is invalid');
        if (this._primaryKey == null)
            throw new Error('Primary Key property should be set');
        if (this._secondaryKey == null)
            throw new Error('Secondary Key property should be set');
        const item = this.dynamoAttributes;
        const now = new Date().toISOString();
        if (this._createdAtKey)
            item[this._createdAtKey] = now;
        if (this._updatedAtKey)
            item[this._updatedAtKey] = now;
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
        await this._dynamodb.transactWrite({
            TransactItems: transactItems,
        }).promise();
        this.attributes = this.parseDynamoAttributes(attributes.Item);
        return this;
    }
    /** @internal */
    get updateAttributes() {
        if (!this.valid)
            throw new Error('The instance is invalid');
        if (this._primaryKey == null)
            throw new Error('Primary Key property should be set');
        if (this._secondaryKey == null)
            throw new Error('Secondary Key property should be set');
        const item = this.dynamoAttributes;
        const opts = Object.entries(item).reduce((agg, [key, value]) => {
            if ([this._primaryKey, this._secondaryKey, this._createdAtKey, this._updatedAtKey].includes(key))
                return agg;
            const { UpdateExpression: expression, ExpressionAttributeNames: names = {}, ExpressionAttributeValues: values = {}, } = agg;
            names[`#${key}`] = key;
            values[`:${key}`] = value;
            agg.ExpressionAttributeNames = names;
            agg.ExpressionAttributeValues = values;
            if (expression == null) {
                agg.UpdateExpression = `SET #${key} = :${key}`;
            }
            else {
                agg.UpdateExpression = `${expression}, #${key} = :${key}`;
            }
            return agg;
        }, {});
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
        const ret = Object.assign({ TableName: this._tableName, Key: this.finalDynamoDBKey }, opts);
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
        await this._dynamodb.transactWrite({
            TransactItems: transactItems,
        }).promise();
        const { Item: item, } = await this._dynamodb.get({
            TableName: attributes.TableName,
            Key: attributes.Key,
        }).promise();
        if (item)
            this.attributes = this.parseDynamoAttributes(item);
        return this;
    }
}
exports.DynamoEntity = DynamoEntity;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHluYW1vRW50aXR5LmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbImxpYi9FbnRpdHkvRHluYW1vRW50aXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHFDQUFxQztBQUNyQyxvREFBdUI7QUFDdkIsOENBWXVCO0FBQ3ZCLHVEQUFrRztBQUVsRywrQ0FBNEM7QUFDNUMsdURBQW9EO0FBRXBELE1BQWEsWUFBYSxTQUFRLHlCQUFXO0lBQzNDOzs7O09BSUc7SUFDSCxZQUFZLElBQTBCO1FBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVaLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVELG1EQUFtRDtJQUVuRCxnQkFBZ0I7SUFDaEIsSUFBSSxTQUFTLEtBQUssT0FBTyxJQUFBLHFDQUF3QixFQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdEUsZ0JBQWdCO0lBQ2hCLE1BQU0sS0FBSyxTQUFTLEtBQUssT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFM0QsZ0JBQWdCO0lBQ2hCLElBQUksVUFBVSxLQUFLLE9BQU8sSUFBQSx5QkFBWSxFQUFD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QUcsbUJBQ1AsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQzFCLEdBQUcsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLElBQ3ZCLElBQUksQ0FDUixDQUFDO1FBRUYsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXFCRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1Ysd0NBQXdDO1FBQ3hDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQztRQUNyRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFFekMsTUFBTSxhQUFhLEdBQUc7WUFDcEI7Z0JBQ0UsTUFBTSxFQUFFLFVBQVU7YUFDbkI7WUFDRCxHQUFHLGFBQWE7U0FDakIsQ0FBQztRQUVGLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7WUFDakMsYUFBYSxFQUFFLGFBQWE7U0FDN0IsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWIsTUFBTSxFQUNKLElBQUksRUFBRSxJQUFJLEdBQ1gsR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO1lBQzNCLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBUztZQUMvQixHQUFHLEVBQUUsVUFBVSxDQUFDLEdBQUc7U0FDcEIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWIsSUFBSSxJQUFJO1lBQUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBR0Y7QUFuNEJELG9DQW00QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby1hd2FpdC1pbi1sb29wICovXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHtcbiAgZ2V0Q3JlYXRlZEF0S2V5LFxuICBnZXRIYXNNYW55TW9kZWwsXG4gIGdldEhhc01hbnlOb3ROZXN0ZWRNb2RlbHMsXG4gIGdldEhhc09uZU1vZGVsLFxuICBnZXRIYXNPbmVOb3ROZXN0ZWRNb2RlbHMsXG4gIGdldFByaW1hcnlLZXksXG4gIGdldFJlbGF0aW9uRGVzY3JpcHRvcnMsXG4gIGdldFNlY29uZGFyeUtleSxcbiAgZ2V0VGFibGVEeW5hbW9EYkluc3RhbmNlLFxuICBnZXRUYWJsZU5hbWUsXG4gIGdldFVwZGF0ZWRBdEtleSxcbn0gZnJvbSAnLi4vRGVjb3JhdG9ycyc7XG5pbXBvcnQgeyBnZXRCZWxvbmdzVG9Nb2RlbCwgZ2V0QmVsb25nc1RvTW9kZWxzLCBnZXRIYXNGcm9tQmVsb25nIH0gZnJvbSAnLi4vRGVjb3JhdG9ycy9iZWxvbmdzVG8nO1xuaW1wb3J0IHsgUXVlcnlPcHRpb25zLCBTY2FuT3B0aW9ucyB9IGZyb20gJy4uL3V0aWxzL0R5bmFtb0VudGl0eVR5cGVzJztcbmltcG9ydCB7IEJhc2ljRW50aXR5IH0gZnJvbSAnLi9CYXNpY0VudGl0eSc7XG5pbXBvcnQgeyBEeW5hbW9QYWdpbmF0b3IgfSBmcm9tICcuL0R5bmFtb1BhZ2luYXRvcic7XG5cbmV4cG9ydCBjbGFzcyBEeW5hbW9FbnRpdHkgZXh0ZW5kcyBCYXNpY0VudGl0eSB7XG4gIC8qKlxuICAgKiBFbnRpdHkgY29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gaXRlbSAtIE9iamVjdCBjb250YWluaW5nIGluaXRpYWwgYXR0cmlidXRlcyB0byBiZSBzZXQuXG4gICAqIEByZXR1cm5zIHtFbnRpdHl9IC0gTmV3IGVudGl0eSBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoaXRlbT86IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgICBzdXBlcihpdGVtKTtcblxuICAgIHRoaXMuY3JlYXRlID0gdGhpcy5jcmVhdGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZSA9IHRoaXMudXBkYXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5sb2FkID0gdGhpcy5sb2FkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zZXRFbnRpdHlPbktleSA9IHRoaXMuc2V0RW50aXR5T25LZXkuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlbW92ZUVudGl0eUZyb21LZXkgPSB0aGlzLnJlbW92ZUVudGl0eUZyb21LZXkuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gQkFTSUMgU0VUVElOR1MgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgZ2V0IF9keW5hbW9kYigpIHsgcmV0dXJuIGdldFRhYmxlRHluYW1vRGJJbnN0YW5jZSh0aGlzLmNvbnN0cnVjdG9yKTsgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgc3RhdGljIGdldCBfZHluYW1vZGIoKSB7IHJldHVybiB0aGlzLnByb3RvdHlwZS5fZHluYW1vZGI7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIGdldCBfdGFibGVOYW1lKCkgeyByZXR1cm4gZ2V0VGFibGVOYW1lKHRoaXMuY29uc3RydWN0b3IpOyB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgZ2V0IF90YWJsZU5hbWUoKSB7IHJldHVybiB0aGlzLnByb3RvdHlwZS5fdGFibGVOYW1lOyB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBnZXQgX2VudGl0eU5hbWUoKSB7IHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBnZXQgX2VudGl0eU5hbWUoKSB7IHJldHVybiB0aGlzLm5hbWU7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIGdldCBfcHJpbWFyeUtleSgpIHsgcmV0dXJuIGdldFByaW1hcnlLZXkodGhpcyk7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBnZXQgX3ByaW1hcnlLZXkoKSB7IHJldHVybiB0aGlzLnByb3RvdHlwZS5fcHJpbWFyeUtleTsgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgZ2V0IF9zZWNvbmRhcnlLZXkoKSB7IHJldHVybiBnZXRTZWNvbmRhcnlLZXkodGhpcyk7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBnZXQgX3NlY29uZGFyeUtleSgpIHsgcmV0dXJuIHRoaXMucHJvdG90eXBlLl9zZWNvbmRhcnlLZXk7IH1cblxuICAvKiogQGludGVybmFsICovXG4gIGdldCBfY3JlYXRlZEF0S2V5KCkgeyByZXR1cm4gZ2V0Q3JlYXRlZEF0S2V5KHRoaXMpOyB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgZ2V0IF9jcmVhdGVkQXRLZXkoKSB7IHJldHVybiB0aGlzLnByb3RvdHlwZS5fY3JlYXRlZEF0S2V5OyB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBnZXQgX3VwZGF0ZWRBdEtleSgpIHsgcmV0dXJuIGdldFVwZGF0ZWRBdEtleSh0aGlzKTsgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgc3RhdGljIGdldCBfdXBkYXRlZEF0S2V5KCkgeyByZXR1cm4gdGhpcy5wcm90b3R5cGUuX3VwZGF0ZWRBdEtleTsgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gQkFTSUMgU0VUVElOR1MgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gVEFCTEUgU1VQUE9SVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGluaXRpYWxpemUoaXRlbTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMsIGl0ZW0uX2VudGl0eU5hbWUsIHRoaXMuX2VudGl0eU5hbWUpO1xuICAgIGlmIChpdGVtLl9lbnRpdHlOYW1lID09PSB0aGlzLl9lbnRpdHlOYW1lKSB7XG4gICAgICByZXR1cm4gbmV3IHRoaXModGhpcy5wcm90b3R5cGUucGFyc2VEeW5hbW9BdHRyaWJ1dGVzKGl0ZW0pKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHJlbGF0aW9uRGVzY3JpcHRvciBvZiBnZXRSZWxhdGlvbkRlc2NyaXB0b3JzKHRoaXMucHJvdG90eXBlKSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBtb2RlbDogTW9kZWxDbGFzcyxcbiAgICAgIH0gPSByZWxhdGlvbkRlc2NyaXB0b3I7XG5cbiAgICAgIGlmIChpdGVtLl9lbnRpdHlOYW1lID09PSBNb2RlbENsYXNzLm5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNb2RlbENsYXNzKE1vZGVsQ2xhc3MucHJvdG90eXBlLnBhcnNlRHluYW1vQXR0cmlidXRlcyhpdGVtKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdRdWVyaWVkIGEgbm9uIHJlY29nbml6ZWQgZW50aXR5Jyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGNyZWF0ZVBhZ2luYXRvcihtZXRob2QsIG9wdHMpIHtcbiAgICByZXR1cm4gbmV3IER5bmFtb1BhZ2luYXRvcih7XG4gICAgICBtZXRob2QsXG4gICAgICBvcHRzLFxuICAgICAgdGFibGVOYW1lOiB0aGlzLl90YWJsZU5hbWUsXG4gICAgICBpbml0aWFsaXplcjogdGhpcy5pbml0aWFsaXplLmJpbmQodGhpcyksXG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIHByZXBhcmVFbnRpdHlBdHRyaWJ1dGVOYW1lQW5kVmFsdWUob3B0cykge1xuICAgIGNvbnN0IG5ld09wdHMgPSBfLmNsb25lRGVlcChvcHRzKTtcblxuICAgIGxldCBhdHRyaWJ1dGVOYW1lO1xuICAgIGxldCBhdHRyaWJ1dGVWYWx1ZTtcbiAgICBsZXQgY291bnRlciA9IDA7XG4gICAgZG8ge1xuICAgICAgYXR0cmlidXRlTmFtZSA9IGAjX2VudGl0eU5hbWUke2NvdW50ZXJ9YDtcbiAgICAgIGF0dHJpYnV0ZVZhbHVlID0gYDpfZW50aXR5TmFtZSR7Y291bnRlcn1gO1xuICAgICAgY291bnRlciArPSAxO1xuICAgIH0gd2hpbGUgKFxuICAgICAgbmV3T3B0cz8uRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzPy5bYXR0cmlidXRlTmFtZV0gIT0gbnVsbFxuICAgICAgfHwgbmV3T3B0cz8uRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcz8uW2F0dHJpYnV0ZVZhbHVlXSAhPSBudWxsXG4gICAgKTtcblxuICAgIGlmIChuZXdPcHRzLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9PSBudWxsKSB7XG4gICAgICBuZXdPcHRzLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IHt9O1xuICAgIH1cblxuICAgIGlmIChuZXdPcHRzLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMgPT0gbnVsbCkge1xuICAgICAgbmV3T3B0cy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgbmV3T3B0cy5FeHByZXNzaW9uQXR0cmlidXRlTmFtZXNbYXR0cmlidXRlTmFtZV0gPSAnX2VudGl0eU5hbWUnO1xuICAgIG5ld09wdHMuRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlc1thdHRyaWJ1dGVWYWx1ZV0gPSB0aGlzLl9lbnRpdHlOYW1lO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9wdHM6IG5ld09wdHMsXG4gICAgICBhdHRyaWJ1dGVOYW1lLFxuICAgICAgYXR0cmlidXRlVmFsdWUsXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgcHJlcGFyZUVudGl0eUV4cHJlc3Npb24ob3B0cywga2V5KSB7XG4gICAgY29uc3Qge1xuICAgICAgb3B0czogbmV3T3B0cyxcbiAgICAgIGF0dHJpYnV0ZU5hbWUsXG4gICAgICBhdHRyaWJ1dGVWYWx1ZSxcbiAgICB9ID0gdGhpcy5wcmVwYXJlRW50aXR5QXR0cmlidXRlTmFtZUFuZFZhbHVlKG9wdHMpO1xuXG4gICAgaWYgKG5ld09wdHM/LltrZXldKSB7XG4gICAgICBuZXdPcHRzW2tleV0gPSBgJHtuZXdPcHRzW2tleV19IGFuZCAke2F0dHJpYnV0ZU5hbWV9ID0gJHthdHRyaWJ1dGVWYWx1ZX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdPcHRzW2tleV0gPSBgJHthdHRyaWJ1dGVOYW1lfSA9ICR7YXR0cmlidXRlVmFsdWV9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3T3B0cztcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgcHJlcGFyZU9wdHNGb3JTY2FuQW5kUXVlcnkob3B0cykge1xuICAgIHJldHVybiB0aGlzLnByZXBhcmVFbnRpdHlFeHByZXNzaW9uKG9wdHMsICdGaWx0ZXJFeHByZXNzaW9uJyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIHByZXBhcmVPcHRzRm9yRGVsZXRlKG9wdHMpIHtcbiAgICByZXR1cm4gdGhpcy5wcmVwYXJlRW50aXR5RXhwcmVzc2lvbihvcHRzLCAnQ29uZGl0aW9uRXhwcmVzc2lvbicpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBfcXVlcnkob3B0czogQVdTLkR5bmFtb0RCLlF1ZXJ5SW5wdXQpIHtcbiAgICByZXR1cm4gdGhpcy5fZHluYW1vZGIucXVlcnkodGhpcy5wcmVwYXJlT3B0c0ZvclNjYW5BbmRRdWVyeShvcHRzKSkucHJvbWlzZSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBfcXVlcnlXaXRoQ2hpbGRyZW5SZWNvcmRzKG9wdHM6IEFXUy5EeW5hbW9EQi5RdWVyeUlucHV0KSB7XG4gICAgY29uc3Qge1xuICAgICAgb3B0czogbmV3T3B0cyxcbiAgICAgIGF0dHJpYnV0ZU5hbWUsXG4gICAgICBhdHRyaWJ1dGVWYWx1ZSxcbiAgICB9ID0gdGhpcy5wcmVwYXJlRW50aXR5QXR0cmlidXRlTmFtZUFuZFZhbHVlKG9wdHMpO1xuXG4gICAgY29uc3QgYXR0cmlidXRlVmFsdWVzOiBzdHJpbmdbXSA9IFthdHRyaWJ1dGVWYWx1ZV07XG5cbiAgICBmb3IgKGNvbnN0IHJlbGF0aW9uRGVzY3JpcHRvciBvZiBnZXRSZWxhdGlvbkRlc2NyaXB0b3JzKHRoaXMucHJvdG90eXBlKSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBvcHRzOiBkZXNjcmlwdG9yT3B0cyxcbiAgICAgICAgbW9kZWw6IE1vZGVsQ2xhc3MsXG4gICAgICAgIHByb3BlcnR5S2V5OiByZWxhdGlvbk5hbWUsXG4gICAgICB9ID0gcmVsYXRpb25EZXNjcmlwdG9yO1xuXG4gICAgICBpZiAoZGVzY3JpcHRvck9wdHM/LmluZGV4TmFtZSA9PT0gb3B0cy5JbmRleE5hbWUpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gYDpfcmVsYXRpb25EZXNjcmlwdG9yXyR7cmVsYXRpb25OYW1lfWA7XG4gICAgICAgIG5ld09wdHMuRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlc1trZXldID0gTW9kZWxDbGFzcy5uYW1lO1xuICAgICAgICBhdHRyaWJ1dGVWYWx1ZXMucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGN1c3RvbUZpbHRlciA9IGAke2F0dHJpYnV0ZU5hbWV9IGluICgke2F0dHJpYnV0ZVZhbHVlcy5qb2luKCcsICcpfSlgO1xuXG4gICAgaWYgKG5ld09wdHM/LkZpbHRlckV4cHJlc3Npb24pIHtcbiAgICAgIG5ld09wdHMuRmlsdGVyRXhwcmVzc2lvbiA9IGAke25ld09wdHMuRmlsdGVyRXhwcmVzc2lvbn0gYW5kICR7Y3VzdG9tRmlsdGVyfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld09wdHMuRmlsdGVyRXhwcmVzc2lvbiA9IGN1c3RvbUZpbHRlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZHluYW1vZGIucXVlcnkobmV3T3B0cykucHJvbWlzZSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBfc2NhbihvcHRzOiBBV1MuRHluYW1vREIuU2NhbklucHV0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2R5bmFtb2RiLnNjYW4odGhpcy5wcmVwYXJlT3B0c0ZvclNjYW5BbmRRdWVyeShvcHRzKSkucHJvbWlzZSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldCBwcmltYXJ5S2V5RHluYW1vREJWYWx1ZSgpIHtcbiAgICBpZiAodGhpcy5fcHJpbWFyeUtleSA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgcmV0dXJuIGAke3RoaXMuX2VudGl0eU5hbWV9LSR7dGhpc1t0aGlzLl9wcmltYXJ5S2V5XX1gO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldCBzZWNvbmRhcnlLZXlEeW5hbW9EQlZhbHVlKCkge1xuICAgIGlmICh0aGlzLl9zZWNvbmRhcnlLZXkgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgIHJldHVybiBgJHt0aGlzLl9lbnRpdHlOYW1lfS0ke3RoaXNbdGhpcy5fc2Vjb25kYXJ5S2V5XX1gO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldCBmaW5hbER5bmFtb0RCS2V5KCkge1xuICAgIGNvbnN0IGtleSA9IHt9O1xuICAgIGlmICh0aGlzLl9wcmltYXJ5S2V5KSB7XG4gICAgICBrZXlbdGhpcy5fcHJpbWFyeUtleV0gPSB0aGlzLnByaW1hcnlLZXlEeW5hbW9EQlZhbHVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9zZWNvbmRhcnlLZXkpIHtcbiAgICAgIGtleVt0aGlzLl9zZWNvbmRhcnlLZXldID0gdGhpcy5zZWNvbmRhcnlLZXlEeW5hbW9EQlZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBrZXk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc2V0RW50aXR5T25LZXkoa2V5OiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuS2V5KTogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LktleSB7XG4gICAgY29uc3QgZmluYWxLZXk6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5LZXkgPSB7fTtcbiAgICBbdGhpcy5fcHJpbWFyeUtleSwgdGhpcy5fc2Vjb25kYXJ5S2V5XS5mb3JFYWNoKChfa2V5KSA9PiB7XG4gICAgICBpZiAoX2tleSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0ga2V5W19rZXldO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgIGZpbmFsS2V5W19rZXldID0gYCR7dGhpcy5fZW50aXR5TmFtZX0tJHt2YWx1ZX1gO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmluYWxLZXk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIHNldEVudGl0eU9uS2V5KGtleTogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LktleSkge1xuICAgIHJldHVybiB0aGlzLnByb3RvdHlwZS5zZXRFbnRpdHlPbktleShrZXkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlbW92ZUVudGl0eUZyb21LZXkoa2V5OiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuS2V5KTogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LktleSB7XG4gICAgY29uc3QgZmluYWxLZXk6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5LZXkgPSB7fTtcbiAgICBbdGhpcy5fcHJpbWFyeUtleSwgdGhpcy5fc2Vjb25kYXJ5S2V5XS5mb3JFYWNoKChfa2V5KSA9PiB7XG4gICAgICBpZiAoX2tleSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0ga2V5W19rZXldO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgIGZpbmFsS2V5W19rZXldID0ga2V5W19rZXldLnRvU3RyaW5nKCkucmVwbGFjZShgJHt0aGlzLl9lbnRpdHlOYW1lfS1gLCAnJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBmaW5hbEtleTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVtb3ZlRW50aXR5RnJvbUtleShrZXk6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5LZXkpIHtcbiAgICByZXR1cm4gdGhpcy5wcm90b3R5cGUucmVtb3ZlRW50aXR5RnJvbUtleShrZXkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBUQUJMRSBTVVBQT1JUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gVEFCTEUgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG4gIC8qKlxuICAgKiBEZWxldGVzIGFuIGl0ZW0gd2l0aCB0aGUgc3BlY2lmaWVkIGtleSBmcm9tIHRoZSBkYXRhYmFzZSB1c2luZyB0aGUgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cImh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NKYXZhU2NyaXB0U0RLL2xhdGVzdC9BV1MvRHluYW1vREIvRG9jdW1lbnRDbGllbnQuaHRtbCNkZWxldGUtcHJvcGVydHlcIj5hd3Mtc2RrIGRvY3VtZW50Y2xpZW50IGRlbGV0ZSBtZXRob2Q8L2E+LlxuICAgKiBAcGFyYW0ge0FXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5LZXl9IGtleSAtIFRoaXMgYXJndW1lbnQgc2hvdWxkIGJlIHRoZSBrZXkgYmVmb3JlIHByZXBhcmluZyBpdCB0byBzYXZlIHRvIHRoZSBkYXRhYmFzZS4gU2VlIGV4YW1wbGUgZm9yIG1vcmUgZGV0YWlscy5cbiAgICogQHJlbWFya3NcbiAgICogJm5ic3A7XG4gICAqIC0gVGhlIG1vZGVsIHByaW1hcnkga2V5IGFuZCBzZWNvbmRhcnkga2V5IGFyZSBhdXRvbWF0aWNhbGx5IGNvbnZlcnRlZCB0byB0aGUgcGF0dGVybiBvZiBob3cgZGF0YSBpcyBzYXZlZCB0byB0aGUgZGF0YWJhc2UuXG4gICAqIC0gSWYgdGhlIHJlY29yZCBkb2VzIG5vdCBleGlzdCwgaXQgdGhyb3dzIGFuIGVycm9yLiBJZiB0aGUgcmVjb3JkIGV4aXN0cywgaXQgcmV0dXJucyB0aGUgYXR0cmlidXRlcyBvZiB0aGUgZGVsZXRlIG9iamVjdCBhcyBpdCBpcyBvbiB0aGUgQVdTIFNESyByZXNwb25zZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgXG4gICAqIGNsYXNzIE1vZGVsIGV4dGVuZHMgRW50aXR5IHtcbiAgICogICBAcHJvcCh7IHByaW1hcnlLZXk6IHRydWUgfSk7XG4gICAqICAgcGs6IHN0cmluZztcbiAgICpcbiAgICogICBAcHJvcCh7IHNlY29uZGFyeUtleTogdHJ1ZSB9KTtcbiAgICogICBzazogc3RyaW5nO1xuICAgKiB9XG4gICAqXG4gICAqIGF3YWl0IE1vZGVsLmRlbGV0ZUl0ZW0oeyBwazogJzEnLCBzazogJzInIH0pOyAvLyBUaGlzIHdpbGwgZGVsZXRlIGEgcmVjb3JkIGluIHRoZSBkYXRhYmFzZSB3aXRoIHBrIGFzICdNb2RlbC0xJyBhbmQgc2sgYXMgJ01vZGVsLTInLlxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBhc3luYyBkZWxldGVJdGVtKGtleTogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LktleSkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5fZHluYW1vZGIuZGVsZXRlKFxuICAgICAgdGhpcy5wcmVwYXJlT3B0c0ZvckRlbGV0ZSh7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy5fdGFibGVOYW1lLFxuICAgICAgICBLZXk6IHRoaXMuc2V0RW50aXR5T25LZXkoa2V5KSxcbiAgICAgICAgUmV0dXJuVmFsdWVzOiAnQUxMX09MRCcsXG4gICAgICB9KSxcbiAgICApLnByb21pc2UoKTtcblxuICAgIGlmIChyZXNwb25zZS5BdHRyaWJ1dGVzID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSXRlbSBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzcG9uc2UuQXR0cmlidXRlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSBhbiBpdGVtIHdpdGggdGhlIHNwZWNpZmllZCBrZXkgZnJvbSB0aGUgZGF0YWJhc2UgdXNpbmcgdGhlIDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCJodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTSmF2YVNjcmlwdFNESy9sYXRlc3QvQVdTL0R5bmFtb0RCL0RvY3VtZW50Q2xpZW50Lmh0bWwjZ2V0LXByb3BlcnR5XCI+YXdzLXNkayBkb2N1bWVudGNsaWVudCBnZXQgbWV0aG9kPC9hPi5cbiAgICogQHBhcmFtIHtBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuS2V5fSBrZXkgLSBUaGlzIGFyZ3VtZW50IHNob3VsZCBiZSB0aGUga2V5IGJlZm9yZSBwcmVwYXJpbmcgaXQgdG8gc2F2ZSB0byB0aGUgZGF0YWJhc2UuIFNlZSBleGFtcGxlIGZvciBtb3JlIGRldGFpbHMuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2luY2x1ZGVSZWxhdGVkID0gZmFsc2VdIC0gSWYgdGhpcyBhcmd1bWVudCBpcyB0cnVlLCB0aGUgcmVsYXRlZCBjaGlsZHJlbiB3aWxsIGJlIGluY2x1ZGVkLiBUaGlzIHdpbGwgb25seSB3b3JrIGZvciBjaGlsZHJlbiB3aXRoIGEgZm9yZWlnbiBrZXkgYW5kIGluZGV4IHNldC4gRm9yIGVhY2ggY2hpbGRyZW4gZ3JvdXAgKGhhc09uZSBvciBoYXNNYW55KSBhIHF1ZXJ5IG9uIHRoZSBmb3JlaWduIGtleSBpbmRleCB3aWxsIGJlIG1hZGUuXG4gICAqIEByZW1hcmtzXG4gICAqICZuYnNwO1xuICAgKiAtIFRoZSBtb2RlbCBwcmltYXJ5IGtleSBhbmQgc2Vjb25kYXJ5IGtleSBhcmUgYXV0b21hdGljYWxseSBjb252ZXJ0ZWQgdG8gdGhlIHBhdHRlcm4gb2YgaG93IGRhdGEgaXMgc2F2ZWQgdG8gdGhlIGRhdGFiYXNlLlxuICAgKiAtIElmIHRoZSByZWNvcmQgZG9lcyBub3QgZXhpc3QsIGl0IHRocm93cyBhbiBlcnJvci4gSWYgdGhlIHJlY29yZCBleGlzdHMsIGl0IHJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIG1vZGVsIHdpdGggdGhlIGF0dHJpYnV0ZXMgYWxyZWFkeSBzZXQuXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYFxuICAgKiBjbGFzcyBNb2RlbCBleHRlbmRzIEVudGl0eSB7XG4gICAqICAgQHByb3AoeyBwcmltYXJ5S2V5OiB0cnVlIH0pO1xuICAgKiAgIHBrOiBzdHJpbmc7XG4gICAqXG4gICAqICAgQHByb3AoeyBzZWNvbmRhcnlLZXk6IHRydWUgfSk7XG4gICAqICAgc2s6IHN0cmluZztcbiAgICogfVxuICAgKlxuICAgKiBjb25zdCBpbnN0YW5jZSA9IGF3YWl0IE1vZGVsLmdldEl0ZW0oeyBwazogJzEnLCBzazogJzInIH0pOyAvLyBUaGlzIHdpbGwgcmV0cmlldmUgYSByZWNvcmQgaW4gdGhlIGRhdGFiYXNlIHdpdGggcGsgYXMgJ01vZGVsLTEnIGFuZCBzayBhcyAnTW9kZWwtMicuXG4gICAqIGNvbnNvbGUubG9nKGluc3RhbmNlLnBrKSAvLyAnMSdcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0SXRlbShrZXk6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5LZXksIGluY2x1ZGVSZWxhdGVkID0gZmFsc2UpIHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuX2R5bmFtb2RiLmdldCh7XG4gICAgICBUYWJsZU5hbWU6IHRoaXMuX3RhYmxlTmFtZSxcbiAgICAgIEtleTogdGhpcy5zZXRFbnRpdHlPbktleShrZXkpLFxuICAgIH0pLnByb21pc2UoKTtcblxuICAgIGNvbnN0IHtcbiAgICAgIEl0ZW06IGl0ZW0sXG4gICAgfSA9IHJlc3BvbnNlO1xuXG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5pbml0aWFsaXplKGl0ZW0pO1xuICAgICAgaWYgKGluY2x1ZGVSZWxhdGVkKSBhd2FpdCBpbnN0YW5jZS5xdWVyeVJlbGF0ZWQoKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJpZXMgdGhlIGRhdGFiYXNlIHVzaW5nIHRoZSA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU0phdmFTY3JpcHRTREsvbGF0ZXN0L0FXUy9EeW5hbW9EQi9Eb2N1bWVudENsaWVudC5odG1sI3F1ZXJ5LXByb3BlcnR5XCI+YXdzLXNkayBkb2N1bWVudGNsaWVudCBxdWVyeSBtZXRob2Q8L2E+LlxuICAgKiBAcGFyYW0ge1F1ZXJ5T3B0aW9uc30gb3B0cyAtIEEgbGlzdCBvZiBvcHRpb25zIHRvIGJlIHVzZWQgYnkgdGhlIHF1ZXJ5IG1ldGhvZC4gU2ltaWxhciB0byBkbyB0aGUgb3B0aW9ucyBmcm9tIDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCJodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTSmF2YVNjcmlwdFNESy9sYXRlc3QvQVdTL0R5bmFtb0RCL0RvY3VtZW50Q2xpZW50Lmh0bWwjcXVlcnktcHJvcGVydHlcIj5hd3Mtc2RrIGRvY3VtZW50Y2xpZW50IHF1ZXJ5IG1ldG9kXTwvYT5cbiAgICogQHJldHVybnMge0R5bmFtb1BhZ2luYXRvcn0gLSBBIHBhZ2luYXRvciBpbnN0YW5jZS5cbiAgICogQHJlbWFya3NcbiAgICogJm5ic3A7XG4gICAqIC0gSXQgYXV0b21hdGljYWxseSBmaWx0ZXIgdGhlIHJlc3VsdHMgdG8gcmV0dXJuIG9ubHkgdGhlIG9uZXMgbWF0Y2hpbmcgdGhlIGN1cnJlbnQgY2xhc3MgZW50aXR5IG5hbWUgdXNpbmcgYSBjb25kaXRpb24gZXhwcmVzc2lvbi5cbiAgICogQGV4YW1wbGVcbiAgICogYGBgXG4gICAqIGNsYXNzIE1vZGVsIGV4dGVuZHMgRW50aXR5IHtcbiAgICogICBAcHJvcCh7IHByaW1hcnlLZXk6IHRydWUgfSk7XG4gICAqICAgcGs6IHN0cmluZztcbiAgICpcbiAgICogICBAcHJvcCh7IHNlY29uZGFyeUtleTogdHJ1ZSB9KTtcbiAgICogICBzazogc3RyaW5nO1xuICAgKiB9XG4gICAqXG4gICAqIGNvbnN0IHBhZ2luYXRvciA9IGF3YWl0IE1vZGVsLnF1ZXJ5KHtcbiAgICogICBJbmRleE5hbWU6ICdieVNrJyxcbiAgICogICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnc2sgPSA6dicsXG4gICAqICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgKiAgICAgJzp2JzogJ1Rlc3RNb2RlbC1xdWVyeS0yJyxcbiAgICogICB9LFxuICAgKiB9KTtcbiAgICpcbiAgICogY29uc29sZS5sb2cocGFnaW5hdG9yLml0ZW1zKSAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGluc3RhbmNlcyBvZiBNb2RlbCBjbGFzcy5cbiAgICogY29uc29sZS5sb2cocGFnaW5hdG9yLm1vcmVQYWdlcykgLy8gQm9vbGVhbiBtZWFuaW5nIGlmIHRoZXJlIGFyZSBtb3JlIHJlY29yZHMgYXZhaWxhYmxlIG9yIG5vdC5cbiAgICogYXdhaXQgcGFnaW5hdG9yLm5leHQoKTsgLy8gRmV0Y2hlcyB0aGUgbmV4dCBwYWdlIGlmIGl0IGV4aXN0cy5cbiAgICogY29uc29sZS5sb2cocGFnaW5hdG9yLml0ZW1zKSAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCBmZXRjaGVkIGluc3RhbmNlcyBvZiBNb2RlbCBjbGFzcy5cbiAgICogY29uc29sZS5sb2cocGFnaW5hdG9yLmxhc3RQYWdlSXRlbXMpIC8vIFJldHVybnMgYW4gYXJyYXkgb2YgbGFzdCBwYWdlIGZldGNoZWQgaW5zdGFuY2VzIG9mIE1vZGVsIGNsYXNzLlxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBhc3luYyBxdWVyeShvcHRzOiBRdWVyeU9wdGlvbnMpIHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLmNyZWF0ZVBhZ2luYXRvcih0aGlzLl9xdWVyeS5iaW5kKHRoaXMpLCBvcHRzKTtcbiAgICBhd2FpdCBwYWdpbmF0b3IubmV4dCgpO1xuICAgIHJldHVybiBwYWdpbmF0b3I7XG4gIH1cblxuICAvKipcbiAgICogUXVlcmllcyB0aGUgZGF0YWJhc2UgdXNpbmcgdGhlIDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCJodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTSmF2YVNjcmlwdFNESy9sYXRlc3QvQVdTL0R5bmFtb0RCL0RvY3VtZW50Q2xpZW50Lmh0bWwjcXVlcnktcHJvcGVydHlcIj5hd3Mtc2RrIGRvY3VtZW50Y2xpZW50IHF1ZXJ5IG1ldGhvZDwvYT4uXG4gICAqIEBwYXJhbSB7UXVlcnlPcHRpb25zfSBvcHRzIC0gQSBsaXN0IG9mIG9wdGlvbnMgdG8gYmUgdXNlZCBieSB0aGUgcXVlcnkgbWV0aG9kLiBTaW1pbGFyIHRvIGRvIHRoZSBvcHRpb25zIGZyb20gPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cImh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NKYXZhU2NyaXB0U0RLL2xhdGVzdC9BV1MvRHluYW1vREIvRG9jdW1lbnRDbGllbnQuaHRtbCNxdWVyeS1wcm9wZXJ0eVwiPmF3cy1zZGsgZG9jdW1lbnRjbGllbnQgcXVlcnkgbWV0b2RdPC9hPlxuICAgKiBAcmV0dXJucyB7RHluYW1vUGFnaW5hdG9yfSAtIEEgcGFnaW5hdG9yIGluc3RhbmNlLlxuICAgKiBAcmVtYXJrc1xuICAgKiAmbmJzcDtcbiAgICogLSBJdCBhdXRvbWF0aWNhbGx5IGZpbHRlciB0aGUgcmVzdWx0cyB0byByZXR1cm4gb25seSB0aGUgb25lcyBtYXRjaGluZyB0aGUgY3VycmVudCBjbGFzcyBlbnRpdHksIGFuZCBhbGwgdGhlIGNoaWxkcmVuIHJlY29yZHMgd2hvIGFyZSByZWxhdGVkIHRvIHRoZSBjdXJyZW50IGNsYXNzIHRocm91Z2ggdGhlIHNhbWUgaW5kZXggYmVpbmcgdXNlZCB3aXRoIGEgY29uZGl0aW9uIGV4cHJlc3Npb24uXG4gICAqIC0gVGhlIGNoaWxkcmVuIGFyZSBub3QgaW5pdGlhbGl6ZWQgaW4gdGhlIHBhcmVudCBtb2RlbCAodGhpcyBjb3VsZCBiZSBkb25lIHRocm91Z2ggYW4gaW1wcm92ZW1lbnQgdG8gdGhlIGxpYnJhcnksIGJ1dCBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LilcbiAgICogQGV4YW1wbGVcbiAgICogYGBgXG4gICAqIGNsYXNzIE1vZGVsIGV4dGVuZHMgRW50aXR5IHtcbiAgICogICBAcHJvcCh7IHByaW1hcnlLZXk6IHRydWUgfSk7XG4gICAqICAgcGs6IHN0cmluZztcbiAgICpcbiAgICogICBAcHJvcCh7IHNlY29uZGFyeUtleTogdHJ1ZSB9KTtcbiAgICogICBzazogc3RyaW5nO1xuICAgKlxuICAgKiAgIEBoYXNNYW55KEhhc01hbnlDaGlsZCwgeyBuZXN0ZWRPYmplY3Q6IGZhbHNlLCBmb3JlaWduS2V5OiAnZmsnLCBpbmRleE5hbWU6ICdieUZLJyB9KVxuICAgKiAgIGNoaWxkcmVuOiBIYXNNYW55Q2hpbGRbXVxuICAgKlxuICAgKiAgIEBoYXNPbmUoSGFzT25lQ2hpbGQsIHsgbmVzdGVkT2JqZWN0OiBmYWxzZSwgZm9yZWlnbktleTogJ2ZrMicsIGluZGV4TmFtZTogJ2J5RksyJyB9KVxuICAgKiAgIGNoaWxkOiBIYXNPbmVDaGlsZFxuICAgKiB9XG4gICAqXG4gICAqIGNvbnN0IHBhZ2luYXRvciA9IGF3YWl0IE1vZGVsLnF1ZXJ5V2l0aENoaWxkcmVuUmVjb3Jkcyh7XG4gICAqICAgSW5kZXhOYW1lOiAnYnlGSycsXG4gICAqICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ2ZrID0gOnYnLFxuICAgKiAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICogICAgICc6dic6ICdNb2RlbC0xJyxcbiAgICogICB9LFxuICAgKiB9KTtcbiAgICpcbiAgICogY29uc29sZS5sb2cocGFnaW5hdG9yLml0ZW1zKSAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGluc3RhbmNlcyBvZiBNb2RlbCBjbGFzcyBhbmQgSGFzTWFueUNoaWxkIGNsYXNzLiBBcyBIYXNPbmVDaGlsZCBpcyByZWxhdGVkIHRocm91Z2ggYW5vdGhlciBmb3JlaWduS2V5LCBpdCBpcyBleGNsdWRlZC5cbiAgICogY29uc29sZS5sb2cocGFnaW5hdG9yLm1vcmVQYWdlcykgLy8gQm9vbGVhbiBtZWFuaW5nIGlmIHRoZXJlIGFyZSBtb3JlIHJlY29yZHMgYXZhaWxhYmxlIG9yIG5vdC5cbiAgICogYXdhaXQgcGFnaW5hdG9yLm5leHQoKTsgLy8gRmV0Y2hlcyB0aGUgbmV4dCBwYWdlIGlmIGl0IGV4aXN0cy5cbiAgICogY29uc29sZS5sb2cocGFnaW5hdG9yLml0ZW1zKSAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCBmZXRjaGVkIGluc3RhbmNlcyBvZiBNb2RlbCBhbmQgSGFzTWFueUNoaWxkIGNsYXNzZXMuXG4gICAqIGNvbnNvbGUubG9nKHBhZ2luYXRvci5sYXN0UGFnZUl0ZW1zKSAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIGxhc3QgcGFnZSBmZXRjaGVkIGluc3RhbmNlcyBvZiBNb2RlbCBhbmQgSGFzTWFueUNoaWxkIGNsYXNzZXMuXG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHF1ZXJ5V2l0aENoaWxkcmVuUmVjb3JkcyhvcHRzOiBRdWVyeU9wdGlvbnMpIHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLmNyZWF0ZVBhZ2luYXRvcih0aGlzLl9xdWVyeVdpdGhDaGlsZHJlblJlY29yZHMuYmluZCh0aGlzKSwgb3B0cyk7XG4gICAgYXdhaXQgcGFnaW5hdG9yLm5leHQoKTtcbiAgICByZXR1cm4gcGFnaW5hdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpbWlsYXIgdG8gdGhlIHtAbGluayBFbnRpdHkucXVlcnkgfCBxdWVyeSBtZXRob2R9LCBidXQgYXV0b21hdGljYWxseSBxdWVyaWVzIGFsbCB0aGUgcGFnZXMgdW50aWwgdGhlcmUgYXJlIG5vIG1vcmUgcmVjb3Jkcy5cbiAgICogQHJldHVybnMge0R5bmFtb1BhZ2luYXRvcn0gLSBBIHBhZ2luYXRvciBpbnN0YW5jZS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBxdWVyeUFsbChvcHRzOiBRdWVyeU9wdGlvbnMpIHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSBhd2FpdCB0aGlzLmNyZWF0ZVBhZ2luYXRvcih0aGlzLl9xdWVyeS5iaW5kKHRoaXMpLCBvcHRzKTtcbiAgICByZXR1cm4gcGFnaW5hdG9yLmdldEFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpbWlsYXIgdG8gdGhlIHtAbGluayBFbnRpdHkucXVlcnlXaXRoQ2hpbGRyZW5SZWNvcmRzIHwgcXVlcnkgd2l0aCBjaGlsZHJlbiByZWNvcmRzIG1ldGhvZH0sIGJ1dCBhdXRvbWF0aWNhbGx5IHF1ZXJpZXMgYWxsIHRoZSBwYWdlcyB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSByZWNvcmRzLlxuICAgKiBAcmV0dXJucyB7RHluYW1vUGFnaW5hdG9yfSAtIEEgcGFnaW5hdG9yIGluc3RhbmNlLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHF1ZXJ5QWxsV2l0aENoaWxkcmVuUmVjb3JkcyhvcHRzOiBRdWVyeU9wdGlvbnMpIHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSBhd2FpdCB0aGlzLmNyZWF0ZVBhZ2luYXRvcih0aGlzLl9xdWVyeVdpdGhDaGlsZHJlblJlY29yZHMuYmluZCh0aGlzKSwgb3B0cyk7XG4gICAgcmV0dXJuIHBhZ2luYXRvci5nZXRBbGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2FucyB0aGUgZGF0YWJhc2UgdXNpbmcgdGhlIDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCJodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTSmF2YVNjcmlwdFNESy9sYXRlc3QvQVdTL0R5bmFtb0RCL0RvY3VtZW50Q2xpZW50Lmh0bWwjc2Nhbi1wcm9wZXJ0eVwiPmF3cy1zZGsgZG9jdW1lbnRjbGllbnQgc2NhbiBtZXRob2Q8L2E+LlxuICAgKiBAcGFyYW0ge1NjYW5PcHRpb25zfSBvcHRzIC0gQSBsaXN0IG9mIG9wdGlvbnMgdG8gYmUgdXNlZCBieSB0aGUgc2NhbiBtZXRob2QuIFNpbWlsYXIgdG8gZG8gdGhlIG9wdGlvbnMgZnJvbSA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FXU0phdmFTY3JpcHRTREsvbGF0ZXN0L0FXUy9EeW5hbW9EQi9Eb2N1bWVudENsaWVudC5odG1sI3NjYW4tcHJvcGVydHlcIj5hd3Mtc2RrIGRvY3VtZW50Y2xpZW50IHNjYW4gbWV0b2RdPC9hPlxuICAgKiBAcmV0dXJucyB7RHluYW1vUGFnaW5hdG9yfSAtIEEgcGFnaW5hdG9yIGluc3RhbmNlLlxuICAgKiBAcmVtYXJrc1xuICAgKiAmbmJzcDtcbiAgICogLSBJdCBhdXRvbWF0aWNhbGx5IGZpbHRlciB0aGUgcmVzdWx0cyB0byByZXR1cm4gb25seSB0aGUgb25lcyBtYXRjaGluZyB0aGUgY3VycmVudCBjbGFzcyBlbnRpdHkgbmFtZSB1c2luZyBhIGNvbmRpdGlvbiBleHByZXNzaW9uLlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGBcbiAgICogY2xhc3MgTW9kZWwgZXh0ZW5kcyBFbnRpdHkge1xuICAgKiAgIEBwcm9wKHsgcHJpbWFyeUtleTogdHJ1ZSB9KTtcbiAgICogICBwazogc3RyaW5nO1xuICAgKlxuICAgKiAgIEBwcm9wKHsgc2Vjb25kYXJ5S2V5OiB0cnVlIH0pO1xuICAgKiAgIHNrOiBzdHJpbmc7XG4gICAqIH1cbiAgICpcbiAgICogY29uc3QgcGFnaW5hdG9yID0gYXdhaXQgTW9kZWwuc2NhbigpO1xuICAgKlxuICAgKiBjb25zb2xlLmxvZyhwYWdpbmF0b3IuaXRlbXMpIC8vIFJldHVybnMgYW4gYXJyYXkgb2YgaW5zdGFuY2VzIG9mIE1vZGVsIGNsYXNzLlxuICAgKiBjb25zb2xlLmxvZyhwYWdpbmF0b3IubW9yZVBhZ2VzKSAvLyBCb29sZWFuIG1lYW5pbmcgaWYgdGhlcmUgYXJlIG1vcmUgcmVjb3JkcyBhdmFpbGFibGUgb3Igbm90LlxuICAgKiBhd2FpdCBwYWdpbmF0b3IubmV4dCgpOyAvLyBGZXRjaGVzIHRoZSBuZXh0IHBhZ2UgaWYgaXQgZXhpc3RzLlxuICAgKiBjb25zb2xlLmxvZyhwYWdpbmF0b3IuaXRlbXMpIC8vIFJldHVybnMgYW4gYXJyYXkgb2YgYWxsIGZldGNoZWQgaW5zdGFuY2VzIG9mIE1vZGVsIGNsYXNzLlxuICAgKiBjb25zb2xlLmxvZyhwYWdpbmF0b3IubGFzdFBhZ2VJdGVtcykgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBsYXN0IHBhZ2UgZmV0Y2hlZCBpbnN0YW5jZXMgb2YgTW9kZWwgY2xhc3MuXG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHNjYW4ob3B0cz86IFNjYW5PcHRpb25zKSB7XG4gICAgY29uc3QgcGFnaW5hdG9yID0gdGhpcy5jcmVhdGVQYWdpbmF0b3IodGhpcy5fc2Nhbi5iaW5kKHRoaXMpLCBvcHRzKTtcbiAgICBhd2FpdCBwYWdpbmF0b3IubmV4dCgpO1xuICAgIHJldHVybiBwYWdpbmF0b3I7XG4gIH1cblxuICAvKipcbiAgICogU2ltaWxhciB0byB0aGUge0BsaW5rIEVudGl0eS5zY2FuIHwgc2NhbiBtZXRob2R9LCBidXQgYXV0b21hdGljYWxseSBxdWVyaWVzIGFsbCB0aGUgcGFnZXMgdW50aWwgdGhlcmUgYXJlIG5vIG1vcmUgcmVjb3Jkcy5cbiAgICogQHJldHVybnMge0R5bmFtb1BhZ2luYXRvcn0gLSBBIHBhZ2luYXRvciBpbnN0YW5jZS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBzY2FuQWxsKG9wdHM/OiBTY2FuT3B0aW9ucykge1xuICAgIGNvbnN0IHBhZ2luYXRvciA9IGF3YWl0IHRoaXMuY3JlYXRlUGFnaW5hdG9yKHRoaXMuX3NjYW4uYmluZCh0aGlzKSwgb3B0cyk7XG4gICAgcmV0dXJuIHBhZ2luYXRvci5nZXRBbGwoKTtcbiAgfVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tIFRBQkxFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgU1VQUE9SVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogQGludGVybmFsICovXG4gIGdldCBkeW5hbW9BdHRyaWJ1dGVzKCkge1xuICAgIGxldCBhdHRyaWJ1dGVzID0gdGhpcy52YWxpZGF0ZWRBdHRyaWJ1dGVzO1xuXG4gICAgaWYgKE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgY2Fubm90IHNhdmUgYW4gaW5zdGFuY2Ugd2l0aCBubyBhdHRyaWJ1dGVzIGF0IGFsbC4nKTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVzLl9lbnRpdHlOYW1lID0gdGhpcy5fZW50aXR5TmFtZTtcbiAgICBhdHRyaWJ1dGVzID0ge1xuICAgICAgLi4uYXR0cmlidXRlcyxcbiAgICAgIC4uLnRoaXMuZmluYWxEeW5hbW9EQktleSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHBhcnNlRHluYW1vQXR0cmlidXRlcyhpdGVtOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gICAgZGVsZXRlIGl0ZW0uX2VudGl0eU5hbWU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4uaXRlbSxcbiAgICAgIC4uLnRoaXMucmVtb3ZlRW50aXR5RnJvbUtleShpdGVtKSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBhc3luYyBxdWVyeVJlbGF0ZWQoKSB7XG4gICAgY29uc3QgaGFzTWFueU5vdE5lc3RlZE1vZGVscyA9IGdldEhhc01hbnlOb3ROZXN0ZWRNb2RlbHModGhpcyk7XG5cbiAgICBmb3IgKGNvbnN0IG1vZGVsTmFtZSBvZiBoYXNNYW55Tm90TmVzdGVkTW9kZWxzKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIG1vZGVsOiBDaGlsZE1vZGVsLFxuICAgICAgICBvcHRzOiB7XG4gICAgICAgICAgZm9yZWlnbktleSA9IHVuZGVmaW5lZCxcbiAgICAgICAgICBpbmRleE5hbWUgPSB1bmRlZmluZWQsXG4gICAgICAgICAgcGFyZW50UHJvcGVydHlPbkNoaWxkID0gdW5kZWZpbmVkLFxuICAgICAgICB9ID0ge30sXG4gICAgICB9ID0gZ2V0SGFzTWFueU1vZGVsKHRoaXMsIG1vZGVsTmFtZSkgfHwge307XG5cbiAgICAgIGlmIChmb3JlaWduS2V5ICE9IG51bGwgJiYgaW5kZXhOYW1lICE9IG51bGwpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGl0ZW1zOiBjaGlsZHJlbixcbiAgICAgICAgfSA9IGF3YWl0IENoaWxkTW9kZWwucXVlcnlBbGwoe1xuICAgICAgICAgIEluZGV4TmFtZTogaW5kZXhOYW1lLFxuICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczoge1xuICAgICAgICAgICAgJyNfZmsnOiBmb3JlaWduS2V5LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgJzpfZmsnOiB0aGlzW2ZvcmVpZ25LZXldLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJyNfZmsgPSA6X2ZrJyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHBhcmVudFByb3BlcnR5T25DaGlsZCkge1xuICAgICAgICAgIGNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICBjaGlsZFtwYXJlbnRQcm9wZXJ0eU9uQ2hpbGRdID0gdGhpcztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXNbbW9kZWxOYW1lXSA9IGNoaWxkcmVuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGhhc09uZU5vdE5lc3RlZE1vZGVscyA9IGdldEhhc09uZU5vdE5lc3RlZE1vZGVscyh0aGlzKTtcblxuICAgIGZvciAoY29uc3QgbW9kZWxOYW1lIG9mIGhhc09uZU5vdE5lc3RlZE1vZGVscykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBtb2RlbDogQ2hpbGRNb2RlbCxcbiAgICAgICAgb3B0czoge1xuICAgICAgICAgIGZvcmVpZ25LZXkgPSB1bmRlZmluZWQsXG4gICAgICAgICAgaW5kZXhOYW1lID0gdW5kZWZpbmVkLFxuICAgICAgICAgIHBhcmVudFByb3BlcnR5T25DaGlsZCA9IHVuZGVmaW5lZCxcbiAgICAgICAgfSA9IHt9LFxuICAgICAgfSA9IGdldEhhc09uZU1vZGVsKHRoaXMsIG1vZGVsTmFtZSkgfHwge307XG5cbiAgICAgIGlmIChmb3JlaWduS2V5ICE9IG51bGwgJiYgaW5kZXhOYW1lICE9IG51bGwpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGl0ZW1zOiBjaGlsZHJlbixcbiAgICAgICAgfSA9IGF3YWl0IENoaWxkTW9kZWwucXVlcnlBbGwoe1xuICAgICAgICAgIEluZGV4TmFtZTogaW5kZXhOYW1lLFxuICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczoge1xuICAgICAgICAgICAgJyNfZmsnOiBmb3JlaWduS2V5LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgJzpfZmsnOiB0aGlzW2ZvcmVpZ25LZXldLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJyNfZmsgPSA6X2ZrJyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHBhcmVudFByb3BlcnR5T25DaGlsZCkge1xuICAgICAgICAgIGNoaWxkcmVuWzBdW3BhcmVudFByb3BlcnR5T25DaGlsZF0gPSB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1kZXN0cnVjdHVyaW5nXG4gICAgICAgIHRoaXNbbW9kZWxOYW1lXSA9IGNoaWxkcmVuWzBdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGJlbG9uZ3NUb01vZGVscyA9IGdldEJlbG9uZ3NUb01vZGVscyh0aGlzKTtcblxuICAgIGZvciAoY29uc3QgbW9kZWxOYW1lIG9mIGJlbG9uZ3NUb01vZGVscykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBtb2RlbDogUGFyZW50TW9kZWwsXG4gICAgICAgIG9wdHM6IHtcbiAgICAgICAgICBmb3JlaWduS2V5ID0gdW5kZWZpbmVkLFxuICAgICAgICAgIGluZGV4TmFtZSA9IHVuZGVmaW5lZCxcbiAgICAgICAgICBwYXJlbnRQcm9wZXJ0eU9uQ2hpbGQgPSB1bmRlZmluZWQsXG4gICAgICAgIH0gPSB7fSxcbiAgICAgIH0gPSBnZXRCZWxvbmdzVG9Nb2RlbCh0aGlzLCBtb2RlbE5hbWUpIHx8IHt9O1xuXG4gICAgICBpZiAoZm9yZWlnbktleSAhPSBudWxsICYmIGluZGV4TmFtZSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBpdGVtczogW3BhcmVudF0sXG4gICAgICAgIH0gPSBhd2FpdCBQYXJlbnRNb2RlbC5xdWVyeUFsbCh7XG4gICAgICAgICAgSW5kZXhOYW1lOiBpbmRleE5hbWUsXG4gICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XG4gICAgICAgICAgICAnI19mayc6IGZvcmVpZ25LZXksXG4gICAgICAgICAgfSxcbiAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAnOl9mayc6IHRoaXNbZm9yZWlnbktleV0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnI19mayA9IDpfZmsnLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgcHJvcGVydHlLZXksXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgfSA9IGdldEhhc0Zyb21CZWxvbmcodGhpcywgZm9yZWlnbktleSwgaW5kZXhOYW1lLCBwYXJlbnRQcm9wZXJ0eU9uQ2hpbGQpIHx8IHt9O1xuXG4gICAgICAgIGlmIChwcm9wZXJ0eUtleSkge1xuICAgICAgICAgIGlmICh0eXBlID09PSAnaGFzT25lJykge1xuICAgICAgICAgICAgcGFyZW50W3Byb3BlcnR5S2V5XSA9IHRoaXM7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnaGFzTWFueScpIHtcbiAgICAgICAgICAgIHBhcmVudFtwcm9wZXJ0eUtleV0gPSBbdGhpc107XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1kZXN0cnVjdHVyaW5nXG4gICAgICAgIHRoaXNbbW9kZWxOYW1lXSA9IHBhcmVudDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIFNVUFBPUlQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogUmV0cmlldmUgY3VycmVudCBpdGVtIGRhdGEgZnJvbSB0aGUgZGF0YWJhc2UgdXNpbmcgdGhlIDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCJodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTSmF2YVNjcmlwdFNESy9sYXRlc3QvQVdTL0R5bmFtb0RCL0RvY3VtZW50Q2xpZW50Lmh0bWwjZ2V0LXByb3BlcnR5XCI+YXdzLXNkayBkb2N1bWVudGNsaWVudCBnZXQgbWV0aG9kPC9hPi5cbiAgICogQHBhcmFtIHtib29sZWFufSBbaW5jbHVkZVJlbGF0ZWQgPSBmYWxzZV0gLSBJZiB0aGlzIGFyZ3VtZW50IGlzIHRydWUsIHRoZSByZWxhdGVkIGNoaWxkcmVuIHdpbGwgYmUgaW5jbHVkZWQuIFRoaXMgd2lsbCBvbmx5IHdvcmsgZm9yIGNoaWxkcmVuIHdpdGggYSBmb3JlaWduIGtleSBhbmQgaW5kZXggc2V0LiBGb3IgZWFjaCBjaGlsZHJlbiBncm91cCAoaGFzT25lIG9yIGhhc01hbnkpIGEgcXVlcnkgb24gdGhlIGZvcmVpZ24ga2V5IGluZGV4IHdpbGwgYmUgbWFkZS5cbiAgICogQHJlbWFya3NcbiAgICogJm5ic3A7XG4gICAqIC0gVGhlIG1vZGVsIHByaW1hcnkga2V5IGFuZCBzZWNvbmRhcnkga2V5IGFyZSBhdXRvbWF0aWNhbGx5IGNvbnZlcnRlZCB0byB0aGUgcGF0dGVybiBvZiBob3cgZGF0YSBpcyBzYXZlZCB0byB0aGUgZGF0YWJhc2UuXG4gICAqIC0gSWYgdGhlIHJlY29yZCBkb2VzIG5vdCBleGlzdCwgaXQgdGhyb3dzIGFuIGVycm9yLiBJZiB0aGUgcmVjb3JkIGV4aXN0cywgaXQgdXBkYXRlcyB0aGUgY3VycmVudCBpbnN0YW5jZSBhdHRyaWJ1dGVzIGFuZCByZXR1cm4gdGhlIGluc3RhbmNlLlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGBcbiAgICogY2xhc3MgTW9kZWwgZXh0ZW5kcyBFbnRpdHkge1xuICAgKiAgIEBwcm9wKHsgcHJpbWFyeUtleTogdHJ1ZSB9KTtcbiAgICogICBwazogc3RyaW5nO1xuICAgKlxuICAgKiAgIEBwcm9wKHsgc2Vjb25kYXJ5S2V5OiB0cnVlIH0pO1xuICAgKiAgIHNrOiBzdHJpbmc7XG4gICAqIH1cbiAgICpcbiAgICogY29uc3QgaW5zdGFuY2UgPSBuZXcgTW9kZWwoeyBwazogJzEnLCBzazogJzInIH0pO1xuICAgKiBhd2FpdCBpbnN0YW5jZS5sb2FkKCk7XG4gICAqIGNvbnNvbGUubG9nKGluc3RhbmNlLm90aGVyQXR0cmlidXRlRnJvbURhdGFiYXNlKSAvLyB2YWx1ZSBsb2FkZWQgZnJvbSB0aGUgZGF0YWJhc2UuXG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgbG9hZChpbmNsdWRlUmVsYXRlZCA9IGZhbHNlKSB7XG4gICAgY29uc3QgcGsgPSB0aGlzLl9wcmltYXJ5S2V5O1xuICAgIGNvbnN0IHNrID0gdGhpcy5fc2Vjb25kYXJ5S2V5O1xuXG4gICAgaWYgKHBrID09IG51bGwgfHwgc2sgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcmltYXJ5IGtleSBhbmQvb3Igc2Vjb25kYXJ5IGtleSBwcm9wcyBub3Qgc2V0Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgSXRlbTogaXRlbSxcbiAgICB9ID0gYXdhaXQgdGhpcy5fZHluYW1vZGIuZ2V0KHtcbiAgICAgIFRhYmxlTmFtZTogdGhpcy5fdGFibGVOYW1lLFxuICAgICAgS2V5OiB0aGlzLmZpbmFsRHluYW1vREJLZXksXG4gICAgfSkucHJvbWlzZSgpO1xuXG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIHRoaXMuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VEeW5hbW9BdHRyaWJ1dGVzKGl0ZW0pO1xuICAgICAgaWYgKGluY2x1ZGVSZWxhdGVkKSBhd2FpdCB0aGlzLnF1ZXJ5UmVsYXRlZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlY29yZCBub3QgZm91bmQuJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBnZXQgcmVsYXRpb25zVXBkYXRlQXR0cmlidXRlcygpIHtcbiAgICBjb25zdCBoYXNPbmVFbnRpdGllcyA9IGdldEhhc09uZU5vdE5lc3RlZE1vZGVscyh0aGlzKS5yZWR1Y2UoKGFnZywgbSkgPT4ge1xuICAgICAgaWYgKHRoaXNbYF9ub0luaXRpYWxpemVyJHtfLmNhcGl0YWxpemUobSl9YF0gPT0gbnVsbCkgcmV0dXJuIGFnZztcblxuICAgICAgY29uc3Qge1xuICAgICAgICBvcHRzOiB7XG4gICAgICAgICAgZm9yZWlnbktleSA9IHVuZGVmaW5lZCxcbiAgICAgICAgfSA9IHt9LFxuICAgICAgfSA9IGdldEhhc09uZU1vZGVsKHRoaXMsIG0pIHx8IHt9O1xuXG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXNbbV07XG4gICAgICBpZiAoZm9yZWlnbktleSAmJiB0aGlzLl9wcmltYXJ5S2V5KSB7XG4gICAgICAgIHZhbHVlW2ZvcmVpZ25LZXldID0gdGhpcy5wcmltYXJ5S2V5RHluYW1vREJWYWx1ZTtcbiAgICAgICAgdGhpc1tmb3JlaWduS2V5XSA9IHRoaXMucHJpbWFyeUtleUR5bmFtb0RCVmFsdWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhZ2cuY29uY2F0KFt2YWx1ZV0pO1xuICAgIH0sIFtdIGFzIER5bmFtb0VudGl0eVtdKTtcblxuICAgIGNvbnN0IGhhc01hbnlFbnRpdGllcyA9IGdldEhhc01hbnlOb3ROZXN0ZWRNb2RlbHModGhpcykucmVkdWNlKChhZ2csIG0pID0+IHtcbiAgICAgIGlmICh0aGlzW2Bfbm9Jbml0aWFsaXplciR7Xy5jYXBpdGFsaXplKG0pfWBdID09IG51bGwpIHJldHVybiBhZ2c7XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgb3B0czoge1xuICAgICAgICAgIGZvcmVpZ25LZXkgPSB1bmRlZmluZWQsXG4gICAgICAgIH0gPSB7fSxcbiAgICAgIH0gPSBnZXRIYXNNYW55TW9kZWwodGhpcywgbSkgfHwge307XG5cbiAgICAgIGxldCB2YWx1ZSA9IHRoaXNbbV07XG4gICAgICBpZiAoZm9yZWlnbktleSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLm1hcCgodikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLl9wcmltYXJ5S2V5KSB7XG4gICAgICAgICAgICB2W2ZvcmVpZ25LZXldID0gdGhpcy5wcmltYXJ5S2V5RHluYW1vREJWYWx1ZTtcbiAgICAgICAgICAgIHRoaXNbZm9yZWlnbktleV0gPSB0aGlzLnByaW1hcnlLZXlEeW5hbW9EQlZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhZ2cuY29uY2F0KHZhbHVlKTtcbiAgICB9LCBbXSBhcyBEeW5hbW9FbnRpdHlbXSk7XG5cbiAgICByZXR1cm4gaGFzT25lRW50aXRpZXMuY29uY2F0KGhhc01hbnlFbnRpdGllcykubWFwKChlbnRpdHkpID0+ICh7XG4gICAgICBVcGRhdGU6IHtcbiAgICAgICAgLi4uZW50aXR5LnVwZGF0ZUF0dHJpYnV0ZXMsXG4gICAgICB9LFxuICAgIH0pKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgZ2V0IGNyZWF0ZUF0dHJpYnV0ZXMoKSB7XG4gICAgaWYgKCF0aGlzLnZhbGlkKSB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBpbnN0YW5jZSBpcyBpbnZhbGlkJyk7XG5cbiAgICBpZiAodGhpcy5fcHJpbWFyeUtleSA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJ1ByaW1hcnkgS2V5IHByb3BlcnR5IHNob3VsZCBiZSBzZXQnKTtcbiAgICBpZiAodGhpcy5fc2Vjb25kYXJ5S2V5ID09IG51bGwpIHRocm93IG5ldyBFcnJvcignU2Vjb25kYXJ5IEtleSBwcm9wZXJ0eSBzaG91bGQgYmUgc2V0Jyk7XG5cbiAgICBjb25zdCBpdGVtID0gdGhpcy5keW5hbW9BdHRyaWJ1dGVzO1xuXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuXG4gICAgaWYgKHRoaXMuX2NyZWF0ZWRBdEtleSkgaXRlbVt0aGlzLl9jcmVhdGVkQXRLZXldID0gbm93O1xuICAgIGlmICh0aGlzLl91cGRhdGVkQXRLZXkpIGl0ZW1bdGhpcy5fdXBkYXRlZEF0S2V5XSA9IG5vdztcblxuICAgIHJldHVybiB7XG4gICAgICBUYWJsZU5hbWU6IHRoaXMuX3RhYmxlTmFtZSxcbiAgICAgIEl0ZW06IGl0ZW0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBjdXJyZW50IGl0ZW0gaW4gZGF0YWJhc2UgdXNpbmcgdGhlIDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCJodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTSmF2YVNjcmlwdFNESy9sYXRlc3QvQVdTL0R5bmFtb0RCL0RvY3VtZW50Q2xpZW50Lmh0bWwjcHV0LXByb3BlcnR5XCI+YXdzLXNkayBkb2N1bWVudGNsaWVudCBwdXQgbWV0aG9kPC9hPi5cbiAgICogQHJlbWFya3NcbiAgICogJm5ic3A7XG4gICAqIC0gVGhlIG1vZGVsIHByaW1hcnkga2V5IGFuZCBzZWNvbmRhcnkga2V5IGFyZSBhdXRvbWF0aWNhbGx5IGNvbnZlcnRlZCB0byB0aGUgcGF0dGVybiBvZiBob3cgZGF0YSBpcyBzYXZlZCB0byB0aGUgZGF0YWJhc2UuXG4gICAqIC0gVGhlIGNyZWF0ZWRBdCBhbmQgdXBkYXRlZEF0IGFyZSBhbHNvIHNldCBpZiB0aGUgY2xhc3MgY29udGFpbnMgYSBwcm9wIGZvciB0aGVtLlxuICAgKiAtIEEgX2VudGl0eSBjb2x1bW4gaXMgYWxzbyBhZGRlZCB0byB0aGUgYXR0cmlidXRlcyB3aXRoIHRoZSBjdXJyZW50IGNsYXNzIG5hbWUuXG4gICAqIC0gSWYgdGhlIHJlY29yZCBhbHJlYWR5IGV4aXN0cywgaXQgZ2V0cyBvdmVyd3JpdHRlbi5cbiAgICogQGV4YW1wbGVcbiAgICogYGBgXG4gICAqIGNsYXNzIE1vZGVsIGV4dGVuZHMgRW50aXR5IHtcbiAgICogICBAcHJvcCh7IHByaW1hcnlLZXk6IHRydWUgfSk7XG4gICAqICAgcGs6IHN0cmluZztcbiAgICpcbiAgICogICBAcHJvcCh7IHNlY29uZGFyeUtleTogdHJ1ZSB9KTtcbiAgICogICBzazogc3RyaW5nO1xuICAgKiB9XG4gICAqXG4gICAqIGNvbnN0IGluc3RhbmNlID0gbmV3IE1vZGVsKHsgcGs6ICcxJywgc2s6ICcyJyB9KTtcbiAgICogYXdhaXQgaW5zdGFuY2UuY3JlYXRlKCk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgY3JlYXRlKCkge1xuICAgIC8vIFRISVMgTkVFRCBUTyBDT01FIEJFRk9SRSBUSEUgQ1JFQVRFIEFUVFJJQlVURVMhXG4gICAgY29uc3QgcmVsQXR0cmlidXRlcyA9IHRoaXMucmVsYXRpb25zVXBkYXRlQXR0cmlidXRlcztcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGVzO1xuXG4gICAgY29uc3QgdHJhbnNhY3RJdGVtcyA9IFtcbiAgICAgIHtcbiAgICAgICAgUHV0OiB0aGlzLmNyZWF0ZUF0dHJpYnV0ZXMsXG4gICAgICB9LFxuICAgICAgLi4ucmVsQXR0cmlidXRlcyxcbiAgICBdO1xuXG4gICAgYXdhaXQgdGhpcy5fZHluYW1vZGIudHJhbnNhY3RXcml0ZSh7XG4gICAgICBUcmFuc2FjdEl0ZW1zOiB0cmFuc2FjdEl0ZW1zLFxuICAgIH0pLnByb21pc2UoKTtcblxuICAgIHRoaXMuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VEeW5hbW9BdHRyaWJ1dGVzKGF0dHJpYnV0ZXMuSXRlbSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIGdldCB1cGRhdGVBdHRyaWJ1dGVzKCkge1xuICAgIGlmICghdGhpcy52YWxpZCkgdGhyb3cgbmV3IEVycm9yKCdUaGUgaW5zdGFuY2UgaXMgaW52YWxpZCcpO1xuXG4gICAgaWYgKHRoaXMuX3ByaW1hcnlLZXkgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCdQcmltYXJ5IEtleSBwcm9wZXJ0eSBzaG91bGQgYmUgc2V0Jyk7XG4gICAgaWYgKHRoaXMuX3NlY29uZGFyeUtleSA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJ1NlY29uZGFyeSBLZXkgcHJvcGVydHkgc2hvdWxkIGJlIHNldCcpO1xuXG4gICAgY29uc3QgaXRlbSA9IHRoaXMuZHluYW1vQXR0cmlidXRlcztcblxuICAgIGNvbnN0IG9wdHMgPSBPYmplY3QuZW50cmllcyhpdGVtKS5yZWR1Y2UoKGFnZywgW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBpZiAoW3RoaXMuX3ByaW1hcnlLZXksIHRoaXMuX3NlY29uZGFyeUtleSwgdGhpcy5fY3JlYXRlZEF0S2V5LCB0aGlzLl91cGRhdGVkQXRLZXldLmluY2x1ZGVzKGtleSkpIHJldHVybiBhZ2c7XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjogZXhwcmVzc2lvbixcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiBuYW1lcyA9IHt9LFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB2YWx1ZXMgPSB7fSxcbiAgICAgIH0gPSBhZ2c7XG5cbiAgICAgIG5hbWVzW2AjJHtrZXl9YF0gPSBrZXk7XG4gICAgICB2YWx1ZXNbYDoke2tleX1gXSA9IHZhbHVlO1xuXG4gICAgICBhZ2cuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0gbmFtZXM7XG4gICAgICBhZ2cuRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyA9IHZhbHVlcztcblxuICAgICAgaWYgKGV4cHJlc3Npb24gPT0gbnVsbCkge1xuICAgICAgICBhZ2cuVXBkYXRlRXhwcmVzc2lvbiA9IGBTRVQgIyR7a2V5fSA9IDoke2tleX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWdnLlVwZGF0ZUV4cHJlc3Npb24gPSBgJHtleHByZXNzaW9ufSwgIyR7a2V5fSA9IDoke2tleX1gO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWdnO1xuICAgIH0sIHt9IGFzIHtcbiAgICAgIFVwZGF0ZUV4cHJlc3Npb246IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5VcGRhdGVFeHByZXNzaW9uO1xuICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVNYXA7XG4gICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlTWFwO1xuICAgIH0pO1xuXG4gICAgaWYgKG9wdHMuVXBkYXRlRXhwcmVzc2lvbiA9PSBudWxsKSB7XG4gICAgICAvLyBOT1RISU5HIEJFSU5HIFNFVCwgVEhST1cgRVJST1JcbiAgICAgIHRocm93IG5ldyBFcnJvcignWW91IGNhbm5vdCBzYXZlIGFuIGluc3RhbmNlIHdpdGggbm8gYXR0cmlidXRlcyBhdCBhbGwuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuXG4gICAgaWYgKHRoaXMuX2NyZWF0ZWRBdEtleSkge1xuICAgICAgb3B0cy5FeHByZXNzaW9uQXR0cmlidXRlTmFtZXNbYCMke3RoaXMuX2NyZWF0ZWRBdEtleX1gXSA9IHRoaXMuX2NyZWF0ZWRBdEtleTtcbiAgICAgIG9wdHMuRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlc1tgOiR7dGhpcy5fY3JlYXRlZEF0S2V5fWBdID0gbm93O1xuICAgICAgb3B0cy5VcGRhdGVFeHByZXNzaW9uID0gYCR7b3B0cy5VcGRhdGVFeHByZXNzaW9ufSwgIyR7dGhpcy5fY3JlYXRlZEF0S2V5fSA9IGlmX25vdF9leGlzdHMoIyR7dGhpcy5fY3JlYXRlZEF0S2V5fSwgOiR7dGhpcy5fY3JlYXRlZEF0S2V5fSlgO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl91cGRhdGVkQXRLZXkpIHtcbiAgICAgIG9wdHMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzW2AjJHt0aGlzLl91cGRhdGVkQXRLZXl9YF0gPSB0aGlzLl91cGRhdGVkQXRLZXk7XG4gICAgICBvcHRzLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbYDoke3RoaXMuX3VwZGF0ZWRBdEtleX1gXSA9IG5vdztcbiAgICAgIG9wdHMuVXBkYXRlRXhwcmVzc2lvbiA9IGAke29wdHMuVXBkYXRlRXhwcmVzc2lvbn0sICMke3RoaXMuX3VwZGF0ZWRBdEtleX0gPSA6JHt0aGlzLl91cGRhdGVkQXRLZXl9YDtcbiAgICB9XG5cbiAgICBjb25zdCByZXQ6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5VcGRhdGUgPSB7XG4gICAgICBUYWJsZU5hbWU6IHRoaXMuX3RhYmxlTmFtZSxcbiAgICAgIEtleTogdGhpcy5maW5hbER5bmFtb0RCS2V5LFxuICAgICAgLi4ub3B0cyxcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIG9yIGNyZWF0ZXMgdGhlIGN1cnJlbnQgaXRlbSBpbiBkYXRhYmFzZSB1c2luZyB0aGUgPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cImh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9BV1NKYXZhU2NyaXB0U0RLL2xhdGVzdC9BV1MvRHluYW1vREIvRG9jdW1lbnRDbGllbnQuaHRtbCN1cGRhdGUtcHJvcGVydHlcIj5hd3Mtc2RrIGRvY3VtZW50Y2xpZW50IHVwZGF0ZSBtZXRob2Q8L2E+LlxuICAgKiBAcmVtYXJrc1xuICAgKiAmbmJzcDtcbiAgICogLSBUaGUgbW9kZWwgcHJpbWFyeSBrZXkgYW5kIHNlY29uZGFyeSBrZXkgYXJlIGF1dG9tYXRpY2FsbHkgY29udmVydGVkIHRvIHRoZSBwYXR0ZXJuIG9mIGhvdyBkYXRhIGlzIHNhdmVkIHRvIHRoZSBkYXRhYmFzZS5cbiAgICogLSBJZiB0aGUgcmVjb3JkIGlzIG5ldywgdGhlIGNyZWF0ZWRBdCBpcyBzZXQuXG4gICAqIC0gSWYgdGhlIHJlY29yZCBpcyBuZXcgb3Igbm90LCB0aGUgdXBkYXRlZEF0IGlzIHNldC5cbiAgICogLSBBIF9lbnRpdHkgY29sdW1uIGlzIGFsc28gYWRkZWQgdG8gdGhlIGF0dHJpYnV0ZXMgd2l0aCB0aGUgY3VycmVudCBjbGFzcyBuYW1lLlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGBcbiAgICogY2xhc3MgTW9kZWwgZXh0ZW5kcyBFbnRpdHkge1xuICAgKiAgIEBwcm9wKHsgcHJpbWFyeUtleTogdHJ1ZSB9KTtcbiAgICogICBwazogc3RyaW5nO1xuICAgKlxuICAgKiAgIEBwcm9wKHsgc2Vjb25kYXJ5S2V5OiB0cnVlIH0pO1xuICAgKiAgIHNrOiBzdHJpbmc7XG4gICAqIH1cbiAgICpcbiAgICogY29uc3QgaW5zdGFuY2UgPSBuZXcgTW9kZWwoeyBwazogJzEnLCBzazogJzInIH0pO1xuICAgKiBhd2FpdCBpbnN0YW5jZS51cGRhdGUoKTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyB1cGRhdGUoKSB7XG4gICAgLy8gVEhJUyBORUVEIFRPIEJFIENBTExFRCBJTiBUSElTIE9SREVSIVxuICAgIGNvbnN0IHJlbEF0dHJpYnV0ZXMgPSB0aGlzLnJlbGF0aW9uc1VwZGF0ZUF0dHJpYnV0ZXM7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IHRoaXMudXBkYXRlQXR0cmlidXRlcztcblxuICAgIGNvbnN0IHRyYW5zYWN0SXRlbXMgPSBbXG4gICAgICB7XG4gICAgICAgIFVwZGF0ZTogYXR0cmlidXRlcyxcbiAgICAgIH0sXG4gICAgICAuLi5yZWxBdHRyaWJ1dGVzLFxuICAgIF07XG5cbiAgICBhd2FpdCB0aGlzLl9keW5hbW9kYi50cmFuc2FjdFdyaXRlKHtcbiAgICAgIFRyYW5zYWN0SXRlbXM6IHRyYW5zYWN0SXRlbXMsXG4gICAgfSkucHJvbWlzZSgpO1xuXG4gICAgY29uc3Qge1xuICAgICAgSXRlbTogaXRlbSxcbiAgICB9ID0gYXdhaXQgdGhpcy5fZHluYW1vZGIuZ2V0KHtcbiAgICAgIFRhYmxlTmFtZTogYXR0cmlidXRlcy5UYWJsZU5hbWUsXG4gICAgICBLZXk6IGF0dHJpYnV0ZXMuS2V5LFxuICAgIH0pLnByb21pc2UoKTtcblxuICAgIGlmIChpdGVtKSB0aGlzLmF0dHJpYnV0ZXMgPSB0aGlzLnBhcnNlRHluYW1vQXR0cmlidXRlcyhpdGVtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG59XG4iXX0=