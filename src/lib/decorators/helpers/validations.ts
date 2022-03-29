import Joi from 'joi';
import _ from 'lodash';
import { getRelations } from '../reflections/relations';
import { getModelSchema, getPropertyValidate, getValidatedFields } from '../reflections/validations';

/** @internal */
function determineIfJoiObjectSchema(joi: Joi.Schema): joi is Joi.ObjectSchema {
  return joi?.type === 'object';
}

/** @internal */
function determineIfJoiArraySchema(joi: Joi.Schema): joi is Joi.ArraySchema {
  return joi?.type === 'array';
}

/** @internal */
export function joiSchemaKeys(target: any): Record<string, Joi.Schema> {
  const validatedKeys = getValidatedFields(target);
  const relations = getRelations(target, ['hasMany', 'hasOne']);

  return _.compact(
    _.uniq(
      [...validatedKeys, ...relations.map((rel) => rel.propertyName)],
    ),
  ).reduce((agg, key) => {
    let schema = getPropertyValidate(target, key);
    const relation = relations.find((rel) => rel.propertyName === key);

    if (relation) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      let relationSchema = joiSchema(relation.Model.prototype);
      if (relationSchema != null && relation.opts?.required && relation.type === 'hasOne') {
        relationSchema = relationSchema.required();
      }

      if (relationSchema) {
        if (relation.type === 'hasOne') {
          if (schema) {
            if (determineIfJoiObjectSchema(schema)) {
              schema = (schema as Joi.ObjectSchema).concat(relationSchema);
            } else {
              throw new Error('hasOne child relations validate should always be a Joi.object()');
            }
          } else schema = relationSchema;

          if (relation.opts?.required) schema = schema.required();
        } else if (relation.type === 'hasMany') {
          const arrayRelationSchema = Joi.array().items(relationSchema);
          if (schema) {
            if (determineIfJoiArraySchema(schema)) {
              schema = (schema as Joi.ArraySchema).concat(arrayRelationSchema);
            } else {
              throw new Error('hasMany children relations validate should always be a Joi.array()');
            }
          } else schema = arrayRelationSchema;

          if (relation.opts?.required) schema = (schema as Joi.ArraySchema).required().min(1);
        }
      }
    }

    if (schema != null) agg[key] = schema;
    return agg;
  }, {} as Record<string, Joi.Schema>);
}

/** @internal */
export function joiSchema(target: any): Joi.ObjectSchema {
  const joiObject = getModelSchema(target) || Joi.object().unknown(true);

  const joiKeys = joiSchemaKeys(target);

  if (Object.keys(joiKeys).length > 0) return joiObject.keys(joiKeys);
  return joiObject;
}

export type ValidateAttributesOptions = Joi.ValidationOptions & {
  throwError?: boolean;
};

export const defaultValidateOptions: Joi.ValidationOptions = {
  abortEarly: false,
  convert: true,
  dateFormat: 'iso',
};

/** @internal */
export function validateAttributes(target: any, item: Record<string, any>, opts?: ValidateAttributesOptions) {
  const {
    throwError = false,
    ...joiOptions
  } = opts || {};

  const schema = joiSchema(target);

  let { value, error } = schema.validate(
    item,
    {
      ...defaultValidateOptions,
      ...joiOptions,
    },
  );

  if (throwError && error != null) throw error;

  const ignoreInvalidChildRelationsKey = (getRelations(target) || [])
    .filter((rel) => {
      return ['hasOne', 'hasMany'].includes(rel.type);
    })
    .filter((rel) => rel.opts?.ignoredInvalid === true)
    .map((c) => c.propertyName);

  if (error) {
    for (const key of ignoreInvalidChildRelationsKey) {
      for (const detail of error.details) {
        if (detail.path[0] === key) {
          // CHECK IF ARRAY
          if (typeof detail.path[1] === 'number') {
            if (Array.isArray(value[key])) {
              (value[key] as any[]).splice(detail.path[1], 1);
            }
          } else {
            delete value[key];
          }
        }
      }
    }

    ({ value, error } = schema.validate(
      value,
      {
        ...defaultValidateOptions,
        ...joiOptions,
      },
    ));
  }

  return {
    value,
    error,
  };
}
