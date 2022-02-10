import 'reflect-metadata';
/**
 * Options for the compositeKey decorator.
 */
export declare type CompositeKeyOptions = {
    delimiter?: string;
};
/** @internal */
export declare function getCompositeKeys(target: any): string[];
/** @internal */
export declare function getCompositeKey(target: any, key: string): string[] | undefined;
/** @internal */
export declare function getCompositeKeyDelimiter(target: any): string;
/**
 * Transforms the decoratored property into a combination of other properties separated by a specific delimiter.
 * @param {string[]} fields - An ordered list containing the name of the properties to be combined. The combination will be done in this order.
 * @param {CompositeKeyOptions} [opts = { delimiter: '#' }] - The options object. Currently, it only supports the delimiter parameter.
 * @param {string} [opts.delimiter = '#'] - A string defining the delimiter to be used when combining the properties.
 * @example
 * ```
 * class Model extends Entity {
 *   @compositeKey(['field1', 'field2'])
 *   compositeProperty: string;
 *
 *   @prop()
 *   field1: string;
 *
 *   @prop()
 *   field2: string;
 * }
 *
 * const model = new Model({ field1: 'part1', field2: 'part2' });
 *
 * console.log(model.compositeProperty) // undefined;
 * console.log(model.field1) // 'part1'
 * console.log(model.field2) // 'part2'
 *
 * console.log(model.transformedAttributes) // { compositeProperty: 'part1#part2', field1: 'part1', field2: 'part2' }
 *
 * ```
 *
 * @category Property Decorators
 */
export declare function compositeKey(fields: string[], opts?: CompositeKeyOptions): (target: any, propertyKey: string) => void;
/** @internal */
export declare function transformCompositeKeyAttributes(target: any, item: Record<string, any>): Record<string, any>;
