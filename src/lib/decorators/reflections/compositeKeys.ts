import 'reflect-metadata';

import {
  COMPOSITE_DELIMITER_KEY,
  COMPOSITE_FIELD_KEY,
} from './metadataKeys';

/** @internal */
export function getCompositeKeys(target: any): string[] {
  return Reflect.getMetadata(COMPOSITE_FIELD_KEY, target) || [];
}

/** @internal */
export function getCompositeKey(target: any, key: string): string[] | undefined {
  return Reflect.getMetadata(COMPOSITE_FIELD_KEY, target, key);
}

/** @internal */
export function getCompositeKeyDelimiter(target: any): string {
  return Reflect.getMetadata(COMPOSITE_DELIMITER_KEY, target) || '#';
}

/** @internal */
export function addCompositeKey(target: any, key: string, fields: string[]): void {
  Reflect.defineMetadata(COMPOSITE_FIELD_KEY, fields, target, key);

  const currentCompositeKeys = getCompositeKeys(target);

  if (currentCompositeKeys.indexOf(key) === -1) {
    const maxDependantIndex = Math.max(...currentCompositeKeys.map((p) => {
      return {
        property: p,
        fields: getCompositeKey(target, p),
      };
    }).filter(({ fields: f }) => {
      return f != null && f.includes(key);
    }).map(({ property }) => {
      return currentCompositeKeys.findIndex((p) => p === property);
    }));

    if (maxDependantIndex < 0) {
      currentCompositeKeys.push(key);
    } else {
      currentCompositeKeys.splice(maxDependantIndex, 0, key);
    }

    currentCompositeKeys.push(key);
  }

  if (!currentCompositeKeys.includes(key)) {
    currentCompositeKeys.push(key);
  }

  Reflect.defineMetadata(COMPOSITE_FIELD_KEY, currentCompositeKeys, target);
}

/** @internal */
export function addCompositeKeyDelimiter(target: any, delimiter: string = '#'): void {
  Reflect.defineMetadata(COMPOSITE_DELIMITER_KEY, delimiter, target);
}
