export declare type Constructor = {
    new (...args: any[]): any;
};
export declare type HasRelationOptions = {
    required?: boolean;
    nestedObject?: boolean;
    foreignKey?: string;
    indexName?: string;
    parentPropertyOnChild?: string;
};
export declare type BelongsRelationOpts = {
    indexName: string;
};
/** @internal */
export declare type RelationModel = {
    model: any;
    opts?: HasRelationOptions;
} | undefined;
/** @internal */
export declare const relationDescriptor = "RELATION_DESCRIPTOR";
/** @internal */
export declare type RelationDescriptors = (RelationModel & {
    propertyKey?: string;
    type: 'hasMany' | 'hasOne' | 'belongsTo';
    initializer?: Function;
})[];
export declare function getRelationDescriptors(target: any): RelationDescriptors;
