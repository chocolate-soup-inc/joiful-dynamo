import 'reflect-metadata';
import _ from 'lodash';
import { getProps } from './prop';
import { isObject } from '../utils/isObject';

const hasOneMetadataKey = Symbol('hasOne');
const hasOnePropertiesMetadataKey = Symbol('hasOneProperties');

type Constructor = { new(...args) };

type Options = {
  required?: boolean,
};

export function hasOne(ChildModel: Constructor, opts?: Options) {
  return (target: any, propertyKey: string): void => {
    // SET THE LIST OF MODELS
    Reflect.defineMetadata(hasOneMetadataKey, {
      model: ChildModel,
      opts,
    }, target, propertyKey);
    Reflect.defineMetadata(hasOneMetadataKey, {
      model: ChildModel,
      opts,
    }, target.constructor, propertyKey);

    let models: string[] = Reflect.getMetadata(hasOneMetadataKey, target);

    if (models) {
      models.push(propertyKey);
    } else {
      models = [propertyKey];
    }

    Reflect.defineMetadata(
      hasOneMetadataKey,
      models,
      target,
    );
    Reflect.defineMetadata(
      hasOneMetadataKey,
      models,
      target.constructor,
    );

    // SET THE LIST OF PROPERTIES
    const descriptors = getProps(ChildModel.prototype);
    const propertyMapping = descriptors.reduce((agg, key) => {
      agg[`${propertyKey}${_.capitalize(key)}`] = {
        entity: propertyKey,
        key,
        opts,
      };
      return agg;
    }, {} as Record<string, { entity: string, key: string, opts?: Options }>);

    for (const [key, value] of Object.entries(propertyMapping)) {
      Reflect.defineMetadata(
        hasOnePropertiesMetadataKey,
        value,
        target,
        key,
      );

      Reflect.defineMetadata(
        hasOnePropertiesMetadataKey,
        value,
        target.constructor,
        key,
      );
    }

    const currentKeys = Reflect.getMetadata(hasOnePropertiesMetadataKey, target) || [];

    Reflect.defineMetadata(
      hasOnePropertiesMetadataKey,
      currentKeys.concat(Object.keys(propertyMapping)),
      target,
    );

    Reflect.defineMetadata(
      hasOnePropertiesMetadataKey,
      currentKeys.concat(Object.keys(propertyMapping)),
      target.constructor,
    );
  };
}

export function getHasOneModels(target: any): string[] | undefined {
  return Reflect.getMetadata(hasOneMetadataKey, target);
}

export function getHasOneModel(target: any, propertyKey: string): {
  model: any,
  opts?: Options,
} {
  return Reflect.getMetadata(hasOneMetadataKey, target, propertyKey);
}

export function getHasOneProperties(target: any): string[] | undefined {
  return Reflect.getMetadata(hasOnePropertiesMetadataKey, target);
}

export function getHasOneProperty(target: any, propertyKey: string): { entity: string, key: string } {
  return Reflect.getMetadata(hasOnePropertiesMetadataKey, target, propertyKey) || {};
}

export function setHasOneDescriptors(target: any) {
  const modelsDescriptors = getHasOneModels(target);

  if (modelsDescriptors != null) {
    for (const model of modelsDescriptors) {
      const { model: ModelClass } = getHasOneModel(target, model);
      target[`_${model}`] = new ModelClass();

      Object.defineProperty(target, model, {
        get() {
          return target[`_${model}`];
        },
        set(v) {
          const targetModel = target[`_${model}`];
          if (isObject(v)) {
            if (targetModel == null) {
              target[`_${model}`] = new ModelClass(v);
            } else {
              for (const [key, value] of Object.entries(v)) {
                targetModel.setAttributeDescriptor(key);
                targetModel[key] = value;
              }
            }
          } else if (v instanceof ModelClass) target[`_${model}`] = v;
          else throw new TypeError(`${model} should be of type ${ModelClass.name}`);
        },
        configurable: false,
      });
    }
  }

  const modelPropertiesDescriptors = getHasOneProperties(target);
  if (modelsDescriptors != null && modelPropertiesDescriptors != null) {
    for (const property of modelPropertiesDescriptors) {
      const { entity, key } = getHasOneProperty(target, property);
      if (entity != null && key != null) {
        Object.defineProperty(target, property, {
          get() {
            return target[entity][key];
          },
          set(v) {
            target[entity][key] = v;
          },
          configurable: false,
        });
      }
    }
  }
}
