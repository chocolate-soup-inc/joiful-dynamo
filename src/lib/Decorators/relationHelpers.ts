import 'reflect-metadata';

export const foreignKeysMetadataKey = 'foreignKeys';
export const parentsForeignKeys = 'parentForeignKeys';

export function getForeignKeys(target): string[] {
  return Reflect.getMetadata(foreignKeysMetadataKey, target) || [];
}

export function addForeignKey(target, foreignKey) {
  const currentKeys = getForeignKeys(target);
  if (!currentKeys.includes(foreignKey)) currentKeys.push(foreignKey);
  Reflect.defineMetadata(foreignKeysMetadataKey, currentKeys, target);
}

export function getParentForeignKeys(target): string[] {
  return Reflect.getMetadata(parentsForeignKeys, target) || {};
}

export function addParentForeignKey(target, foreignKey, entityName) {
  const currentKeys = getParentForeignKeys(target);
  if (!Object.keys(currentKeys).includes(foreignKey)) currentKeys[foreignKey] = entityName;
  Reflect.defineMetadata(parentsForeignKeys, currentKeys, target);
}

export type Constructor = { new(...args: any[]) };

export type HasRelationOptions = {
  required?: boolean;
  nestedObject?: boolean;
  foreignKey?: string;
  indexName?: string;
  parentPropertyOnChild?: string;
};

export type BelongsRelationOpts = {
  indexName: string;
};

/** @internal */
export type RelationModel = {
  model: any,
  opts?: HasRelationOptions,
} | undefined;

/** @internal */
export const relationDescriptor = 'RELATION_DESCRIPTOR';

/** @internal */
export type RelationDescriptors = (RelationModel & {
  propertyKey?: string;
  type: 'hasMany' | 'hasOne' | 'belongsTo';
  initializer?: Function;
})[];

export function getRelationDescriptors(target: any): RelationDescriptors {
  return Reflect.getMetadata(relationDescriptor, target) || [];
}
