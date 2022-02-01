import 'reflect-metadata';
import { setPropGettersAndSetters } from './prop';

const aliasesMapMetadataKey = Symbol('aliasesMap');

export const getAliasesMap = (target: any): Record<string, string> => {
  return Reflect.getMetadata(aliasesMapMetadataKey, target) || {};
};

export const getAliasTarget = (target: any, key: string): string => {
  return getAliasesMap(target)[key] || key;
};

export function setAliasDescriptor(target: any, aliasKey: string, propertyKey: string): void {
  // SET THE ALIAS MAP IN THE INSTANCE
  let aliasesMap: Record<string, string> = Reflect.getMetadata(aliasesMapMetadataKey, target);

  if (aliasesMap == null) aliasesMap = {};
  aliasesMap[aliasKey] = propertyKey;

  Reflect.defineMetadata(aliasesMapMetadataKey, aliasesMap, target);

  Object.defineProperty(target, aliasKey, {
    get() {
      return this.getAttribute(propertyKey);
    },
    set(v) {
      this.setAttribute(propertyKey, v);
    },
    configurable: true,
    enumerable: false,
  });
}

export function aliasTo(aliasToName: string) {
  return (target: any, propertyKey: string): void => {
    // TARGET IS THE CLASS PROTOTYPE
    setPropGettersAndSetters(target, aliasToName);
    setAliasDescriptor(target, propertyKey, aliasToName);
  };
}

export function aliases(aliasesNames: string[]) {
  return (target: any, propertyKey: string): void => {
    // TARGET IS THE CLASS PROTOTYPE
    setPropGettersAndSetters(target, propertyKey);

    for (const alias of aliasesNames) {
      setAliasDescriptor(target, alias, propertyKey);
    }
  };
}

export function transformAliasAttributes(target: any, item: Record<string, any>) {
  return Object.entries(item).reduce((agg, [key, value]: [string, any]) => {
    agg[getAliasTarget(target, key)] = value;
    return agg;
  }, {} as Record<string, any>);
}
