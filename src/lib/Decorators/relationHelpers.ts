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
