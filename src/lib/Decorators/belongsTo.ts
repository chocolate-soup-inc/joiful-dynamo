import Joi from 'joi';
import 'reflect-metadata';
import {
  Constructor,
  HasRelationOptions,
  relationDescriptor,
  RelationDescriptors,
} from './relationHelpers';

const belongsToMetadataKey = 'belongsTo';

export function getBelongsToModels(target: any) {
  return Reflect.getMetadata(belongsToMetadataKey, target) || [];
}

export function getBelongsToModel(target: any, propertyKey: string) {
  return Reflect.getMetadata(belongsToMetadataKey, target, propertyKey);
}

export function getHasFromBelong(target: any, foreignKey: string, indexName: string, parentPropertyOnChild?: string) {
  return Reflect.getMetadata(belongsToMetadataKey, target, `${foreignKey}${indexName}${parentPropertyOnChild || ''}`);
}

export function setBelongsTo(target: any, ChildModel: Constructor, propertyKey: string, type: 'hasMany' | 'hasOne', opts: HasRelationOptions = {}) {
  if (opts?.foreignKey && opts?.indexName) {
    Reflect.defineMetadata(belongsToMetadataKey, {
      indexName: opts?.indexName,
      foreignKey: opts?.foreignKey,
      parentPropertyOnChild: opts?.parentPropertyOnChild,
      parent: target.constructor,
      child: ChildModel,
      propertyKey,
      type,
    }, ChildModel.prototype, `${opts.foreignKey}${opts.indexName}${opts?.parentPropertyOnChild || ''}`);

    if (opts?.parentPropertyOnChild) {
      Reflect.defineMetadata(belongsToMetadataKey, {
        model: target.constructor,
        opts,
      }, ChildModel.prototype, opts?.parentPropertyOnChild);
    }

    const modelProperties: RelationDescriptors = Reflect.getMetadata(relationDescriptor, ChildModel.prototype) || [];

    modelProperties.push({
      model: target.constructor,
      opts,
      type: 'belongsTo',
      initializer: target.initialize,
    });

    Reflect.defineMetadata(relationDescriptor, modelProperties, ChildModel.prototype);

    if (opts?.parentPropertyOnChild) {
      let belongsToModels: string[] = Reflect.getMetadata(belongsToMetadataKey, ChildModel.prototype);

      if (belongsToModels) {
        belongsToModels.push(opts?.parentPropertyOnChild);
      } else {
        belongsToModels = [opts?.parentPropertyOnChild];
      }

      Reflect.defineMetadata(belongsToMetadataKey, belongsToModels, ChildModel.prototype);
    }
  }

  if (opts?.parentPropertyOnChild) {
    const instancePropertyKey = `_${belongsToMetadataKey}_${opts?.parentPropertyOnChild}`;

    Object.defineProperty(ChildModel.prototype, opts.parentPropertyOnChild, {
      get() {
        if (this[instancePropertyKey] == null) this[instancePropertyKey] = new target.constructor();
        return this[instancePropertyKey];
      },
      set(value) {
        if (value instanceof target.constructor) {
          this[instancePropertyKey] = value;
        } else {
          Joi.assert(
            value,
            Joi.object().unknown(true),
          );

          this[instancePropertyKey] = new target.constructor(value);
        }
      },
      enumerable: false,
      configurable: false,
    });
  }
}
