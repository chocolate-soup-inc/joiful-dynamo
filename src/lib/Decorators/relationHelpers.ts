import 'reflect-metadata';

export const foreignKeysMetadataKey = 'foreignKeys';
export const childForeignKeysMetadataKey = 'childForeignKeys';

export function getForeignKeys(target): string[] {
  return Reflect.getMetadata(foreignKeysMetadataKey, target) || [];
}

export function addForeignKey(target, foreignKey) {
  const currentKeys = getForeignKeys(target);
  if (!currentKeys.includes(foreignKey)) currentKeys.push(foreignKey);
  Reflect.defineMetadata(foreignKeysMetadataKey, currentKeys, target);
}

export function getChildForeignKeys(target): string[] {
  return Reflect.getMetadata(childForeignKeysMetadataKey, target) || [];
}

export function addChildForeignKey(target, foreignKey) {
  const currentKeys = getChildForeignKeys(target);
  if (!currentKeys.includes(foreignKey)) currentKeys.push(foreignKey);
  Reflect.defineMetadata(childForeignKeysMetadataKey, currentKeys, target);
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
