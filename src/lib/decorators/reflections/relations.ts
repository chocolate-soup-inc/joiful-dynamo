import 'reflect-metadata';

import {
  CHILD_PROPERTIES_KEY,
  RELATIONS_MAP_KEY,
} from './metadataKeys';

/** @internal */
export type RelationOpts = {
  required?: boolean;
  nestedObject?: boolean;
  foreignKey?: string;
  indexName?: string;
  ignoredInvalid?: boolean;
};

/** @internal */
export type Relation = {
  type: 'hasMany' | 'hasOne' | 'belongsTo';
  parentPropertyName?: string;
  propertyName?: string;
  foreignKey?: string;
  Model: any;
  entityName: string;
  opts?: RelationOpts,
};

/** @internal */
export function getRelations(target: any, types?: ('hasMany' | 'hasOne' | 'belongsTo')[] | undefined): Relation[] {
  const relations: Relation[] = Reflect.getMetadata(RELATIONS_MAP_KEY, target) || [];

  if (types) {
    return relations.filter((rel) => types.includes(rel.type));
  }

  return relations;
}

/** @internal */
export function addRelation(target: any, type: 'hasMany' | 'hasOne' | 'belongsTo', propertyName: string, ChildModel: any, opts?: RelationOpts): void {
  const relations: Relation[] = getRelations(target);
  const childRelations: Relation[] = getRelations(ChildModel.prototype);

  relations.push({
    type,
    propertyName,
    foreignKey: opts?.foreignKey,
    Model: ChildModel,
    entityName: ChildModel._entityName,
    opts,
  });

  childRelations.push({
    type: 'belongsTo',
    parentPropertyName: propertyName,
    foreignKey: opts?.foreignKey,
    Model: target.constructor,
    entityName: target._entityName,
  });

  Reflect.defineMetadata(RELATIONS_MAP_KEY, relations, target);
  Reflect.defineMetadata(RELATIONS_MAP_KEY, childRelations, ChildModel.prototype);
}

/** @internal */
export function getChildPropertiesKeys(target: any): string[] {
  return Reflect.getMetadata(CHILD_PROPERTIES_KEY, target) || [];
}

/** @internal */
export function addChildPropertiesKey(target: any, key: string): void {
  const currentChildPropertiesKeys = getChildPropertiesKeys(target);

  if (!currentChildPropertiesKeys.includes(key)) {
    currentChildPropertiesKeys.push(key);
  }

  Reflect.defineMetadata(CHILD_PROPERTIES_KEY, currentChildPropertiesKeys, target);
}
