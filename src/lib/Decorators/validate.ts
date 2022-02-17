import 'reflect-metadata';
import Joi from 'joi';
import { getHasOneModel, getHasOneNestedModels, getHasOneNotNestedModels } from './hasOne';
import { getHasManyModel, getHasManyNestedModels, getHasManyNotNestedModels } from './hasMany';

const validateMetadataKey = 'validate';
const objectValidateMetadataKey = 'objectValidate';

/** @internal */
export const getValidatedFields = (target: any): string[] => {
  return Reflect.getMetadata(validateMetadataKey, target) || [];
};

/** @internal */
export const getPropertyValidate = (target: any, key: string): Joi.Schema | undefined => {
  return Reflect.getMetadata(validateMetadataKey, target, key);
};

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
export function validate(joi: Joi.Schema) {
  return (target: any, propertyKey?: string): void => {
    if (propertyKey) {
      // ADD THE JOI SCHEMA TO THE METADATA
      Reflect.defineMetadata(validateMetadataKey, joi, target, propertyKey);

      // SET THE LIST OF VALIDATED PROPERTIES IN THE INSTANCE
      let properties: string[] = Reflect.getMetadata(validateMetadataKey, target);

      if (properties) {
        properties.push(propertyKey);
      } else {
        properties = [propertyKey];
        Reflect.defineMetadata(validateMetadataKey, properties, target);
      }
    } else if (joi.describe().type === 'object') {
      Reflect.defineMetadata(objectValidateMetadataKey, joi, target.prototype);
    } else {
      throw new Error('Entity validate should always be a Joi.object()');
    }
  };
}

/** @internal */
export function joiSchema(target: any) {
  const validatedKeys = getValidatedFields(target);
  const joiObject = Reflect.getMetadata(objectValidateMetadataKey, target) || Joi.object().unknown(true);

  const hasOneNestedModels = getHasOneNestedModels(target);
  const hasManyNestedModels = getHasManyNestedModels(target);
  const allNestedModels = hasOneNestedModels.concat(hasManyNestedModels);

  const hasOneNotNestedModels = getHasOneNotNestedModels(target);
  const hasManyNotNestedModels = getHasManyNotNestedModels(target);
  const allNotNestedModels = hasOneNotNestedModels.concat(hasManyNotNestedModels);

  const allModels = allNestedModels.concat(allNotNestedModels);

  // THIS WILL IGNORE ALL THE MODELS (NESTED AND NOT NESTED) FROM THE SCHEMA
  const joiKeys = validatedKeys.reduce((agg, key) => {
    const schema = getPropertyValidate(target, key);
    if (!allModels.includes(key) && schema != null) agg[key] = schema;
    return agg;
  }, {} as Record<string, Joi.Schema>);

  // THIS WILL RE-ADD THE NESTED MODELS TO THE SCHEMA
  [{
    modelsArray: hasOneNestedModels,
    getModelFunc: getHasOneModel,
    isArray: false,
  }, {
    modelsArray: hasManyNestedModels,
    getModelFunc: getHasManyModel,
    isArray: true,
  }].forEach(({ modelsArray, getModelFunc, isArray }) => {
    for (const model of modelsArray) {
      const {
        model: ModelClass,
        opts,
      } = getModelFunc(target, model) || {};

      const schema = joiSchema(ModelClass.prototype);

      if (schema != null) {
        let finalSchema: Joi.ObjectSchema | Joi.ArraySchema = schema;
        if (isArray) {
          finalSchema = Joi.array().items(schema);
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

  if (Object.keys(joiKeys).length > 0) return joiObject.keys(joiKeys);
  return joiObject;
}

/** @internal */
export function validateAttributes(target: any, item: Record<string, any>, _throw: boolean = true) {
  const schema = joiSchema(target);

  const { value, error } = schema.validate(
    item,
    {
      abortEarly: false,
      convert: true,
      dateFormat: 'iso',
    },
  );

  if (_throw && error) throw error;
  return value;
}
