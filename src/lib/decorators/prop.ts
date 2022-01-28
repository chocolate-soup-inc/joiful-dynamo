import 'reflect-metadata';

type PropOptions = {
  primaryKey?: boolean;
  secondaryKey?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
};

const propMetadataKey = Symbol('prop');
const primaryKeyMetadataKey = 'primaryKey';
const secondaryKeyMetadataKey = 'secondaryKey';
const createdAtKeyMetadataKey = 'createdAtKey';
const updatedAtKeyMetadataKey = 'updatedAtKey';

export function setPropGettersAndSetters(target: any, propertyKey: string): void {
  // SET THE LIST OF VALIDATED PROPERTIES IN THE INSTANCE
  let properties: string[] = Reflect.getMetadata(propMetadataKey, target);

  if (properties) {
    if (properties.indexOf(propertyKey) === -1) {
      properties.push(propertyKey);
    }
  } else {
    properties = [propertyKey];
    Reflect.defineMetadata(propMetadataKey, properties, target);
  }
}

export function prop(opts?: PropOptions) {
  return (target: any, propertyKey: string) => {
    setPropGettersAndSetters(target, propertyKey);

    const obj = {
      [primaryKeyMetadataKey]: opts?.primaryKey,
      [secondaryKeyMetadataKey]: opts?.secondaryKey,
      [createdAtKeyMetadataKey]: opts?.createdAt,
      [updatedAtKeyMetadataKey]: opts?.updatedAt,
    };

    Object.entries(obj).forEach(([key, value]) => {
      if (value) {
        const currentValue = Reflect.getMetadata(key, target.constructor);
        if (currentValue != null) {
          throw new Error(`Cannot have 2 properties as ${key}`);
        } else {
          Reflect.defineMetadata(key, propertyKey, target.constructor);
        }
      }
    });
  };
}

export function getProps(target: any): string[] {
  return Reflect.getMetadata(propMetadataKey, target) || [];
}

export function getPrimaryKey(target: any): string | undefined {
  return Reflect.getMetadata(primaryKeyMetadataKey, target);
}

export function getSecondaryKey(target: any): string | undefined {
  return Reflect.getMetadata(secondaryKeyMetadataKey, target);
}

export function getCreatedAtKey(target: any): string | undefined {
  return Reflect.getMetadata(createdAtKeyMetadataKey, target);
}

export function getUpdatedAtKey(target: any): string | undefined {
  return Reflect.getMetadata(updatedAtKeyMetadataKey, target);
}
