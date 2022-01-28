import 'reflect-metadata';
import { setPropGettersAndSetters } from './prop';

const aliasesMapMetadataKey = Symbol('aliasesMap');

export function aliasTo(aliasToName: string) {
  return (target: any, propertyKey: string): void => {
    setPropGettersAndSetters(target, aliasToName);
    setPropGettersAndSetters(target, propertyKey);

    // SET THE ALIAS MAP IN THE INSTANCE
    let aliasesMap: Record<string, string> = Reflect.getMetadata(aliasesMapMetadataKey, target);

    if (aliasesMap == null) aliasesMap = {};
    aliasesMap[propertyKey] = aliasToName;

    Reflect.defineMetadata(aliasesMapMetadataKey, aliasesMap, target);
    Reflect.defineMetadata(aliasesMapMetadataKey, aliasesMap, target.constructor);
  };
}

export function aliases(aliasesNames: string[]) {
  return (target: any, propertyKey: string): void => {
    setPropGettersAndSetters(target, propertyKey);
    for (const alias of aliasesNames) {
      setPropGettersAndSetters(target, alias);
    }

    // SET THE ALIAS MAP IN THE INSTANCE
    let aliasesMap: Record<string, string> = Reflect.getMetadata(aliasesMapMetadataKey, target);

    if (aliasesMap == null) aliasesMap = {};
    for (const alias of aliasesNames) {
      aliasesMap[alias] = propertyKey;
    }

    Reflect.defineMetadata(aliasesMapMetadataKey, aliasesMap, target);
    Reflect.defineMetadata(aliasesMapMetadataKey, aliasesMap, target.constructor);
  };
}
export const getAliasesMap = (target: any): Record<string, string> => {
  return Reflect.getMetadata(aliasesMapMetadataKey, target) || {};
};

export const getAliasTarget = (target: any, key: string): string => {
  return getAliasesMap(target)[key] || key;
};
