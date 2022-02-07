import 'reflect-metadata';
import _ from 'lodash';
import Joi from 'joi';
import { getAliasesMap } from './aliases';
import { Constructor, RelationModel, RelationOptions } from './decoratorTypes';
import { setPropGettersAndSetters } from './prop';

export const hasOneMetadataKey = 'hasOne';
const hasOnePropertiesMetadataKey = 'hasOneProperties';

export function getHasOneModels(target: any): string[] | undefined {
  return Reflect.getMetadata(hasOneMetadataKey, target);
}

export function getHasOneModel(target: any, propertyKey: string): RelationModel {
  return Reflect.getMetadata(hasOneMetadataKey, target, propertyKey);
}

export function getHasOneNestedModels(target: any): string[] {
  const models: string[] = getHasOneModels(target) || [];

  return models.filter((model) => {
    const {
      opts,
    } = getHasOneModel(target, model) || {};

    return opts?.nestedObject;
  });
}

export function getHasOneNotNestedModels(target: any): string[] {
  const models: string[] = getHasOneModels(target) || [];

  return models.filter((model) => {
    const {
      opts,
    } = getHasOneModel(target, model) || {};

    return !opts?.nestedObject;
  });
}

export function getHasOneProperties(target: any): string[] | undefined {
  return Reflect.getMetadata(hasOnePropertiesMetadataKey, target);
}

export function getHasOneProperty(target: any, propertyKey: string): { entity: string, key: string } {
  return Reflect.getMetadata(hasOnePropertiesMetadataKey, target, propertyKey) || {};
}

export function setHasOneDescriptor(target: any, modelName: string, ChildModel: Constructor) {
  const propertyKey = `_${hasOneMetadataKey}_${modelName}`;

  Object.defineProperty(target, modelName, {
    get() {
      if (this[propertyKey] == null) this[propertyKey] = new ChildModel();
      return this[propertyKey];
    },
    set(value) {
      if (value instanceof ChildModel) {
        this[propertyKey] = value;
      } else {
        Joi.assert(
          value,
          Joi.object().unknown(true),
        );

        this[propertyKey] = new ChildModel(value);
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

export function setHasOnePropertiesDescriptor(target: any, modelName: string, ChildModel: Constructor) {
  const propDescriptors = Object.keys(ChildModel.prototype);
  const aliasDescriptors = Object.keys(getAliasesMap(ChildModel.prototype));

  const descriptors = propDescriptors.concat(aliasDescriptors);

  descriptors.forEach((key) => {
    const propertyKey = `${modelName}${_.capitalize(key)}`;

    Object.defineProperty(target, propertyKey, {
      get() {
        if (this[modelName]) return this[modelName][key];
        return undefined;
      },
      set(value) {
        if (this[modelName] == null) {
          this[modelName] = new ChildModel({
            [key]: value,
          });
        } else {
          this[modelName][key] = value;
        }
      },
      configurable: false,
    });
  });
}

export function hasOne(ChildModel: Constructor, opts?: RelationOptions) {
  return (target: any, propertyKey: string): void => {
    // SET THE LIST OF MODELS
    Reflect.defineMetadata(hasOneMetadataKey, {
      model: ChildModel,
      opts,
    }, target, propertyKey);

    if (opts?.foreignKey) {
      setPropGettersAndSetters(target, opts?.foreignKey);
    }

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

    setHasOneDescriptor(target, propertyKey, ChildModel);
    setHasOnePropertiesDescriptor(target, propertyKey, ChildModel);
  };
}

export function transformHasOneAttributes(target: any, item: Record<string, any>) {
  const finalAttributes = _.cloneDeep(item);

  const nestedModels: string[] = getHasOneNestedModels(target) || [];

  for (const model of nestedModels) {
    delete finalAttributes[model];

    if (item[model] != null) {
      const {
        model: ModelClass,
      } = getHasOneModel(target, model) || {};

      let instance = item[model];
      if (!(item[model] instanceof ModelClass)) {
        instance = new ModelClass(item[model]);
      }

      if (Object.keys(instance.attributes).length > 0) {
        finalAttributes[model] = instance.attributes;
      }
    }
  }

  const notNestedModels: string[] = getHasOneNotNestedModels(target) || [];
  for (const model of notNestedModels) {
    delete finalAttributes[model];
  }

  return finalAttributes;
}
