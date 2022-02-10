"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicEntity = void 0;
const joi_1 = __importDefault(require("joi"));
const lodash_1 = __importDefault(require("lodash"));
const Decorators_1 = require("../Decorators");
class BasicEntity {
    // ---------------- BASIC ATTRIBUTES SETTINGS ----------------
    constructor(item = {}) {
        this._attributes = {};
        this.attributes = item;
        this.getAttribute = this.getAttribute.bind(this);
        this.setAttribute = this.setAttribute.bind(this);
    }
    /**
     * Gets all the attributes from the instance before any transformation. Alias are already removed and only the final properties are returned.
     */
    get attributes() {
        return this._attributes || {};
    }
    /**
     * Sets the attributes from the instance. It deals with children properties too.
     */
    set attributes(attributes) {
        // WE SHOULD ORGANIZE THE ENTRIES ORDER SO IT SETS THE CHILD PROPERTIES BEFORE SETTING THE REST (SO IT DOES NOT OVERWRITE)
        const entries = Object.entries(attributes);
        const hasOneModels = (0, Decorators_1.getHasOneModels)(this) || [];
        const hasManyModels = (0, Decorators_1.getHasManyModels)(this) || [];
        const allModels = hasOneModels.concat(hasManyModels);
        entries.sort(([aKey], [bKey]) => {
            if (allModels.includes(aKey) && !allModels.includes(bKey))
                return -1;
            if (!allModels.includes(aKey) && allModels.includes(bKey))
                return 1;
            return 0;
        });
        for (const [key, value] of entries) {
            (0, Decorators_1.setPropGettersAndSetters)(this.constructor.prototype, key);
            this[key] = value;
        }
    }
    getAttribute(key) {
        return this.attributes[key];
    }
    setAttribute(key, value) {
        this.attributes[key] = value;
    }
    /** @internal */
    get enumerableAttributes() {
        return Object.keys(this.constructor.prototype).reduce((agg, key) => {
            let value;
            if (this.relatedNotNestedModels.includes(key)) {
                value = this[`_noInitializer${lodash_1.default.capitalize(key)}`];
            }
            else {
                value = this[key];
            }
            if (value !== undefined)
                agg[key] = value;
            return agg;
        }, {});
    }
    /** @internal */
    get transformedAttributes() {
        let attributes = (0, Decorators_1.transformAliasAttributes)(this, this.enumerableAttributes);
        attributes = (0, Decorators_1.transformHasManyAttributes)(this, attributes);
        attributes = (0, Decorators_1.transformHasOneAttributes)(this, attributes);
        attributes = (0, Decorators_1.transformCompositeKeyAttributes)(this, attributes);
        return attributes;
    }
    /** @internal */
    get validatedAttributes() {
        return (0, Decorators_1.validateAttributes)(this, this.transformedAttributes);
    }
    /**
     * Validates the instance attributes and returns the final transformed and validated attributes (before any dynamodb specific transformations like addin the entity name to the pk and sk, for example).
     */
    get finalAttributes() {
        return this.validatedAttributes;
    }
    // ---------------- BASIC ATTRIBUTES SETTINGS ----------------
    // ---------------- VALIDATION SUPPORT SETTINGS ----------------
    get relatedNotNestedModels() {
        return (0, Decorators_1.getHasOneNotNestedModels)(this).concat((0, Decorators_1.getHasManyNotNestedModels)(this));
    }
    /** @internal */
    validateRelatedModels(_throw = false) {
        for (const hasOneModel of (0, Decorators_1.getHasOneNotNestedModels)(this)) {
            const instance = this[`_noInitializer${lodash_1.default.capitalize(hasOneModel)}`];
            if (instance == null) {
                const { opts: { required = false, } = {}, } = (0, Decorators_1.getHasOneModel)(this, hasOneModel) || {};
                if (required) {
                    const error = new joi_1.default.ValidationError(`"${hasOneModel}" is required.`, this, this.attributes);
                    if (_throw) {
                        throw error;
                    }
                    else {
                        this._error = error;
                        return false;
                    }
                }
                else {
                    continue;
                }
            }
            const valid = instance.validate(_throw);
            if (!valid) {
                this._error = instance.error;
                return false;
            }
        }
        for (const hasManyModel of (0, Decorators_1.getHasManyNotNestedModels)(this)) {
            const instances = this[hasManyModel];
            const { opts: { required = false, } = {}, } = (0, Decorators_1.getHasManyModel)(this, hasManyModel) || {};
            if (required && (instances == null || !Array.isArray(instances) || instances.length === 0)) {
                const error = new joi_1.default.ValidationError(`"${hasManyModel}" is required.`, this, this.attributes);
                if (_throw) {
                    throw error;
                }
                else {
                    this._error = error;
                    return false;
                }
            }
            for (const instance of instances) {
                const valid = instance.validate(_throw);
                if (!valid) {
                    this._error = instance.error;
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Validates the current instance.
     * @param {boolean} _throw - If true, throws an error if the instance is invalid. If false, saves the error to the error property and returns true or false.
     */
    validate(_throw = false) {
        this._error = undefined;
        try {
            (0, Decorators_1.validateAttributes)(this, this.transformedAttributes);
            this.validateRelatedModels(true);
            return true;
        }
        catch (error) {
            if (_throw) {
                throw error;
            }
            else if (error instanceof joi_1.default.ValidationError) {
                this._error = error;
                return false;
            }
            throw error;
        }
    }
    /**
     * Returns a boolean indicating if the current instance is valid or not.
     */
    get valid() {
        return this.validate();
    }
    /**
     * If a validation was ran without throwing exceptions, the errors found are kept in the error variable. This getter returns that error.
     */
    get error() {
        return this._error;
    }
    // ---------------- VALIDATION SETTINGS ----------------
    // ---------------- STATIC METHODS ----------------
    /** @ignore */
    static transformAttributes(item) {
        return new this(item).transformedAttributes;
    }
    /**
     * Returns the transformed attributes of the item. Similar to {@link Entity.finalAttributes | Instance finalAttributes getter}.
     * @param {Record<string, any>} item - The attributes to use for the transformation.
     */
    static validateAttributes(item) {
        return new this(item).validatedAttributes;
    }
    /**
     * Creates as instance of the current class with the attributes provided and validates it. See {@link Entity.validate | Instance Validate} for more details.
     * @param {Record<string, any>} item - The attributes to use when creating the instance.
     * @param {boolean} [_throw = true] - If it should throw an error or not when validating.
     */
    static validate(item, _throw = true) {
        return new this(item).validate(_throw);
    }
}
exports.BasicEntity = BasicEntity;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFzaWNFbnRpdHkuanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsibGliL0VudGl0eS9CYXNpY0VudGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4Q0FBc0I7QUFDdEIsb0RBQXVCO0FBQ3ZCLDhDQWF1QjtBQUV2QixNQUFhLFdBQVc7SUFLdEIsOERBQThEO0lBRTlELFlBQVksT0FBNEIsRUFBRTtRQU5oQyxnQkFBVyxHQUF3QixFQUFFLENBQUM7UUFPOUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFFdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxVQUFVLENBQUMsVUFBK0I7UUFDNUMsMEhBQTBIO1FBQzFILE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0MsTUFBTSxZQUFZLEdBQUcsSUFBQSw0QkFBZSxFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNqRCxNQUFNLGFBQWEsR0FBRyxJQUFBLDZCQUFnQixFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUM5QixJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMs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QyxNQUFNLEdBQUcsS0FBSyxDQUFDO2dCQUNwQixPQUFPLEtBQUssQ0FBQzthQUNkO1lBRUQsTUFBTSxLQUFLLENBQUM7U0FDYjtJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQsd0RBQXdEO0lBRXhELG1EQUFtRDtJQUVuRCxjQUFjO0lBQ2QsTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQXlCO1FBQ2xELE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMscUJBQXFCLENBQUM7SUFDOUMsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxJQUF5QjtRQUNqRCxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLG1CQUFtQixDQUFDO0lBQzVDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUF5QixFQUFFLFNBQWtCLElBQUk7UUFDL0QsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDekMsQ0FBQztDQUdGO0FBbk9ELGtDQW1PQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBKb2kgZnJvbSAnam9pJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQge1xuICBnZXRIYXNNYW55TW9kZWwsXG4gIGdldEhhc01hbnlNb2RlbHMsXG4gIGdldEhhc01hbnlOb3ROZXN0ZWRNb2RlbHMsXG4gIGdldEhhc09uZU1vZGVsLFxuICBnZXRIYXNPbmVNb2RlbHMsXG4gIGdldEhhc09uZU5vdE5lc3RlZE1vZGVscyxcbiAgc2V0UHJvcEdldHRlcnNBbmRTZXR0ZXJzLFxuICB0cmFuc2Zvcm1BbGlhc0F0dHJpYnV0ZXMsXG4gIHRyYW5zZm9ybUNvbXBvc2l0ZUtleUF0dHJpYnV0ZXMsXG4gIHRyYW5zZm9ybUhhc01hbnlBdHRyaWJ1dGVzLFxuICB0cmFuc2Zvcm1IYXNPbmVBdHRyaWJ1dGVzLFxuICB2YWxpZGF0ZUF0dHJpYnV0ZXMsXG59IGZyb20gJy4uL0RlY29yYXRvcnMnO1xuXG5leHBvcnQgY2xhc3MgQmFzaWNFbnRpdHkge1xuICBwcm90ZWN0ZWQgX2F0dHJpYnV0ZXM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcblxuICBba2V5OiBzdHJpbmddOiBhbnk7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBCQVNJQyBBVFRSSUJVVEVTIFNFVFRJTkdTIC0tLS0tLS0tLS0tLS0tLS1cblxuICBjb25zdHJ1Y3RvcihpdGVtOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge30pIHtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSBpdGVtO1xuXG4gICAgdGhpcy5nZXRBdHRyaWJ1dGUgPSB0aGlzLmdldEF0dHJpYnV0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlID0gdGhpcy5zZXRBdHRyaWJ1dGUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCB0aGUgYXR0cmlidXRlcyBmcm9tIHRoZSBpbnN0YW5jZSBiZWZvcmUgYW55IHRyYW5zZm9ybWF0aW9uLiBBbGlhcyBhcmUgYWxyZWFkeSByZW1vdmVkIGFuZCBvbmx5IHRoZSBmaW5hbCBwcm9wZXJ0aWVzIGFyZSByZXR1cm5lZC5cbiAgICovXG4gIGdldCBhdHRyaWJ1dGVzKCk6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzIHx8IHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGF0dHJpYnV0ZXMgZnJvbSB0aGUgaW5zdGFuY2UuIEl0IGRlYWxzIHdpdGggY2hpbGRyZW4gcHJvcGVydGllcyB0b28uXG4gICAqL1xuICBzZXQgYXR0cmlidXRlcyhhdHRyaWJ1dGVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gICAgLy8gV0UgU0hPVUxEIE9SR0FOSVpFIFRIRSBFTlRSSUVTIE9SREVSIFNPIElUIFNFVFMgVEhFIENISUxEIFBST1BFUlRJRVMgQkVGT1JFIFNFVFRJTkcgVEhFIFJFU1QgKFNPIElUIERPRVMgTk9UIE9WRVJXUklURSlcbiAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoYXR0cmlidXRlcyk7XG4gICAgY29uc3QgaGFzT25lTW9kZWxzID0gZ2V0SGFzT25lTW9kZWxzKHRoaXMpIHx8IFtdO1xuICAgIGNvbnN0IGhhc01hbnlNb2RlbHMgPSBnZXRIYXNNYW55TW9kZWxzKHRoaXMpIHx8IFtdO1xuICAgIGNvbnN0IGFsbE1vZGVscyA9IGhhc09uZU1vZGVscy5jb25jYXQoaGFzTWFueU1vZGVscyk7XG4gICAgZW50cmllcy5zb3J0KChbYUtleV0sIFtiS2V5XSkgPT4ge1xuICAgICAgaWYgKGFsbE1vZGVscy5pbmNsdWRlcyhhS2V5KSAmJiAhYWxsTW9kZWxzLmluY2x1ZGVzKGJLZXkpKSByZXR1cm4gLTE7XG4gICAgICBpZiAoIWFsbE1vZGVscy5pbmNsdWRlcyhhS2V5KSAmJiBhbGxNb2RlbHMuaW5jbHVkZXMoYktleSkpIHJldHVybiAxO1xuICAgICAgcmV0dXJuIDA7XG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBlbnRyaWVzKSB7XG4gICAgICBzZXRQcm9wR2V0dGVyc0FuZFNldHRlcnModGhpcy5jb25zdHJ1Y3Rvci5wcm90b3R5cGUsIGtleSk7XG4gICAgICB0aGlzW2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW2tleV07XG4gIH1cblxuICBwcm90ZWN0ZWQgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5hdHRyaWJ1dGVzW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgZ2V0IGVudW1lcmFibGVBdHRyaWJ1dGVzKCk6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmNvbnN0cnVjdG9yLnByb3RvdHlwZSkucmVkdWNlKChhZ2csIGtleSkgPT4ge1xuICAgICAgbGV0IHZhbHVlO1xuICAgICAgaWYgKHRoaXMucmVsYXRlZE5vdE5lc3RlZE1vZGVscy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIHZhbHVlID0gdGhpc1tgX25vSW5pdGlhbGl6ZXIke18uY2FwaXRhbGl6ZShrZXkpfWBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSB0aGlzW2tleV07XG4gICAgICB9XG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSBhZ2dba2V5XSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIGFnZztcbiAgICB9LCB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+KTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgZ2V0IHRyYW5zZm9ybWVkQXR0cmlidXRlcygpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHtcbiAgICBsZXQgYXR0cmlidXRlcyA9IHRyYW5zZm9ybUFsaWFzQXR0cmlidXRlcyh0aGlzLCB0aGlzLmVudW1lcmFibGVBdHRyaWJ1dGVzKTtcbiAgICBhdHRyaWJ1dGVzID0gdHJhbnNmb3JtSGFzTWFueUF0dHJpYnV0ZXModGhpcywgYXR0cmlidXRlcyk7XG4gICAgYXR0cmlidXRlcyA9IHRyYW5zZm9ybUhhc09uZUF0dHJpYnV0ZXModGhpcywgYXR0cmlidXRlcyk7XG4gICAgYXR0cmlidXRlcyA9IHRyYW5zZm9ybUNvbXBvc2l0ZUtleUF0dHJpYnV0ZXModGhpcywgYXR0cmlidXRlcyk7XG5cbiAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgZ2V0IHZhbGlkYXRlZEF0dHJpYnV0ZXMoKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgcmV0dXJuIHZhbGlkYXRlQXR0cmlidXRlcyh0aGlzLCB0aGlzLnRyYW5zZm9ybWVkQXR0cmlidXRlcyk7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGVzIHRoZSBpbnN0YW5jZSBhdHRyaWJ1dGVzIGFuZCByZXR1cm5zIHRoZSBmaW5hbCB0cmFuc2Zvcm1lZCBhbmQgdmFsaWRhdGVkIGF0dHJpYnV0ZXMgKGJlZm9yZSBhbnkgZHluYW1vZGIgc3BlY2lmaWMgdHJhbnNmb3JtYXRpb25zIGxpa2UgYWRkaW4gdGhlIGVudGl0eSBuYW1lIHRvIHRoZSBwayBhbmQgc2ssIGZvciBleGFtcGxlKS5cbiAgICovXG4gIGdldCBmaW5hbEF0dHJpYnV0ZXMoKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgcmV0dXJuIHRoaXMudmFsaWRhdGVkQXR0cmlidXRlcztcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gQkFTSUMgQVRUUklCVVRFUyBTRVRUSU5HUyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBWQUxJREFUSU9OIFNVUFBPUlQgU0VUVElOR1MgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBnZXQgcmVsYXRlZE5vdE5lc3RlZE1vZGVscygpIHtcbiAgICByZXR1cm4gZ2V0SGFzT25lTm90TmVzdGVkTW9kZWxzKHRoaXMpLmNvbmNhdChnZXRIYXNNYW55Tm90TmVzdGVkTW9kZWxzKHRoaXMpKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gVkFMSURBVElPTiBTVVBQT1JUIFNFVFRJTkdTIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tIFZBTElEQVRJT04gU0VUVElOR1MgLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBfZXJyb3I6IEpvaS5WYWxpZGF0aW9uRXJyb3IgfCB1bmRlZmluZWQ7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICB2YWxpZGF0ZVJlbGF0ZWRNb2RlbHMoX3Rocm93OiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcbiAgICBmb3IgKGNvbnN0IGhhc09uZU1vZGVsIG9mIGdldEhhc09uZU5vdE5lc3RlZE1vZGVscyh0aGlzKSkge1xuICAgICAgY29uc3QgaW5zdGFuY2U6IEJhc2ljRW50aXR5IHwgdW5kZWZpbmVkID0gdGhpc1tgX25vSW5pdGlhbGl6ZXIke18uY2FwaXRhbGl6ZShoYXNPbmVNb2RlbCl9YF07XG5cbiAgICAgIGlmIChpbnN0YW5jZSA9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBvcHRzOiB7XG4gICAgICAgICAgICByZXF1aXJlZCA9IGZhbHNlLFxuICAgICAgICAgIH0gPSB7fSxcbiAgICAgICAgfSA9IGdldEhhc09uZU1vZGVsKHRoaXMsIGhhc09uZU1vZGVsKSB8fCB7fTtcblxuICAgICAgICBpZiAocmVxdWlyZWQpIHtcbiAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBKb2kuVmFsaWRhdGlvbkVycm9yKGBcIiR7aGFzT25lTW9kZWx9XCIgaXMgcmVxdWlyZWQuYCwgdGhpcywgdGhpcy5hdHRyaWJ1dGVzKTtcbiAgICAgICAgICBpZiAoX3Rocm93KSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdmFsaWQgPSBpbnN0YW5jZS52YWxpZGF0ZShfdGhyb3cpO1xuICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICB0aGlzLl9lcnJvciA9IGluc3RhbmNlLmVycm9yO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBoYXNNYW55TW9kZWwgb2YgZ2V0SGFzTWFueU5vdE5lc3RlZE1vZGVscyh0aGlzKSkge1xuICAgICAgY29uc3QgaW5zdGFuY2VzID0gdGhpc1toYXNNYW55TW9kZWxdO1xuXG4gICAgICBjb25zdCB7XG4gICAgICAgIG9wdHM6IHtcbiAgICAgICAgICByZXF1aXJlZCA9IGZhbHNlLFxuICAgICAgICB9ID0ge30sXG4gICAgICB9ID0gZ2V0SGFzTWFueU1vZGVsKHRoaXMsIGhhc01hbnlNb2RlbCkgfHwge307XG5cbiAgICAgIGlmIChyZXF1aXJlZCAmJiAoaW5zdGFuY2VzID09IG51bGwgfHwgIUFycmF5LmlzQXJyYXkoaW5zdGFuY2VzKSB8fCBpbnN0YW5jZXMubGVuZ3RoID09PSAwKSkge1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBKb2kuVmFsaWRhdGlvbkVycm9yKGBcIiR7aGFzTWFueU1vZGVsfVwiIGlzIHJlcXVpcmVkLmAsIHRoaXMsIHRoaXMuYXR0cmlidXRlcyk7XG4gICAgICAgIGlmIChfdGhyb3cpIHtcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9lcnJvciA9IGVycm9yO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGluc3RhbmNlIG9mIGluc3RhbmNlcykge1xuICAgICAgICBjb25zdCB2YWxpZCA9IGluc3RhbmNlLnZhbGlkYXRlKF90aHJvdyk7XG4gICAgICAgIGlmICghdmFsaWQpIHtcbiAgICAgICAgICB0aGlzLl9lcnJvciA9IGluc3RhbmNlLmVycm9yO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlcyB0aGUgY3VycmVudCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtib29sZWFufSBfdGhyb3cgLSBJZiB0cnVlLCB0aHJvd3MgYW4gZXJyb3IgaWYgdGhlIGluc3RhbmNlIGlzIGludmFsaWQuIElmIGZhbHNlLCBzYXZlcyB0aGUgZXJyb3IgdG8gdGhlIGVycm9yIHByb3BlcnR5IGFuZCByZXR1cm5zIHRydWUgb3IgZmFsc2UuXG4gICAqL1xuICB2YWxpZGF0ZShfdGhyb3c6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xuICAgIHRoaXMuX2Vycm9yID0gdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICB2YWxpZGF0ZUF0dHJpYnV0ZXModGhpcywgdGhpcy50cmFuc2Zvcm1lZEF0dHJpYnV0ZXMpO1xuICAgICAgdGhpcy52YWxpZGF0ZVJlbGF0ZWRNb2RlbHModHJ1ZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKF90aHJvdykge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH0gZWxzZSBpZiAoZXJyb3IgaW5zdGFuY2VvZiBKb2kuVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICAgIHRoaXMuX2Vycm9yID0gZXJyb3I7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhlIGN1cnJlbnQgaW5zdGFuY2UgaXMgdmFsaWQgb3Igbm90LlxuICAgKi9cbiAgZ2V0IHZhbGlkKCkge1xuICAgIHJldHVybiB0aGlzLnZhbGlkYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogSWYgYSB2YWxpZGF0aW9uIHdhcyByYW4gd2l0aG91dCB0aHJvd2luZyBleGNlcHRpb25zLCB0aGUgZXJyb3JzIGZvdW5kIGFyZSBrZXB0IGluIHRoZSBlcnJvciB2YXJpYWJsZS4gVGhpcyBnZXR0ZXIgcmV0dXJucyB0aGF0IGVycm9yLlxuICAgKi9cbiAgZ2V0IGVycm9yKCkge1xuICAgIHJldHVybiB0aGlzLl9lcnJvcjtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0gVkFMSURBVElPTiBTRVRUSU5HUyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqIEBpZ25vcmUgKi9cbiAgc3RhdGljIHRyYW5zZm9ybUF0dHJpYnV0ZXMoaXRlbTogUmVjb3JkPHN0cmluZywgYW55Pik6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgIHJldHVybiBuZXcgdGhpcyhpdGVtKS50cmFuc2Zvcm1lZEF0dHJpYnV0ZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdHJhbnNmb3JtZWQgYXR0cmlidXRlcyBvZiB0aGUgaXRlbS4gU2ltaWxhciB0byB7QGxpbmsgRW50aXR5LmZpbmFsQXR0cmlidXRlcyB8IEluc3RhbmNlIGZpbmFsQXR0cmlidXRlcyBnZXR0ZXJ9LlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGl0ZW0gLSBUaGUgYXR0cmlidXRlcyB0byB1c2UgZm9yIHRoZSB0cmFuc2Zvcm1hdGlvbi5cbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZUF0dHJpYnV0ZXMoaXRlbTogUmVjb3JkPHN0cmluZywgYW55Pik6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgIHJldHVybiBuZXcgdGhpcyhpdGVtKS52YWxpZGF0ZWRBdHRyaWJ1dGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYXMgaW5zdGFuY2Ugb2YgdGhlIGN1cnJlbnQgY2xhc3Mgd2l0aCB0aGUgYXR0cmlidXRlcyBwcm92aWRlZCBhbmQgdmFsaWRhdGVzIGl0LiBTZWUge0BsaW5rIEVudGl0eS52YWxpZGF0ZSB8IEluc3RhbmNlIFZhbGlkYXRlfSBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGl0ZW0gLSBUaGUgYXR0cmlidXRlcyB0byB1c2Ugd2hlbiBjcmVhdGluZyB0aGUgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW190aHJvdyA9IHRydWVdIC0gSWYgaXQgc2hvdWxkIHRocm93IGFuIGVycm9yIG9yIG5vdCB3aGVuIHZhbGlkYXRpbmcuXG4gICAqL1xuICBzdGF0aWMgdmFsaWRhdGUoaXRlbTogUmVjb3JkPHN0cmluZywgYW55PiwgX3Rocm93OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIHJldHVybiBuZXcgdGhpcyhpdGVtKS52YWxpZGF0ZShfdGhyb3cpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tXG59XG4iXX0=