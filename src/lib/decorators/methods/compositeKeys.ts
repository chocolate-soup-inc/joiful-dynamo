import {
  addCompositeKey,
  addCompositeKeyDelimiter,
} from '../reflections/compositeKeys';

/**
 * Options for the compositeKey decorator.
 */
export type CompositeKeyOptions = {
  delimiter?: string;
};

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
export function compositeKey(fields: string[], opts?: CompositeKeyOptions) {
  return (target: any, propertyKey: string): void => {
    addCompositeKeyDelimiter(target, opts?.delimiter);
    addCompositeKey(target, propertyKey, fields);
  };
}
