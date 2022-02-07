import Joi from 'joi';
import _ from 'lodash';
import 'reflect-metadata';
import { Constructor, RelationModel, RelationOptions } from './decoratorTypes';

const hasManyMetadataKey = Symbol('hasMany');

/** @internal */
export function getHasManyModels(target: any): string[] | undefined {
  return Reflect.getMetadata(hasManyMetadataKey, target);
}

/** @internal */
export function getHasManyModel(target: any, propertyKey: string): RelationModel {
  return Reflect.getMetadata(hasManyMetadataKey, target, propertyKey);
}

/** @internal */
export function getHasManyNestedModels(target: any): string[] {
  const models: string[] = getHasManyModels(target) || [];

  return models.filter((model) => {
    const {
      opts,
    } = getHasManyModel(target, model) || {};

    return opts?.nestedObject;
  });
}

/** @internal */
export function getHasManyNotNestedModels(target: any): string[] {
  const models: string[] = getHasManyModels(target) || [];

  return models.filter((model) => {
    const {
      opts,
    } = getHasManyModel(target, model) || {};

    return !opts?.nestedObject;
  });
}

/** @internal */
export function setHasManyDescriptor(
  target: any,
  modelName: string,
  ChildModel: Constructor,
) {
  const propertyKey = `_${hasManyMetadataKey.toString()}_${modelName}`;
  if (target[propertyKey] == null) target[propertyKey] = [];

  Object.defineProperty(target, modelName, {
    get() {
      return target[propertyKey];
    },
    set(value) {
      try {
        Joi.assert(
          value,
          Joi
            .array()
            .items(
              Joi
                .any()
                .custom((v) => (v instanceof ChildModel)),
            ),
        );

        target[propertyKey] = value;
      } catch (error) {
        Joi.assert(
          value,
          Joi
            .array()
            .items(
              Joi
                .object()
                .unknown(true),
            ),
        );
      }

      target[propertyKey] = value.map((v) => new ChildModel(v));
    },
    enumerable: true,
    configurable: false,
  });
}

export function hasMany(ChildModel: Constructor, opts?: RelationOptions) {
  return (target: any, propertyKey: string): void => {
    const reflectTarget = target.constructor;
    Reflect.defineMetadata(hasManyMetadataKey, {
      model: ChildModel,
      opts,
    }, reflectTarget, propertyKey);

    let models: string[] = Reflect.getMetadata(hasManyMetadataKey, reflectTarget);

    if (models) {
      models.push(propertyKey);
    } else {
      models = [propertyKey];
    }

    Reflect.defineMetadata(
      hasManyMetadataKey,
      models,
      reflectTarget,
    );

    setHasManyDescriptor(target, propertyKey, ChildModel);
  };
}

/** @internal */
export function transformHasManyAttributes(target: any, item: Record<string, any>) {
  const finalAttributes = _.cloneDeep(item);

  const nestedModels: string[] = getHasManyNestedModels(target) || [];
  for (const model of nestedModels) {
    if (item[model] != null) {
      finalAttributes[model] = item[model].map((value) => {
        const {
          model: ModelClass,
        } = getHasManyModel(target, model) || {};

        if (value instanceof ModelClass) return value.attributes;

        // VALUE IS AN OBJECT
        const instance = new ModelClass(model);
        return instance.attributes;
      });
    }
  }

  const notNestedModels: string[] = getHasManyNotNestedModels(target) || [];
  for (const model of notNestedModels) {
    delete finalAttributes[model];
  }

  return finalAttributes;
}
