import { setPropGettersAndSetters } from '../properties/props';
import { addProp, PropOptions } from '../reflections/props';

/**
 * Sets the decorated property as a mapped property of the Entity setting its setters and getters (this is important for the attribute mapping for inserting in the database). Besides this, all the parameters initialized with the entity model will have the correct setters and getters. You can also set some properties as primaryKeys, secondaryKeys, createdAt or updatedAt.
 * @param {Object} [opts] - The list of options.
 * @param {boolean} [opts.primaryKey] - If true, the decorated property will be the entity Primary Key.
 * @param {boolean} [opts.secondary] - If true, the decorated property will be the entity Secondary Key.
 * @param {boolean} [opts.createdAt] - If true, the decorated property will be the entity created at field, being overwritten with the current date iso string when created.
 * @param {boolean} [opts.updatedAt] - If true, the decorated property will be the entity updated at field, being overwritten with the current date iso string when created or updated.
 * @example
 * ```
 * class Model extends Entity {
 *   @prop({ primaryKey: true })
 *   property1: string;
 *
 *   @prop({ secondaryKey: true })
 *   property2: string;
 *
 *   @prop({ createdAt: true })
 *   cAt: string;
 *
 *   @prop({ updatedAt: true })
 *   uAt: string;
 * }
 *
 * const model = new Model({
 *   property1: '1',
 *   property2: '2',
 *   cAt: '3',
 *   uAt: '4',
 *   extraAttribute: '5',
 * });
 *
 * console.log(model.property1) // '1'
 * console.log(model.property2) // '2'
 * console.log(model.cAt) // '3'
 * console.log(model.uAt) // '4'
 * console.log(model.extraAttribute) // '5'
 *
 * model.property1 = 'changed1';
 * console.log(model.property1) // 'changed1';
 *
 * model.property2 = 'changed2';
 * console.log(model.property2) // 'changed2';
 *
 * model.cAt = 'changed3';
 * console.log(model.cAt) // 'changed3';
 *
 * model.uAt = 'changed4';
 * console.log(model.uAt) // 'changed4';
 *
 * model.extraAttribute = 'changed5';
 * console.log(model.extraAttribute) // 'changed5';
 *
 * model.extraAttribute2 = 'changed6'; // ERROR: the setter does not exist!
 *
 * console.log(model._primaryKey) // 'property1';
 * console.log(model._secondaryKey) // 'property2';
 * console.log(model._createdAtKey) // 'cAt';
 * console.log(model._updatedAtKey) // 'uAt';
 *
 * model.create(); // In the database it will be saved like this: { property1: 'Model-changed1', property2: 'Model-changed2', cAt: '2022-02-07T16:16:44.975Z', uAt: '2022-02-07T16:16:44.975Z', extraAttribute: 'changed5' };
 * ```
 *
 * @category Property Decorators
 */
export function prop(opts?: PropOptions) {
  return (target: any, propertyName: string) => {
    // TARGET IS THE CLASS PROTOTYPE
    addProp(target, propertyName, opts);
    // setPropGettersAndSetters(target, propertyName, opts);
    setPropGettersAndSetters(target, propertyName);
  };
}
