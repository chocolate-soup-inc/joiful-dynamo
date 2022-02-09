import 'reflect-metadata';
import _ from 'lodash';
import Joi from 'joi';
import { getAliasesMap } from './aliases';
import {
  Constructor,
  relationDescriptor,
  RelationDescriptors,
  RelationModel,
  HasRelationOptions,
} from './relationHelpers';
import { setPropGettersAndSetters } from './prop';
import { setBelongsTo } from './belongsTo';

const hasOneMetadataKey = 'hasOne';
const hasOnePropertiesMetadataKey = 'hasOneProperties';

/** @internal */
export function getHasOneModels(target: any): string[] | undefined {
  return Reflect.getMetadata(hasOneMetadataKey, target);
}

/** @internal */
export function getHasOneModel(target: any, propertyKey: string): RelationModel {
  return Reflect.getMetadata(hasOneMetadataKey, target, propertyKey);
}

/** @internal */
export function getHasOneNestedModels(target: any): string[] {
  const models: string[] = getHasOneModels(target) || [];

  return models.filter((model) => {
    const {
      opts,
    } = getHasOneModel(target, model) || {};

    return opts?.nestedObject;
  });
}

/** @internal */
export function getHasOneNotNestedModels(target: any): string[] {
  const models: string[] = getHasOneModels(target) || [];

  return models.filter((model) => {
    const {
      opts,
    } = getHasOneModel(target, model) || {};

    return !opts?.nestedObject;
  });
}

/** @internal */
export function getHasOneProperties(target: any): string[] | undefined {
  return Reflect.getMetadata(hasOnePropertiesMetadataKey, target);
}

/** @internal */
export function getHasOneProperty(target: any, propertyKey: string): { entity: string, key: string } {
  return Reflect.getMetadata(hasOnePropertiesMetadataKey, target, propertyKey) || {};
}

/** @internal */
export function setHasOneDescriptor(
  target: any,
  modelName: string,
  ChildModel: Constructor,
) {
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

/** @internal */
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

/**
 * Sets the decorated property as another entity.
 * @param {Entity} ChildModel - The class of which the property should be an instance of. This class needs to extend the Entity class.
 * @param {Object} [opts] - The options to configure the relation.
 * @param {boolean} [opts.required] - If set to true, the validation method will check if the child is undefined, and if it is will throw a ValidationError.
 * @param {boolean} [opts.nestedObject] - If set to true, the attributes will be nested to the parent model. If set to false, the child model will be another record in the database, meaning that when you save the parent model, the child model gets saved as a separate record in the database.
 * @param {string} [opts.foreignKey] - The foreign key property from the child. If this variable is set, the child property will be set to the parent model entity type + its id. It will also set the parent with this same column and value, helping future index queries.
 * @param {string} [opts.indexName] - If the foreign key is set, this indexName is used by some methods to query the relations.
 * @param {string} [opts.parentPropertyOnChild] - Set a reference in the child so it can access the parent correctly. Right now, this is only set in load / getItem with includedRelated set. - Needs improvements to be set everywhere. Also, validations do not apply for parents.
 * @remarks
 *
 * - Besides validations and setting the child instance, it also creates getters and setters for all child instances in the parent. Look example for more details.
 * - When the hasOne is set on the parent with a foreignKey AND indexName, automatically, when querying the child with related records, it will bring the parent record too.
 * @example
 * ```
 * import * as Joi from 'joi';
 *
 * class ChildModel extends Entity {
 *   @prop()
 *   @validate(Joi.string().required())
 *   pk: string;
 *
 *   @prop()
 *   sk: string;
 *
 *   @prop()
 *   fk: string;
 * }
 *
 * class ParentModel extends Entity {
 *   @prop({ primaryKey: true })
 *   pk: string;
 *
 *   @hasOne(ChildModel, { nestedObject: true, required: true })
 *   child1: ChildModel;
 *
 *   @hasOne(ChildModel, { nestedObject: false, required: false, foreignKey: 'fk' })
 *   child2: ChildModel;
 * }
 *
 * const parent = new ParentModel({
 *   pk: '1',
 *   child1: {
 *     pk: 'pk-from-child-1',
 *     sk: 'sk-from-child-1',
 *   },
 *   child2Sk: 'sk-from-child-2',
 * });
 *
 * console.log(parent.child1.pk) // 'pk-from-child-1'
 * console.log(parent.child1.sk) // 'sk-from-child-1'
 * console.log(parent.child1Pk) // 'pk-from-child-1'
 * console.log(parent.child1Sk) // 'sk-from-child-1'
 *
 * console.log(parent.child2.pk) // undefined
 * console.log(parent.child2.sk) // 'sk-from-child-2'
 * console.log(parent.child2Pk) // undefined
 * console.log(parent.child2Sk) // 'sk-from-child-2'
 *
 * parent.child2.pk = 'pk-from-child-2';
 *
 * console.log(parent.child2.pk) // 'pk-from-child-2'
 * console.log(parent.child2.sk) // 'sk-from-child-2'
 * console.log(parent.child2Pk) // 'pk-from-child-2'
 * console.log(parent.child2Sk) // 'sk-from-child-2'
 *
 * console.log(parent.transformedAttributes) // { child1: { pk: 'pk-from-child-1', sk: 'sk-from-child-1' } } # The child2 does not appear in the attributes because it will become a new record.
 *
 * console.log(parent.valid) // false # As child 2 is invalid, parent is invalid also.
 *
 * model.child2 = undefined;
 *
 * console.log(parent.valid) // true # As child 2 is not required, parent is valid.
 *
 * model.child1 = undefined;
 *
 * console.log(parent.valid) // false # As child 1 is required, the parent is invalid.
 *
 * parent.create() // This will insert 2 records in the database. The parent and the child 2. Both will have the property fk set to 'ParentModel-1'
 * ```
 *
 * @category Property Decorators
 */
export function hasOne(ChildModel: Constructor, opts?: HasRelationOptions) {
  return (target: any, propertyKey: string): void => {
    Reflect.defineMetadata(hasOneMetadataKey, {
      model: ChildModel,
      opts,
    }, target, propertyKey);

    const modelProperties: RelationDescriptors = Reflect.getMetadata(relationDescriptor, target) || [];

    modelProperties.push({
      model: ChildModel,
      opts,
      propertyKey,
      type: 'hasOne',
    });

    Reflect.defineMetadata(relationDescriptor, modelProperties, target);

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

    setBelongsTo(target, ChildModel, propertyKey, 'hasOne', opts);

    setHasOneDescriptor(target, propertyKey, ChildModel);
    setHasOnePropertiesDescriptor(target, propertyKey, ChildModel);
  };
}

/** @internal */
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
