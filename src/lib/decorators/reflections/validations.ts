import 'reflect-metadata';
import Joi from 'joi';

import {
  FIELD_VALIDATION_MAP_KEY,
  MODEL_VALIDATION_MAP_KEY,
} from './metadataKeys';

/** @internal */
export const getValidatedFields = (target: any): string[] => {
  return Reflect.getMetadata(FIELD_VALIDATION_MAP_KEY, target) || [];
};

/** @internal */
export const getPropertyValidate = (target: any, key: string): Joi.Schema | undefined => {
  return Reflect.getMetadata(FIELD_VALIDATION_MAP_KEY, target, key);
};

/** @internal */
export const addValidatedField = (target: any, field: string, joi: Joi.Schema): void => {
  const currentValidatedFields = getValidatedFields(target);

  if (!currentValidatedFields.includes(field)) {
    currentValidatedFields.push(field);
  }

  Reflect.defineMetadata(FIELD_VALIDATION_MAP_KEY, currentValidatedFields, target);
  Reflect.defineMetadata(FIELD_VALIDATION_MAP_KEY, joi, target, field);
};

/** @internal */
export const getModelSchema: (target: any) => Joi.ObjectSchema | undefined = (target) => {
  return Reflect.getMetadata(MODEL_VALIDATION_MAP_KEY, target);
};

/** @internal */
export const setModelSchema = (target: any, joi: Joi.Schema) => {
  if (joi.describe().type === 'object') {
    Reflect.defineMetadata(MODEL_VALIDATION_MAP_KEY, joi, target);
  } else {
    throw new Error('Model level validate should always be a Joi.object()');
  }
};
