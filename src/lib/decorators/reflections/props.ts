import 'reflect-metadata';

import {
  CREATED_AT_FIELD_KEY,
  PRIMARY_FIELD_KEY,
  PROP_FIELD_KEY,
  SECONDARY_FIELD_KEY,
  UPDATED_AT_FIELD_KEY,
} from './metadataKeys';

/** @internal */
export type PropOptions = {
  primaryKey?: boolean;
  secondaryKey?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
};

/** @internal */
export function getPrimaryKey(target: any): string | undefined {
  return Reflect.getMetadata(PRIMARY_FIELD_KEY, target);
}

/** @internal */
export function getSecondaryKey(target: any): string | undefined {
  return Reflect.getMetadata(SECONDARY_FIELD_KEY, target);
}

/** @internal */
export function getCreatedAtKey(target: any): string | undefined {
  return Reflect.getMetadata(CREATED_AT_FIELD_KEY, target);
}

/** @internal */
export function getUpdatedAtKey(target: any): string | undefined {
  return Reflect.getMetadata(UPDATED_AT_FIELD_KEY, target);
}

/** @internal */
export function getProps(target: any): string[] {
  return Reflect.getMetadata(PROP_FIELD_KEY, target) || [];
}

/** @internal */
export function addProp(target: any, propertyName: string, opts?: PropOptions): void {
  const currentProps = getProps(target);

  if (!currentProps.includes(propertyName)) {
    currentProps.push(propertyName);
  }

  const obj = {
    [PRIMARY_FIELD_KEY]: opts?.primaryKey,
    [SECONDARY_FIELD_KEY]: opts?.secondaryKey,
    [CREATED_AT_FIELD_KEY]: opts?.createdAt,
    [UPDATED_AT_FIELD_KEY]: opts?.updatedAt,
  };

  Object.entries(obj).forEach(([key, value]) => {
    if (value) {
      const currentValue = Reflect.getMetadata(key, target);
      if (currentValue != null) {
        throw new Error(`Cannot have 2 properties as ${key}`);
      } else {
        Reflect.defineMetadata(key, propertyName, target);
      }
    }
  });

  Reflect.defineMetadata(PROP_FIELD_KEY, currentProps, target);
}
