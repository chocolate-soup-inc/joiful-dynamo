import _ from 'lodash';
import 'reflect-metadata';

const compositeMetadataKey = Symbol('compositeKey');
const delimiterMetadataKey = Symbol('delimiter');

type Options = {
  delimiter?: string;
};

export function getCompositeKeys(target: any): string[] {
  return Reflect.getMetadata(compositeMetadataKey, target) || [];
}

export function getCompositeKey(target: any, key: string): string[] | undefined {
  return Reflect.getMetadata(compositeMetadataKey, target, key);
}

export function getCompositeKeyDelimiter(target: any): string {
  return Reflect.getMetadata(delimiterMetadataKey, target) || '#';
}

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
