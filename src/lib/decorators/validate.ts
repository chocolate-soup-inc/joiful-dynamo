import 'reflect-metadata';
import Joi from 'joi';
import { setPropGettersAndSetters } from './prop';
import { getHasOneModel, getHasOneModels } from './hasOne';

const validateMetadataKey = Symbol('validate');

export function validate(joi: Joi.Schema) {
  return (target: any, propertyKey: string): void => {
    // ADD THE JOI SCHEMA TO THE METADATA
    Reflect.defineMetadata(validateMetadataKey, joi, target, propertyKey);
    Reflect.defineMetadata(validateMetadataKey, joi, target.constructor, propertyKey);

    setPropGettersAndSetters(target, propertyKey);

    // SET THE LIST OF VALIDATED PROPERTIES IN THE INSTANCE
    let properties: string[] = Reflect.getMetadata(validateMetadataKey, target);

    if (properties) {
      properties.push(propertyKey);
    } else {
      properties = [propertyKey];
      Reflect.defineMetadata(validateMetadataKey, properties, target);
    }

    Reflect.defineMetadata(validateMetadataKey, properties, target.constructor);
  };
}

export const getValidatedFields = (target: any): string[] => {
  return Reflect.getMetadata(validateMetadataKey, target);
};

export const getPropertyValidate = (target: any, key: string): Joi.Schema => {
  return Reflect.getMetadata(validateMetadataKey, target, key);
};

export function joiSchema(target: any) {
  const keys = getValidatedFields(target);
  const joiObject = Joi.object().unknown(true);

  let joiKeys = {};
  const modelsDescriptors = getHasOneModels(target);
  if (keys != null && keys.length > 0) {
    joiKeys = keys.reduce((agg, key: string) => {
      if (!modelsDescriptors?.includes(key)) {
        agg[key] = getPropertyValidate(target, key);
      }
      return agg;
    }, {} as Record<string, Joi.Schema>);
  }

  if (modelsDescriptors != null) {
    for (const model of modelsDescriptors) {
      const {
        model: ModelClass,
        opts,
      } = getHasOneModel(target, model);
      let modelJoiObject = ModelClass.joiSchema;
      if (opts && opts.required) {
        modelJoiObject = modelJoiObject.required();
      }
      joiKeys[model] = modelJoiObject;
    }
  }

  return joiObject.keys(joiKeys);
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
