"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelationDescriptors = void 0;
__exportStar(require("./aliases"), exports);
__exportStar(require("./compositeKey"), exports);
__exportStar(require("./hasMany"), exports);
__exportStar(require("./hasOne"), exports);
__exportStar(require("./prop"), exports);
__exportStar(require("./table"), exports);
__exportStar(require("./validate"), exports);
var relationHelpers_1 = require("./relationHelpers");
Object.defineProperty(exports, "getRelationDescriptors", { enumerable: true, get: function () { return relationHelpers_1.getRelationDescriptors; } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsibGliL0RlY29yYXRvcnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLDRDQUEwQjtBQUMxQixpREFBK0I7QUFDL0IsNENBQTBCO0FBQzFCLDJDQUF5QjtBQUN6Qix5Q0FBdUI7QUFDdkIsMENBQXdCO0FBQ3hCLDZDQUEyQjtBQUMzQixxREFBMkQ7QUFBbEQseUhBQUEsc0JBQXNCLE9BQUE7QUFFL0I7Ozs7Ozs7Ozs7R0FVRyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gJy4vYWxpYXNlcyc7XG5leHBvcnQgKiBmcm9tICcuL2NvbXBvc2l0ZUtleSc7XG5leHBvcnQgKiBmcm9tICcuL2hhc01hbnknO1xuZXhwb3J0ICogZnJvbSAnLi9oYXNPbmUnO1xuZXhwb3J0ICogZnJvbSAnLi9wcm9wJztcbmV4cG9ydCAqIGZyb20gJy4vdGFibGUnO1xuZXhwb3J0ICogZnJvbSAnLi92YWxpZGF0ZSc7XG5leHBvcnQgeyBnZXRSZWxhdGlvbkRlc2NyaXB0b3JzIH0gZnJvbSAnLi9yZWxhdGlvbkhlbHBlcnMnO1xuXG4vKipcbiAqIEpvaWZ1bC1keW5hbW8gaXMgYSBwYWNrYWdlIHRoYXQgdHJpZXMgdG8gbWFrZSBjb2Rpbmcgd2l0aCBkeW5hbW9kYiB0YWJsZXMgZWFzaWVyLiBUaGUgcGFja2FnZSB3YXMgdGhpbmtlZCB3aXRoIFtBZGphY2VuY3kgTGlzdCBEZXNpZ24gUGF0dGVybl0oaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2FtYXpvbmR5bmFtb2RiL2xhdGVzdC9kZXZlbG9wZXJndWlkZS9icC1hZGphY2VuY3ktZ3JhcGhzLmh0bWwpIGluIG1pbmQuIFRoZSBwYWNrYWdlIHdhcyBub3QgcmVhbGx5IHRlc3RlZCBmb3IgdGhlIG11bHRpcGxlIHRhYmxlcyBkZXNpZ24gcGF0dGVybi5cbiAqXG4gKiBGb3IgdmFsaWRhdGlvbiwgdGhlIHBhY2thZ2UgdXNlcyBbSm9pXShodHRwczovL2dpdGh1Yi5jb20vc2lkZXdheS9qb2kpIG1ha2luZyB2YWxpZGF0aW9ucyBlYXN5IGFuZCB2ZXJ5IHZlcnNhdGlsZS5cbiAqXG4gKiBBbHNvLCB0aGUgbGlicmFyeSBpcyBzdHJvbmdseSBiYXNlZCBvbiBUeXBlc2NyaXB0IGFuZCBnb3QgYSBsb3Qgb2YgaW5zcGlyYXRpb24gaW4gb3RoZXIgbGlicmFyaWVzIGxpa2UgW1R5cGVPUk1dKGh0dHBzOi8vdHlwZW9ybS5pby8jLykgYW5kIFtEeW5hbW9kYiBUb29sYm94XShodHRwczovL2dpdGh1Yi5jb20vamVyZW15ZGFseS9keW5hbW9kYi10b29sYm94KS5cbiAqXG4gKiBUaGlzIGxpYnJhcnkgSVMgTk9UIGEgY29tcGxldGUgT1JNLlxuICpcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICovXG4iXX0=