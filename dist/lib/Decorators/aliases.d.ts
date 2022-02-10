import 'reflect-metadata';
/** @internal */
export declare const getAliasesMap: (target: any) => Record<string, string>;
/** @internal */
export declare const getAliasTarget: (target: any, key: string) => string;
/** @internal */
export declare function setAliasDescriptor(target: any, aliasKey: string, propertyKey: string): void;
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
export declare function aliasTo(aliasToName: string): (target: any, propertyKey: string) => void;
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
export declare function aliases(aliasesNames: string[]): (target: any, propertyKey: string) => void;
/** @internal */
export declare function transformAliasAttributes(target: any, item: Record<string, any>): Record<string, any>;
