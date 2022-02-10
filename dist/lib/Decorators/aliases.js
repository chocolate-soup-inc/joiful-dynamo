"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformAliasAttributes = exports.aliases = exports.aliasTo = exports.setAliasDescriptor = exports.getAliasTarget = exports.getAliasesMap = void 0;
require("reflect-metadata");
const prop_1 = require("./prop");
const aliasesMapMetadataKey = Symbol('aliasesMap');
/** @internal */
const getAliasesMap = (target) => {
    return Reflect.getMetadata(aliasesMapMetadataKey, target) || {};
};
exports.getAliasesMap = getAliasesMap;
/** @internal */
const getAliasTarget = (target, key) => {
    return (0, exports.getAliasesMap)(target)[key] || key;
};
exports.getAliasTarget = getAliasTarget;
/** @internal */
function setAliasDescriptor(target, aliasKey, propertyKey) {
    // SET THE ALIAS MAP IN THE INSTANCE
    let aliasesMap = Reflect.getMetadata(aliasesMapMetadataKey, target);
    if (aliasesMap == null)
        aliasesMap = {};
    aliasesMap[aliasKey] = propertyKey;
    Reflect.defineMetadata(aliasesMapMetadataKey, aliasesMap, target);
    Object.defineProperty(target, aliasKey, {
        get() {
            return this.getAttribute(propertyKey);
        },
        set(v) {
            this.setAttribute(propertyKey, v);
        },
        configurable: true,
        enumerable: false,
    });
}
exports.setAliasDescriptor = setAliasDescriptor;
/**
 * Sets the decorated property as an alias of another property.
 * @param {string} aliasToName - The name of the prop to which this prop should be an alias of.
 * @remarks
 *
 * Once the aliasTo decorator is set on an Entity Class model property, the instance, the setters and getters will be set and both variables will be linked.
 * @example
 * ```
 * class Model extends Entity {
 *    myProperty number;
 *
 *    @aliasTo('myProperty')
 *    aliasProperty: number;
 * }
 *
 * const model = new Model({
 *    aliasProperty: 1;
 * })
 *
 * console.log(model.myProperty) // 1
 * console.log(model.aliasProperty) // 1
 *
 * model.myProperty = 2;
 *
 * console.log(model.myProperty) // 2
 * console.log(model.aliasProperty) // 2
 *
 * model.aliasProperty = 3;
 *
 * console.log(model.myProperty) // 3
 * console.log(model.aliasProperty) // 3
 * ```
 *
 * @category Property Decorators
 */
function aliasTo(aliasToName) {
    return (target, propertyKey) => {
        // TARGET IS THE CLASS PROTOTYPE
        (0, prop_1.setPropGettersAndSetters)(target, aliasToName);
        setAliasDescriptor(target, propertyKey, aliasToName);
    };
}
exports.aliasTo = aliasTo;
/**
 * Sets a list of aliases for the decorated property.
 * @param {string[]} aliasesNames - A list of aliases for the current property.
 * @remarks
 *
 * Once the aliases decorator is set on an Entity Class model property, the instance will have getters and setters of each of the aliases.
 * @example
 * ```
 * class Model extends Entity {
 *   @aliases(['alias1', 'alias2'])
 *   myProperty number;
 * }
 *
 * const model = new Model({
 *   alias1: 1,
 * });
 *
 * console.log(model.myProperty) // 1
 * console.log(model.alias1) // 1
 * console.log(model.alias2) // 1
 *
 * model.myProperty = 2;
 *
 * console.log(model.myProperty) // 2
 * console.log(model.alias1) // 2
 * console.log(model.alias2) // 2
 *
 * model.alias2 = 3;
 *
 * console.log(model.myProperty) // 3
 * console.log(model.alias1) // 3
 * console.log(model.alias2) // 3
 * ```
 *
 * @category Property Decorators
 */
function aliases(aliasesNames) {
    return (target, propertyKey) => {
        // TARGET IS THE CLASS PROTOTYPE
        (0, prop_1.setPropGettersAndSetters)(target, propertyKey);
        for (const alias of aliasesNames) {
            setAliasDescriptor(target, alias, propertyKey);
        }
    };
}
exports.aliases = aliases;
/** @internal */
function transformAliasAttributes(target, item) {
    return Object.entries(item).reduce((agg, [key, value]) => {
        agg[(0, exports.getAliasTarget)(target, key)] = value;
        return agg;
    }, {});
}
exports.transformAliasAttributes = transformAliasAttributes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXNlcy5qcyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlcyI6WyJsaWIvRGVjb3JhdG9ycy9hbGlhc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDRCQUEwQjtBQUMxQixpQ0FBa0Q7QUFFbEQsTUFBTSxxQkFBcUIsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFbkQsZ0JBQWdCO0FBQ1QsTUFBTSxhQUFhLEdBQUcsQ0FBQyxNQUFXLEVBQTBCLEVBQUU7SUFDbkUsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNsRSxDQUFDLENBQUM7QUFGVyxRQUFBLGFBQWEsaUJBRXhCO0FBRUYsZ0JBQWdCO0FBQ1QsTUFBTSxjQUFjLEdBQUcsQ0FBQyxNQUFXLEVBQUUsR0FBVyxFQUFVLEVBQUU7SUFDakUsT0FBTyxJQUFBLHFCQUFhLEVBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQzNDLENBQUMsQ0FBQztBQUZXLFFBQUEsY0FBYyxrQkFFekI7QUFFRixnQkFBZ0I7QUFDaEIsU0FBZ0Isa0JBQWtCLENBQUMsTUFBVyxFQUFFLFFBQWdCLEVBQUUsV0FBbUI7SUFDbkYsb0NBQW9DO0lBQ3BDLElBQUksVUFBVSxHQUEyQixPQUFPLENBQUMsV0FBVyxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRTVGLElBQUksVUFBVSxJQUFJLElBQUk7UUFBRSxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3hDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxXQUFXLENBQUM7SUFFbkMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFbEUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFO1FBQ3RDLEdBQUc7WUFDRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUNELEdBQUcsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUNELFlBQVksRUFBRSxJQUFJO1FBQ2xCLFVBQVUsRUFBRSxLQUFLO0tBQ2xCLENBQUMsQ0FBQztBQUNMLENBQUM7QUFuQkQsZ0RBbUJDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FrQ0c7QUFDSCxTQUFnQixPQUFPLENBQUMsV0FBbUI7SUFDekMsT0FBTyxDQUFDLE1BQVcsRUFBRSxXQUFtQixFQUFRLEVBQUU7UUFDaEQsZ0NBQWdDO1FBQ2hDLElBQUEsK0JBQXdCLEVBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzlDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDdkQsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQU5ELDBCQU1DO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUNHO0FBQ0gsU0FBZ0IsT0FBTyxDQUFDLFlBQXNCO0lBQzVDLE9BQU8sQ0FBQyxNQUFXLEVBQUUsV0FBbUIsRUFBUSxFQUFFO1FBQ2hELGdDQUFnQztRQUNoQyxJQUFBLCtCQUF3QixFQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztRQUU5QyxLQUFLLE1BQU0sS0FBSyxJQUFJLFlBQVksRUFBRTtZQUNoQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ2hEO0lBQ0gsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVRELDBCQVNDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLHdCQUF3QixDQUFDLE1BQVcsRUFBRSxJQUF5QjtJQUM3RSxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBZ0IsRUFBRSxFQUFFO1FBQ3RFLEdBQUcsQ0FBQyxJQUFBLHNCQUFjLEVBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3pDLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQyxFQUFFLEVBQXlCLENBQUMsQ0FBQztBQUNoQyxDQUFDO0FBTEQsNERBS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuaW1wb3J0IHsgc2V0UHJvcEdldHRlcnNBbmRTZXR0ZXJzIH0gZnJvbSAnLi9wcm9wJztcblxuY29uc3QgYWxpYXNlc01hcE1ldGFkYXRhS2V5ID0gU3ltYm9sKCdhbGlhc2VzTWFwJyk7XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBjb25zdCBnZXRBbGlhc2VzTWFwID0gKHRhcmdldDogYW55KTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9PiB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKGFsaWFzZXNNYXBNZXRhZGF0YUtleSwgdGFyZ2V0KSB8fCB7fTtcbn07XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBjb25zdCBnZXRBbGlhc1RhcmdldCA9ICh0YXJnZXQ6IGFueSwga2V5OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICByZXR1cm4gZ2V0QWxpYXNlc01hcCh0YXJnZXQpW2tleV0gfHwga2V5O1xufTtcblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEFsaWFzRGVzY3JpcHRvcih0YXJnZXQ6IGFueSwgYWxpYXNLZXk6IHN0cmluZywgcHJvcGVydHlLZXk6IHN0cmluZyk6IHZvaWQge1xuICAvLyBTRVQgVEhFIEFMSUFTIE1BUCBJTiBUSEUgSU5TVEFOQ0VcbiAgbGV0IGFsaWFzZXNNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSBSZWZsZWN0LmdldE1ldGFkYXRhKGFsaWFzZXNNYXBNZXRhZGF0YUtleSwgdGFyZ2V0KTtcblxuICBpZiAoYWxpYXNlc01hcCA9PSBudWxsKSBhbGlhc2VzTWFwID0ge307XG4gIGFsaWFzZXNNYXBbYWxpYXNLZXldID0gcHJvcGVydHlLZXk7XG5cbiAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShhbGlhc2VzTWFwTWV0YWRhdGFLZXksIGFsaWFzZXNNYXAsIHRhcmdldCk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgYWxpYXNLZXksIHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUocHJvcGVydHlLZXkpO1xuICAgIH0sXG4gICAgc2V0KHYpIHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKHByb3BlcnR5S2V5LCB2KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgfSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgZGVjb3JhdGVkIHByb3BlcnR5IGFzIGFuIGFsaWFzIG9mIGFub3RoZXIgcHJvcGVydHkuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWxpYXNUb05hbWUgLSBUaGUgbmFtZSBvZiB0aGUgcHJvcCB0byB3aGljaCB0aGlzIHByb3Agc2hvdWxkIGJlIGFuIGFsaWFzIG9mLlxuICogQHJlbWFya3NcbiAqXG4gKiBPbmNlIHRoZSBhbGlhc1RvIGRlY29yYXRvciBpcyBzZXQgb24gYW4gRW50aXR5IENsYXNzIG1vZGVsIHByb3BlcnR5LCB0aGUgaW5zdGFuY2UsIHRoZSBzZXR0ZXJzIGFuZCBnZXR0ZXJzIHdpbGwgYmUgc2V0IGFuZCBib3RoIHZhcmlhYmxlcyB3aWxsIGJlIGxpbmtlZC5cbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqIGNsYXNzIE1vZGVsIGV4dGVuZHMgRW50aXR5IHtcbiAqICAgIG15UHJvcGVydHkgbnVtYmVyO1xuICpcbiAqICAgIEBhbGlhc1RvKCdteVByb3BlcnR5JylcbiAqICAgIGFsaWFzUHJvcGVydHk6IG51bWJlcjtcbiAqIH1cbiAqXG4gKiBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbCh7XG4gKiAgICBhbGlhc1Byb3BlcnR5OiAxO1xuICogfSlcbiAqXG4gKiBjb25zb2xlLmxvZyhtb2RlbC5teVByb3BlcnR5KSAvLyAxXG4gKiBjb25zb2xlLmxvZyhtb2RlbC5hbGlhc1Byb3BlcnR5KSAvLyAxXG4gKlxuICogbW9kZWwubXlQcm9wZXJ0eSA9IDI7XG4gKlxuICogY29uc29sZS5sb2cobW9kZWwubXlQcm9wZXJ0eSkgLy8gMlxuICogY29uc29sZS5sb2cobW9kZWwuYWxpYXNQcm9wZXJ0eSkgLy8gMlxuICpcbiAqIG1vZGVsLmFsaWFzUHJvcGVydHkgPSAzO1xuICpcbiAqIGNvbnNvbGUubG9nKG1vZGVsLm15UHJvcGVydHkpIC8vIDNcbiAqIGNvbnNvbGUubG9nKG1vZGVsLmFsaWFzUHJvcGVydHkpIC8vIDNcbiAqIGBgYFxuICpcbiAqIEBjYXRlZ29yeSBQcm9wZXJ0eSBEZWNvcmF0b3JzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGlhc1RvKGFsaWFzVG9OYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIC8vIFRBUkdFVCBJUyBUSEUgQ0xBU1MgUFJPVE9UWVBFXG4gICAgc2V0UHJvcEdldHRlcnNBbmRTZXR0ZXJzKHRhcmdldCwgYWxpYXNUb05hbWUpO1xuICAgIHNldEFsaWFzRGVzY3JpcHRvcih0YXJnZXQsIHByb3BlcnR5S2V5LCBhbGlhc1RvTmFtZSk7XG4gIH07XG59XG5cbi8qKlxuICogU2V0cyBhIGxpc3Qgb2YgYWxpYXNlcyBmb3IgdGhlIGRlY29yYXRlZCBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB7c3RyaW5nW119IGFsaWFzZXNOYW1lcyAtIEEgbGlzdCBvZiBhbGlhc2VzIGZvciB0aGUgY3VycmVudCBwcm9wZXJ0eS5cbiAqIEByZW1hcmtzXG4gKlxuICogT25jZSB0aGUgYWxpYXNlcyBkZWNvcmF0b3IgaXMgc2V0IG9uIGFuIEVudGl0eSBDbGFzcyBtb2RlbCBwcm9wZXJ0eSwgdGhlIGluc3RhbmNlIHdpbGwgaGF2ZSBnZXR0ZXJzIGFuZCBzZXR0ZXJzIG9mIGVhY2ggb2YgdGhlIGFsaWFzZXMuXG4gKiBAZXhhbXBsZVxuICogYGBgXG4gKiBjbGFzcyBNb2RlbCBleHRlbmRzIEVudGl0eSB7XG4gKiAgIEBhbGlhc2VzKFsnYWxpYXMxJywgJ2FsaWFzMiddKVxuICogICBteVByb3BlcnR5IG51bWJlcjtcbiAqIH1cbiAqXG4gKiBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbCh7XG4gKiAgIGFsaWFzMTogMSxcbiAqIH0pO1xuICpcbiAqIGNvbnNvbGUubG9nKG1vZGVsLm15UHJvcGVydHkpIC8vIDFcbiAqIGNvbnNvbGUubG9nKG1vZGVsLmFsaWFzMSkgLy8gMVxuICogY29uc29sZS5sb2cobW9kZWwuYWxpYXMyKSAvLyAxXG4gKlxuICogbW9kZWwubXlQcm9wZXJ0eSA9IDI7XG4gKlxuICogY29uc29sZS5sb2cobW9kZWwubXlQcm9wZXJ0eSkgLy8gMlxuICogY29uc29sZS5sb2cobW9kZWwuYWxpYXMxKSAvLyAyXG4gKiBjb25zb2xlLmxvZyhtb2RlbC5hbGlhczIpIC8vIDJcbiAqXG4gKiBtb2RlbC5hbGlhczIgPSAzO1xuICpcbiAqIGNvbnNvbGUubG9nKG1vZGVsLm15UHJvcGVydHkpIC8vIDNcbiAqIGNvbnNvbGUubG9nKG1vZGVsLmFsaWFzMSkgLy8gM1xuICogY29uc29sZS5sb2cobW9kZWwuYWxpYXMyKSAvLyAzXG4gKiBgYGBcbiAqXG4gKiBAY2F0ZWdvcnkgUHJvcGVydHkgRGVjb3JhdG9yc1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWxpYXNlcyhhbGlhc2VzTmFtZXM6IHN0cmluZ1tdKSB7XG4gIHJldHVybiAodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAvLyBUQVJHRVQgSVMgVEhFIENMQVNTIFBST1RPVFlQRVxuICAgIHNldFByb3BHZXR0ZXJzQW5kU2V0dGVycyh0YXJnZXQsIHByb3BlcnR5S2V5KTtcblxuICAgIGZvciAoY29uc3QgYWxpYXMgb2YgYWxpYXNlc05hbWVzKSB7XG4gICAgICBzZXRBbGlhc0Rlc2NyaXB0b3IodGFyZ2V0LCBhbGlhcywgcHJvcGVydHlLZXkpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUFsaWFzQXR0cmlidXRlcyh0YXJnZXQ6IGFueSwgaXRlbTogUmVjb3JkPHN0cmluZywgYW55Pikge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoaXRlbSkucmVkdWNlKChhZ2csIFtrZXksIHZhbHVlXTogW3N0cmluZywgYW55XSkgPT4ge1xuICAgIGFnZ1tnZXRBbGlhc1RhcmdldCh0YXJnZXQsIGtleSldID0gdmFsdWU7XG4gICAgcmV0dXJuIGFnZztcbiAgfSwge30gYXMgUmVjb3JkPHN0cmluZywgYW55Pik7XG59XG4iXX0=