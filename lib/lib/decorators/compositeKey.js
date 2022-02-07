"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformCompositeKeyAttributes = exports.compositeKey = exports.getCompositeKeyDelimiter = exports.getCompositeKey = exports.getCompositeKeys = void 0;
const lodash_1 = __importDefault(require("lodash"));
require("reflect-metadata");
const compositeMetadataKey = Symbol('compositeKey');
const delimiterMetadataKey = Symbol('delimiter');
function getCompositeKeys(target) {
    return Reflect.getMetadata(compositeMetadataKey, target) || [];
}
exports.getCompositeKeys = getCompositeKeys;
function getCompositeKey(target, key) {
    return Reflect.getMetadata(compositeMetadataKey, target, key);
}
exports.getCompositeKey = getCompositeKey;
function getCompositeKeyDelimiter(target) {
    return Reflect.getMetadata(delimiterMetadataKey, target) || '#';
}
exports.getCompositeKeyDelimiter = getCompositeKeyDelimiter;
function compositeKey(fields, opts) {
    return (target, propertyKey) => {
        Reflect.defineMetadata(delimiterMetadataKey, (opts === null || opts === void 0 ? void 0 : opts.delimiter) || '#', target);
        Reflect.defineMetadata(compositeMetadataKey, fields, target, propertyKey);
        let properties = Reflect.getMetadata(compositeMetadataKey, target);
        if (properties) {
            if (properties.indexOf(propertyKey) === -1) {
                const maxDependantIndex = Math.max(...properties.map((p) => {
                    return {
                        property: p,
                        fields: getCompositeKey(target, p),
                    };
                }).filter(({ fields: f }) => {
                    return f != null && f.includes(propertyKey);
                }).map(({ property }) => {
                    return properties.findIndex((p) => p === property);
                }));
                if (maxDependantIndex < 0) {
                    properties.push(propertyKey);
                }
                else {
                    properties.splice(maxDependantIndex, 0, propertyKey);
                }
                properties.push(propertyKey);
            }
        }
        else {
            properties = [propertyKey];
        }
        Reflect.defineMetadata(compositeMetadataKey, properties, target);
    };
}
exports.compositeKey = compositeKey;
function transformCompositeKeyAttributes(target, item) {
    const newItem = lodash_1.default.cloneDeep(item);
    const compositeKeys = getCompositeKeys(target);
    for (const key of compositeKeys) {
        const fields = getCompositeKey(target, key);
        if (fields) {
            const delimiter = getCompositeKeyDelimiter(target);
            const keyParts = fields.map((field) => newItem[field]);
            if (lodash_1.default.difference(fields, Object.keys(newItem)).length > 0
                || keyParts.filter((part) => part == null).length > 0) {
                // SET AS BLANK
                delete newItem[key];
                continue;
            }
            else {
                newItem[key] = keyParts.join(delimiter);
            }
        }
    }
    return newItem;
}
exports.transformCompositeKeyAttributes = transformCompositeKeyAttributes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zaXRlS2V5LmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbImxpYi9kZWNvcmF0b3JzL2NvbXBvc2l0ZUtleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBdUI7QUFDdkIsNEJBQTBCO0FBRTFCLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3BELE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBTWpELFNBQWdCLGdCQUFnQixDQUFDLE1BQVc7SUFDMUMsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNqRSxDQUFDO0FBRkQsNENBRUM7QUFFRCxTQUFnQixlQUFlLENBQUMsTUFBVyxFQUFFLEdBQVc7SUFDdEQsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNoRSxDQUFDO0FBRkQsMENBRUM7QUFFRCxTQUFnQix3QkFBd0IsQ0FBQyxNQUFXO0lBQ2xELE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDbEUsQ0FBQztBQUZELDREQUVDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLE1BQWdCLEVBQUUsSUFBYztJQUMzRCxPQUFPLENBQUMsTUFBVyxFQUFFLFdBQW1CLEVBQVEsRUFBRTtRQUNoRCxPQUFPLENBQUMsY0FBYyxDQUNwQixvQkFBb0IsRUFDcEIsQ0FBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsU0FBUyxLQUFJLEdBQUcsRUFDdEIsTUFBTSxDQUNQLENBQUM7UUFFRixPQUFPLENBQUMsY0FBYyxDQUNwQixvQkFBb0IsRUFDcEIsTUFBTSxFQUNOLE1BQU0sRUFDTixXQUFXLENBQ1osQ0FBQztRQUVGLElBQUksVUFBVSxHQUFhLE9B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b2Rhc2gnO1xuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcblxuY29uc3QgY29tcG9zaXRlTWV0YWRhdGFLZXkgPSBTeW1ib2woJ2NvbXBvc2l0ZUtleScpO1xuY29uc3QgZGVsaW1pdGVyTWV0YWRhdGFLZXkgPSBTeW1ib2woJ2RlbGltaXRlcicpO1xuXG50eXBlIE9wdGlvbnMgPSB7XG4gIGRlbGltaXRlcj86IHN0cmluZztcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb3NpdGVLZXlzKHRhcmdldDogYW55KTogc3RyaW5nW10ge1xuICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShjb21wb3NpdGVNZXRhZGF0YUtleSwgdGFyZ2V0KSB8fCBbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvc2l0ZUtleSh0YXJnZXQ6IGFueSwga2V5OiBzdHJpbmcpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKGNvbXBvc2l0ZU1ldGFkYXRhS2V5LCB0YXJnZXQsIGtleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb3NpdGVLZXlEZWxpbWl0ZXIodGFyZ2V0OiBhbnkpOiBzdHJpbmcge1xuICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShkZWxpbWl0ZXJNZXRhZGF0YUtleSwgdGFyZ2V0KSB8fCAnIyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wb3NpdGVLZXkoZmllbGRzOiBzdHJpbmdbXSwgb3B0cz86IE9wdGlvbnMpIHtcbiAgcmV0dXJuICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXG4gICAgICBkZWxpbWl0ZXJNZXRhZGF0YUtleSxcbiAgICAgIG9wdHM/LmRlbGltaXRlciB8fCAnIycsXG4gICAgICB0YXJnZXQsXG4gICAgKTtcblxuICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXG4gICAgICBjb21wb3NpdGVNZXRhZGF0YUtleSxcbiAgICAgIGZpZWxkcyxcbiAgICAgIHRhcmdldCxcbiAgICAgIHByb3BlcnR5S2V5LFxuICAgICk7XG5cbiAgICBsZXQgcHJvcGVydGllczogc3RyaW5nW10gPSBSZWZsZWN0LmdldE1ldGFkYXRhKGNvbXBvc2l0ZU1ldGFkYXRhS2V5LCB0YXJnZXQpO1xuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgIGlmIChwcm9wZXJ0aWVzLmluZGV4T2YocHJvcGVydHlLZXkpID09PSAtMSkge1xuICAgICAgICBjb25zdCBtYXhEZXBlbmRhbnRJbmRleCA9IE1hdGgubWF4KC4uLnByb3BlcnRpZXMubWFwKChwKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByb3BlcnR5OiBwLFxuICAgICAgICAgICAgZmllbGRzOiBnZXRDb21wb3NpdGVLZXkodGFyZ2V0LCBwKSxcbiAgICAgICAgICB9O1xuICAgICAgICB9KS5maWx0ZXIoKHsgZmllbGRzOiBmIH0pID0+IHtcbiAgICAgICAgICByZXR1cm4gZiAhPSBudWxsICYmIGYuaW5jbHVkZXMocHJvcGVydHlLZXkpO1xuICAgICAgICB9KS5tYXAoKHsgcHJvcGVydHkgfSkgPT4ge1xuICAgICAgICAgIHJldHVybiBwcm9wZXJ0aWVzLmZpbmRJbmRleCgocCkgPT4gcCA9PT0gcHJvcGVydHkpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgaWYgKG1heERlcGVuZGFudEluZGV4IDwgMCkge1xuICAgICAgICAgIHByb3BlcnRpZXMucHVzaChwcm9wZXJ0eUtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvcGVydGllcy5zcGxpY2UobWF4RGVwZW5kYW50SW5kZXgsIDAsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3BlcnRpZXMucHVzaChwcm9wZXJ0eUtleSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3BlcnRpZXMgPSBbcHJvcGVydHlLZXldO1xuICAgIH1cblxuICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXG4gICAgICBjb21wb3NpdGVNZXRhZGF0YUtleSxcbiAgICAgIHByb3BlcnRpZXMsXG4gICAgICB0YXJnZXQsXG4gICAgKTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUNvbXBvc2l0ZUtleUF0dHJpYnV0ZXModGFyZ2V0OiBhbnksIGl0ZW06IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgY29uc3QgbmV3SXRlbSA9IF8uY2xvbmVEZWVwKGl0ZW0pO1xuICBjb25zdCBjb21wb3NpdGVLZXlzID0gZ2V0Q29tcG9zaXRlS2V5cyh0YXJnZXQpO1xuXG4gIGZvciAoY29uc3Qga2V5IG9mIGNvbXBvc2l0ZUtleXMpIHtcbiAgICBjb25zdCBmaWVsZHMgPSBnZXRDb21wb3NpdGVLZXkodGFyZ2V0LCBrZXkpO1xuXG4gICAgaWYgKGZpZWxkcykge1xuICAgICAgY29uc3QgZGVsaW1pdGVyID0gZ2V0Q29tcG9zaXRlS2V5RGVsaW1pdGVyKHRhcmdldCk7XG5cbiAgICAgIGNvbnN0IGtleVBhcnRzID0gZmllbGRzLm1hcCgoZmllbGQpID0+IG5ld0l0ZW1bZmllbGRdKTtcblxuICAgICAgaWYgKFxuICAgICAgICBfLmRpZmZlcmVuY2UoZmllbGRzLCBPYmplY3Qua2V5cyhuZXdJdGVtKSkubGVuZ3RoID4gMFxuICAgICAgICB8fCBrZXlQYXJ0cy5maWx0ZXIoKHBhcnQpID0+IHBhcnQgPT0gbnVsbCkubGVuZ3RoID4gMFxuICAgICAgKSB7XG4gICAgICAgIC8vIFNFVCBBUyBCTEFOS1xuICAgICAgICBkZWxldGUgbmV3SXRlbVtrZXldO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0l0ZW1ba2V5XSA9IGtleVBhcnRzLmpvaW4oZGVsaW1pdGVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmV3SXRlbTtcbn1cbiJdfQ==