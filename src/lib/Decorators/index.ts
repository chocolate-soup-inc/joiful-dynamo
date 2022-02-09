export * from './aliases';
export * from './compositeKey';
export * from './hasMany';
export * from './hasOne';
export * from './prop';
export * from './table';
export * from './validate';
export { getRelationDescriptors } from './relationHelpers';

/**
 * Joiful-dynamo is a package that tries to make coding with dynamodb tables easier. The package was thinked with [Adjacency List Design Pattern](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-adjacency-graphs.html) in mind. The package was not really tested for the multiple tables design pattern.
 *
 * For validation, the package uses [Joi](https://github.com/sideway/joi) making validations easy and very versatile.
 *
 * Also, the library is strongly based on Typescript and got a lot of inspiration in other libraries like [TypeORM](https://typeorm.io/#/) and [Dynamodb Toolbox](https://github.com/jeremydaly/dynamodb-toolbox).
 *
 * This library IS NOT a complete ORM.
 *
 * @packageDocumentation
 */
