"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformHasOneAttributes = exports.hasOne = exports.setHasOnePropertiesDescriptor = exports.setHasOneDescriptor = exports.getHasOneProperty = exports.getHasOneProperties = exports.getHasOneNotNestedModels = exports.getHasOneNestedModels = exports.getHasOneModel = exports.getHasOneModels = void 0;
require("reflect-metadata");
const lodash_1 = __importDefault(require("lodash"));
const joi_1 = __importDefault(require("joi"));
const aliases_1 = require("./aliases");
const relationHelpers_1 = require("./relationHelpers");
const prop_1 = require("./prop");
const belongsTo_1 = require("./belongsTo");
const hasOneMetadataKey = 'hasOne';
const hasOnePropertiesMetadataKey = 'hasOneProperties';
/** @internal */
function getHasOneModels(target) {
    return Reflect.getMetadata(hasOneMetadataKey, target);
}
exports.getHasOneModels = getHasOneModels;
/** @internal */
function getHasOneModel(target, propertyKey) {
    return Reflect.getMetadata(hasOneMetadataKey, target, propertyKey);
}
exports.getHasOneModel = getHasOneModel;
/** @internal */
function getHasOneNestedModels(target) {
    const models = getHasOneModels(target) || [];
    return models.filter((model) => {
        const { opts, } = getHasOneModel(target, model) || {};
        return opts === null || opts === void 0 ? void 0 : opts.nestedObject;
    });
}
exports.getHasOneNestedModels = getHasOneNestedModels;
/** @internal */
function getHasOneNotNestedModels(target) {
    const models = getHasOneModels(target) || [];
    return models.filter((model) => {
        const { opts, } = getHasOneModel(target, model) || {};
        return !(opts === null || opts === void 0 ? void 0 : opts.nestedObject);
    });
}
exports.getHasOneNotNestedModels = getHasOneNotNestedModels;
/** @internal */
function getHasOneProperties(target) {
    return Reflect.getMetadata(hasOnePropertiesMetadataKey, target);
}
exports.getHasOneProperties = getHasOneProperties;
/** @internal */
function getHasOneProperty(target, propertyKey) {
    return Reflect.getMetadata(hasOnePropertiesMetadataKey, target, propertyKey) || {};
}
exports.getHasOneProperty = getHasOneProperty;
/** @internal */
function setHasOneDescriptor(target, modelName, ChildModel) {
    const propertyKey = `_${hasOneMetadataKey}_${modelName}`;
    Object.defineProperty(target, modelName, {
        get() {
            if (this[propertyKey] == null)
                this[propertyKey] = new ChildModel();
            return this[propertyKey];
        },
        set(value) {
            if (value instanceof ChildModel) {
                this[propertyKey] = value;
            }
            else {
                joi_1.default.assert(value, joi_1.default.object().unknown(true));
                this[propertyKey] = new ChildModel(value);
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
exports.setHasOneDescriptor = setHasOneDescriptor;
/** @internal */
function setHasOnePropertiesDescriptor(target, modelName, ChildModel) {
    const propDescriptors = Object.keys(ChildModel.prototype);
    const aliasDescriptors = Object.keys((0, aliases_1.getAliasesMap)(ChildModel.prototype));
    const descriptors = propDescriptors.concat(aliasDescriptors);
    descriptors.forEach((key) => {
        const propertyKey = `${modelName}${lodash_1.default.capitalize(key)}`;
        Object.defineProperty(target, propertyKey, {
            get() {
                if (this[modelName])
                    return this[modelName][key];
                return undefined;
            },
            set(value) {
                if (this[modelName] == null) {
                    this[modelName] = new ChildModel({
                        [key]: value,
                    });
                }
                else {
                    this[modelName][key] = value;
                }
            },
            configurable: false,
        });
    });
}
exports.setHasOnePropertiesDescriptor = setHasOnePropertiesDescriptor;
/**
 * Sets the decorated property as another entity.
 * @param {Entity} ChildModel - The class of which the property should be an instance of. This class needs to extend the Entity class.
 * @param {Object} [opts] - The options to configure the relation.
 * @param {boolean} [opts.required] - If set to true, the validation method will check if the child is undefined, and if it is will throw a ValidationError.
 * @param {boolean} [opts.nestedObject] - If set to true, the attributes will be nested to the parent model. If set to false, the child model will be another record in the database, meaning that when you save the parent model, the child model gets saved as a separate record in the database.
 * @param {string} [opts.foreignKey] - The foreign key property from the child. If this variable is set, the child property will be set to the parent model entity type + its id. It will also set the parent with this same column and value, helping future index queries.
 * @param {string} [opts.indexName] - If the foreign key is set, this indexName is used by some methods to query the relations.
 * @param {string} [opts.parentPropertyOnChild] - Set a reference in the child so it can access the parent correctly. Right now, this is only set in load / getItem with includedRelated set. - Needs improvements to be set everywhere. Also, validations do not apply for parents.
 * @remarks
 *
 * - Besides validations and setting the child instance, it also creates getters and setters for all child instances in the parent. Look example for more details.
 * - When the hasOne is set on the parent with a foreignKey AND indexName, automatically, when querying the child with related records, it will bring the parent record too.
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
 *   @hasOne(ChildModel, { nestedObject: true, required: true })
 *   child1: ChildModel;
 *
 *   @hasOne(ChildModel, { nestedObject: false, required: false, foreignKey: 'fk' })
 *   child2: ChildModel;
 * }
 *
 * const parent = new ParentModel({
 *   pk: '1',
 *   child1: {
 *     pk: 'pk-from-child-1',
 *     sk: 'sk-from-child-1',
 *   },
 *   child2Sk: 'sk-from-child-2',
 * });
 *
 * console.log(parent.child1.pk) // 'pk-from-child-1'
 * console.log(parent.child1.sk) // 'sk-from-child-1'
 * console.log(parent.child1Pk) // 'pk-from-child-1'
 * console.log(parent.child1Sk) // 'sk-from-child-1'
 *
 * console.log(parent.child2.pk) // undefined
 * console.log(parent.child2.sk) // 'sk-from-child-2'
 * console.log(parent.child2Pk) // undefined
 * console.log(parent.child2Sk) // 'sk-from-child-2'
 *
 * parent.child2.pk = 'pk-from-child-2';
 *
 * console.log(parent.child2.pk) // 'pk-from-child-2'
 * console.log(parent.child2.sk) // 'sk-from-child-2'
 * console.log(parent.child2Pk) // 'pk-from-child-2'
 * console.log(parent.child2Sk) // 'sk-from-child-2'
 *
 * console.log(parent.transformedAttributes) // { child1: { pk: 'pk-from-child-1', sk: 'sk-from-child-1' } } # The child2 does not appear in the attributes because it will become a new record.
 *
 * console.log(parent.valid) // false # As child 2 is invalid, parent is invalid also.
 *
 * model.child2 = undefined;
 *
 * console.log(parent.valid) // true # As child 2 is not required, parent is valid.
 *
 * model.child1 = undefined;
 *
 * console.log(parent.valid) // false # As child 1 is required, the parent is invalid.
 *
 * parent.create() // This will insert 2 records in the database. The parent and the child 2. Both will have the property fk set to 'ParentModel-1'
 * ```
 *
 * @category Property Decorators
 */
function hasOne(ChildModel, opts) {
    return (target, propertyKey) => {
        Reflect.defineMetadata(hasOneMetadataKey, {
            model: ChildModel,
            opts,
        }, target, propertyKey);
        const modelProperties = Reflect.getMetadata(relationHelpers_1.relationDescriptor, target) || [];
        modelProperties.push({
            model: ChildModel,
            opts,
            propertyKey,
            type: 'hasOne',
        });
        Reflect.defineMetadata(relationHelpers_1.relationDescriptor, modelProperties, target);
        if (opts === null || opts === void 0 ? void 0 : opts.foreignKey) {
            (0, prop_1.setPropGettersAndSetters)(target, opts === null || opts === void 0 ? void 0 : opts.foreignKey);
        }
        let models = Reflect.getMetadata(hasOneMetadataKey, target);
        if (models) {
            models.push(propertyKey);
        }
        else {
            models = [propertyKey];
        }
        Reflect.defineMetadata(hasOneMetadataKey, models, target);
        (0, belongsTo_1.setBelongsTo)(target, ChildModel, propertyKey, 'hasOne', opts);
        setHasOneDescriptor(target, propertyKey, ChildModel);
        setHasOnePropertiesDescriptor(target, propertyKey, ChildModel);
    };
}
exports.hasOne = hasOne;
/** @internal */
function transformHasOneAttributes(target, item) {
    const finalAttributes = lodash_1.default.cloneDeep(item);
    const nestedModels = getHasOneNestedModels(target) || [];
    for (const model of nestedModels) {
        delete finalAttributes[model];
        if (item[model] != null) {
            const { model: ModelClass, } = getHasOneModel(target, model) || {};
            let instance = item[model];
            if (!(item[model] instanceof ModelClass)) {
                instance = new ModelClass(item[model]);
            }
            if (Object.keys(instance.attributes).length > 0) {
                finalAttributes[model] = instance.attributes;
            }
        }
    }
    const notNestedModels = getHasOneNotNestedModels(target) || [];
    for (const model of notNestedModels) {
        delete finalAttributes[model];
    }
    return finalAttributes;
}
exports.transformHasOneAttributes = transformHasOneAttributes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzT25lLmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbImxpYi9EZWNvcmF0b3JzL2hhc09uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIsb0RBQXVCO0FBQ3ZCLDhDQUFzQjtBQUN0Qix1Q0FBMEM7QUFDMUMsdURBTTJCO0FBQzNCLGlDQUFrRDtBQUNsRCwyQ0FBMkM7QUFFM0MsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUM7QUFDbkMsTUFBTSwyQkFBMkIsR0FBRyxrQkFBa0IsQ0FBQztBQUV2RCxnQkFBZ0I7QUFDaEIsU0FBZ0IsZUFBZSxDQUFDLE1BQVc7SUFDekMsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFGRCwwQ0FFQztBQUVELGdCQUFnQjtBQUNoQixTQUFnQixjQUFjLENBQUMsTUFBVyxFQUFFLFdBQW1CO0lBQzdELE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDckUsQ0FBQztBQUZELHdDQUVDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLHFCQUFxQixDQUFDLE1BQVc7SUFDL0MsTUFBTSxNQUFNLEdBQWEsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV2RCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM3QixNQUFNLEVBQ0osSUFBSSxHQUNMLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFeEMsT0FBTyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsWUFBWSxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVZELHNEQVVDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLHdCQUF3QixDQUFDLE1BQVc7SUFDbEQsTUFBTSxNQUFNLEdBQWEsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV2RCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM3QixNQUFNLEVBQ0osSUFBSSxHQUNMLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFeEMsT0FBTyxDQUFDLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFlBQVksQ0FBQSxDQUFDO0lBQzdCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVZELDREQVVDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLG1CQUFtQixDQUFDLE1BQVc7SUFDN0MsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLDJCQUEyQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFGRCxrREFFQztBQUVELGdCQUFnQjtBQUNoQixTQUFnQixpQkFBaUIsQ0FBQyxNQUFXLEVBQUUsV0FBbUI7SUFDaEUsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLDJCQUEyQixFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDckYsQ0FBQztBQUZELDhDQUVDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLG1CQUFtQixDQUNqQyxNQUFXLEVBQ1gsU0FBaUIsRUFDakIsVUFBdUI7SUFFdkIsTUFBTSxXQUFXLEdBQUcsSUFBSSxpQkFBaUIsSUFBSSxTQUFTLEVBQUUsQ0FBQztJQUV6RCxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUU7UUFDdkMsR0FBRztZQUNELElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLElBQUk7Z0JBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7WUFDcEUsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUNELEdBQUcsQ0FBQyxLQUFLO1lBQ1AsSUFBSSxLQUFLLFlBQVksVUFBVSxFQUFFO2dCQUMvQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO2FBQzNCO2lCQUFNO2dCQUNMLGFBQUcsQ0FBQyxNQUFNLENBQ1IsS0FBSyxFQUNMLGFBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQzNCLENBQUM7Z0JBRUYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQzNDO1FBQ0gsQ0FBQztRQUNELFVBQVUsRUFBRSxJQUFJO1FBQ2hCLFlBQVksRUFBRSxLQUFLO0tBQ3BCLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLGlCQUFpQixnQkFBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFO1FBQ3hFLEdBQUc7WUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBQ0QsVUFBVSxFQUFFLEtBQUs7UUFDakIsWUFBWSxFQUFFLEtBQUs7S0FDcEIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQW5DRCxrREFtQ0M7QUFFRCxnQkFBZ0I7QUFDaEIsU0FBZ0IsNkJBQTZCLENBQUMsTUFBVyxFQUFFLFNBQWlCLEVBQUUsVUFBdUI7SUFDbkcsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDMUQsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUEsdUJBQWEsRUFBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUUxRSxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFFN0QsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQzFCLE1BQU0sV0FBVyxHQUFHLEdBQUcsU0FBUyxHQUFHLGdCQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFFdkQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFO1lBQ3pDLEdBQUc7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUFFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNqRCxPQUFPLFNBQVMsQ0FBQztZQUNuQixDQUFDO1lBQ0QsR0FBRyxDQUFDLEtBQUs7Z0JBQ1AsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxFQUFFO29CQUMzQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUM7d0JBQy9CLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSztxQkFDYixDQUFDLENBQUM7aUJBQ0o7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztpQkFDOUI7WUFDSCxDQUFDO1lBQ0QsWUFBWSxFQUFFLEtBQUs7U0FDcEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBMUJELHNFQTBCQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0ZHO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLFVBQXVCLEVBQUUsSUFBeUI7SUFDdkUsT0FBTyxDQUFDLE1BQVcsRUFBRSxXQUFtQixFQUFRLEVBQUU7UUFDaEQsT0FBTyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRTtZQUN4QyxLQUFLLEVBQUUsVUFBVTtZQUNqQixJQUFJO1NBQ0wsRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFeEIsTUFBTSxlQUFlLEdBQXdCLE9BQU8sQ0FBQyxXQUFXLENBQUMsb0NBQWtCLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRW5HLGVBQWUsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLFVBQVU7WUFDakIsSUFBSTtZQUNKLFdBQVc7WUFDWCxJQUFJLEVBQUUsUUFBUTtTQUNmLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxjQUFjLENBQUMsb0NBQWtCLEVBQUUsZUFBZSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXBFLElBQUksSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFVBQVUsRUFBRTtZQUNwQixJQUFBLCtCQUF3QixFQUFDLE1BQU0sRUFBRSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsVUFBVSxDQUFDLENBQUM7U0FDcEQ7UUFFRCxJQUFJLE1BQU0sR0FBYSxPQUFPLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXRFLElBQUksTUFBTSxFQUFFO1lBQ1YsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUMxQjthQUFNO1lBQ0wsTUFBTSxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDeEI7UUFFRCxPQUFPLENBQUMsY0FBYyxDQUNwQixpQkFBaUIsRUFDakIsTUFBTSxFQUNOLE1BQU0sQ0FDUCxDQUFDO1FBRUYsSUFBQSx3QkFBWSxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU5RCxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3JELDZCQUE2QixDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDakUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQXpDRCx3QkF5Q0M7QUFFRCxnQkFBZ0I7QUFDaEIsU0FBZ0IseUJBQXlCLENBQUMsTUFBVyxFQUFFLElBQXlCO0lBQzlFLE1BQU0sZUFBZSxHQUFHLGdCQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTFDLE1BQU0sWUFBWSxHQUFhLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUVuRSxLQUFLLE1BQU0sS0FBSyxJQUFJLFlBQVksRUFBRTtRQUNoQyxPQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUU5QixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDdkIsTUFBTSxFQUNKLEtBQUssRUFBRSxVQUFVLEdBQ2xCLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFeEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxVQUFVLENBQUMsRUFBRTtnQkFDeEMsUUFBUSxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3hDO1lBRUQsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUMvQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQzthQUM5QztTQUNGO0tBQ0Y7SUFFRCxNQUFNLGVBQWUsR0FBYSx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDekUsS0FBSyxNQUFNLEtBQUssSUFBSSxlQUFlLEVBQUU7UUFDbkMsT0FBTyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDL0I7SUFFRCxPQUFPLGVBQWUsQ0FBQztBQUN6QixDQUFDO0FBOUJELDhEQThCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IEpvaSBmcm9tICdqb2knO1xuaW1wb3J0IHsgZ2V0QWxpYXNlc01hcCB9IGZyb20gJy4vYWxpYXNlcyc7XG5pbXBvcnQge1xuICBDb25zdHJ1Y3RvcixcbiAgcmVsYXRpb25EZXNjcmlwdG9yLFxuICBSZWxhdGlvbkRlc2NyaXB0b3JzLFxuICBSZWxhdGlvbk1vZGVsLFxuICBIYXNSZWxhdGlvbk9wdGlvbnMsXG59IGZyb20gJy4vcmVsYXRpb25IZWxwZXJzJztcbmltcG9ydCB7IHNldFByb3BHZXR0ZXJzQW5kU2V0dGVycyB9IGZyb20gJy4vcHJvcCc7XG5pbXBvcnQgeyBzZXRCZWxvbmdzVG8gfSBmcm9tICcuL2JlbG9uZ3NUbyc7XG5cbmNvbnN0IGhhc09uZU1ldGFkYXRhS2V5ID0gJ2hhc09uZSc7XG5jb25zdCBoYXNPbmVQcm9wZXJ0aWVzTWV0YWRhdGFLZXkgPSAnaGFzT25lUHJvcGVydGllcyc7XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIYXNPbmVNb2RlbHModGFyZ2V0OiBhbnkpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKGhhc09uZU1ldGFkYXRhS2V5LCB0YXJnZXQpO1xufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzT25lTW9kZWwodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpOiBSZWxhdGlvbk1vZGVsIHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoaGFzT25lTWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzT25lTmVzdGVkTW9kZWxzKHRhcmdldDogYW55KTogc3RyaW5nW10ge1xuICBjb25zdCBtb2RlbHM6IHN0cmluZ1tdID0gZ2V0SGFzT25lTW9kZWxzKHRhcmdldCkgfHwgW107XG5cbiAgcmV0dXJuIG1vZGVscy5maWx0ZXIoKG1vZGVsKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgb3B0cyxcbiAgICB9ID0gZ2V0SGFzT25lTW9kZWwodGFyZ2V0LCBtb2RlbCkgfHwge307XG5cbiAgICByZXR1cm4gb3B0cz8ubmVzdGVkT2JqZWN0O1xuICB9KTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc09uZU5vdE5lc3RlZE1vZGVscyh0YXJnZXQ6IGFueSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbW9kZWxzOiBzdHJpbmdbXSA9IGdldEhhc09uZU1vZGVscyh0YXJnZXQpIHx8IFtdO1xuXG4gIHJldHVybiBtb2RlbHMuZmlsdGVyKChtb2RlbCkgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIG9wdHMsXG4gICAgfSA9IGdldEhhc09uZU1vZGVsKHRhcmdldCwgbW9kZWwpIHx8IHt9O1xuXG4gICAgcmV0dXJuICFvcHRzPy5uZXN0ZWRPYmplY3Q7XG4gIH0pO1xufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzT25lUHJvcGVydGllcyh0YXJnZXQ6IGFueSk6IHN0cmluZ1tdIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoaGFzT25lUHJvcGVydGllc01ldGFkYXRhS2V5LCB0YXJnZXQpO1xufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzT25lUHJvcGVydHkodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpOiB7IGVudGl0eTogc3RyaW5nLCBrZXk6IHN0cmluZyB9IHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoaGFzT25lUHJvcGVydGllc01ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KSB8fCB7fTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhhc09uZURlc2NyaXB0b3IoXG4gIHRhcmdldDogYW55LFxuICBtb2RlbE5hbWU6IHN0cmluZyxcbiAgQ2hpbGRNb2RlbDogQ29uc3RydWN0b3IsXG4pIHtcbiAgY29uc3QgcHJvcGVydHlLZXkgPSBgXyR7aGFzT25lTWV0YWRhdGFLZXl9XyR7bW9kZWxOYW1lfWA7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgbW9kZWxOYW1lLCB7XG4gICAgZ2V0KCkge1xuICAgICAgaWYgKHRoaXNbcHJvcGVydHlLZXldID09IG51bGwpIHRoaXNbcHJvcGVydHlLZXldID0gbmV3IENoaWxkTW9kZWwoKTtcbiAgICAgIHJldHVybiB0aGlzW3Byb3BlcnR5S2V5XTtcbiAgICB9LFxuICAgIHNldCh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQ2hpbGRNb2RlbCkge1xuICAgICAgICB0aGlzW3Byb3BlcnR5S2V5XSA9IHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgSm9pLmFzc2VydChcbiAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICBKb2kub2JqZWN0KCkudW5rbm93bih0cnVlKSxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzW3Byb3BlcnR5S2V5XSA9IG5ldyBDaGlsZE1vZGVsKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgYF9ub0luaXRpYWxpemVyJHtfLmNhcGl0YWxpemUobW9kZWxOYW1lKX1gLCB7XG4gICAgZ2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXNbcHJvcGVydHlLZXldO1xuICAgIH0sXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgfSk7XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRIYXNPbmVQcm9wZXJ0aWVzRGVzY3JpcHRvcih0YXJnZXQ6IGFueSwgbW9kZWxOYW1lOiBzdHJpbmcsIENoaWxkTW9kZWw6IENvbnN0cnVjdG9yKSB7XG4gIGNvbnN0IHByb3BEZXNjcmlwdG9ycyA9IE9iamVjdC5rZXlzKENoaWxkTW9kZWwucHJvdG90eXBlKTtcbiAgY29uc3QgYWxpYXNEZXNjcmlwdG9ycyA9IE9iamVjdC5rZXlzKGdldEFsaWFzZXNNYXAoQ2hpbGRNb2RlbC5wcm90b3R5cGUpKTtcblxuICBjb25zdCBkZXNjcmlwdG9ycyA9IHByb3BEZXNjcmlwdG9ycy5jb25jYXQoYWxpYXNEZXNjcmlwdG9ycyk7XG5cbiAgZGVzY3JpcHRvcnMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgY29uc3QgcHJvcGVydHlLZXkgPSBgJHttb2RlbE5hbWV9JHtfLmNhcGl0YWxpemUoa2V5KX1gO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcGVydHlLZXksIHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgaWYgKHRoaXNbbW9kZWxOYW1lXSkgcmV0dXJuIHRoaXNbbW9kZWxOYW1lXVtrZXldO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfSxcbiAgICAgIHNldCh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpc1ttb2RlbE5hbWVdID09IG51bGwpIHtcbiAgICAgICAgICB0aGlzW21vZGVsTmFtZV0gPSBuZXcgQ2hpbGRNb2RlbCh7XG4gICAgICAgICAgICBba2V5XTogdmFsdWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1ttb2RlbE5hbWVdW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGRlY29yYXRlZCBwcm9wZXJ0eSBhcyBhbm90aGVyIGVudGl0eS5cbiAqIEBwYXJhbSB7RW50aXR5fSBDaGlsZE1vZGVsIC0gVGhlIGNsYXNzIG9mIHdoaWNoIHRoZSBwcm9wZXJ0eSBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YuIFRoaXMgY2xhc3MgbmVlZHMgdG8gZXh0ZW5kIHRoZSBFbnRpdHkgY2xhc3MuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdHNdIC0gVGhlIG9wdGlvbnMgdG8gY29uZmlndXJlIHRoZSByZWxhdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMucmVxdWlyZWRdIC0gSWYgc2V0IHRvIHRydWUsIHRoZSB2YWxpZGF0aW9uIG1ldGhvZCB3aWxsIGNoZWNrIGlmIHRoZSBjaGlsZCBpcyB1bmRlZmluZWQsIGFuZCBpZiBpdCBpcyB3aWxsIHRocm93IGEgVmFsaWRhdGlvbkVycm9yLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0cy5uZXN0ZWRPYmplY3RdIC0gSWYgc2V0IHRvIHRydWUsIHRoZSBhdHRyaWJ1dGVzIHdpbGwgYmUgbmVzdGVkIHRvIHRoZSBwYXJlbnQgbW9kZWwuIElmIHNldCB0byBmYWxzZSwgdGhlIGNoaWxkIG1vZGVsIHdpbGwgYmUgYW5vdGhlciByZWNvcmQgaW4gdGhlIGRhdGFiYXNlLCBtZWFuaW5nIHRoYXQgd2hlbiB5b3Ugc2F2ZSB0aGUgcGFyZW50IG1vZGVsLCB0aGUgY2hpbGQgbW9kZWwgZ2V0cyBzYXZlZCBhcyBhIHNlcGFyYXRlIHJlY29yZCBpbiB0aGUgZGF0YWJhc2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuZm9yZWlnbktleV0gLSBUaGUgZm9yZWlnbiBrZXkgcHJvcGVydHkgZnJvbSB0aGUgY2hpbGQuIElmIHRoaXMgdmFyaWFibGUgaXMgc2V0LCB0aGUgY2hpbGQgcHJvcGVydHkgd2lsbCBiZSBzZXQgdG8gdGhlIHBhcmVudCBtb2RlbCBlbnRpdHkgdHlwZSArIGl0cyBpZC4gSXQgd2lsbCBhbHNvIHNldCB0aGUgcGFyZW50IHdpdGggdGhpcyBzYW1lIGNvbHVtbiBhbmQgdmFsdWUsIGhlbHBpbmcgZnV0dXJlIGluZGV4IHF1ZXJpZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuaW5kZXhOYW1lXSAtIElmIHRoZSBmb3JlaWduIGtleSBpcyBzZXQsIHRoaXMgaW5kZXhOYW1lIGlzIHVzZWQgYnkgc29tZSBtZXRob2RzIHRvIHF1ZXJ5IHRoZSByZWxhdGlvbnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdHMucGFyZW50UHJvcGVydHlPbkNoaWxkXSAtIFNldCBhIHJlZmVyZW5jZSBpbiB0aGUgY2hpbGQgc28gaXQgY2FuIGFjY2VzcyB0aGUgcGFyZW50IGNvcnJlY3RseS4gUmlnaHQgbm93LCB0aGlzIGlzIG9ubHkgc2V0IGluIGxvYWQgLyBnZXRJdGVtIHdpdGggaW5jbHVkZWRSZWxhdGVkIHNldC4gLSBOZWVkcyBpbXByb3ZlbWVudHMgdG8gYmUgc2V0IGV2ZXJ5d2hlcmUuIEFsc28sIHZhbGlkYXRpb25zIGRvIG5vdCBhcHBseSBmb3IgcGFyZW50cy5cbiAqIEByZW1hcmtzXG4gKlxuICogLSBCZXNpZGVzIHZhbGlkYXRpb25zIGFuZCBzZXR0aW5nIHRoZSBjaGlsZCBpbnN0YW5jZSwgaXQgYWxzbyBjcmVhdGVzIGdldHRlcnMgYW5kIHNldHRlcnMgZm9yIGFsbCBjaGlsZCBpbnN0YW5jZXMgaW4gdGhlIHBhcmVudC4gTG9vayBleGFtcGxlIGZvciBtb3JlIGRldGFpbHMuXG4gKiAtIFdoZW4gdGhlIGhhc09uZSBpcyBzZXQgb24gdGhlIHBhcmVudCB3aXRoIGEgZm9yZWlnbktleSBBTkQgaW5kZXhOYW1lLCBhdXRvbWF0aWNhbGx5LCB3aGVuIHF1ZXJ5aW5nIHRoZSBjaGlsZCB3aXRoIHJlbGF0ZWQgcmVjb3JkcywgaXQgd2lsbCBicmluZyB0aGUgcGFyZW50IHJlY29yZCB0b28uXG4gKiBAZXhhbXBsZVxuICogYGBgXG4gKiBpbXBvcnQgKiBhcyBKb2kgZnJvbSAnam9pJztcbiAqXG4gKiBjbGFzcyBDaGlsZE1vZGVsIGV4dGVuZHMgRW50aXR5IHtcbiAqICAgQHByb3AoKVxuICogICBAdmFsaWRhdGUoSm9pLnN0cmluZygpLnJlcXVpcmVkKCkpXG4gKiAgIHBrOiBzdHJpbmc7XG4gKlxuICogICBAcHJvcCgpXG4gKiAgIHNrOiBzdHJpbmc7XG4gKlxuICogICBAcHJvcCgpXG4gKiAgIGZrOiBzdHJpbmc7XG4gKiB9XG4gKlxuICogY2xhc3MgUGFyZW50TW9kZWwgZXh0ZW5kcyBFbnRpdHkge1xuICogICBAcHJvcCh7IHByaW1hcnlLZXk6IHRydWUgfSlcbiAqICAgcGs6IHN0cmluZztcbiAqXG4gKiAgIEBoYXNPbmUoQ2hpbGRNb2RlbCwgeyBuZXN0ZWRPYmplY3Q6IHRydWUsIHJlcXVpcmVkOiB0cnVlIH0pXG4gKiAgIGNoaWxkMTogQ2hpbGRNb2RlbDtcbiAqXG4gKiAgIEBoYXNPbmUoQ2hpbGRNb2RlbCwgeyBuZXN0ZWRPYmplY3Q6IGZhbHNlLCByZXF1aXJlZDogZmFsc2UsIGZvcmVpZ25LZXk6ICdmaycgfSlcbiAqICAgY2hpbGQyOiBDaGlsZE1vZGVsO1xuICogfVxuICpcbiAqIGNvbnN0IHBhcmVudCA9IG5ldyBQYXJlbnRNb2RlbCh7XG4gKiAgIHBrOiAnMScsXG4gKiAgIGNoaWxkMToge1xuICogICAgIHBrOiAncGstZnJvbS1jaGlsZC0xJyxcbiAqICAgICBzazogJ3NrLWZyb20tY2hpbGQtMScsXG4gKiAgIH0sXG4gKiAgIGNoaWxkMlNrOiAnc2stZnJvbS1jaGlsZC0yJyxcbiAqIH0pO1xuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC5jaGlsZDEucGspIC8vICdway1mcm9tLWNoaWxkLTEnXG4gKiBjb25zb2xlLmxvZyhwYXJlbnQuY2hpbGQxLnNrKSAvLyAnc2stZnJvbS1jaGlsZC0xJ1xuICogY29uc29sZS5sb2cocGFyZW50LmNoaWxkMVBrKSAvLyAncGstZnJvbS1jaGlsZC0xJ1xuICogY29uc29sZS5sb2cocGFyZW50LmNoaWxkMVNrKSAvLyAnc2stZnJvbS1jaGlsZC0xJ1xuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC5jaGlsZDIucGspIC8vIHVuZGVmaW5lZFxuICogY29uc29sZS5sb2cocGFyZW50LmNoaWxkMi5zaykgLy8gJ3NrLWZyb20tY2hpbGQtMidcbiAqIGNvbnNvbGUubG9nKHBhcmVudC5jaGlsZDJQaykgLy8gdW5kZWZpbmVkXG4gKiBjb25zb2xlLmxvZyhwYXJlbnQuY2hpbGQyU2spIC8vICdzay1mcm9tLWNoaWxkLTInXG4gKlxuICogcGFyZW50LmNoaWxkMi5wayA9ICdway1mcm9tLWNoaWxkLTInO1xuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC5jaGlsZDIucGspIC8vICdway1mcm9tLWNoaWxkLTInXG4gKiBjb25zb2xlLmxvZyhwYXJlbnQuY2hpbGQyLnNrKSAvLyAnc2stZnJvbS1jaGlsZC0yJ1xuICogY29uc29sZS5sb2cocGFyZW50LmNoaWxkMlBrKSAvLyAncGstZnJvbS1jaGlsZC0yJ1xuICogY29uc29sZS5sb2cocGFyZW50LmNoaWxkMlNrKSAvLyAnc2stZnJvbS1jaGlsZC0yJ1xuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC50cmFuc2Zvcm1lZEF0dHJpYnV0ZXMpIC8vIHsgY2hpbGQxOiB7IHBrOiAncGstZnJvbS1jaGlsZC0xJywgc2s6ICdzay1mcm9tLWNoaWxkLTEnIH0gfSAjIFRoZSBjaGlsZDIgZG9lcyBub3QgYXBwZWFyIGluIHRoZSBhdHRyaWJ1dGVzIGJlY2F1c2UgaXQgd2lsbCBiZWNvbWUgYSBuZXcgcmVjb3JkLlxuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC52YWxpZCkgLy8gZmFsc2UgIyBBcyBjaGlsZCAyIGlzIGludmFsaWQsIHBhcmVudCBpcyBpbnZhbGlkIGFsc28uXG4gKlxuICogbW9kZWwuY2hpbGQyID0gdW5kZWZpbmVkO1xuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC52YWxpZCkgLy8gdHJ1ZSAjIEFzIGNoaWxkIDIgaXMgbm90IHJlcXVpcmVkLCBwYXJlbnQgaXMgdmFsaWQuXG4gKlxuICogbW9kZWwuY2hpbGQxID0gdW5kZWZpbmVkO1xuICpcbiAqIGNvbnNvbGUubG9nKHBhcmVudC52YWxpZCkgLy8gZmFsc2UgIyBBcyBjaGlsZCAxIGlzIHJlcXVpcmVkLCB0aGUgcGFyZW50IGlzIGludmFsaWQuXG4gKlxuICogcGFyZW50LmNyZWF0ZSgpIC8vIFRoaXMgd2lsbCBpbnNlcnQgMiByZWNvcmRzIGluIHRoZSBkYXRhYmFzZS4gVGhlIHBhcmVudCBhbmQgdGhlIGNoaWxkIDIuIEJvdGggd2lsbCBoYXZlIHRoZSBwcm9wZXJ0eSBmayBzZXQgdG8gJ1BhcmVudE1vZGVsLTEnXG4gKiBgYGBcbiAqXG4gKiBAY2F0ZWdvcnkgUHJvcGVydHkgRGVjb3JhdG9yc1xuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzT25lKENoaWxkTW9kZWw6IENvbnN0cnVjdG9yLCBvcHRzPzogSGFzUmVsYXRpb25PcHRpb25zKSB7XG4gIHJldHVybiAodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKGhhc09uZU1ldGFkYXRhS2V5LCB7XG4gICAgICBtb2RlbDogQ2hpbGRNb2RlbCxcbiAgICAgIG9wdHMsXG4gICAgfSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG5cbiAgICBjb25zdCBtb2RlbFByb3BlcnRpZXM6IFJlbGF0aW9uRGVzY3JpcHRvcnMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKHJlbGF0aW9uRGVzY3JpcHRvciwgdGFyZ2V0KSB8fCBbXTtcblxuICAgIG1vZGVsUHJvcGVydGllcy5wdXNoKHtcbiAgICAgIG1vZGVsOiBDaGlsZE1vZGVsLFxuICAgICAgb3B0cyxcbiAgICAgIHByb3BlcnR5S2V5LFxuICAgICAgdHlwZTogJ2hhc09uZScsXG4gICAgfSk7XG5cbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKHJlbGF0aW9uRGVzY3JpcHRvciwgbW9kZWxQcm9wZXJ0aWVzLCB0YXJnZXQpO1xuXG4gICAgaWYgKG9wdHM/LmZvcmVpZ25LZXkpIHtcbiAgICAgIHNldFByb3BHZXR0ZXJzQW5kU2V0dGVycyh0YXJnZXQsIG9wdHM/LmZvcmVpZ25LZXkpO1xuICAgIH1cblxuICAgIGxldCBtb2RlbHM6IHN0cmluZ1tdID0gUmVmbGVjdC5nZXRNZXRhZGF0YShoYXNPbmVNZXRhZGF0YUtleSwgdGFyZ2V0KTtcblxuICAgIGlmIChtb2RlbHMpIHtcbiAgICAgIG1vZGVscy5wdXNoKHByb3BlcnR5S2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW9kZWxzID0gW3Byb3BlcnR5S2V5XTtcbiAgICB9XG5cbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFxuICAgICAgaGFzT25lTWV0YWRhdGFLZXksXG4gICAgICBtb2RlbHMsXG4gICAgICB0YXJnZXQsXG4gICAgKTtcblxuICAgIHNldEJlbG9uZ3NUbyh0YXJnZXQsIENoaWxkTW9kZWwsIHByb3BlcnR5S2V5LCAnaGFzT25lJywgb3B0cyk7XG5cbiAgICBzZXRIYXNPbmVEZXNjcmlwdG9yKHRhcmdldCwgcHJvcGVydHlLZXksIENoaWxkTW9kZWwpO1xuICAgIHNldEhhc09uZVByb3BlcnRpZXNEZXNjcmlwdG9yKHRhcmdldCwgcHJvcGVydHlLZXksIENoaWxkTW9kZWwpO1xuICB9O1xufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtSGFzT25lQXR0cmlidXRlcyh0YXJnZXQ6IGFueSwgaXRlbTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICBjb25zdCBmaW5hbEF0dHJpYnV0ZXMgPSBfLmNsb25lRGVlcChpdGVtKTtcblxuICBjb25zdCBuZXN0ZWRNb2RlbHM6IHN0cmluZ1tdID0gZ2V0SGFzT25lTmVzdGVkTW9kZWxzKHRhcmdldCkgfHwgW107XG5cbiAgZm9yIChjb25zdCBtb2RlbCBvZiBuZXN0ZWRNb2RlbHMpIHtcbiAgICBkZWxldGUgZmluYWxBdHRyaWJ1dGVzW21vZGVsXTtcblxuICAgIGlmIChpdGVtW21vZGVsXSAhPSBudWxsKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIG1vZGVsOiBNb2RlbENsYXNzLFxuICAgICAgfSA9IGdldEhhc09uZU1vZGVsKHRhcmdldCwgbW9kZWwpIHx8IHt9O1xuXG4gICAgICBsZXQgaW5zdGFuY2UgPSBpdGVtW21vZGVsXTtcbiAgICAgIGlmICghKGl0ZW1bbW9kZWxdIGluc3RhbmNlb2YgTW9kZWxDbGFzcykpIHtcbiAgICAgICAgaW5zdGFuY2UgPSBuZXcgTW9kZWxDbGFzcyhpdGVtW21vZGVsXSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChPYmplY3Qua2V5cyhpbnN0YW5jZS5hdHRyaWJ1dGVzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZpbmFsQXR0cmlidXRlc1ttb2RlbF0gPSBpbnN0YW5jZS5hdHRyaWJ1dGVzO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG5vdE5lc3RlZE1vZGVsczogc3RyaW5nW10gPSBnZXRIYXNPbmVOb3ROZXN0ZWRNb2RlbHModGFyZ2V0KSB8fCBbXTtcbiAgZm9yIChjb25zdCBtb2RlbCBvZiBub3ROZXN0ZWRNb2RlbHMpIHtcbiAgICBkZWxldGUgZmluYWxBdHRyaWJ1dGVzW21vZGVsXTtcbiAgfVxuXG4gIHJldHVybiBmaW5hbEF0dHJpYnV0ZXM7XG59XG4iXX0=