import Joi from 'joi';
import _ from 'lodash';
import 'reflect-metadata';
import {
  Constructor,
  relationDescriptor,
  RelationDescriptors,
  RelationModel,
  HasRelationOptions,
  addForeignKey,
  addParentForeignKey,
} from './relationHelpers';
import { setPropGettersAndSetters } from './prop';
import { setBelongsTo } from './belongsTo';

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

/**
 * Sets the decorated property an array of another entity.
 * @param {Entity[]} ChildModel - The class of which the property should be an array of instances of. This class needs to extend the Entity class.
 * @param {Object} [opts] - The options to configure the relation.
 * @param {boolean} [opts.required] - If set to true, the validation method will check if the children is undefined or with length 0, and if it is will throw a ValidationError.
 * @param {boolean} [opts.nestedObject] - If set to true, the attributes will be nested to the parent model. If set to false, the children models will be saved as new records in the database.
 * @param {string} [opts.foreignKey] - The foreign key property from the children. If this variable is set, each of the children records will have the parent model entity type + its id as the foreignKey column. It will also set the parent with this same column and value, helping future index queries.
 * @param {string} [opts.indexName] - If the foreign key is set, this indexName is used by some methods to query the relations.
 * @param {string} [opts.parentPropertyOnChild] - Set a reference in the child so it can access the parent correctly. Right now, this is only set in load / getItem with includedRelated set. - Needs improvements to be set everywhere. Also, validations do not apply for parents.
 * @remarks
 *
 * - When the hasMany is set on the parent with a foreignKey AND indexName, automatically, when querying the child with related records, it will bring the parent record too.
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
 *   @hasMany(ChildModel, { nestedObject: false, required: true, foreignKey: 'fk', indexName: 'byFK' })
 *   children: ChildModel[];
 * }
 *
 * const parent = new ParentModel({
 *   pk: '1',
 * });
 *
 * console.log(parent.children) // []
 *
 * console.log(parent.valid) // false # As children is set as required, it is invalid as it has no children now..
 *
 * parent.children = [new ChildModel({
 *   pk: 'pk-from-child-1',
 *   sk: 'sk-from-child-1',
 * }), new ChildModel({
 *   sk: 'sk-from-child-2',
 * })]
 *
 * console.log(parent.children[0].pk) // 'pk-from-child-1'
 * console.log(parent.children[0].sk) // 'sk-from-child-1'
 *
 * console.log(parent.children[1].pk) // undefined
 * console.log(parent.children[1].sk) // 'sk-from-child-2'
 *
 * console.log(parent.valid) // false # As the second child is invalid, parent is also invalid.
 *
 * parent.children[1].pk = 'pk-from-child-2';
 *
 * console.log(parent.children[1].pk) // 'pk-from-child-2'
 * console.log(parent.children[1].sk) // 'sk-from-child-2'
 *
 * console.log(parent.transformedAttributes) // # The children attributes do not appear in the attributes because they will become new records.
 *
 * console.log(parent.valid) // true # As now all children are valid, the parent is also valid.
 *
 * parent.create() // This will insert 3 records in the database. The parent and each of the children. All of them will have fk column set to 'ParentModel-1'
 * ```
 *
 * @category Property Decorators
 */
export function hasMany(ChildModel: Constructor, opts?: HasRelationOptions) {
  return (target: any, propertyKey: string): void => {
    Reflect.defineMetadata(hasManyMetadataKey, {
      model: ChildModel,
      opts,
    }, target, propertyKey);

    const modelProperties: RelationDescriptors = Reflect.getMetadata(relationDescriptor, target) || [];

    modelProperties.push({
      model: ChildModel,
      opts,
      propertyKey,
      type: 'hasMany',
    });

    Reflect.defineMetadata(relationDescriptor, modelProperties, target);

    Reflect.defineMetadata(hasManyMetadataKey, {
      model: ChildModel,
      opts,
      propertyKey,
    }, target, `_hasMany_${ChildModel.name}`);

    if (opts?.foreignKey) {
      addForeignKey(target, opts?.foreignKey);
      addParentForeignKey(ChildModel.prototype, opts?.foreignKey, target._entityName);
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

    setBelongsTo(target, ChildModel, propertyKey, 'hasMany', opts);

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
