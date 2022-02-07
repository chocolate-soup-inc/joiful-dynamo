"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoEntity = void 0;
const lodash_1 = __importDefault(require("lodash"));
const decorators_1 = require("../decorators");
const BasicEntity_1 = require("./BasicEntity");
const DynamoPaginator_1 = require("./DynamoPaginator");
class DynamoEntity extends BasicEntity_1.BasicEntity {
    constructor(item) {
        super(item);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.load = this.load.bind(this);
        this.setEntityOnKey = this.setEntityOnKey.bind(this);
        this.removeEntityFromKey = this.removeEntityFromKey.bind(this);
    }
    // ---------------- BASIC SETTINGS ----------------
    get _dynamodb() { return (0, decorators_1.getTableDynamoDbInstance)(this.constructor); }
    static get _dynamodb() { return this.prototype._dynamodb; }
    get _tableName() { return (0, decorators_1.getTableName)(this.constructor); }
    static get _tableName() { return this.prototype._tableName; }
    get _entityName() { return this.constructor.name; }
    static get _entityName() { return this.name; }
    get _primaryKey() { return (0, decorators_1.getPrimaryKey)(this); }
    static get _primaryKey() { return this.prototype._primaryKey; }
    get _secondaryKey() { return (0, decorators_1.getSecondaryKey)(this); }
    static get _secondaryKey() { return this.prototype._secondaryKey; }
    get _createdAtKey() { return (0, decorators_1.getCreatedAtKey)(this); }
    static get _createdAtKey() { return this.prototype._createdAtKey; }
    get _updatedAtKey() { return (0, decorators_1.getUpdatedAtKey)(this); }
    static get _updatedAtKey() { return this.prototype._updatedAtKey; }
    // ---------------- BASIC SETTINGS ----------------
    // ---------------- TABLE SUPPORT METHODS ----------------
    static initialize(item) {
        return new this(this.prototype.parseDynamoAttributes(item));
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
    static async getItem(key) {
        const { Item: item, } = await this._dynamodb.get({
            TableName: this._tableName,
            Key: this.setEntityOnKey(key),
        }).promise();
        if (item)
            return this.initialize(item);
        return item;
    }
    static async query(opts) {
        const paginator = this.createPaginator(this._query.bind(this), opts);
        await paginator.next();
        return paginator;
    }
    static async queryAll(opts) {
        const paginator = await this.createPaginator(this._query.bind(this), opts);
        return paginator.getAll();
    }
    static async scan(opts) {
        const paginator = this.createPaginator(this._scan.bind(this), opts);
        await paginator.next();
        return paginator;
    }
    static async scanAll(opts) {
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
        attributes = Object.assign(Object.assign({}, attributes), this.finalDynamoDBKey);
        return attributes;
    }
    parseDynamoAttributes(item) {
        delete item._entityName;
        return Object.assign(Object.assign({}, item), this.removeEntityFromKey(item));
    }
    // ---------------- INSTANCE SUPPORT METHODS ----------------
    // ---------------- INSTANCE METHODS ----------------
    async load() {
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
        }
        else {
            throw new Error('Record not found.');
        }
    }
    get relationsUpdateAttributes() {
        const hasOneEntities = (0, decorators_1.getHasOneNotNestedModels)(this).reduce((agg, m) => {
            if (this[`_noInitializer${lodash_1.default.capitalize(m)}`] == null)
                return agg;
            const { opts: { foreignKey = undefined, } = {}, } = (0, decorators_1.getHasOneModel)(this, m) || {};
            const value = this[m];
            if (foreignKey && this._primaryKey) {
                value[foreignKey] = this.primaryKeyDynamoDBValue;
                this[foreignKey] = this.primaryKeyDynamoDBValue;
            }
            return agg.concat([value]);
        }, []);
        const hasManyEntities = (0, decorators_1.getHasManyNotNestedModels)(this).reduce((agg, m) => {
            if (this[`_noInitializer${lodash_1.default.capitalize(m)}`] == null)
                return agg;
            const { opts: { foreignKey = undefined, } = {}, } = (0, decorators_1.getHasManyModel)(this, m) || {};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHluYW1vRW50aXR5LmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbImxpYi9jbGFzc2VzL0R5bmFtb0VudGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBdUI7QUFDdkIsOENBV3VCO0FBRXZCLCtDQUE0QztBQUM1Qyx1REFBb0Q7QUFFcEQsTUFBYSxZQUFhLFNBQVEseUJBQVc7SUFDM0MsWUFBWSxJQUEwQjtRQUNwQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFWixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCxtREFBbUQ7SUFFbkQsSUFBSSxTQUFTLEtBQUssT0FBTyxJQUFBLHFDQUF3QixFQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdEUsTUFBTSxLQUFLLFNBQVMsS0FBSyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUUzRCxJQUFJLFVBQVUsS0FBSyxPQUFPLElBQUEseUJBQVksRUFBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTNELE1BQU0sS0FBSyxVQUFVLEtBQUssT0FBTyxJQUFJLENBQUMs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QUFTLEVBQUUsVUFBVSxDQUFDLFNBQVM7WUFDL0IsR0FBRyxFQUFFLFVBQVUsQ0FBQyxHQUFHO1NBQ3BCLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUViLElBQUksSUFBSTtZQUFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUdGO0FBeGRELG9DQXdkQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQge1xuICBnZXRDcmVhdGVkQXRLZXksXG4gIGdldEhhc01hbnlNb2RlbCxcbiAgZ2V0SGFzTWFueU5vdE5lc3RlZE1vZGVscyxcbiAgZ2V0SGFzT25lTW9kZWwsXG4gIGdldEhhc09uZU5vdE5lc3RlZE1vZGVscyxcbiAgZ2V0UHJpbWFyeUtleSxcbiAgZ2V0U2Vjb25kYXJ5S2V5LFxuICBnZXRUYWJsZUR5bmFtb0RiSW5zdGFuY2UsXG4gIGdldFRhYmxlTmFtZSxcbiAgZ2V0VXBkYXRlZEF0S2V5LFxufSBmcm9tICcuLi9kZWNvcmF0b3JzJztcbmltcG9ydCB7IFF1ZXJ5T3B0aW9ucywgU2Nhbk9wdGlvbnMgfSBmcm9tICcuLi9EeW5hbW9FbnRpdHlUeXBlcyc7XG5pbXBvcnQgeyBCYXNpY0VudGl0eSB9IGZyb20gJy4vQmFzaWNFbnRpdHknO1xuaW1wb3J0IHsgRHluYW1vUGFnaW5hdG9yIH0gZnJvbSAnLi9EeW5hbW9QYWdpbmF0b3InO1xuXG5leHBvcnQgY2xhc3MgRHluYW1vRW50aXR5IGV4dGVuZHMgQmFzaWNFbnRpdHkge1xuICBjb25zdHJ1Y3RvcihpdGVtPzogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICAgIHN1cGVyKGl0ZW0pO1xuXG4gICAgdGhpcy5jcmVhdGUgPSB0aGlzLmNyZWF0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMudXBkYXRlID0gdGhpcy51cGRhdGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLmxvYWQgPSB0aGlzLmxvYWQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNldEVudGl0eU9uS2V5ID0gdGhpcy5zZXRFbnRpdHlPbktleS5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlRW50aXR5RnJvbUtleSA9IHRoaXMucmVtb3ZlRW50aXR5RnJvbUtleS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBCQVNJQyBTRVRUSU5HUyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgZ2V0IF9keW5hbW9kYigpIHsgcmV0dXJuIGdldFRhYmxlRHluYW1vRGJJbnN0YW5jZSh0aGlzLmNvbnN0cnVjdG9yKTsgfVxuXG4gIHN0YXRpYyBnZXQgX2R5bmFtb2RiKCkgeyByZXR1cm4gdGhpcy5wcm90b3R5cGUuX2R5bmFtb2RiOyB9XG5cbiAgZ2V0IF90YWJsZU5hbWUoKSB7IHJldHVybiBnZXRUYWJsZU5hbWUodGhpcy5jb25zdHJ1Y3Rvcik7IH1cblxuICBzdGF0aWMgZ2V0IF90YWJsZU5hbWUoKSB7IHJldHVybiB0aGlzLnByb3RvdHlwZS5fdGFibGVOYW1lOyB9XG5cbiAgZ2V0IF9lbnRpdHlOYW1lKCkgeyByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lOyB9XG5cbiAgc3RhdGljIGdldCBfZW50aXR5TmFtZSgpIHsgcmV0dXJuIHRoaXMubmFtZTsgfVxuXG4gIGdldCBfcHJpbWFyeUtleSgpIHsgcmV0dXJuIGdldFByaW1hcnlLZXkodGhpcyk7IH1cblxuICBzdGF0aWMgZ2V0IF9wcmltYXJ5S2V5KCkgeyByZXR1cm4gdGhpcy5wcm90b3R5cGUuX3ByaW1hcnlLZXk7IH1cblxuICBnZXQgX3NlY29uZGFyeUtleSgpIHsgcmV0dXJuIGdldFNlY29uZGFyeUtleSh0aGlzKTsgfVxuXG4gIHN0YXRpYyBnZXQgX3NlY29uZGFyeUtleSgpIHsgcmV0dXJuIHRoaXMucHJvdG90eXBlLl9zZWNvbmRhcnlLZXk7IH1cblxuICBnZXQgX2NyZWF0ZWRBdEtleSgpIHsgcmV0dXJuIGdldENyZWF0ZWRBdEtleSh0aGlzKTsgfVxuXG4gIHN0YXRpYyBnZXQgX2NyZWF0ZWRBdEtleSgpIHsgcmV0dXJuIHRoaXMucHJvdG90eXBlLl9jcmVhdGVkQXRLZXk7IH1cblxuICBnZXQgX3VwZGF0ZWRBdEtleSgpIHsgcmV0dXJuIGdldFVwZGF0ZWRBdEtleSh0aGlzKTsgfVxuXG4gIHN0YXRpYyBnZXQgX3VwZGF0ZWRBdEtleSgpIHsgcmV0dXJuIHRoaXMucHJvdG90eXBlLl91cGRhdGVkQXRLZXk7IH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tIEJBU0lDIFNFVFRJTkdTIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tIFRBQkxFIFNVUFBPUlQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBpbml0aWFsaXplKGl0ZW06IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgICByZXR1cm4gbmV3IHRoaXModGhpcy5wcm90b3R5cGUucGFyc2VEeW5hbW9BdHRyaWJ1dGVzKGl0ZW0pKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgY3JlYXRlUGFnaW5hdG9yKG1ldGhvZCwgb3B0cykge1xuICAgIHJldHVybiBuZXcgRHluYW1vUGFnaW5hdG9yKHtcbiAgICAgIG1ldGhvZCxcbiAgICAgIG9wdHMsXG4gICAgICB0YWJsZU5hbWU6IHRoaXMuX3RhYmxlTmFtZSxcbiAgICAgIGluaXRpYWxpemVyOiB0aGlzLmluaXRpYWxpemUuYmluZCh0aGlzKSxcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgcHJlcGFyZUVudGl0eUF0dHJpYnV0ZU5hbWVBbmRWYWx1ZShvcHRzKSB7XG4gICAgY29uc3QgbmV3T3B0cyA9IF8uY2xvbmVEZWVwKG9wdHMpO1xuXG4gICAgbGV0IGF0dHJpYnV0ZU5hbWU7XG4gICAgbGV0IGF0dHJpYnV0ZVZhbHVlO1xuICAgIGxldCBjb3VudGVyID0gMDtcbiAgICBkbyB7XG4gICAgICBhdHRyaWJ1dGVOYW1lID0gYCNfZW50aXR5TmFtZSR7Y291bnRlcn1gO1xuICAgICAgYXR0cmlidXRlVmFsdWUgPSBgOl9lbnRpdHlOYW1lJHtjb3VudGVyfWA7XG4gICAgICBjb3VudGVyICs9IDE7XG4gICAgfSB3aGlsZSAoXG4gICAgICBuZXdPcHRzPy5FeHByZXNzaW9uQXR0cmlidXRlTmFtZXM/LlthdHRyaWJ1dGVOYW1lXSAhPSBudWxsXG4gICAgICB8fCBuZXdPcHRzPy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzPy5bYXR0cmlidXRlVmFsdWVdICE9IG51bGxcbiAgICApO1xuXG4gICAgaWYgKG5ld09wdHMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID09IG51bGwpIHtcbiAgICAgIG5ld09wdHMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0ge307XG4gICAgfVxuXG4gICAgaWYgKG5ld09wdHMuRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyA9PSBudWxsKSB7XG4gICAgICBuZXdPcHRzLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBuZXdPcHRzLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lc1thdHRyaWJ1dGVOYW1lXSA9ICdfZW50aXR5TmFtZSc7XG4gICAgbmV3T3B0cy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzW2F0dHJpYnV0ZVZhbHVlXSA9IHRoaXMuX2VudGl0eU5hbWU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb3B0czogbmV3T3B0cyxcbiAgICAgIGF0dHJpYnV0ZU5hbWUsXG4gICAgICBhdHRyaWJ1dGVWYWx1ZSxcbiAgICB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBwcmVwYXJlRW50aXR5RXhwcmVzc2lvbihvcHRzLCBrZXkpIHtcbiAgICBjb25zdCB7XG4gICAgICBvcHRzOiBuZXdPcHRzLFxuICAgICAgYXR0cmlidXRlTmFtZSxcbiAgICAgIGF0dHJpYnV0ZVZhbHVlLFxuICAgIH0gPSB0aGlzLnByZXBhcmVFbnRpdHlBdHRyaWJ1dGVOYW1lQW5kVmFsdWUob3B0cyk7XG5cbiAgICBpZiAobmV3T3B0cz8uW2tleV0pIHtcbiAgICAgIG5ld09wdHNba2V5XSA9IGAke25ld09wdHNba2V5XX0gYW5kICR7YXR0cmlidXRlTmFtZX0gPSAke2F0dHJpYnV0ZVZhbHVlfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld09wdHNba2V5XSA9IGAke2F0dHJpYnV0ZU5hbWV9ID0gJHthdHRyaWJ1dGVWYWx1ZX1gO1xuICAgIH1cblxuICAgIHJldHVybiBuZXdPcHRzO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBwcmVwYXJlT3B0c0ZvclNjYW5BbmRRdWVyeShvcHRzKSB7XG4gICAgcmV0dXJuIHRoaXMucHJlcGFyZUVudGl0eUV4cHJlc3Npb24ob3B0cywgJ0ZpbHRlckV4cHJlc3Npb24nKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgcHJlcGFyZU9wdHNGb3JEZWxldGUob3B0cykge1xuICAgIHJldHVybiB0aGlzLnByZXBhcmVFbnRpdHlFeHByZXNzaW9uKG9wdHMsICdDb25kaXRpb25FeHByZXNzaW9uJyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIF9xdWVyeShvcHRzOiBBV1MuRHluYW1vREIuUXVlcnlJbnB1dCkge1xuICAgIHJldHVybiB0aGlzLl9keW5hbW9kYi5xdWVyeSh0aGlzLnByZXBhcmVPcHRzRm9yU2NhbkFuZFF1ZXJ5KG9wdHMpKS5wcm9taXNlKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIF9zY2FuKG9wdHM6IEFXUy5EeW5hbW9EQi5TY2FuSW5wdXQpIHtcbiAgICByZXR1cm4gdGhpcy5fZHluYW1vZGIuc2Nhbih0aGlzLnByZXBhcmVPcHRzRm9yU2NhbkFuZFF1ZXJ5KG9wdHMpKS5wcm9taXNlKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0IHByaW1hcnlLZXlEeW5hbW9EQlZhbHVlKCkge1xuICAgIGlmICh0aGlzLl9wcmltYXJ5S2V5ID09IG51bGwpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICByZXR1cm4gYCR7dGhpcy5fZW50aXR5TmFtZX0tJHt0aGlzW3RoaXMuX3ByaW1hcnlLZXldfWA7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0IHNlY29uZGFyeUtleUR5bmFtb0RCVmFsdWUoKSB7XG4gICAgaWYgKHRoaXMuX3NlY29uZGFyeUtleSA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgcmV0dXJuIGAke3RoaXMuX2VudGl0eU5hbWV9LSR7dGhpc1t0aGlzLl9zZWNvbmRhcnlLZXldfWA7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0IGZpbmFsRHluYW1vREJLZXkoKSB7XG4gICAgY29uc3Qga2V5ID0ge307XG4gICAgaWYgKHRoaXMuX3ByaW1hcnlLZXkpIHtcbiAgICAgIGtleVt0aGlzLl9wcmltYXJ5S2V5XSA9IHRoaXMucHJpbWFyeUtleUR5bmFtb0RCVmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3NlY29uZGFyeUtleSkge1xuICAgICAga2V5W3RoaXMuX3NlY29uZGFyeUtleV0gPSB0aGlzLnNlY29uZGFyeUtleUR5bmFtb0RCVmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzZXRFbnRpdHlPbktleShrZXk6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5LZXkpOiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuS2V5IHtcbiAgICBjb25zdCBmaW5hbEtleTogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LktleSA9IHt9O1xuICAgIFt0aGlzLl9wcmltYXJ5S2V5LCB0aGlzLl9zZWNvbmRhcnlLZXldLmZvckVhY2goKF9rZXkpID0+IHtcbiAgICAgIGlmIChfa2V5ICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBrZXlbX2tleV07XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgZmluYWxLZXlbX2tleV0gPSBgJHt0aGlzLl9lbnRpdHlOYW1lfS0ke3ZhbHVlfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBmaW5hbEtleTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgc2V0RW50aXR5T25LZXkoa2V5OiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuS2V5KSB7XG4gICAgcmV0dXJuIHRoaXMucHJvdG90eXBlLnNldEVudGl0eU9uS2V5KGtleSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVtb3ZlRW50aXR5RnJvbUtleShrZXk6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudC5LZXkpOiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuS2V5IHtcbiAgICBjb25zdCBmaW5hbEtleTogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LktleSA9IHt9O1xuICAgIFt0aGlzLl9wcmltYXJ5S2V5LCB0aGlzLl9zZWNvbmRhcnlLZXldLmZvckVhY2goKF9rZXkpID0+IHtcbiAgICAgIGlmIChfa2V5ICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBrZXlbX2tleV07XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgZmluYWxLZXlbX2tleV0gPSBrZXlbX2tleV0udG9TdHJpbmcoKS5yZXBsYWNlKGAke3RoaXMuX2VudGl0eU5hbWV9LWAsICcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpbmFsS2V5O1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyByZW1vdmVFbnRpdHlGcm9tS2V5KGtleTogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LktleSkge1xuICAgIHJldHVybiB0aGlzLnByb3RvdHlwZS5yZW1vdmVFbnRpdHlGcm9tS2V5KGtleSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tIFRBQkxFIFNVUFBPUlQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBUQUJMRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS1cbiAgc3RhdGljIGFzeW5jIGRlbGV0ZUl0ZW0oa2V5OiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuS2V5KSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9keW5hbW9kYi5kZWxldGUoXG4gICAgICB0aGlzLnByZXBhcmVPcHRzRm9yRGVsZXRlKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLl90YWJsZU5hbWUsXG4gICAgICAgIEtleTogdGhpcy5zZXRFbnRpdHlPbktleShrZXkpLFxuICAgICAgICBSZXR1cm5WYWx1ZXM6ICdBTExfT0xEJyxcbiAgICAgIH0pLFxuICAgICkucHJvbWlzZSgpO1xuXG4gICAgaWYgKHJlc3BvbnNlLkF0dHJpYnV0ZXMgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJdGVtIGRvZXMgbm90IGV4aXN0LicpO1xuICAgIH1cblxuICAgIHJldHVybiByZXNwb25zZS5BdHRyaWJ1dGVzO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGdldEl0ZW0oa2V5OiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuS2V5KSB7XG4gICAgY29uc3Qge1xuICAgICAgSXRlbTogaXRlbSxcbiAgICB9ID0gYXdhaXQgdGhpcy5fZHluYW1vZGIuZ2V0KHtcbiAgICAgIFRhYmxlTmFtZTogdGhpcy5fdGFibGVOYW1lLFxuICAgICAgS2V5OiB0aGlzLnNldEVudGl0eU9uS2V5KGtleSksXG4gICAgfSkucHJvbWlzZSgpO1xuXG4gICAgaWYgKGl0ZW0pIHJldHVybiB0aGlzLmluaXRpYWxpemUoaXRlbSk7XG5cbiAgICByZXR1cm4gaXRlbTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBxdWVyeShvcHRzOiBRdWVyeU9wdGlvbnMpIHtcbiAgICBjb25zdCBwYWdpbmF0b3IgPSB0aGlzLmNyZWF0ZVBhZ2luYXRvcih0aGlzLl9xdWVyeS5iaW5kKHRoaXMpLCBvcHRzKTtcbiAgICBhd2FpdCBwYWdpbmF0b3IubmV4dCgpO1xuICAgIHJldHVybiBwYWdpbmF0b3I7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgcXVlcnlBbGwob3B0czogUXVlcnlPcHRpb25zKSB7XG4gICAgY29uc3QgcGFnaW5hdG9yID0gYXdhaXQgdGhpcy5jcmVhdGVQYWdpbmF0b3IodGhpcy5fcXVlcnkuYmluZCh0aGlzKSwgb3B0cyk7XG4gICAgcmV0dXJuIHBhZ2luYXRvci5nZXRBbGwoKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBzY2FuKG9wdHM/OiBTY2FuT3B0aW9ucykge1xuICAgIGNvbnN0IHBhZ2luYXRvciA9IHRoaXMuY3JlYXRlUGFnaW5hdG9yKHRoaXMuX3NjYW4uYmluZCh0aGlzKSwgb3B0cyk7XG4gICAgYXdhaXQgcGFnaW5hdG9yLm5leHQoKTtcbiAgICByZXR1cm4gcGFnaW5hdG9yO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIHNjYW5BbGwob3B0cz86IFNjYW5PcHRpb25zKSB7XG4gICAgY29uc3QgcGFnaW5hdG9yID0gYXdhaXQgdGhpcy5jcmVhdGVQYWdpbmF0b3IodGhpcy5fc2Nhbi5iaW5kKHRoaXMpLCBvcHRzKTtcbiAgICByZXR1cm4gcGFnaW5hdG9yLmdldEFsbCgpO1xuICB9XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gVEFCTEUgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBTVVBQT1JUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGdldCBkeW5hbW9BdHRyaWJ1dGVzKCkge1xuICAgIGxldCBhdHRyaWJ1dGVzID0gdGhpcy52YWxpZGF0ZWRBdHRyaWJ1dGVzO1xuXG4gICAgaWYgKE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgY2Fubm90IHNhdmUgYW4gaW5zdGFuY2Ugd2l0aCBubyBhdHRyaWJ1dGVzIGF0IGFsbC4nKTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVzLl9lbnRpdHlOYW1lID0gdGhpcy5fZW50aXR5TmFtZTtcbiAgICBhdHRyaWJ1dGVzID0ge1xuICAgICAgLi4uYXR0cmlidXRlcyxcbiAgICAgIC4uLnRoaXMuZmluYWxEeW5hbW9EQktleSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gIH1cblxuICBwYXJzZUR5bmFtb0F0dHJpYnV0ZXMoaXRlbTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICAgIGRlbGV0ZSBpdGVtLl9lbnRpdHlOYW1lO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLml0ZW0sXG4gICAgICAuLi50aGlzLnJlbW92ZUVudGl0eUZyb21LZXkoaXRlbSksXG4gICAgfTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgU1VQUE9SVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgY29uc3QgcGsgPSB0aGlzLl9wcmltYXJ5S2V5O1xuICAgIGNvbnN0IHNrID0gdGhpcy5fc2Vjb25kYXJ5S2V5O1xuXG4gICAgaWYgKHBrID09IG51bGwgfHwgc2sgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcmltYXJ5IGtleSBhbmQvb3Igc2Vjb25kYXJ5IGtleSBwcm9wcyBub3Qgc2V0Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgSXRlbTogaXRlbSxcbiAgICB9ID0gYXdhaXQgdGhpcy5fZHluYW1vZGIuZ2V0KHtcbiAgICAgIFRhYmxlTmFtZTogdGhpcy5fdGFibGVOYW1lLFxuICAgICAgS2V5OiB0aGlzLmZpbmFsRHluYW1vREJLZXksXG4gICAgfSkucHJvbWlzZSgpO1xuXG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIHRoaXMuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VEeW5hbW9BdHRyaWJ1dGVzKGl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlY29yZCBub3QgZm91bmQuJyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IHJlbGF0aW9uc1VwZGF0ZUF0dHJpYnV0ZXMoKSB7XG4gICAgY29uc3QgaGFzT25lRW50aXRpZXMgPSBnZXRIYXNPbmVOb3ROZXN0ZWRNb2RlbHModGhpcykucmVkdWNlKChhZ2csIG0pID0+IHtcbiAgICAgIGlmICh0aGlzW2Bfbm9Jbml0aWFsaXplciR7Xy5jYXBpdGFsaXplKG0pfWBdID09IG51bGwpIHJldHVybiBhZ2c7XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgb3B0czoge1xuICAgICAgICAgIGZvcmVpZ25LZXkgPSB1bmRlZmluZWQsXG4gICAgICAgIH0gPSB7fSxcbiAgICAgIH0gPSBnZXRIYXNPbmVNb2RlbCh0aGlzLCBtKSB8fCB7fTtcblxuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzW21dO1xuICAgICAgaWYgKGZvcmVpZ25LZXkgJiYgdGhpcy5fcHJpbWFyeUtleSkge1xuICAgICAgICB2YWx1ZVtmb3JlaWduS2V5XSA9IHRoaXMucHJpbWFyeUtleUR5bmFtb0RCVmFsdWU7XG4gICAgICAgIHRoaXNbZm9yZWlnbktleV0gPSB0aGlzLnByaW1hcnlLZXlEeW5hbW9EQlZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWdnLmNvbmNhdChbdmFsdWVdKTtcbiAgICB9LCBbXSBhcyBEeW5hbW9FbnRpdHlbXSk7XG5cbiAgICBjb25zdCBoYXNNYW55RW50aXRpZXMgPSBnZXRIYXNNYW55Tm90TmVzdGVkTW9kZWxzKHRoaXMpLnJlZHVjZSgoYWdnLCBtKSA9PiB7XG4gICAgICBpZiAodGhpc1tgX25vSW5pdGlhbGl6ZXIke18uY2FwaXRhbGl6ZShtKX1gXSA9PSBudWxsKSByZXR1cm4gYWdnO1xuXG4gICAgICBjb25zdCB7XG4gICAgICAgIG9wdHM6IHtcbiAgICAgICAgICBmb3JlaWduS2V5ID0gdW5kZWZpbmVkLFxuICAgICAgICB9ID0ge30sXG4gICAgICB9ID0gZ2V0SGFzTWFueU1vZGVsKHRoaXMsIG0pIHx8IHt9O1xuXG4gICAgICBsZXQgdmFsdWUgPSB0aGlzW21dO1xuICAgICAgaWYgKGZvcmVpZ25LZXkpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5tYXAoKHYpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5fcHJpbWFyeUtleSkge1xuICAgICAgICAgICAgdltmb3JlaWduS2V5XSA9IHRoaXMucHJpbWFyeUtleUR5bmFtb0RCVmFsdWU7XG4gICAgICAgICAgICB0aGlzW2ZvcmVpZ25LZXldID0gdGhpcy5wcmltYXJ5S2V5RHluYW1vREJWYWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWdnLmNvbmNhdCh2YWx1ZSk7XG4gICAgfSwgW10gYXMgRHluYW1vRW50aXR5W10pO1xuXG4gICAgcmV0dXJuIGhhc09uZUVudGl0aWVzLmNvbmNhdChoYXNNYW55RW50aXRpZXMpLm1hcCgoZW50aXR5KSA9PiAoe1xuICAgICAgVXBkYXRlOiB7XG4gICAgICAgIC4uLmVudGl0eS51cGRhdGVBdHRyaWJ1dGVzLFxuICAgICAgfSxcbiAgICB9KSk7XG4gIH1cblxuICBnZXQgY3JlYXRlQXR0cmlidXRlcygpIHtcbiAgICBpZiAoIXRoaXMudmFsaWQpIHRocm93IG5ldyBFcnJvcignVGhlIGluc3RhbmNlIGlzIGludmFsaWQnKTtcblxuICAgIGlmICh0aGlzLl9wcmltYXJ5S2V5ID09IG51bGwpIHRocm93IG5ldyBFcnJvcignUHJpbWFyeSBLZXkgcHJvcGVydHkgc2hvdWxkIGJlIHNldCcpO1xuICAgIGlmICh0aGlzLl9zZWNvbmRhcnlLZXkgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCdTZWNvbmRhcnkgS2V5IHByb3BlcnR5IHNob3VsZCBiZSBzZXQnKTtcblxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmR5bmFtb0F0dHJpYnV0ZXM7XG5cbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG5cbiAgICBpZiAodGhpcy5fY3JlYXRlZEF0S2V5KSBpdGVtW3RoaXMuX2NyZWF0ZWRBdEtleV0gPSBub3c7XG4gICAgaWYgKHRoaXMuX3VwZGF0ZWRBdEtleSkgaXRlbVt0aGlzLl91cGRhdGVkQXRLZXldID0gbm93O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIFRhYmxlTmFtZTogdGhpcy5fdGFibGVOYW1lLFxuICAgICAgSXRlbTogaXRlbSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKCkge1xuICAgIC8vIFRISVMgTkVFRCBUTyBDT01FIEJFRk9SRSBUSEUgQ1JFQVRFIEFUVFJJQlVURVMhXG4gICAgY29uc3QgcmVsQXR0cmlidXRlcyA9IHRoaXMucmVsYXRpb25zVXBkYXRlQXR0cmlidXRlcztcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGVzO1xuXG4gICAgY29uc3QgdHJhbnNhY3RJdGVtcyA9IFtcbiAgICAgIHtcbiAgICAgICAgUHV0OiB0aGlzLmNyZWF0ZUF0dHJpYnV0ZXMsXG4gICAgICB9LFxuICAgICAgLi4ucmVsQXR0cmlidXRlcyxcbiAgICBdO1xuXG4gICAgYXdhaXQgdGhpcy5fZHluYW1vZGIudHJhbnNhY3RXcml0ZSh7XG4gICAgICBUcmFuc2FjdEl0ZW1zOiB0cmFuc2FjdEl0ZW1zLFxuICAgIH0pLnByb21pc2UoKTtcblxuICAgIHRoaXMuYXR0cmlidXRlcyA9IHRoaXMucGFyc2VEeW5hbW9BdHRyaWJ1dGVzKGF0dHJpYnV0ZXMuSXRlbSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQgdXBkYXRlQXR0cmlidXRlcygpIHtcbiAgICBpZiAoIXRoaXMudmFsaWQpIHRocm93IG5ldyBFcnJvcignVGhlIGluc3RhbmNlIGlzIGludmFsaWQnKTtcblxuICAgIGlmICh0aGlzLl9wcmltYXJ5S2V5ID09IG51bGwpIHRocm93IG5ldyBFcnJvcignUHJpbWFyeSBLZXkgcHJvcGVydHkgc2hvdWxkIGJlIHNldCcpO1xuICAgIGlmICh0aGlzLl9zZWNvbmRhcnlLZXkgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCdTZWNvbmRhcnkgS2V5IHByb3BlcnR5IHNob3VsZCBiZSBzZXQnKTtcblxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmR5bmFtb0F0dHJpYnV0ZXM7XG5cbiAgICBjb25zdCBvcHRzID0gT2JqZWN0LmVudHJpZXMoaXRlbSkucmVkdWNlKChhZ2csIFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgaWYgKFt0aGlzLl9wcmltYXJ5S2V5LCB0aGlzLl9zZWNvbmRhcnlLZXksIHRoaXMuX2NyZWF0ZWRBdEtleSwgdGhpcy5fdXBkYXRlZEF0S2V5XS5pbmNsdWRlcyhrZXkpKSByZXR1cm4gYWdnO1xuXG4gICAgICBjb25zdCB7XG4gICAgICAgIFVwZGF0ZUV4cHJlc3Npb246IGV4cHJlc3Npb24sXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogbmFtZXMgPSB7fSxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogdmFsdWVzID0ge30sXG4gICAgICB9ID0gYWdnO1xuXG4gICAgICBuYW1lc1tgIyR7a2V5fWBdID0ga2V5O1xuICAgICAgdmFsdWVzW2A6JHtrZXl9YF0gPSB2YWx1ZTtcblxuICAgICAgYWdnLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IG5hbWVzO1xuICAgICAgYWdnLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMgPSB2YWx1ZXM7XG5cbiAgICAgIGlmIChleHByZXNzaW9uID09IG51bGwpIHtcbiAgICAgICAgYWdnLlVwZGF0ZUV4cHJlc3Npb24gPSBgU0VUICMke2tleX0gPSA6JHtrZXl9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFnZy5VcGRhdGVFeHByZXNzaW9uID0gYCR7ZXhwcmVzc2lvbn0sICMke2tleX0gPSA6JHtrZXl9YDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFnZztcbiAgICB9LCB7fSBhcyB7XG4gICAgICBVcGRhdGVFeHByZXNzaW9uOiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuVXBkYXRlRXhwcmVzc2lvbjtcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lTWFwO1xuICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50LkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZU1hcDtcbiAgICB9KTtcblxuICAgIGlmIChvcHRzLlVwZGF0ZUV4cHJlc3Npb24gPT0gbnVsbCkge1xuICAgICAgLy8gTk9USElORyBCRUlORyBTRVQsIFRIUk9XIEVSUk9SXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW5ub3Qgc2F2ZSBhbiBpbnN0YW5jZSB3aXRoIG5vIGF0dHJpYnV0ZXMgYXQgYWxsLicpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAgIGlmICh0aGlzLl9jcmVhdGVkQXRLZXkpIHtcbiAgICAgIG9wdHMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzW2AjJHt0aGlzLl9jcmVhdGVkQXRLZXl9YF0gPSB0aGlzLl9jcmVhdGVkQXRLZXk7XG4gICAgICBvcHRzLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbYDoke3RoaXMuX2NyZWF0ZWRBdEtleX1gXSA9IG5vdztcbiAgICAgIG9wdHMuVXBkYXRlRXhwcmVzc2lvbiA9IGAke29wdHMuVXBkYXRlRXhwcmVzc2lvbn0sICMke3RoaXMuX2NyZWF0ZWRBdEtleX0gPSBpZl9ub3RfZXhpc3RzKCMke3RoaXMuX2NyZWF0ZWRBdEtleX0sIDoke3RoaXMuX2NyZWF0ZWRBdEtleX0pYDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fdXBkYXRlZEF0S2V5KSB7XG4gICAgICBvcHRzLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lc1tgIyR7dGhpcy5fdXBkYXRlZEF0S2V5fWBdID0gdGhpcy5fdXBkYXRlZEF0S2V5O1xuICAgICAgb3B0cy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzW2A6JHt0aGlzLl91cGRhdGVkQXRLZXl9YF0gPSBub3c7XG4gICAgICBvcHRzLlVwZGF0ZUV4cHJlc3Npb24gPSBgJHtvcHRzLlVwZGF0ZUV4cHJlc3Npb259LCAjJHt0aGlzLl91cGRhdGVkQXRLZXl9ID0gOiR7dGhpcy5fdXBkYXRlZEF0S2V5fWA7XG4gICAgfVxuXG4gICAgY29uc3QgcmV0OiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuVXBkYXRlID0ge1xuICAgICAgVGFibGVOYW1lOiB0aGlzLl90YWJsZU5hbWUsXG4gICAgICBLZXk6IHRoaXMuZmluYWxEeW5hbW9EQktleSxcbiAgICAgIC4uLm9wdHMsXG4gICAgfTtcblxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBhc3luYyB1cGRhdGUoKSB7XG4gICAgLy8gVEhJUyBORUVEIFRPIEJFIENBTExFRCBJTiBUSElTIE9SREVSIVxuICAgIGNvbnN0IHJlbEF0dHJpYnV0ZXMgPSB0aGlzLnJlbGF0aW9uc1VwZGF0ZUF0dHJpYnV0ZXM7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IHRoaXMudXBkYXRlQXR0cmlidXRlcztcblxuICAgIGNvbnN0IHRyYW5zYWN0SXRlbXMgPSBbXG4gICAgICB7XG4gICAgICAgIFVwZGF0ZTogYXR0cmlidXRlcyxcbiAgICAgIH0sXG4gICAgICAuLi5yZWxBdHRyaWJ1dGVzLFxuICAgIF07XG5cbiAgICBhd2FpdCB0aGlzLl9keW5hbW9kYi50cmFuc2FjdFdyaXRlKHtcbiAgICAgIFRyYW5zYWN0SXRlbXM6IHRyYW5zYWN0SXRlbXMsXG4gICAgfSkucHJvbWlzZSgpO1xuXG4gICAgY29uc3Qge1xuICAgICAgSXRlbTogaXRlbSxcbiAgICB9ID0gYXdhaXQgdGhpcy5fZHluYW1vZGIuZ2V0KHtcbiAgICAgIFRhYmxlTmFtZTogYXR0cmlidXRlcy5UYWJsZU5hbWUsXG4gICAgICBLZXk6IGF0dHJpYnV0ZXMuS2V5LFxuICAgIH0pLnByb21pc2UoKTtcblxuICAgIGlmIChpdGVtKSB0aGlzLmF0dHJpYnV0ZXMgPSB0aGlzLnBhcnNlRHluYW1vQXR0cmlidXRlcyhpdGVtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG59XG4iXX0=