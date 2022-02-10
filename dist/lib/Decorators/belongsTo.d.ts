import 'reflect-metadata';
import { Constructor, HasRelationOptions } from './relationHelpers';
export declare function getBelongsToModels(target: any): any;
export declare function getBelongsToModel(target: any, propertyKey: string): any;
export declare function getHasFromBelong(target: any, foreignKey: string, indexName: string, parentPropertyOnChild?: string): any;
export declare function setBelongsTo(target: any, ChildModel: Constructor, propertyKey: string, type: 'hasMany' | 'hasOne', opts?: HasRelationOptions): void;
