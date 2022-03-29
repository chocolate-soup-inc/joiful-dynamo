import 'reflect-metadata';

import {
  PROPERTY_ALIASES_KEY,
  ALIASES_MAP_KEY,
} from './metadataKeys';

/** @internal */
export const getAliasesMap = (target: any): Record<string, string> => {
  return Reflect.getMetadata(ALIASES_MAP_KEY, target) || {};
};

/** @internal */
export const addAliasToMap = (target: any, key: string, alias: string): void => {
  const map = getAliasesMap(target);
  map[alias] = key;
  Reflect.defineMetadata(ALIASES_MAP_KEY, map, target);
};

/** @internal */
export const getAliasesForProperty = (target: any, key: string): string[] => {
  return Reflect.getMetadata(PROPERTY_ALIASES_KEY, target, key) || [];
};

/** @internal */
export const addAliasForProperty = (target: any, property: string, alias: string) => {
  const currentAliasesForProperty = getAliasesForProperty(target, property);

  if (!currentAliasesForProperty.includes(alias)) {
    currentAliasesForProperty.push(alias);
  }

  Reflect.defineMetadata(PROPERTY_ALIASES_KEY, currentAliasesForProperty, target, property);
  addAliasToMap(target, property, alias);
};
