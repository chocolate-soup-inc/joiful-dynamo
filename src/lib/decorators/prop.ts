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

export function setPropDescriptor(target: any, propertyKey: string): void {
  Object.defineProperty(target, propertyKey, {
    get() {
      return this.getAttribute(propertyKey);
    },
    set(v) {
      this.setAttribute(propertyKey, v);
    },
    configurable: true,
    enumerable: true,
  });
}

export function setPropGettersAndSetters(target: any, propertyKey: string): void {
  // SET THE LIST OF VALIDATED PROPERTIES IN THE INSTANCE
  const properties: string[] = Reflect.getMetadata(propMetadataKey, target) || [];

  if (properties.includes(propertyKey)) return;

  properties.push(propertyKey);
  Reflect.defineMetadata(propMetadataKey, properties, target);

  if (Object.getOwnPropertyDescriptor(target, propertyKey) == null) {
    setPropDescriptor(target, propertyKey);
  }
}

export function prop(opts?: PropOptions) {
  return (target: any, propertyKey: string) => {
    // TARGET IS THE CLASS PROTOTYPE
    setPropGettersAndSetters(target, propertyKey);

    const obj = {
      [primaryKeyMetadataKey]: opts?.primaryKey,
      [secondaryKeyMetadataKey]: opts?.secondaryKey,
      [createdAtKeyMetadataKey]: opts?.createdAt,
      [updatedAtKeyMetadataKey]: opts?.updatedAt,
    };

    Object.entries(obj).forEach(([key, value]) => {
      if (value) {
        const currentValue = Reflect.getMetadata(key, target);
        if (currentValue != null) {
          throw new Error(`Cannot have 2 properties as ${key}`);
        } else {
          Reflect.defineMetadata(key, propertyKey, target);
        }
      }
    });
  };
}
