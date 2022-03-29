import { setAliasDescriptor } from '../properties/aliases';
import { setPropGettersAndSetters } from '../properties/props';
import { addAliasForProperty } from '../reflections/aliases';

/**
 * Sets the decorated property as an alias of another property.
 * @param {string} aliasToName - The name of the prop to which this prop should be an alias of.
 * @remarks
 *
 * Once the aliasTo decorator is set on an Entity Class model property, the instance, the setters and getters will be set and both variables will be linked.
 * @example
 * ```
 * class Model extends Entity {
 *    myProperty number;
 *
 *    @aliasTo('myProperty')
 *    aliasProperty: number;
 * }
 *
 * const model = new Model({
 *    aliasProperty: 1;
 * })
 *
 * console.log(model.myProperty) // 1
 * console.log(model.aliasProperty) // 1
 *
 * model.myProperty = 2;
 *
 * console.log(model.myProperty) // 2
 * console.log(model.aliasProperty) // 2
 *
 * model.aliasProperty = 3;
 *
 * console.log(model.myProperty) // 3
 * console.log(model.aliasProperty) // 3
 * ```
 *
 * @category Property Decorators
 */
export function aliasTo(propertyName: string) {
  return (target: any, alias: string): void => {
    // TARGET IS THE CLASS PROTOTYPE
    addAliasForProperty(target, propertyName, alias);
    setPropGettersAndSetters(target, propertyName);
    setAliasDescriptor(target, alias, propertyName);
  };
}

/**
 * Sets a list of aliases for the decorated property.
 * @param {string[]} aliasesNames - A list of aliases for the current property.
 * @remarks
 *
 * Once the aliases decorator is set on an Entity Class model property, the instance will have getters and setters of each of the aliases.
 * @example
 * ```
 * class Model extends Entity {
 *   @aliases(['alias1', 'alias2'])
 *   myProperty number;
 * }
 *
 * const model = new Model({
 *   alias1: 1,
 * });
 *
 * console.log(model.myProperty) // 1
 * console.log(model.alias1) // 1
 * console.log(model.alias2) // 1
 *
 * model.myProperty = 2;
 *
 * console.log(model.myProperty) // 2
 * console.log(model.alias1) // 2
 * console.log(model.alias2) // 2
 *
 * model.alias2 = 3;
 *
 * console.log(model.myProperty) // 3
 * console.log(model.alias1) // 3
 * console.log(model.alias2) // 3
 * ```
 *
 * @category Property Decorators
 */
export function aliases(aliasesNames: string[]) {
  return (target: any, propertyKey: string): void => {
    // TARGET IS THE CLASS PROTOTYPE
    setPropGettersAndSetters(target, propertyKey);
    for (const aliasName of aliasesNames) {
      addAliasForProperty(target, propertyKey, aliasName);
      setAliasDescriptor(target, aliasName, propertyKey);
    }
  };
}
