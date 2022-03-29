import {
  addRelationDescriptor,
  setHasOnePropertiesDescriptor,
} from '../properties/relations';

import {
  addRelation,
  RelationOpts,
} from '../reflections/relations';

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
export function hasOne(ChildModel: any, opts?: RelationOpts) {
  return (target: any, propertyName: string): void => {
    addRelation(target, 'hasOne', propertyName, ChildModel, opts);

    addRelationDescriptor({
      target,
      type: 'hasOne',
      propertyName,
      ChildModel,
      foreignKey: opts?.foreignKey,
    });

    setHasOnePropertiesDescriptor(target, propertyName, ChildModel);
  };
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
export function hasMany(ChildModel: any, opts?: RelationOpts) {
  return (target: any, propertyName: string): void => {
    addRelation(target, 'hasMany', propertyName, ChildModel, opts);

    // if (opts?.foreignKey) setForeignKeyGettersAndSetters(target, opts?.foreignKey);

    addRelationDescriptor({
      target,
      type: 'hasMany',
      propertyName,
      ChildModel,
      foreignKey: opts?.foreignKey,
    });
  };
}
