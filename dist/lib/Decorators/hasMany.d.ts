import 'reflect-metadata';
import { Constructor, RelationModel, HasRelationOptions } from './relationHelpers';
/** @internal */
export declare function getHasManyModels(target: any): string[] | undefined;
/** @internal */
export declare function getHasManyModel(target: any, propertyKey: string): RelationModel;
/** @internal */
export declare function getHasManyNestedModels(target: any): string[];
/** @internal */
export declare function getHasManyNotNestedModels(target: any): string[];
/** @internal */
export declare function setHasManyDescriptor(target: any, modelName: string, ChildModel: Constructor): void;
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
export declare function hasMany(ChildModel: Constructor, opts?: HasRelationOptions): (target: any, propertyKey: string) => void;
/** @internal */
export declare function transformHasManyAttributes(target: any, item: Record<string, any>): Record<string, any>;
