"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformHasManyAttributes = exports.hasMany = exports.setHasManyDescriptor = exports.getHasManyNotNestedModels = exports.getHasManyNestedModels = exports.getHasManyModel = exports.getHasManyModels = void 0;
const joi_1 = __importDefault(require("joi"));
const lodash_1 = __importDefault(require("lodash"));
require("reflect-metadata");
const relationHelpers_1 = require("./relationHelpers");
const prop_1 = require("./prop");
const belongsTo_1 = require("./belongsTo");
const hasManyMetadataKey = 'hasMany';
/** @internal */
function getHasManyModels(target) {
    return Reflect.getMetadata(hasManyMetadataKey, target);
}
exports.getHasManyModels = getHasManyModels;
/** @internal */
function getHasManyModel(target, propertyKey) {
    return Reflect.getMetadata(hasManyMetadataKey, target, propertyKey);
}
exports.getHasManyModel = getHasManyModel;
/** @internal */
function getHasManyNestedModels(target) {
    const models = getHasManyModels(target) || [];
    return models.filter((model) => {
        const { opts, } = getHasManyModel(target, model) || {};
        return opts === null || opts === void 0 ? void 0 : opts.nestedObject;
    });
}
exports.getHasManyNestedModels = getHasManyNestedModels;
/** @internal */
function getHasManyNotNestedModels(target) {
    const models = getHasManyModels(target) || [];
    return models.filter((model) => {
        const { opts, } = getHasManyModel(target, model) || {};
        return !(opts === null || opts === void 0 ? void 0 : opts.nestedObject);
    });
}
exports.getHasManyNotNestedModels = getHasManyNotNestedModels;
/** @internal */
function setHasManyDescriptor(target, modelName, ChildModel) {
    const propertyKey = `_${hasManyMetadataKey}_${modelName}`;
    Object.defineProperty(target, modelName, {
        get() {
            return this[propertyKey] || [];
        },
        set(value) {
            if (Array.isArray(value)) {
                if (value.filter((v) => !(v instanceof ChildModel)).length > 0) {
                    try {
                        for (const item of value) {
                            joi_1.default.assert(item, joi_1.default.object().unknown(true));
                        }
                        this[propertyKey] = value.map((v) => new ChildModel(v));
                    }
                    catch (error) {
                        throw new TypeError(`Array contain invalid items. All items must be an instance of ${ChildModel.name}`);
                    }
                }
                else {
                    this[propertyKey] = value;
                }
            }
            else {
                throw new TypeError(`Value must be an array of instances of ${ChildModel.name}`);
            }
        },
        enumerable: true,
        configurable: false,
    });
    Object.defineProperty(target, `_noInitializer${lodash_1.default.capitalize(modelName)}`, {
        get() {
            return this[propertyKey];
        },
        enumerable: false,
        configurable: false,
    });
}
exports.setHasManyDescriptor = setHasManyDescriptor;
/**
 * Sets the decorated property an array of another entity.
 * @param {Entity[]} ChildModel - The class of which the property should be an array of instances of. This class needs to extend the Entity class.
 * @param {Object} [opts] - The options to configure the relation.
 * @param {boolean} [opts.required] - If set to true, the validation method will check if the children is undefined or with length 0, and if it is will throw a ValidationError.
 * @param {boolean} [opts.nestedObject] - If set to true, the attributes will be nested to the parent model. If set to false, the children models will be saved as new records in the database.
 * @param {string} [opts.foreignKey] - The foreign key property from the children. If this variable is set, each of the children records will have the parent model entity type + its id as the foreignKey column. It will also set the parent with this same column and value, helping future index queries.
 * @param {string} [opts.indexName] - If the foreign key is set, this indexName is used by some methods to query the relations.
 * @param {string} [opts.parentPropertyOnChild] - Set a reference in the child so it can access the parent correctly. Right now, this is only set in load / getItem with includedRelated set. - Needs improvements to be set everywhere. Also, validations do not apply for parents.
 * @remarks
 *
 * - When the hasMany is set on the parent with a foreignKey AND indexName, automatically, when querying the child with related records, it will bring the parent record too.
 * @example
 * ```
 * import * as Joi from 'joi';
 *
 * class ChildModel extends Entity {
 *   @prop()
 *   @validate(Joi.string().required())
 *   pk: string;
 *
 *   @prop()
 *   sk: string;
 *
 *   @prop()
 *   fk: string;
 * }
 *
 * class ParentModel extends Entity {
 *   @prop({ primaryKey: true })
 *   pk: string;
 *
 *   @hasMany(ChildModel, { nestedObject: false, required: true, foreignKey: 'fk', indexName: 'byFK' })
 *   children: ChildModel[];
 * }
 *
 * const parent = new ParentModel({
 *   pk: '1',
 * });
 *
 * console.log(parent.children) // []
 *
 * console.log(parent.valid) // false # As children is set as required, it is invalid as it has no children now..
 *
 * parent.children = [new ChildModel({
 *   pk: 'pk-from-child-1',
 *   sk: 'sk-from-child-1',
 * }), new ChildModel({
 *   sk: 'sk-from-child-2',
 * })]
 *
 * console.log(parent.children[0].pk) // 'pk-from-child-1'
 * console.log(parent.children[0].sk) // 'sk-from-child-1'
 *
 * console.log(parent.children[1].pk) // undefined
 * console.log(parent.children[1].sk) // 'sk-from-child-2'
 *
 * console.log(parent.valid) // false # As the second child is invalid, parent is also invalid.
 *
 * parent.children[1].pk = 'pk-from-child-2';
 *
 * console.log(parent.children[1].pk) // 'pk-from-child-2'
 * console.log(parent.children[1].sk) // 'sk-from-child-2'
 *
 * console.log(parent.transformedAttributes) // # The children attributes do not appear in the attributes because they will become new records.
 *
 * console.log(parent.valid) // true # As now all children are valid, the parent is also valid.
 *
 * parent.create() // This will insert 3 records in the database. The parent and each of the children. All of them will have fk column set to 'ParentModel-1'
 * ```
 *
 * @category Property Decorators
 */
function hasMany(ChildModel, opts) {
    return (target, propertyKey) => {
        Reflect.defineMetadata(hasManyMetadataKey, {
            model: ChildModel,
            opts,
        }, target, propertyKey);
        const modelProperties = Reflect.getMetadata(relationHelpers_1.relationDescriptor, target, ChildModel.name) || [];
        modelProperties.push({
            model: ChildModel,
            opts,
            propertyKey,
            type: 'hasMany',
        });
        Reflect.defineMetadata(relationHelpers_1.relationDescriptor, modelProperties, target);
        Reflect.defineMetadata(hasManyMetadataKey, {
            model: ChildModel,
            opts,
            propertyKey,
        }, target, `_hasMany_${ChildModel.name}`);
        if (opts === null || opts === void 0 ? void 0 : opts.foreignKey) {
            (0, prop_1.setPropGettersAndSetters)(target, opts === null || opts === void 0 ? void 0 : opts.foreignKey);
        }
        let models = Reflect.getMetadata(hasManyMetadataKey, target);
        if (models) {
            models.push(propertyKey);
        }
        else {
            models = [propertyKey];
        }
        Reflect.defineMetadata(hasManyMetadataKey, models, target);
        (0, belongsTo_1.setBelongsTo)(target, ChildModel, propertyKey, 'hasMany', opts);
        setHasManyDescriptor(target, propertyKey, ChildModel);
    };
}
exports.hasMany = hasMany;
/** @internal */
function transformHasManyAttributes(target, item) {
    const finalAttributes = lodash_1.default.cloneDeep(item);
    const nestedModels = getHasManyNestedModels(target) || [];
    for (const model of nestedModels) {
        if (item[model] != null) {
            if (Array.isArray(item[model]) && item[model].length > 0) {
                finalAttributes[model] = item[model].map((value) => {
                    const { model: ModelClass, } = getHasManyModel(target, model) || {};
                    if (value instanceof ModelClass)
                        return value.attributes;
                    // VALUE IS AN OBJECT
                    const instance = new ModelClass(model);
                    return instance.attributes;
                });
            }
            else {
                delete finalAttributes[model];
            }
        }
    }
    const notNestedModels = getHasManyNotNestedModels(target) || [];
    for (const model of notNestedModels) {
        delete finalAttributes[model];
    }
    return finalAttributes;
}
exports.transformHasManyAttributes = transformHasManyAttributes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzTWFueS5qcyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlcyI6WyJsaWIvRGVjb3JhdG9ycy9oYXNNYW55LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUFzQjtBQUN0QixvREFBdUI7QUFDdkIsNEJBQTBCO0FBQzFCLHVEQU0yQjtBQUMzQixpQ0FBa0Q7QUFDbEQsMkNBQTJDO0FBRTNDLE1BQU0sa0JBQWtCLEdBQUcsU0FBUyxDQUFDO0FBRXJDLGdCQUFnQjtBQUNoQixTQUFnQixnQkFBZ0IsQ0FBQyxNQUFXO0lBQzFDLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRkQsNENBRUM7QUFFRCxnQkFBZ0I7QUFDaEIsU0FBZ0IsZUFBZSxDQUFDLE1BQVcsRUFBRSxXQUFtQjtJQUM5RCxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFGRCwwQ0FFQztBQUVELGdCQUFnQjtBQUNoQixTQUFnQixzQkFBc0IsQ0FBQyxNQUFXO0lBQ2hELE1BQU0sTUFBTSxHQUFhLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV4RCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM3QixNQUFNLEVBQ0osSUFBSSxHQUNMLEdBQUcsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFekMsT0FBTyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsWUFBWSxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVZELHdEQVVDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLHlCQUF5QixDQUFDLE1BQVc7SUFDbkQsTUFBTSxNQUFNLEdBQWEsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUks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LGdFQThCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBKb2kgZnJvbSAnam9pJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuaW1wb3J0IHtcbiAgQ29uc3RydWN0b3IsXG4gIHJlbGF0aW9uRGVzY3JpcHRvcixcbiAgUmVsYXRpb25EZXNjcmlwdG9ycyxcbiAgUmVsYXRpb25Nb2RlbCxcbiAgSGFzUmVsYXRpb25PcHRpb25zLFxufSBmcm9tICcuL3JlbGF0aW9uSGVscGVycyc7XG5pbXBvcnQgeyBzZXRQcm9wR2V0dGVyc0FuZFNldHRlcnMgfSBmcm9tICcuL3Byb3AnO1xuaW1wb3J0IHsgc2V0QmVsb25nc1RvIH0gZnJvbSAnLi9iZWxvbmdzVG8nO1xuXG5jb25zdCBoYXNNYW55TWV0YWRhdGFLZXkgPSAnaGFzTWFueSc7XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIYXNNYW55TW9kZWxzKHRhcmdldDogYW55KTogc3RyaW5nW10gfCB1bmRlZmluZWQge1xuICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShoYXNNYW55TWV0YWRhdGFLZXksIHRhcmdldCk7XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIYXNNYW55TW9kZWwodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpOiBSZWxhdGlvbk1vZGVsIHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoaGFzTWFueU1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc01hbnlOZXN0ZWRNb2RlbHModGFyZ2V0OiBhbnkpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG1vZGVsczogc3RyaW5nW10gPSBnZXRIYXNNYW55TW9kZWxzKHRhcmdldCkgfHwgW107XG5cbiAgcmV0dXJuIG1vZGVscy5maWx0ZXIoKG1vZGVsKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgb3B0cyxcbiAgICB9ID0gZ2V0SGFzTWFueU1vZGVsKHRhcmdldCwgbW9kZWwpIHx8IHt9O1xuXG4gICAgcmV0dXJuIG9wdHM/Lm5lc3RlZE9iamVjdDtcbiAgfSk7XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIYXNNYW55Tm90TmVzdGVkTW9kZWxzKHRhcmdldDogYW55KTogc3RyaW5nW10ge1xuICBjb25zdCBtb2RlbHM6IHN0cmluZ1tdID0gZ2V0SGFzTWFueU1vZGVscyh0YXJnZXQpIHx8IFtdO1xuXG4gIHJldHVybiBtb2RlbHMuZmlsdGVyKChtb2RlbCkgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIG9wdHMsXG4gICAgfSA9IGdldEhhc01hbnlNb2RlbCh0YXJnZXQsIG1vZGVsKSB8fCB7fTtcblxuICAgIHJldHVybiAhb3B0cz8ubmVzdGVkT2JqZWN0O1xuICB9KTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhhc01hbnlEZXNjcmlwdG9yKFxuICB0YXJnZXQ6IGFueSxcbiAgbW9kZWxOYW1lOiBzdHJpbmcsXG4gIENoaWxkTW9kZWw6IENvbnN0cnVjdG9yLFxuKSB7XG4gIGNvbnN0IHByb3BlcnR5S2V5ID0gYF8ke2hhc01hbnlNZXRhZGF0YUtleX1fJHttb2RlbE5hbWV9YDtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBtb2RlbE5hbWUsIHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpc1twcm9wZXJ0eUtleV0gfHwgW107XG4gICAgfSxcbiAgICBzZXQodmFsdWUpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBpZiAodmFsdWUuZmlsdGVyKCh2KSA9PiAhKHYgaW5zdGFuY2VvZiBDaGlsZE1vZGVsKSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdmFsdWUpIHtcbiAgICAgICAgICAgICAgSm9pLmFzc2VydChcbiAgICAgICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgICAgIEpvaS5vYmplY3QoKS51bmtub3duKHRydWUpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzW3Byb3BlcnR5S2V5XSA9IHZhbHVlLm1hcCgodikgPT4gbmV3IENoaWxkTW9kZWwodikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBBcnJheSBjb250YWluIGludmFsaWQgaXRlbXMuIEFsbCBpdGVtcyBtdXN0IGJlIGFuIGluc3RhbmNlIG9mICR7Q2hpbGRNb2RlbC5uYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzW3Byb3BlcnR5S2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBWYWx1ZSBtdXN0IGJlIGFuIGFycmF5IG9mIGluc3RhbmNlcyBvZiAke0NoaWxkTW9kZWwubmFtZX1gKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgYF9ub0luaXRpYWxpemVyJHtfLmNhcGl0YWxpemUobW9kZWxOYW1lKX1gLCB7XG4gICAgZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXNbcHJvcGVydHlLZXldO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgfSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgZGVjb3JhdGVkIHByb3BlcnR5IGFuIGFycmF5IG9mIGFub3RoZXIgZW50aXR5LlxuICogQHBhcmFtIHtFbnRpdHlbXX0gQ2hpbGRNb2RlbCAtIFRoZSBjbGFzcyBvZiB3aGljaCB0aGUgcHJvcGVydHkgc2hvdWxkIGJlIGFuIGFycmF5IG9mIGluc3RhbmNlcyBvZi4gVGhpcyBjbGFzcyBuZWVkcyB0byBleHRlbmQgdGhlIEVudGl0eSBjbGFzcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0c10gLSBUaGUgb3B0aW9ucyB0byBjb25maWd1cmUgdGhlIHJlbGF0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5yZXF1aXJlZF0gLSBJZiBzZXQgdG8gdHJ1ZSwgdGhlIHZhbGlkYXRpb24gbWV0aG9kIHdpbGwgY2hlY2sgaWYgdGhlIGNoaWxkcmVuIGlzIHVuZGVmaW5lZCBvciB3aXRoIGxlbmd0aCAwLCBhbmQgaWYgaXQgaXMgd2lsbCB0aHJvdyBhIFZhbGlkYXRpb25FcnJvci5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMubmVzdGVkT2JqZWN0XSAtIElmIHNldCB0byB0cnVlLCB0aGUgYXR0cmlidXRlcyB3aWxsIGJlIG5lc3RlZCB0byB0aGUgcGFyZW50IG1vZGVsLiBJZiBzZXQgdG8gZmFsc2UsIHRoZSBjaGlsZHJlbiBtb2RlbHMgd2lsbCBiZSBzYXZlZCBhcyBuZXcgcmVjb3JkcyBpbiB0aGUgZGF0YWJhc2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuZm9yZWlnbktleV0gLSBUaGUgZm9yZWlnbiBrZXkgcHJvcGVydHkgZnJvbSB0aGUgY2hpbGRyZW4uIElmIHRoaXMgdmFyaWFibGUgaXMgc2V0LCBlYWNoIG9mIHRoZSBjaGlsZHJlbiByZWNvcmRzIHdpbGwgaGF2ZSB0aGUgcGFyZW50IG1vZGVsIGVudGl0eSB0eXBlICsgaXRzIGlkIGFzIHRoZSBmb3JlaWduS2V5IGNvbHVtbi4gSXQgd2lsbCBhbHNvIHNldCB0aGUgcGFyZW50IHdpdGggdGhpcyBzYW1lIGNvbHVtbiBhbmQgdmFsdWUsIGhlbHBpbmcgZnV0dXJlIGluZGV4IHF1ZXJpZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuaW5kZXhOYW1lXSAtIElmIHRoZSBmb3JlaWduIGtleSBpcyBzZXQsIHRoaXMgaW5kZXhOYW1lIGlzIHVzZWQgYnkgc29tZSBtZXRob2RzIHRvIHF1ZXJ5IHRoZSByZWxhdGlvbnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdHMucGFyZW50UHJvcGVydHlPbkNoaWxkXSAtIFNldCBhIHJlZmVyZW5jZSBpbiB0aGUgY2hpbGQgc28gaXQgY2FuIGFjY2VzcyB0aGUgcGFyZW50IGNvcnJlY3RseS4gUmlnaHQgbm93LCB0aGlzIGlzIG9ubHkgc2V0IGluIGxvYWQgLyBnZXRJdGVtIHdpdGggaW5jbHVkZWRSZWxhdGVkIHNldC4gLSBOZWVkcyBpbXByb3ZlbWVudHMgdG8gYmUgc2V0IGV2ZXJ5d2hlcmUuIEFsc28sIHZhbGlkYXRpb25zIGRvIG5vdCBhcHBseSBmb3IgcGFyZW50cy5cbiAqIEByZW1hcmtzXG4gKlxuICogLSBXaGVuIHRoZSBoYXNNYW55IGlzIHNldCBvbiB0aGUgcGFyZW50IHdpdGggYSBmb3JlaWduS2V5IEFORCBpbmRleE5hbWUsIGF1dG9tYXRpY2FsbHksIHdoZW4gcXVlcnlpbmcgdGhlIGNoaWxkIHdpdGggcmVsYXRlZCByZWNvcmRzLCBpdCB3aWxsIGJyaW5nIHRoZSBwYXJlbnQgcmVjb3JkIHRvby5cbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqIGltcG9ydCAqIGFzIEpvaSBmcm9tICdqb2knO1xuICpcbiAqIGNsYXNzIENoaWxkTW9kZWwgZXh0ZW5kcyBFbnRpdHkge1xuICogICBAcHJvcCgpXG4gKiAgIEB2YWxpZGF0ZShKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSlcbiAqICAgcGs6IHN0cmluZztcbiAqXG4gKiAgIEBwcm9wKClcbiAqICAgc2s6IHN0cmluZztcbiAqXG4gKiAgIEBwcm9wKClcbiAqICAgZms6IHN0cmluZztcbiAqIH1cbiAqXG4gKiBjbGFzcyBQYXJlbnRNb2RlbCBleHRlbmRzIEVudGl0eSB7XG4gKiAgIEBwcm9wKHsgcHJpbWFyeUtleTogdHJ1ZSB9KVxuICogICBwazogc3RyaW5nO1xuICpcbiAqICAgQGhhc01hbnkoQ2hpbGRNb2RlbCwgeyBuZXN0ZWRPYmplY3Q6IGZhbHNlLCByZXF1aXJlZDogdHJ1ZSwgZm9yZWlnbktleTogJ2ZrJywgaW5kZXhOYW1lOiAnYnlGSycgfSlcbiAqICAgY2hpbGRyZW46IENoaWxkTW9kZWxbXTtcbiAqIH1cbiAqXG4gKiBjb25zdCBwYXJlbnQgPSBuZXcgUGFyZW50TW9kZWwoe1xuICogICBwazogJzEnLFxuICogfSk7XG4gKlxuICogY29uc29sZS5sb2cocGFyZW50LmNoaWxkcmVuKSAvLyBbXVxuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC52YWxpZCkgLy8gZmFsc2UgIyBBcyBjaGlsZHJlbiBpcyBzZXQgYXMgcmVxdWlyZWQsIGl0IGlzIGludmFsaWQgYXMgaXQgaGFzIG5vIGNoaWxkcmVuIG5vdy4uXG4gKlxuICogcGFyZW50LmNoaWxkcmVuID0gW25ldyBDaGlsZE1vZGVsKHtcbiAqICAgcGs6ICdway1mcm9tLWNoaWxkLTEnLFxuICogICBzazogJ3NrLWZyb20tY2hpbGQtMScsXG4gKiB9KSwgbmV3IENoaWxkTW9kZWwoe1xuICogICBzazogJ3NrLWZyb20tY2hpbGQtMicsXG4gKiB9KV1cbiAqXG4gKiBjb25zb2xlLmxvZyhwYXJlbnQuY2hpbGRyZW5bMF0ucGspIC8vICdway1mcm9tLWNoaWxkLTEnXG4gKiBjb25zb2xlLmxvZyhwYXJlbnQuY2hpbGRyZW5bMF0uc2spIC8vICdzay1mcm9tLWNoaWxkLTEnXG4gKlxuICogY29uc29sZS5sb2cocGFyZW50LmNoaWxkcmVuWzFdLnBrKSAvLyB1bmRlZmluZWRcbiAqIGNvbnNvbGUubG9nKHBhcmVudC5jaGlsZHJlblsxXS5zaykgLy8gJ3NrLWZyb20tY2hpbGQtMidcbiAqXG4gKiBjb25zb2xlLmxvZyhwYXJlbnQudmFsaWQpIC8vIGZhbHNlICMgQXMgdGhlIHNlY29uZCBjaGlsZCBpcyBpbnZhbGlkLCBwYXJlbnQgaXMgYWxzbyBpbnZhbGlkLlxuICpcbiAqIHBhcmVudC5jaGlsZHJlblsxXS5wayA9ICdway1mcm9tLWNoaWxkLTInO1xuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC5jaGlsZHJlblsxXS5waykgLy8gJ3BrLWZyb20tY2hpbGQtMidcbiAqIGNvbnNvbGUubG9nKHBhcmVudC5jaGlsZHJlblsxXS5zaykgLy8gJ3NrLWZyb20tY2hpbGQtMidcbiAqXG4gKiBjb25zb2xlLmxvZyhwYXJlbnQudHJhbnNmb3JtZWRBdHRyaWJ1dGVzKSAvLyAjIFRoZSBjaGlsZHJlbiBhdHRyaWJ1dGVzIGRvIG5vdCBhcHBlYXIgaW4gdGhlIGF0dHJpYnV0ZXMgYmVjYXVzZSB0aGV5IHdpbGwgYmVjb21lIG5ldyByZWNvcmRzLlxuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC52YWxpZCkgLy8gdHJ1ZSAjIEFzIG5vdyBhbGwgY2hpbGRyZW4gYXJlIHZhbGlkLCB0aGUgcGFyZW50IGlzIGFsc28gdmFsaWQuXG4gKlxuICogcGFyZW50LmNyZWF0ZSgpIC8vIFRoaXMgd2lsbCBpbnNlcnQgMyByZWNvcmRzIGluIHRoZSBkYXRhYmFzZS4gVGhlIHBhcmVudCBhbmQgZWFjaCBvZiB0aGUgY2hpbGRyZW4uIEFsbCBvZiB0aGVtIHdpbGwgaGF2ZSBmayBjb2x1bW4gc2V0IHRvICdQYXJlbnRNb2RlbC0xJ1xuICogYGBgXG4gKlxuICogQGNhdGVnb3J5IFByb3BlcnR5IERlY29yYXRvcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc01hbnkoQ2hpbGRNb2RlbDogQ29uc3RydWN0b3IsIG9wdHM/OiBIYXNSZWxhdGlvbk9wdGlvbnMpIHtcbiAgcmV0dXJuICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoaGFzTWFueU1ldGFkYXRhS2V5LCB7XG4gICAgICBtb2RlbDogQ2hpbGRNb2RlbCxcbiAgICAgIG9wdHMsXG4gICAgfSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG5cbiAgICBjb25zdCBtb2RlbFByb3BlcnRpZXM6IFJlbGF0aW9uRGVzY3JpcHRvcnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKHJlbGF0aW9uRGVzY3JpcHRvciwgdGFyZ2V0LCBDaGlsZE1vZGVsLm5hbWUpIHx8IFtdO1xuXG4gICAgbW9kZWxQcm9wZXJ0aWVzLnB1c2goe1xuICAgICAgbW9kZWw6IENoaWxkTW9kZWwsXG4gICAgICBvcHRzLFxuICAgICAgcHJvcGVydHlLZXksXG4gICAgICB0eXBlOiAnaGFzTWFueScsXG4gICAgfSk7XG5cbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKHJlbGF0aW9uRGVzY3JpcHRvciwgbW9kZWxQcm9wZXJ0aWVzLCB0YXJnZXQpO1xuXG4gICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShoYXNNYW55TWV0YWRhdGFLZXksIHtcbiAgICAgIG1vZGVsOiBDaGlsZE1vZGVsLFxuICAgICAgb3B0cyxcbiAgICAgIHByb3BlcnR5S2V5LFxuICAgIH0sIHRhcmdldCwgYF9oYXNNYW55XyR7Q2hpbGRNb2RlbC5uYW1lfWApO1xuXG4gICAgaWYgKG9wdHM/LmZvcmVpZ25LZXkpIHtcbiAgICAgIHNldFByb3BHZXR0ZXJzQW5kU2V0dGVycyh0YXJnZXQsIG9wdHM/LmZvcmVpZ25LZXkpO1xuICAgIH1cblxuICAgIGxldCBtb2RlbHM6IHN0cmluZ1tdID0gUmVmbGVjdC5nZXRNZXRhZGF0YShoYXNNYW55TWV0YWRhdGFLZXksIHRhcmdldCk7XG5cbiAgICBpZiAobW9kZWxzKSB7XG4gICAgICBtb2RlbHMucHVzaChwcm9wZXJ0eUtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vZGVscyA9IFtwcm9wZXJ0eUtleV07XG4gICAgfVxuXG4gICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcbiAgICAgIGhhc01hbnlNZXRhZGF0YUtleSxcbiAgICAgIG1vZGVscyxcbiAgICAgIHRhcmdldCxcbiAgICApO1xuXG4gICAgc2V0QmVsb25nc1RvKHRhcmdldCwgQ2hpbGRNb2RlbCwgcHJvcGVydHlLZXksICdoYXNNYW55Jywgb3B0cyk7XG5cbiAgICBzZXRIYXNNYW55RGVzY3JpcHRvcih0YXJnZXQsIHByb3BlcnR5S2V5LCBDaGlsZE1vZGVsKTtcbiAgfTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUhhc01hbnlBdHRyaWJ1dGVzKHRhcmdldDogYW55LCBpdGVtOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gIGNvbnN0IGZpbmFsQXR0cmlidXRlcyA9IF8uY2xvbmVEZWVwKGl0ZW0pO1xuXG4gIGNvbnN0IG5lc3RlZE1vZGVsczogc3RyaW5nW10gPSBnZXRIYXNNYW55TmVzdGVkTW9kZWxzKHRhcmdldCkgfHwgW107XG4gIGZvciAoY29uc3QgbW9kZWwgb2YgbmVzdGVkTW9kZWxzKSB7XG4gICAgaWYgKGl0ZW1bbW9kZWxdICE9IG51bGwpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW1bbW9kZWxdKSAmJiBpdGVtW21vZGVsXS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZpbmFsQXR0cmlidXRlc1ttb2RlbF0gPSBpdGVtW21vZGVsXS5tYXAoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgbW9kZWw6IE1vZGVsQ2xhc3MsXG4gICAgICAgICAgfSA9IGdldEhhc01hbnlNb2RlbCh0YXJnZXQsIG1vZGVsKSB8fCB7fTtcblxuICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1vZGVsQ2xhc3MpIHJldHVybiB2YWx1ZS5hdHRyaWJ1dGVzO1xuXG4gICAgICAgICAgLy8gVkFMVUUgSVMgQU4gT0JKRUNUXG4gICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgTW9kZWxDbGFzcyhtb2RlbCk7XG4gICAgICAgICAgcmV0dXJuIGluc3RhbmNlLmF0dHJpYnV0ZXM7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIGZpbmFsQXR0cmlidXRlc1ttb2RlbF07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgbm90TmVzdGVkTW9kZWxzOiBzdHJpbmdbXSA9IGdldEhhc01hbnlOb3ROZXN0ZWRNb2RlbHModGFyZ2V0KSB8fCBbXTtcbiAgZm9yIChjb25zdCBtb2RlbCBvZiBub3ROZXN0ZWRNb2RlbHMpIHtcbiAgICBkZWxldGUgZmluYWxBdHRyaWJ1dGVzW21vZGVsXTtcbiAgfVxuXG4gIHJldHVybiBmaW5hbEF0dHJpYnV0ZXM7XG59XG4iXX0=