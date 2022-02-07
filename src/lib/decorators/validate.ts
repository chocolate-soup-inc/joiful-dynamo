import 'reflect-metadata';
import Joi from 'joi';
import { getHasOneModel, getHasOneNestedModels, getHasOneNotNestedModels } from './hasOne';
import { getHasManyModel, getHasManyNestedModels, getHasManyNotNestedModels } from './hasMany';

const validateMetadataKey = Symbol('validate');

export const getValidatedFields = (target: any): string[] => {
  return Reflect.getMetadata(validateMetadataKey, target) || [];
};

export const getPropertyValidate = (target: any, key: string): Joi.Schema | undefined => {
  return Reflect.getMetadata(validateMetadataKey, target, key);
};

export function validate(joi: Joi.Schema) {
  return (target: any, propertyKey: string): void => {
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
  };
}

export function joiSchema(target: any) {
  const validatedKeys = getValidatedFields(target);
  const joiObject = Joi.object().unknown(true);

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
  }, {
    modelsArray: hasManyNestedModels,
    getModelFunc: getHasManyModel,
  }].forEach(({ modelsArray, getModelFunc }) => {
    for (const model of modelsArray) {
      const {
        model: ModelClass,
        opts,
      } = getModelFunc(target, model) || {};

      let schema = joiSchema(ModelClass.prototype);
      if (schema != null) {
        if (opts && opts.required) {
          schema = schema.required();
        }

        joiKeys[model] = schema;
      }
    }
  });

  if (Object.keys(joiKeys).length > 0) return joiObject.keys(joiKeys);
  return joiObject;
}

export function validateAttributes(target: any, item: Record<string, any>) {
  const schema = joiSchema(target);

  const { value, error } = schema.validate(
    item,
    {
      abortEarly: false,
      convert: true,
      dateFormat: 'iso',
    },
  );

  if (error) throw error;
  return value;
}
