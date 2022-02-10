"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAttributes = exports.joiSchema = exports.validate = exports.getPropertyValidate = exports.getValidatedFields = void 0;
require("reflect-metadata");
const joi_1 = __importDefault(require("joi"));
const hasOne_1 = require("./hasOne");
const hasMany_1 = require("./hasMany");
const validateMetadataKey = 'validate';
const objectValidateMetadataKey = 'objectValidate';
/** @internal */
const getValidatedFields = (target) => {
    return Reflect.getMetadata(validateMetadataKey, target) || [];
};
exports.getValidatedFields = getValidatedFields;
/** @internal */
const getPropertyValidate = (target, key) => {
    return Reflect.getMetadata(validateMetadataKey, target, key);
};
exports.getPropertyValidate = getPropertyValidate;
/**
 * Adds validation to the decorated property or decorated Entity using Joi validation library.
 * @param {Joi.Schema} joi - The Joi validation schema.
 * @remarks
 *
 * If you are setting the decorated Entity it NEEDS to be of Joi.object() type. Remember that if you set a new validation object in the Entitiy itself you need to add the .unknown(true) if you want to accept any attribute.
 * @example
 * ```
 * import * as Joi from 'joi';
 *
 * @validate(Joi.object().unknown(true).and('attribute1', 'attribute2'))
 * class Model extends Entity {
 *   @validate(Joi.string().required().trim())
 *   pk: string;
 *
 *   @validate(Joi.string().trim())
 *   sk: string;
 *
 *   @validate(Joi.string())
 *   attribute1: string;
 *
 *   @validate(Joi.string())
 *   attribute2: string;
 * }
 *
 * const model = new Model({ pk: '1' });
 *
 * console.log(model.valid) // true
 *
 * model.sk = '2'
 * console.log(model.valid) // true
 *
 * model.pk = undefined;
 * console.log(model.valid) // false
 *
 * model.pk = '   1 2   ';
 * console.log(model.validatedAttributes) // { pk: '1 2', sk: '2' } # The joi transfromation happens when validating but doesn't change the original attributes. But the transformed attributes are the ones used on save.
 *
 * model.attribute1 = '1'
 * console.log(model.valid) // false # It is invalid because of the entity level validation with the Joi.object().and()
 *
 * model.attribute2 = '2'
 * console.log(model.valid) // true # It is now valid because it passes the Joi.object().and() validation.
 * ```
 *
 * @category Property Decorators
 */
function validate(joi) {
    return (target, propertyKey) => {
        if (propertyKey) {
            // ADD THE JOI SCHEMA TO THE METADATA
            Reflect.defineMetadata(validateMetadataKey, joi, target, propertyKey);
            // SET THE LIST OF VALIDATED PROPERTIES IN THE INSTANCE
            let properties = Reflect.getMetadata(validateMetadataKey, target);
            if (properties) {
                properties.push(propertyKey);
            }
            else {
                properties = [propertyKey];
                Reflect.defineMetadata(validateMetadataKey, properties, target);
            }
        }
        else if (joi.describe().type === 'object') {
            Reflect.defineMetadata(objectValidateMetadataKey, joi, target.prototype);
        }
        else {
            throw new Error('Entity validate should always be a Joi.object()');
        }
    };
}
exports.validate = validate;
/** @internal */
function joiSchema(target) {
    const validatedKeys = (0, exports.getValidatedFields)(target);
    const joiObject = Reflect.getMetadata(objectValidateMetadataKey, target) || joi_1.default.object().unknown(true);
    const hasOneNestedModels = (0, hasOne_1.getHasOneNestedModels)(target);
    const hasManyNestedModels = (0, hasMany_1.getHasManyNestedModels)(target);
    const allNestedModels = hasOneNestedModels.concat(hasManyNestedModels);
    const hasOneNotNestedModels = (0, hasOne_1.getHasOneNotNestedModels)(target);
    const hasManyNotNestedModels = (0, hasMany_1.getHasManyNotNestedModels)(target);
    const allNotNestedModels = hasOneNotNestedModels.concat(hasManyNotNestedModels);
    const allModels = allNestedModels.concat(allNotNestedModels);
    // THIS WILL IGNORE ALL THE MODELS (NESTED AND NOT NESTED) FROM THE SCHEMA
    const joiKeys = validatedKeys.reduce((agg, key) => {
        const schema = (0, exports.getPropertyValidate)(target, key);
        if (!allModels.includes(key) && schema != null)
            agg[key] = schema;
        return agg;
    }, {});
    // THIS WILL RE-ADD THE NESTED MODELS TO THE SCHEMA
    [{
            modelsArray: hasOneNestedModels,
            getModelFunc: hasOne_1.getHasOneModel,
            isArray: false,
        }, {
            modelsArray: hasManyNestedModels,
            getModelFunc: hasMany_1.getHasManyModel,
            isArray: true,
        }].forEach(({ modelsArray, getModelFunc, isArray }) => {
        for (const model of modelsArray) {
            const { model: ModelClass, opts, } = getModelFunc(target, model) || {};
            const schema = joiSchema(ModelClass.prototype);
            if (schema != null) {
                let finalSchema = schema;
                if (isArray) {
                    finalSchema = joi_1.default.array().items(schema);
                }
                if (opts && opts.required) {
                    finalSchema = finalSchema.required();
                    if (isArray) {
                        finalSchema = finalSchema.min(1);
                    }
                }
                joiKeys[model] = finalSchema;
            }
        }
    });
    if (Object.keys(joiKeys).length > 0)
        return joiObject.keys(joiKeys);
    return joiObject;
}
exports.joiSchema = joiSchema;
/** @internal */
function validateAttributes(target, item) {
    const schema = joiSchema(target);
    const { value, error } = schema.validate(item, {
        abortEarly: false,
        convert: true,
        dateFormat: 'iso',
    });
    if (error)
        throw error;
    return value;
}
exports.validateAttributes = validateAttributes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGUuanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsibGliL0RlY29yYXRvcnMvdmFsaWRhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNEJBQTBCO0FBQzFCLDhDQUFzQjtBQUN0QixxQ0FBMkY7QUFDM0YsdUNBQStGO0FBRS9GLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDO0FBQ3ZDLE1BQU0seUJBQXlCLEdBQUcsZ0JBQWdCLENBQUM7QUFFbkQsZ0JBQWdCO0FBQ1QsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLE1BQVcsRUFBWSxFQUFFO0lBQzFELE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDaEUsQ0FBQyxDQUFDO0FBRlcsUUFBQSxrQkFBa0Isc0JBRTdCO0FBRUYsZ0JBQWdCO0FBQ1QsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLE1BQVcsRUFBRSxHQUFXLEVBQTBCLEVBQUU7SUFDdEYsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUM7QUFGVyxRQUFBLG1CQUFtQix1QkFFOUI7QUFFRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQThDRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxHQUFlO0lBQ3RDLE9BQU8sQ0FBQyxNQUFXLEVBQUUsV0FBb0IsRUFBUSxFQUFFO1FBQ2pELElBQUksV0FBVyxFQUFFO1lBQ2YscUNBQXFDO1lBQ3JDLE9BQU8sQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztZQUV0RSx1REFBdUQ7WUFDdkQsSUFBSSxVQUFVLEdBQWEsT0FBTyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUU1RSxJQUFJLFVB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QUFDO2dCQUM3RCxJQUFJLE9BQU8sRUFBRTtvQkFDWCxXQUFXLEdBQUcsYUFBRyxDQUFDLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDekM7Z0JBRUQsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDekIsV0FBVyxHQUFHLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFFckMsSUFBSSxPQUFPLEVBQUU7d0JBQ1gsV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ2xDO2lCQUNGO2dCQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxXQUFXLENBQUM7YUFDOUI7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDO1FBQUUsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3BFLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUE1REQsOEJBNERDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLGtCQUFrQixDQUFDLE1BQVcsRUFBRSxJQUF5QjtJQUN2RSxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFakMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUN0QyxJQUFJLEVBQ0o7UUFDRSxVQUFVLEVBQUUsS0FBSztRQUNqQixPQUFPLEVBQUUsSUFBSTtRQUNiLFVBQVUsRUFBRSxLQUFLO0tBQ2xCLENBQ0YsQ0FBQztJQUVGLElBQUksS0FBSztRQUFFLE1BQU0sS0FBSyxDQUFDO0lBQ3ZCLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQWRELGdEQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcbmltcG9ydCBKb2kgZnJvbSAnam9pJztcbmltcG9ydCB7IGdldEhhc09uZU1vZGVsLCBnZXRIYXNPbmVOZXN0ZWRNb2RlbHMsIGdldEhhc09uZU5vdE5lc3RlZE1vZGVscyB9IGZyb20gJy4vaGFzT25lJztcbmltcG9ydCB7IGdldEhhc01hbnlNb2RlbCwgZ2V0SGFzTWFueU5lc3RlZE1vZGVscywgZ2V0SGFzTWFueU5vdE5lc3RlZE1vZGVscyB9IGZyb20gJy4vaGFzTWFueSc7XG5cbmNvbnN0IHZhbGlkYXRlTWV0YWRhdGFLZXkgPSAndmFsaWRhdGUnO1xuY29uc3Qgb2JqZWN0VmFsaWRhdGVNZXRhZGF0YUtleSA9ICdvYmplY3RWYWxpZGF0ZSc7XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBjb25zdCBnZXRWYWxpZGF0ZWRGaWVsZHMgPSAodGFyZ2V0OiBhbnkpOiBzdHJpbmdbXSA9PiB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKHZhbGlkYXRlTWV0YWRhdGFLZXksIHRhcmdldCkgfHwgW107XG59O1xuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgY29uc3QgZ2V0UHJvcGVydHlWYWxpZGF0ZSA9ICh0YXJnZXQ6IGFueSwga2V5OiBzdHJpbmcpOiBKb2kuU2NoZW1hIHwgdW5kZWZpbmVkID0+IHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEodmFsaWRhdGVNZXRhZGF0YUtleSwgdGFyZ2V0LCBrZXkpO1xufTtcblxuLyoqXG4gKiBBZGRzIHZhbGlkYXRpb24gdG8gdGhlIGRlY29yYXRlZCBwcm9wZXJ0eSBvciBkZWNvcmF0ZWQgRW50aXR5IHVzaW5nIEpvaSB2YWxpZGF0aW9uIGxpYnJhcnkuXG4gKiBAcGFyYW0ge0pvaS5TY2hlbWF9IGpvaSAtIFRoZSBKb2kgdmFsaWRhdGlvbiBzY2hlbWEuXG4gKiBAcmVtYXJrc1xuICpcbiAqIElmIHlvdSBhcmUgc2V0dGluZyB0aGUgZGVjb3JhdGVkIEVudGl0eSBpdCBORUVEUyB0byBiZSBvZiBKb2kub2JqZWN0KCkgdHlwZS4gUmVtZW1iZXIgdGhhdCBpZiB5b3Ugc2V0IGEgbmV3IHZhbGlkYXRpb24gb2JqZWN0IGluIHRoZSBFbnRpdGl5IGl0c2VsZiB5b3UgbmVlZCB0byBhZGQgdGhlIC51bmtub3duKHRydWUpIGlmIHlvdSB3YW50IHRvIGFjY2VwdCBhbnkgYXR0cmlidXRlLlxuICogQGV4YW1wbGVcbiAqIGBgYFxuICogaW1wb3J0ICogYXMgSm9pIGZyb20gJ2pvaSc7XG4gKlxuICogQHZhbGlkYXRlKEpvaS5vYmplY3QoKS51bmtub3duKHRydWUpLmFuZCgnYXR0cmlidXRlMScsICdhdHRyaWJ1dGUyJykpXG4gKiBjbGFzcyBNb2RlbCBleHRlbmRzIEVudGl0eSB7XG4gKiAgIEB2YWxpZGF0ZShKb2kuc3RyaW5nKCkucmVxdWlyZWQoKS50cmltKCkpXG4gKiAgIHBrOiBzdHJpbmc7XG4gKlxuICogICBAdmFsaWRhdGUoSm9pLnN0cmluZygpLnRyaW0oKSlcbiAqICAgc2s6IHN0cmluZztcbiAqXG4gKiAgIEB2YWxpZGF0ZShKb2kuc3RyaW5nKCkpXG4gKiAgIGF0dHJpYnV0ZTE6IHN0cmluZztcbiAqXG4gKiAgIEB2YWxpZGF0ZShKb2kuc3RyaW5nKCkpXG4gKiAgIGF0dHJpYnV0ZTI6IHN0cmluZztcbiAqIH1cbiAqXG4gKiBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbCh7IHBrOiAnMScgfSk7XG4gKlxuICogY29uc29sZS5sb2cobW9kZWwudmFsaWQpIC8vIHRydWVcbiAqXG4gKiBtb2RlbC5zayA9ICcyJ1xuICogY29uc29sZS5sb2cobW9kZWwudmFsaWQpIC8vIHRydWVcbiAqXG4gKiBtb2RlbC5wayA9IHVuZGVmaW5lZDtcbiAqIGNvbnNvbGUubG9nKG1vZGVsLnZhbGlkKSAvLyBmYWxzZVxuICpcbiAqIG1vZGVsLnBrID0gJyAgIDEgMiAgICc7XG4gKiBjb25zb2xlLmxvZyhtb2RlbC52YWxpZGF0ZWRBdHRyaWJ1dGVzKSAvLyB7IHBrOiAnMSAyJywgc2s6ICcyJyB9ICMgVGhlIGpvaSB0cmFuc2Zyb21hdGlvbiBoYXBwZW5zIHdoZW4gdmFsaWRhdGluZyBidXQgZG9lc24ndCBjaGFuZ2UgdGhlIG9yaWdpbmFsIGF0dHJpYnV0ZXMuIEJ1dCB0aGUgdHJhbnNmb3JtZWQgYXR0cmlidXRlcyBhcmUgdGhlIG9uZXMgdXNlZCBvbiBzYXZlLlxuICpcbiAqIG1vZGVsLmF0dHJpYnV0ZTEgPSAnMSdcbiAqIGNvbnNvbGUubG9nKG1vZGVsLnZhbGlkKSAvLyBmYWxzZSAjIEl0IGlzIGludmFsaWQgYmVjYXVzZSBvZiB0aGUgZW50aXR5IGxldmVsIHZhbGlkYXRpb24gd2l0aCB0aGUgSm9pLm9iamVjdCgpLmFuZCgpXG4gKlxuICogbW9kZWwuYXR0cmlidXRlMiA9ICcyJ1xuICogY29uc29sZS5sb2cobW9kZWwudmFsaWQpIC8vIHRydWUgIyBJdCBpcyBub3cgdmFsaWQgYmVjYXVzZSBpdCBwYXNzZXMgdGhlIEpvaS5vYmplY3QoKS5hbmQoKSB2YWxpZGF0aW9uLlxuICogYGBgXG4gKlxuICogQGNhdGVnb3J5IFByb3BlcnR5IERlY29yYXRvcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlKGpvaTogSm9pLlNjaGVtYSkge1xuICByZXR1cm4gKHRhcmdldDogYW55LCBwcm9wZXJ0eUtleT86IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIGlmIChwcm9wZXJ0eUtleSkge1xuICAgICAgLy8gQUREIFRIRSBKT0kgU0NIRU1BIFRPIFRIRSBNRVRBREFUQVxuICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YSh2YWxpZGF0ZU1ldGFkYXRhS2V5LCBqb2ksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xuXG4gICAgICAvLyBTRVQgVEhFIExJU1QgT0YgVkFMSURBVEVEIFBST1BFUlRJRVMgSU4gVEhFIElOU1RBTkNFXG4gICAgICBsZXQgcHJvcGVydGllczogc3RyaW5nW10gPSBSZWZsZWN0LmdldE1ldGFkYXRhKHZhbGlkYXRlTWV0YWRhdGFLZXksIHRhcmdldCk7XG5cbiAgICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHByb3BlcnRpZXMucHVzaChwcm9wZXJ0eUtleSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9wZXJ0aWVzID0gW3Byb3BlcnR5S2V5XTtcbiAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YSh2YWxpZGF0ZU1ldGFkYXRhS2V5LCBwcm9wZXJ0aWVzLCB0YXJnZXQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoam9pLmRlc2NyaWJlKCkudHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEob2JqZWN0VmFsaWRhdGVNZXRhZGF0YUtleSwgam9pLCB0YXJnZXQucHJvdG90eXBlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbnRpdHkgdmFsaWRhdGUgc2hvdWxkIGFsd2F5cyBiZSBhIEpvaS5vYmplY3QoKScpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaVNjaGVtYSh0YXJnZXQ6IGFueSkge1xuICBjb25zdCB2YWxpZGF0ZWRLZXlzID0gZ2V0VmFsaWRhdGVkRmllbGRzKHRhcmdldCk7XG4gIGNvbnN0IGpvaU9iamVjdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEob2JqZWN0VmFsaWRhdGVNZXRhZGF0YUtleSwgdGFyZ2V0KSB8fCBKb2kub2JqZWN0KCkudW5rbm93bih0cnVlKTtcblxuICBjb25zdCBoYXNPbmVOZXN0ZWRNb2RlbHMgPSBnZXRIYXNPbmVOZXN0ZWRNb2RlbHModGFyZ2V0KTtcbiAgY29uc3QgaGFzTWFueU5lc3RlZE1vZGVscyA9IGdldEhhc01hbnlOZXN0ZWRNb2RlbHModGFyZ2V0KTtcbiAgY29uc3QgYWxsTmVzdGVkTW9kZWxzID0gaGFzT25lTmVzdGVkTW9kZWxzLmNvbmNhdChoYXNNYW55TmVzdGVkTW9kZWxzKTtcblxuICBjb25zdCBoYXNPbmVOb3ROZXN0ZWRNb2RlbHMgPSBnZXRIYXNPbmVOb3ROZXN0ZWRNb2RlbHModGFyZ2V0KTtcbiAgY29uc3QgaGFzTWFueU5vdE5lc3RlZE1vZGVscyA9IGdldEhhc01hbnlOb3ROZXN0ZWRNb2RlbHModGFyZ2V0KTtcbiAgY29uc3QgYWxsTm90TmVzdGVkTW9kZWxzID0gaGFzT25lTm90TmVzdGVkTW9kZWxzLmNvbmNhdChoYXNNYW55Tm90TmVzdGVkTW9kZWxzKTtcblxuICBjb25zdCBhbGxNb2RlbHMgPSBhbGxOZXN0ZWRNb2RlbHMuY29uY2F0KGFsbE5vdE5lc3RlZE1vZGVscyk7XG5cbiAgLy8gVEhJUyBXSUxMIElHTk9SRSBBTEwgVEhFIE1PREVMUyAoTkVTVEVEIEFORCBOT1QgTkVTVEVEKSBGUk9NIFRIRSBTQ0hFTUFcbiAgY29uc3Qgam9pS2V5cyA9IHZhbGlkYXRlZEtleXMucmVkdWNlKChhZ2csIGtleSkgPT4ge1xuICAgIGNvbnN0IHNjaGVtYSA9IGdldFByb3BlcnR5VmFsaWRhdGUodGFyZ2V0LCBrZXkpO1xuICAgIGlmICghYWxsTW9kZWxzLmluY2x1ZGVzKGtleSkgJiYgc2NoZW1hICE9IG51bGwpIGFnZ1trZXldID0gc2NoZW1hO1xuICAgIHJldHVybiBhZ2c7XG4gIH0sIHt9IGFzIFJlY29yZDxzdHJpbmcsIEpvaS5TY2hlbWE+KTtcblxuICAvLyBUSElTIFdJTEwgUkUtQUREIFRIRSBORVNURUQgTU9ERUxTIFRPIFRIRSBTQ0hFTUFcbiAgW3tcbiAgICBtb2RlbHNBcnJheTogaGFzT25lTmVzdGVkTW9kZWxzLFxuICAgIGdldE1vZGVsRnVuYzogZ2V0SGFzT25lTW9kZWwsXG4gICAgaXNBcnJheTogZmFsc2UsXG4gIH0sIHtcbiAgICBtb2RlbHNBcnJheTogaGFzTWFueU5lc3RlZE1vZGVscyxcbiAgICBnZXRNb2RlbEZ1bmM6IGdldEhhc01hbnlNb2RlbCxcbiAgICBpc0FycmF5OiB0cnVlLFxuICB9XS5mb3JFYWNoKCh7IG1vZGVsc0FycmF5LCBnZXRNb2RlbEZ1bmMsIGlzQXJyYXkgfSkgPT4ge1xuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgbW9kZWxzQXJyYXkpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbW9kZWw6IE1vZGVsQ2xhc3MsXG4gICAgICAgIG9wdHMsXG4gICAgICB9ID0gZ2V0TW9kZWxGdW5jKHRhcmdldCwgbW9kZWwpIHx8IHt9O1xuXG4gICAgICBjb25zdCBzY2hlbWEgPSBqb2lTY2hlbWEoTW9kZWxDbGFzcy5wcm90b3R5cGUpO1xuXG4gICAgICBpZiAoc2NoZW1hICE9IG51bGwpIHtcbiAgICAgICAgbGV0IGZpbmFsU2NoZW1hOiBKb2kuT2JqZWN0U2NoZW1hIHwgSm9pLkFycmF5U2NoZW1hID0gc2NoZW1hO1xuICAgICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICAgIGZpbmFsU2NoZW1hID0gSm9pLmFycmF5KCkuaXRlbXMoc2NoZW1hKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRzICYmIG9wdHMucmVxdWlyZWQpIHtcbiAgICAgICAgICBmaW5hbFNjaGVtYSA9IGZpbmFsU2NoZW1hLnJlcXVpcmVkKCk7XG5cbiAgICAgICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICAgICAgZmluYWxTY2hlbWEgPSBmaW5hbFNjaGVtYS5taW4oMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgam9pS2V5c1ttb2RlbF0gPSBmaW5hbFNjaGVtYTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGlmIChPYmplY3Qua2V5cyhqb2lLZXlzKS5sZW5ndGggPiAwKSByZXR1cm4gam9pT2JqZWN0LmtleXMoam9pS2V5cyk7XG4gIHJldHVybiBqb2lPYmplY3Q7XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUF0dHJpYnV0ZXModGFyZ2V0OiBhbnksIGl0ZW06IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgY29uc3Qgc2NoZW1hID0gam9pU2NoZW1hKHRhcmdldCk7XG5cbiAgY29uc3QgeyB2YWx1ZSwgZXJyb3IgfSA9IHNjaGVtYS52YWxpZGF0ZShcbiAgICBpdGVtLFxuICAgIHtcbiAgICAgIGFib3J0RWFybHk6IGZhbHNlLFxuICAgICAgY29udmVydDogdHJ1ZSxcbiAgICAgIGRhdGVGb3JtYXQ6ICdpc28nLFxuICAgIH0sXG4gICk7XG5cbiAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcbiAgcmV0dXJuIHZhbHVlO1xufVxuIl19