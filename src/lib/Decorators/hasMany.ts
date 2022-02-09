import Joi from 'joi';
import _ from 'lodash';
import 'reflect-metadata';
import { Constructor, RelationModel, RelationOptions } from './decoratorTypes';
import { setPropGettersAndSetters } from './prop';

const hasManyMetadataKey = 'hasMany';

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
              Joi.assert(
                item,
                Joi.object().unknown(true),
              );
            }

            this[propertyKey] = value.map((v) => new ChildModel(v));
          } catch (error) {
            throw new TypeError(`Array contain invalid items. All items must be an instance of ${ChildModel.name}`);
          }
        } else {
          this[propertyKey] = value;
        }
      } else {
        throw new TypeError(`Value must be an array of instances of ${ChildModel.name}`);
      }
    },
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(target, `_noInitializer${_.capitalize(modelName)}`, {
    get() {
      return this[propertyKey];
    },
    enumerable: false,
    configurable: false,
  });
}

export function hasMany(ChildModel: Constructor, opts?: RelationOptions) {
  return (target: any, propertyKey: string): void => {
    Reflect.defineMetadata(hasManyMetadataKey, {
      model: ChildModel,
      opts,
    }, target, propertyKey);

    if (opts?.foreignKey) {
      setPropGettersAndSetters(target, opts?.foreignKey);
    }

    let models: string[] = Reflect.getMetadata(hasManyMetadataKey, target);

    if (models) {
      models.push(propertyKey);
    } else {
      models = [propertyKey];
    }

    Reflect.defineMetadata(
      hasManyMetadataKey,
      models,
      target,
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
      if (Array.isArray(item[model]) && item[model].length > 0) {
        finalAttributes[model] = item[model].map((value) => {
          const {
            model: ModelClass,
          } = getHasManyModel(target, model) || {};

          if (value instanceof ModelClass) return value.attributes;

          // VALUE IS AN OBJECT
          const instance = new ModelClass(model);
          return instance.attributes;
        });
      } else {
        delete finalAttributes[model];
      }
    }
  }

  const notNestedModels: string[] = getHasManyNotNestedModels(target) || [];
  for (const model of notNestedModels) {
    delete finalAttributes[model];
  }

  return finalAttributes;
}
