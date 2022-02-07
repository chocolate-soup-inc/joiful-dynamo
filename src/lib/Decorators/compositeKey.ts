import _ from 'lodash';
import 'reflect-metadata';

const compositeMetadataKey = Symbol('compositeKey');
const delimiterMetadataKey = Symbol('delimiter');

type Options = {
  delimiter?: string;
};

/** @internal */
export function getCompositeKeys(target: any): string[] {
  return Reflect.getMetadata(compositeMetadataKey, target) || [];
}

/** @internal */
export function getCompositeKey(target: any, key: string): string[] | undefined {
  return Reflect.getMetadata(compositeMetadataKey, target, key);
}

/** @internal */
export function getCompositeKeyDelimiter(target: any): string {
  return Reflect.getMetadata(delimiterMetadataKey, target) || '#';
}

/**
 * Transforms the decoratored property into a combination of other properties separated by a specific delimiter.
 * @param {string[]} fields - An ordered list containing the name of the properties to be combined. The combination will be done in this order.
 * @param {Object} [opts = { delimiter: '#' }] - The options object. Currently, it only supports the delimiter parameter.
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
export function compositeKey(fields: string[], opts?: Options) {
  return (target: any, propertyKey: string): void => {
    Reflect.defineMetadata(
      delimiterMetadataKey,
      opts?.delimiter || '#',
      target,
    );

    Reflect.defineMetadata(
      compositeMetadataKey,
      fields,
      target,
      propertyKey,
    );

    let properties: string[] = Reflect.getMetadata(compositeMetadataKey, target);

    if (properties) {
      if (properties.indexOf(propertyKey) === -1) {
        const maxDependantIndex = Math.max(...properties.map((p) => {
          return {
            property: p,
            fields: getCompositeKey(target, p),
          };
        }).filter(({ fields: f }) => {
          return f != null && f.includes(propertyKey);
        }).map(({ property }) => {
          return properties.findIndex((p) => p === property);
        }));

        if (maxDependantIndex < 0) {
          properties.push(propertyKey);
        } else {
          properties.splice(maxDependantIndex, 0, propertyKey);
        }

        properties.push(propertyKey);
      }
    } else {
      properties = [propertyKey];
    }

    Reflect.defineMetadata(
      compositeMetadataKey,
      properties,
      target,
    );
  };
}

/** @internal */
export function transformCompositeKeyAttributes(target: any, item: Record<string, any>) {
  const newItem = _.cloneDeep(item);
  const compositeKeys = getCompositeKeys(target);

  for (const key of compositeKeys) {
    const fields = getCompositeKey(target, key);

    if (fields) {
      const delimiter = getCompositeKeyDelimiter(target);

      const keyParts = fields.map((field) => newItem[field]);

      if (
        _.difference(fields, Object.keys(newItem)).length > 0
        || keyParts.filter((part) => part == null).length > 0
      ) {
        // SET AS BLANK
        delete newItem[key];
        continue;
      } else {
        newItem[key] = keyParts.join(delimiter);
      }
    }
  }

  return newItem;
}
