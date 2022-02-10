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
/** @internal */
function getCompositeKeys(target) {
    return Reflect.getMetadata(compositeMetadataKey, target) || [];
}
exports.getCompositeKeys = getCompositeKeys;
/** @internal */
function getCompositeKey(target, key) {
    return Reflect.getMetadata(compositeMetadataKey, target, key);
}
exports.getCompositeKey = getCompositeKey;
/** @internal */
function getCompositeKeyDelimiter(target) {
    return Reflect.getMetadata(delimiterMetadataKey, target) || '#';
}
exports.getCompositeKeyDelimiter = getCompositeKeyDelimiter;
/**
 * Transforms the decoratored property into a combination of other properties separated by a specific delimiter.
 * @param {string[]} fields - An ordered list containing the name of the properties to be combined. The combination will be done in this order.
 * @param {CompositeKeyOptions} [opts = { delimiter: '#' }] - The options object. Currently, it only supports the delimiter parameter.
 * @param {string} [opts.delimiter = '#'] - A string defining the delimiter to be used when combining the properties.
 * @example
 * ```
 * class Model extends Entity {
 *   @compositeKey(['field1', 'field2'])
 *   compositeProperty: string;
 *
 *   @prop()
 *   field1: string;
 *
 *   @prop()
 *   field2: string;
 * }
 *
 * const model = new Model({ field1: 'part1', field2: 'part2' });
 *
 * console.log(model.compositeProperty) // undefined;
 * console.log(model.field1) // 'part1'
 * console.log(model.field2) // 'part2'
 *
 * console.log(model.transformedAttributes) // { compositeProperty: 'part1#part2', field1: 'part1', field2: 'part2' }
 *
 * ```
 *
 * @category Property Decorators
 */
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
/** @internal */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zaXRlS2V5LmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbImxpYi9EZWNvcmF0b3JzL2NvbXBvc2l0ZUtleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBdUI7QUFDdkIsNEJBQTBCO0FBRTFCLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3BELE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBU2pELGdCQUFnQjtBQUNoQixTQUFnQixnQkFBZ0IsQ0FBQyxNQUFXO0lBQzFDLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDakUsQ0FBQztBQUZELDRDQUVDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLGVBQWUsQ0FBQyxNQUFXLEVBQUUsR0FBVztJQUN0RCxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFGRCwwQ0FFQztBQUVELGdCQUFnQjtBQUNoQixTQUFnQix3QkFBd0IsQ0FBQyxNQUFXO0lBQ2xELE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDbEUsQ0FBQztBQUZELDREQUVDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLE1BQWdCLEVBQUUsSUFBMEI7SUFDdkUsT0FBTyxDQUFDLE1BQVcsRUFBRSxXQUFtQixFQUFRLEVBQUU7UUFDaEQsT0FBTyxDQUFDLGNBQWMsQ0FDcEIsb0JBQW9CLEVBQ3BCLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFNBQVMsS0FBSSxHQUFHLEVBQ3RCLE1BQU0sQ0FDUCxDQUFDO1FBRUYsT0FBTyxDQUFDLGNB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QztTQUNGO0tBQ0Y7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBMUJELDBFQTBCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuXG5jb25zdCBjb21wb3NpdGVNZXRhZGF0YUtleSA9IFN5bWJvbCgnY29tcG9zaXRlS2V5Jyk7XG5jb25zdCBkZWxpbWl0ZXJNZXRhZGF0YUtleSA9IFN5bWJvbCgnZGVsaW1pdGVyJyk7XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgdGhlIGNvbXBvc2l0ZUtleSBkZWNvcmF0b3IuXG4gKi9cbmV4cG9ydCB0eXBlIENvbXBvc2l0ZUtleU9wdGlvbnMgPSB7XG4gIGRlbGltaXRlcj86IHN0cmluZztcbn07XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb3NpdGVLZXlzKHRhcmdldDogYW55KTogc3RyaW5nW10ge1xuICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShjb21wb3NpdGVNZXRhZGF0YUtleSwgdGFyZ2V0KSB8fCBbXTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvc2l0ZUtleSh0YXJnZXQ6IGFueSwga2V5OiBzdHJpbmcpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKGNvbXBvc2l0ZU1ldGFkYXRhS2V5LCB0YXJnZXQsIGtleSk7XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb3NpdGVLZXlEZWxpbWl0ZXIodGFyZ2V0OiBhbnkpOiBzdHJpbmcge1xuICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShkZWxpbWl0ZXJNZXRhZGF0YUtleSwgdGFyZ2V0KSB8fCAnIyc7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgZGVjb3JhdG9yZWQgcHJvcGVydHkgaW50byBhIGNvbWJpbmF0aW9uIG9mIG90aGVyIHByb3BlcnRpZXMgc2VwYXJhdGVkIGJ5IGEgc3BlY2lmaWMgZGVsaW1pdGVyLlxuICogQHBhcmFtIHtzdHJpbmdbXX0gZmllbGRzIC0gQW4gb3JkZXJlZCBsaXN0IGNvbnRhaW5pbmcgdGhlIG5hbWUgb2YgdGhlIHByb3BlcnRpZXMgdG8gYmUgY29tYmluZWQuIFRoZSBjb21iaW5hdGlvbiB3aWxsIGJlIGRvbmUgaW4gdGhpcyBvcmRlci5cbiAqIEBwYXJhbSB7Q29tcG9zaXRlS2V5T3B0aW9uc30gW29wdHMgPSB7IGRlbGltaXRlcjogJyMnIH1dIC0gVGhlIG9wdGlvbnMgb2JqZWN0LiBDdXJyZW50bHksIGl0IG9ubHkgc3VwcG9ydHMgdGhlIGRlbGltaXRlciBwYXJhbWV0ZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdHMuZGVsaW1pdGVyID0gJyMnXSAtIEEgc3RyaW5nIGRlZmluaW5nIHRoZSBkZWxpbWl0ZXIgdG8gYmUgdXNlZCB3aGVuIGNvbWJpbmluZyB0aGUgcHJvcGVydGllcy5cbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqIGNsYXNzIE1vZGVsIGV4dGVuZHMgRW50aXR5IHtcbiAqICAgQGNvbXBvc2l0ZUtleShbJ2ZpZWxkMScsICdmaWVsZDInXSlcbiAqICAgY29tcG9zaXRlUHJvcGVydHk6IHN0cmluZztcbiAqXG4gKiAgIEBwcm9wKClcbiAqICAgZmllbGQxOiBzdHJpbmc7XG4gKlxuICogICBAcHJvcCgpXG4gKiAgIGZpZWxkMjogc3RyaW5nO1xuICogfVxuICpcbiAqIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsKHsgZmllbGQxOiAncGFydDEnLCBmaWVsZDI6ICdwYXJ0MicgfSk7XG4gKlxuICogY29uc29sZS5sb2cobW9kZWwuY29tcG9zaXRlUHJvcGVydHkpIC8vIHVuZGVmaW5lZDtcbiAqIGNvbnNvbGUubG9nKG1vZGVsLmZpZWxkMSkgLy8gJ3BhcnQxJ1xuICogY29uc29sZS5sb2cobW9kZWwuZmllbGQyKSAvLyAncGFydDInXG4gKlxuICogY29uc29sZS5sb2cobW9kZWwudHJhbnNmb3JtZWRBdHRyaWJ1dGVzKSAvLyB7IGNvbXBvc2l0ZVByb3BlcnR5OiAncGFydDEjcGFydDInLCBmaWVsZDE6ICdwYXJ0MScsIGZpZWxkMjogJ3BhcnQyJyB9XG4gKlxuICogYGBgXG4gKlxuICogQGNhdGVnb3J5IFByb3BlcnR5IERlY29yYXRvcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvc2l0ZUtleShmaWVsZHM6IHN0cmluZ1tdLCBvcHRzPzogQ29tcG9zaXRlS2V5T3B0aW9ucykge1xuICByZXR1cm4gKHRhcmdldDogYW55LCBwcm9wZXJ0eUtleTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcbiAgICAgIGRlbGltaXRlck1ldGFkYXRhS2V5LFxuICAgICAgb3B0cz8uZGVsaW1pdGVyIHx8ICcjJyxcbiAgICAgIHRhcmdldCxcbiAgICApO1xuXG4gICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcbiAgICAgIGNvbXBvc2l0ZU1ldGFkYXRhS2V5LFxuICAgICAgZmllbGRzLFxuICAgICAgdGFyZ2V0LFxuICAgICAgcHJvcGVydHlLZXksXG4gICAgKTtcblxuICAgIGxldCBwcm9wZXJ0aWVzOiBzdHJpbmdbXSA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoY29tcG9zaXRlTWV0YWRhdGFLZXksIHRhcmdldCk7XG5cbiAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgaWYgKHByb3BlcnRpZXMuaW5kZXhPZihwcm9wZXJ0eUtleSkgPT09IC0xKSB7XG4gICAgICAgIGNvbnN0IG1heERlcGVuZGFudEluZGV4ID0gTWF0aC5tYXgoLi4ucHJvcGVydGllcy5tYXAoKHApID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJvcGVydHk6IHAsXG4gICAgICAgICAgICBmaWVsZHM6IGdldENvbXBvc2l0ZUtleSh0YXJnZXQsIHApLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pLmZpbHRlcigoeyBmaWVsZHM6IGYgfSkgPT4ge1xuICAgICAgICAgIHJldHVybiBmICE9IG51bGwgJiYgZi5pbmNsdWRlcyhwcm9wZXJ0eUtleSk7XG4gICAgICAgIH0pLm1hcCgoeyBwcm9wZXJ0eSB9KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHByb3BlcnRpZXMuZmluZEluZGV4KChwKSA9PiBwID09PSBwcm9wZXJ0eSk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICBpZiAobWF4RGVwZW5kYW50SW5kZXggPCAwKSB7XG4gICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5S2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9wZXJ0aWVzLnNwbGljZShtYXhEZXBlbmRhbnRJbmRleCwgMCwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5S2V5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcGVydGllcyA9IFtwcm9wZXJ0eUtleV07XG4gICAgfVxuXG4gICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcbiAgICAgIGNvbXBvc2l0ZU1ldGFkYXRhS2V5LFxuICAgICAgcHJvcGVydGllcyxcbiAgICAgIHRhcmdldCxcbiAgICApO1xuICB9O1xufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtQ29tcG9zaXRlS2V5QXR0cmlidXRlcyh0YXJnZXQ6IGFueSwgaXRlbTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICBjb25zdCBuZXdJdGVtID0gXy5jbG9uZURlZXAoaXRlbSk7XG4gIGNvbnN0IGNvbXBvc2l0ZUtleXMgPSBnZXRDb21wb3NpdGVLZXlzKHRhcmdldCk7XG5cbiAgZm9yIChjb25zdCBrZXkgb2YgY29tcG9zaXRlS2V5cykge1xuICAgIGNvbnN0IGZpZWxkcyA9IGdldENvbXBvc2l0ZUtleSh0YXJnZXQsIGtleSk7XG5cbiAgICBpZiAoZmllbGRzKSB7XG4gICAgICBjb25zdCBkZWxpbWl0ZXIgPSBnZXRDb21wb3NpdGVLZXlEZWxpbWl0ZXIodGFyZ2V0KTtcblxuICAgICAgY29uc3Qga2V5UGFydHMgPSBmaWVsZHMubWFwKChmaWVsZCkgPT4gbmV3SXRlbVtmaWVsZF0pO1xuXG4gICAgICBpZiAoXG4gICAgICAgIF8uZGlmZmVyZW5jZShmaWVsZHMsIE9iamVjdC5rZXlzKG5ld0l0ZW0pKS5sZW5ndGggPiAwXG4gICAgICAgIHx8IGtleVBhcnRzLmZpbHRlcigocGFydCkgPT4gcGFydCA9PSBudWxsKS5sZW5ndGggPiAwXG4gICAgICApIHtcbiAgICAgICAgLy8gU0VUIEFTIEJMQU5LXG4gICAgICAgIGRlbGV0ZSBuZXdJdGVtW2tleV07XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3SXRlbVtrZXldID0ga2V5UGFydHMuam9pbihkZWxpbWl0ZXIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXdJdGVtO1xufVxuIl19