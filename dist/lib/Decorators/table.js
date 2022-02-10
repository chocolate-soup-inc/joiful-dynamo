"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTableDynamoDbInstance = exports.getTableName = exports.getTableProps = exports.table = exports.dynamodbDocumentClient = void 0;
require("reflect-metadata");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const isTest = process.env.JEST_WORKER_ID;
const isLocal = process.env.IS_LOCAL;
const dynamoOptions = {};
if (isTest || isLocal) {
    if (isTest) {
        dynamoOptions.endpoint = `http://localhost:${process.env.JEST_DYNAMODB_PORT || '4567'}`;
    }
    else if (isLocal) {
        dynamoOptions.endpoint = `http://localhost:${process.env.LOCAL_DYNAMODB_PORT || '3456'}`;
    }
    dynamoOptions.sslEnabled = false;
    dynamoOptions.region = 'local-env';
    dynamoOptions.credentials = new aws_sdk_1.default.Credentials({
        accessKeyId: '123',
        secretAccessKey: '123',
    });
}
/** @internal */
exports.dynamodbDocumentClient = new aws_sdk_1.default.DynamoDB.DocumentClient(dynamoOptions);
const tableMetadataKey = 'table';
/**
 * Sets the dynamodb table and its document client for this class.
 * @param {String} name - The DynamoDB table name to which records of this classe should be saved to and retrieved from.
 * @param {Object} [opts] - The options object. Accepts only the documentClient property right now.
 * @param {AWS.DynamoDB.DocumentClient} [opts.documentClient] - The AWS DynamoDB Dcoument Client to be used. If not set, it will use the default one.
 * @example
 * ```
 * @table('test-table')
 * class Model extends Entity {
 * }
 *
 * const model = new Model({ attr1: '1', attr2: '2' });
 * model.create(); // This will create the record in the 'test-table' DynamoDB table.
 * ```
 *
 * @category Class Decorators
 */
function table(name, opts) {
    return (constructor) => {
        // CONSTRUCTOR IS ACTUALLY THE CLASS ITSELF
        if (name == null)
            throw new TypeError('Name is required in the table decorator');
        const dynamodb = (opts === null || opts === void 0 ? void 0 : opts.documentClient) || exports.dynamodbDocumentClient;
        Reflect.defineMetadata(tableMetadataKey, {
            name,
            dynamodb,
        }, constructor);
    };
}
exports.table = table;
/** @internal */
const getTableProps = (target) => {
    return Reflect.getMetadata(tableMetadataKey, target);
};
exports.getTableProps = getTableProps;
/** @internal */
const getTableName = (target) => {
    return (0, exports.getTableProps)(target).name;
};
exports.getTableName = getTableName;
/** @internal */
const getTableDynamoDbInstance = (target) => {
    return (0, exports.getTableProps)(target).dynamodb;
};
exports.getTableDynamoDbInstance = getTableDynamoDbInstance;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsibGliL0RlY29yYXRvcnMvdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNEJBQTBCO0FBQzFCLHNEQUEwQjtBQUUxQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQztBQUMxQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUVyQyxNQUFNLGFBQWEsR0FBK0YsRUFBRSxDQUFDO0FBRXJILElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRTtJQUNyQixJQUFJLE1BQU0sRUFBRTtRQUNWLGFBQWEsQ0FBQyxRQUFRLEdBQUcsb0JBQW9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksTUFBTSxFQUFFLENBQUM7S0FDekY7U0FBTSxJQUFJLE9BQU8sRUFBRTtRQUNsQixhQUFhLENBQUMsUUFBUSxHQUFHLG9CQUFvQixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLE1BQU0sRUFBRSxDQUFDO0tBQzFGO0lBRUQsYUFBYSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDakMsYUFBYSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUM7SUFDbkMsYUFBYSxDQUFDLFdBQVcsR0FBRyxJQUFJLGlCQUFHLENBQUMsV0FBVyxDQUFDO1FBQzlDLFdBQVcsRUFBRSxLQUFLO1FBQ2xCLGVBQWUsRUFBRSxLQUFLO0tBQ3ZCLENBQUMsQ0FBQztDQUNKO0FBRUQsZ0JBQWdCO0FBQ0gsUUFBQSxzQkFBc0IsR0FBRyxJQUFJLGlCQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUVyRixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQztBQU1qQzs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRztBQUNILFNBQWdCLEtBQUssQ0FBQyxJQUFZLEVBQUUsSUFBbUI7SUFDckQsT0FBTyxDQUFDLFdBQXFCLEVBQUUsRUFBRTtRQUMvQiwyQ0FBMkM7UUFDM0MsSUFBSSxJQUFJLElBQUksSUFBSTtZQUFFLE1BQU0sSUFBSSxTQUFTLENBQUMseUNBQXlDLENBQUMsQ0FBQztRQUVqRixNQUFNLFFBQVEsR0FBRyxDQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxjQUFjLEtBQUksOEJBQXNCLENBQUM7UUFFaEUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRTtZQUN2QyxJQUFJO1lBQ0osUUFBUTtTQUNULEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVpELHNCQVlDO0FBRUQsZ0JBQWdCO0FBQ1QsTUFBTSxhQUFhLEdBQUcsQ0FBQyxNQUFXLEVBQTJELEVBQUU7SUFDcEcsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZELENBQUMsQ0FBQztBQUZXLFFBQUEsYUFBYSxpQkFFeEI7QUFFRixnQkFBZ0I7QUFDVCxNQUFNLFlBQVksR0FBRyxDQUFDLE1BQVcsRUFBVSxFQUFFO0lBQ2xELE9BQU8sSUFBQSxxQkFBYSxFQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNwQyxDQUFDLENBQUM7QUFGVyxRQUFBLFlBQVksZ0JBRXZCO0FBRUYsZ0JBQWdCO0FBQ1QsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLE1BQVcsRUFBK0IsRUFBRTtJQUNuRixPQUFPLElBQUEscUJBQWEsRUFBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDeEMsQ0FBQyxDQUFDO0FBRlcsUUFBQSx3QkFBd0IsNEJBRW5DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcbmltcG9ydCBBV1MgZnJvbSAnYXdzLXNkayc7XG5cbmNvbnN0IGlzVGVzdCA9IHByb2Nlc3MuZW52LkpFU1RfV09SS0VSX0lEO1xuY29uc3QgaXNMb2NhbCA9IHByb2Nlc3MuZW52LklTX0xPQ0FMO1xuXG5jb25zdCBkeW5hbW9PcHRpb25zOiBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQuRG9jdW1lbnRDbGllbnRPcHRpb25zICYgQVdTLkR5bmFtb0RCLlR5cGVzLkNsaWVudENvbmZpZ3VyYXRpb24gPSB7fTtcblxuaWYgKGlzVGVzdCB8fCBpc0xvY2FsKSB7XG4gIGlmIChpc1Rlc3QpIHtcbiAgICBkeW5hbW9PcHRpb25zLmVuZHBvaW50ID0gYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwcm9jZXNzLmVudi5KRVNUX0RZTkFNT0RCX1BPUlQgfHwgJzQ1NjcnfWA7XG4gIH0gZWxzZSBpZiAoaXNMb2NhbCkge1xuICAgIGR5bmFtb09wdGlvbnMuZW5kcG9pbnQgPSBgaHR0cDovL2xvY2FsaG9zdDoke3Byb2Nlc3MuZW52LkxPQ0FMX0RZTkFNT0RCX1BPUlQgfHwgJzM0NTYnfWA7XG4gIH1cblxuICBkeW5hbW9PcHRpb25zLnNzbEVuYWJsZWQgPSBmYWxzZTtcbiAgZHluYW1vT3B0aW9ucy5yZWdpb24gPSAnbG9jYWwtZW52JztcbiAgZHluYW1vT3B0aW9ucy5jcmVkZW50aWFscyA9IG5ldyBBV1MuQ3JlZGVudGlhbHMoe1xuICAgIGFjY2Vzc0tleUlkOiAnMTIzJyxcbiAgICBzZWNyZXRBY2Nlc3NLZXk6ICcxMjMnLFxuICB9KTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGNvbnN0IGR5bmFtb2RiRG9jdW1lbnRDbGllbnQgPSBuZXcgQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50KGR5bmFtb09wdGlvbnMpO1xuXG5jb25zdCB0YWJsZU1ldGFkYXRhS2V5ID0gJ3RhYmxlJztcblxuZXhwb3J0IHR5cGUgVGFibGVPcHRpb25zID0ge1xuICBkb2N1bWVudENsaWVudD86IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudDtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgZHluYW1vZGIgdGFibGUgYW5kIGl0cyBkb2N1bWVudCBjbGllbnQgZm9yIHRoaXMgY2xhc3MuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBEeW5hbW9EQiB0YWJsZSBuYW1lIHRvIHdoaWNoIHJlY29yZHMgb2YgdGhpcyBjbGFzc2Ugc2hvdWxkIGJlIHNhdmVkIHRvIGFuZCByZXRyaWV2ZWQgZnJvbS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0c10gLSBUaGUgb3B0aW9ucyBvYmplY3QuIEFjY2VwdHMgb25seSB0aGUgZG9jdW1lbnRDbGllbnQgcHJvcGVydHkgcmlnaHQgbm93LlxuICogQHBhcmFtIHtBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnR9IFtvcHRzLmRvY3VtZW50Q2xpZW50XSAtIFRoZSBBV1MgRHluYW1vREIgRGNvdW1lbnQgQ2xpZW50IHRvIGJlIHVzZWQuIElmIG5vdCBzZXQsIGl0IHdpbGwgdXNlIHRoZSBkZWZhdWx0IG9uZS5cbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqIEB0YWJsZSgndGVzdC10YWJsZScpXG4gKiBjbGFzcyBNb2RlbCBleHRlbmRzIEVudGl0eSB7XG4gKiB9XG4gKlxuICogY29uc3QgbW9kZWwgPSBuZXcgTW9kZWwoeyBhdHRyMTogJzEnLCBhdHRyMjogJzInIH0pO1xuICogbW9kZWwuY3JlYXRlKCk7IC8vIFRoaXMgd2lsbCBjcmVhdGUgdGhlIHJlY29yZCBpbiB0aGUgJ3Rlc3QtdGFibGUnIER5bmFtb0RCIHRhYmxlLlxuICogYGBgXG4gKlxuICogQGNhdGVnb3J5IENsYXNzIERlY29yYXRvcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRhYmxlKG5hbWU6IHN0cmluZywgb3B0cz86IFRhYmxlT3B0aW9ucykge1xuICByZXR1cm4gKGNvbnN0cnVjdG9yOiBGdW5jdGlvbikgPT4ge1xuICAgIC8vIENPTlNUUlVDVE9SIElTIEFDVFVBTExZIFRIRSBDTEFTUyBJVFNFTEZcbiAgICBpZiAobmFtZSA9PSBudWxsKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdOYW1lIGlzIHJlcXVpcmVkIGluIHRoZSB0YWJsZSBkZWNvcmF0b3InKTtcblxuICAgIGNvbnN0IGR5bmFtb2RiID0gb3B0cz8uZG9jdW1lbnRDbGllbnQgfHwgZHluYW1vZGJEb2N1bWVudENsaWVudDtcblxuICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEodGFibGVNZXRhZGF0YUtleSwge1xuICAgICAgbmFtZSxcbiAgICAgIGR5bmFtb2RiLFxuICAgIH0sIGNvbnN0cnVjdG9yKTtcbiAgfTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGNvbnN0IGdldFRhYmxlUHJvcHMgPSAodGFyZ2V0OiBhbnkpOiB7IG5hbWU6IHN0cmluZywgZHluYW1vZGI6IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudCB9ID0+IHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEodGFibGVNZXRhZGF0YUtleSwgdGFyZ2V0KTtcbn07XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBjb25zdCBnZXRUYWJsZU5hbWUgPSAodGFyZ2V0OiBhbnkpOiBzdHJpbmcgPT4ge1xuICByZXR1cm4gZ2V0VGFibGVQcm9wcyh0YXJnZXQpLm5hbWU7XG59O1xuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgY29uc3QgZ2V0VGFibGVEeW5hbW9EYkluc3RhbmNlID0gKHRhcmdldDogYW55KTogQVdTLkR5bmFtb0RCLkRvY3VtZW50Q2xpZW50ID0+IHtcbiAgcmV0dXJuIGdldFRhYmxlUHJvcHModGFyZ2V0KS5keW5hbW9kYjtcbn07XG4iXX0=