import Entity, {
  EntityAttributeConfig,
  EntityAttributes,
  EntityConstructor,
} from 'dynamodb-toolbox/dist/classes/Entity';
import { DynamoDBTypes } from 'dynamodb-toolbox/dist/classes/Table';
import * as Joi from 'joi';
import createJDModel from './createJDModel';
import { isObject } from './utils';

export interface JoifulEntityAttributeConfig extends EntityAttributeConfig {
  validate?: Joi.SchemaLike | Joi.SchemaLike[];
  aliases?: string | string[];
}

export declare type JoifulEntityCompositeAttributes = [
  string,
  number,
  (DynamoDBTypes | JoifulEntityAttributeConfig)?,
];

export interface JoifulEntityAttributes {
  [attr: string]:
  | DynamoDBTypes
  | JoifulEntityAttributeConfig
  | JoifulEntityCompositeAttributes;
}

export interface JoifulEntityConstructor extends EntityConstructor {
  attributes: JoifulEntityAttributes;
  beforeValidate?: (attributes: Record<string, any>) => Record<string, any>;
  joiExtensions?: (joi: Joi.ObjectSchema) => Joi.ObjectSchema;
}

const parseAttributeOptions = (
  options: DynamoDBTypes | JoifulEntityAttributeConfig,
): {
  options: DynamoDBTypes | EntityAttributeConfig;
  validate?: Joi.SchemaLike | Joi.SchemaLike[];
  aliases?: string | string[];
} => {
  if (typeof options === 'string' || !isObject(options)) return { options };

  const {
    aliases,
    validate,
    ...entityOptions
  } = options;

  return {
    aliases,
    validate,
    options: entityOptions,
  };
};

const parseOptions = (
  attributes: JoifulEntityAttributes,
): {
  attributesAliases?: Record<string, string | string[]>;
  joiAttributeDefinitions: Record<string, Joi.SchemaLike | Joi.SchemaLike[]>;
  dynamoAttributeDefinitions: EntityAttributes;
} => {
  const joiAttributeDefinitions: Record<string, Joi.SchemaLike | Joi.SchemaLike[]> = {};
  const dynamoAttributeDefinitions: EntityAttributes = {};

  const attributesAliases: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string') {
      dynamoAttributeDefinitions[key] = value;
    } else {
      let parsed;
      if (Array.isArray(value)) {
        parsed = parseAttributeOptions(value[2]);
      } else if (isObject(value)) {
        parsed = parseAttributeOptions(value);
      }

      const { validate, options, aliases } = parsed;

      attributesAliases[key] = aliases;

      if (validate) joiAttributeDefinitions[key] = validate;
      if (Array.isArray(value)) {
        dynamoAttributeDefinitions[key] = [value[0], value[1], options];
      } else {
        dynamoAttributeDefinitions[key] = options;
      }
    }
  }

  return {
    joiAttributeDefinitions,
    dynamoAttributeDefinitions,
    attributesAliases,
  };
};

function createEntity(params: JoifulEntityConstructor) {
  const {
    joiAttributeDefinitions,
    dynamoAttributeDefinitions,
    attributesAliases,
  } = parseOptions(params.attributes);

  const {
    beforeValidate,
    joiExtensions = (joi) => joi,
    ...restParams
  } = params;

  if (this.entities) {
    const entity = new Entity({
      table: this.table,
      ...restParams,
      attributes: dynamoAttributeDefinitions,
    });

    let joi = Joi.object();
    for (const [key, value] of Object.entries(attributesAliases)) {
      if (Array.isArray(value)) {
        for (const name of value) {
          joi = joi.rename(name, key, {
            multiple: true,
            override: true,
          });
        }
      } else if (typeof value === 'string') {
        joi = joi.rename(value, key, {
          multiple: true,
          override: true,
        });
      }
    }

    joi = joi.keys(joiAttributeDefinitions).unknown(true);
    joi = joiExtensions(joi);

    const model = createJDModel(entity, joi, attributesAliases, beforeValidate);
    this.entities[params.name] = {
      entity,
      joi,
      model,
    };

    return {
      entity,
      joi,
      model,
    };
  }

  throw new Error('entites array is not set.');
}

export default createEntity;
