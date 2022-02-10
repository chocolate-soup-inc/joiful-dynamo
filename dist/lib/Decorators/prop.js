"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prop = exports.setPropGettersAndSetters = exports.setPropDescriptor = exports.getUpdatedAtKey = exports.getCreatedAtKey = exports.getSecondaryKey = exports.getPrimaryKey = void 0;
require("reflect-metadata");
const propMetadataKey = Symbol('prop');
const primaryKeyMetadataKey = 'primaryKey';
const secondaryKeyMetadataKey = 'secondaryKey';
const createdAtKeyMetadataKey = 'createdAtKey';
const updatedAtKeyMetadataKey = 'updatedAtKey';
/** @internal */
function getPrimaryKey(target) {
    return Reflect.getMetadata(primaryKeyMetadataKey, target);
}
exports.getPrimaryKey = getPrimaryKey;
/** @internal */
function getSecondaryKey(target) {
    return Reflect.getMetadata(secondaryKeyMetadataKey, target);
}
exports.getSecondaryKey = getSecondaryKey;
/** @internal */
function getCreatedAtKey(target) {
    return Reflect.getMetadata(createdAtKeyMetadataKey, target);
}
exports.getCreatedAtKey = getCreatedAtKey;
/** @internal */
function getUpdatedAtKey(target) {
    return Reflect.getMetadata(updatedAtKeyMetadataKey, target);
}
exports.getUpdatedAtKey = getUpdatedAtKey;
/** @internal */
function setPropDescriptor(target, propertyKey) {
    Object.defineProperty(target, propertyKey, {
        get() {
            return this.getAttribute(propertyKey);
        },
        set(v) {
            this.setAttribute(propertyKey, v);
        },
        configurable: true,
        enumerable: true,
    });
}
exports.setPropDescriptor = setPropDescriptor;
/** @internal */
function setPropGettersAndSetters(target, propertyKey) {
    // SET THE LIST OF VALIDATED PROPERTIES IN THE INSTANCE
    const properties = Reflect.getMetadata(propMetadataKey, target) || [];
    if (properties.includes(propertyKey))
        return;
    properties.push(propertyKey);
    Reflect.defineMetadata(propMetadataKey, properties, target);
    if (Object.getOwnPropertyDescriptor(target, propertyKey) == null) {
        setPropDescriptor(target, propertyKey);
    }
}
exports.setPropGettersAndSetters = setPropGettersAndSetters;
/**
 * Sets the decorated property as a mapped property of the Entity setting its setters and getters (this is important for the attribute mapping for inserting in the database). Besides this, all the parameters initialized with the entity model will have the correct setters and getters. You can also set some properties as primaryKeys, secondaryKeys, createdAt or updatedAt.
 * @param {Object} [opts] - The list of options.
 * @param {boolean} [opts.primaryKey] - If true, the decorated property will be the entity Primary Key.
 * @param {boolean} [opts.secondary] - If true, the decorated property will be the entity Secondary Key.
 * @param {boolean} [opts.createdAt] - If true, the decorated property will be the entity created at field, being overwritten with the current date iso string when created.
 * @param {boolean} [opts.updatedAt] - If true, the decorated property will be the entity updated at field, being overwritten with the current date iso string when created or updated.
 * @example
 * ```
 * class Model extends Entity {
 *   @prop({ primaryKey: true })
 *   property1: string;
 *
 *   @prop({ secondaryKey: true })
 *   property2: string;
 *
 *   @prop({ createdAt: true })
 *   cAt: string;
 *
 *   @prop({ updatedAt: true })
 *   uAt: string;
 * }
 *
 * const model = new Model({
 *   property1: '1',
 *   property2: '2',
 *   cAt: '3',
 *   uAt: '4',
 *   extraAttribute: '5',
 * });
 *
 * console.log(model.property1) // '1'
 * console.log(model.property2) // '2'
 * console.log(model.cAt) // '3'
 * console.log(model.uAt) // '4'
 * console.log(model.extraAttribute) // '5'
 *
 * model.property1 = 'changed1';
 * console.log(model.property1) // 'changed1';
 *
 * model.property2 = 'changed2';
 * console.log(model.property2) // 'changed2';
 *
 * model.cAt = 'changed3';
 * console.log(model.cAt) // 'changed3';
 *
 * model.uAt = 'changed4';
 * console.log(model.uAt) // 'changed4';
 *
 * model.extraAttribute = 'changed5';
 * console.log(model.extraAttribute) // 'changed5';
 *
 * model.extraAttribute2 = 'changed6'; // ERROR: the setter does not exist!
 *
 * console.log(model._primaryKey) // 'property1';
 * console.log(model._secondaryKey) // 'property2';
 * console.log(model._createdAtKey) // 'cAt';
 * console.log(model._updatedAtKey) // 'uAt';
 *
 * model.create(); // In the database it will be saved like this: { property1: 'Model-changed1', property2: 'Model-changed2', cAt: '2022-02-07T16:16:44.975Z', uAt: '2022-02-07T16:16:44.975Z', extraAttribute: 'changed5' };
 * ```
 *
 * @category Property Decorators
 */
function prop(opts) {
    return (target, propertyKey) => {
        // TARGET IS THE CLASS PROTOTYPE
        setPropGettersAndSetters(target, propertyKey);
        const obj = {
            [primaryKeyMetadataKey]: opts === null || opts === void 0 ? void 0 : opts.primaryKey,
            [secondaryKeyMetadataKey]: opts === null || opts === void 0 ? void 0 : opts.secondaryKey,
            [createdAtKeyMetadataKey]: opts === null || opts === void 0 ? void 0 : opts.createdAt,
            [updatedAtKeyMetadataKey]: opts === null || opts === void 0 ? void 0 : opts.updatedAt,
        };
        Object.entries(obj).forEach(([key, value]) => {
            if (value) {
                const currentValue = Reflect.getMetadata(key, target);
                if (currentValue != null) {
                    throw new Error(`Cannot have 2 properties as ${key}`);
                }
                else {
                    Reflect.defineMetadata(key, propertyKey, target);
                }
            }
        });
    };
}
exports.prop = prop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcC5qcyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlcyI6WyJsaWIvRGVjb3JhdG9ycy9wcm9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDRCQUEwQjtBQVMxQixNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdkMsTUFBTSxxQkFBcUIsR0FBRyxZQUFZLENBQUM7QUFDM0MsTUFBTSx1QkFBdUIsR0FBRyxjQUFjLENBQUM7QUFDL0MsTUFBTSx1QkFBdUIsR0FBRyxjQUFjLENBQUM7QUFDL0MsTUFBTSx1QkFBdUIsR0FBRyxjQUFjLENBQUM7QUFFL0MsZ0JBQWdCO0FBQ2hCLFNBQWdCLGFBQWEsQ0FBQyxNQUFXO0lBQ3ZDLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRkQsc0NBRUM7QUFFRCxnQkFBZ0I7QUFDaEIsU0FBZ0IsZUFBZSxDQUFDLE1BQVc7SUFDekMsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFGRCwwQ0FFQztBQUVELGdCQUFnQjtBQUNoQixTQUFnQixlQUFlLENBQUMsTUFBVztJQUN6QyxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsdUJBQXVCLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUZELDBDQUVDO0FBRUQsZ0JBQWdCO0FBQ2hCLFNBQWdCLGVBQWUsQ0FBQyxNQUFXO0lBQ3pDLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRkQsMENBRUM7QUFFRCxnQkFBZ0I7QUFDaEIsU0FBZ0IsaUJBQWlCLENBQUMsTUFBVyxFQUFFLFdBQW1CO0lBQ2hFLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRTtRQUN6QyxHQUFHO1lBQ0QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFDRCxHQUFHLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxZQUFZLEVBQUUsSUFBSTtRQUNsQixVQUFVLEVBQUUsSUFBSTtLQUNqQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBWEQsOENBV0M7QUFFRCxnQkFBZ0I7QUFDaEIsU0FBZ0Isd0JBQXdCLENBQUMsTUFBVyxFQUFFLFdBQW1CO0lBQ3ZFLHVEQUF1RDtJQUN2RCxNQUFNLFVBQVUsR0FBYSxPQUFPLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFaEYsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztRQUFFLE9BQU87SUFFN0MsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUM3QixPQUFPLENBQUMsY0FBYyxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFNUQsSUFBSSxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxJQUFJLElBQUksRUFBRTtRQUNoRSxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDeEM7QUFDSCxDQUFDO0FBWkQsNERBWUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBK0RHO0FBQ0gsU0FBZ0IsSUFBSSxDQUFDLElBQWtCO0lBQ3JDLE9BQU8sQ0FBQyxNQUFXLEVBQUUsV0FBbUIsRUFBRSxFQUFFO1FBQzFDLGdDQUFnQztRQUNoQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFOUMsTUFBTSxHQUFHLEdBQUc7WUFDVixDQUFDLHFCQUFxQixDQUFDLEVBQUUsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFVBQVU7WUFDekMsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxZQUFZO1lBQzdDLENBQUMsdUJBQXVCLENBQUMsRUFBRSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsU0FBUztZQUMxQyxDQUFDLHVCQUF1QixDQUFDLEVBQUUsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFNBQVM7U0FDM0MsQ0FBQztRQUVGLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUMzQyxJQUFJLEtBQUssRUFBRTtnQkFDVCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxZQUFZLElBQUksSUFBSSxFQUFFO29CQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixHQUFHLEVBQUUsQ0FBQyxDQUFDO2lCQUN2RDtxQkFBTTtvQkFDTCxPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ2xEO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUM7QUF2QkQsb0JBdUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcblxuZXhwb3J0IHR5cGUgUHJvcE9wdGlvbnMgPSB7XG4gIHByaW1hcnlLZXk/OiBib29sZWFuO1xuICBzZWNvbmRhcnlLZXk/OiBib29sZWFuO1xuICBjcmVhdGVkQXQ/OiBib29sZWFuO1xuICB1cGRhdGVkQXQ/OiBib29sZWFuO1xufTtcblxuY29uc3QgcHJvcE1ldGFkYXRhS2V5ID0gU3ltYm9sKCdwcm9wJyk7XG5jb25zdCBwcmltYXJ5S2V5TWV0YWRhdGFLZXkgPSAncHJpbWFyeUtleSc7XG5jb25zdCBzZWNvbmRhcnlLZXlNZXRhZGF0YUtleSA9ICdzZWNvbmRhcnlLZXknO1xuY29uc3QgY3JlYXRlZEF0S2V5TWV0YWRhdGFLZXkgPSAnY3JlYXRlZEF0S2V5JztcbmNvbnN0IHVwZGF0ZWRBdEtleU1ldGFkYXRhS2V5ID0gJ3VwZGF0ZWRBdEtleSc7XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmltYXJ5S2V5KHRhcmdldDogYW55KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEocHJpbWFyeUtleU1ldGFkYXRhS2V5LCB0YXJnZXQpO1xufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2Vjb25kYXJ5S2V5KHRhcmdldDogYW55KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoc2Vjb25kYXJ5S2V5TWV0YWRhdGFLZXksIHRhcmdldCk7XG59XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDcmVhdGVkQXRLZXkodGFyZ2V0OiBhbnkpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShjcmVhdGVkQXRLZXlNZXRhZGF0YUtleSwgdGFyZ2V0KTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFVwZGF0ZWRBdEtleSh0YXJnZXQ6IGFueSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKHVwZGF0ZWRBdEtleU1ldGFkYXRhS2V5LCB0YXJnZXQpO1xufVxuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJvcERlc2NyaXB0b3IodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcGVydHlLZXksIHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUocHJvcGVydHlLZXkpO1xuICAgIH0sXG4gICAgc2V0KHYpIHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKHByb3BlcnR5S2V5LCB2KTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICB9KTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFByb3BHZXR0ZXJzQW5kU2V0dGVycyh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZyk6IHZvaWQge1xuICAvLyBTRVQgVEhFIExJU1QgT0YgVkFMSURBVEVEIFBST1BFUlRJRVMgSU4gVEhFIElOU1RBTkNFXG4gIGNvbnN0IHByb3BlcnRpZXM6IHN0cmluZ1tdID0gUmVmbGVjdC5nZXRNZXRhZGF0YShwcm9wTWV0YWRhdGFLZXksIHRhcmdldCkgfHwgW107XG5cbiAgaWYgKHByb3BlcnRpZXMuaW5jbHVkZXMocHJvcGVydHlLZXkpKSByZXR1cm47XG5cbiAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5S2V5KTtcbiAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShwcm9wTWV0YWRhdGFLZXksIHByb3BlcnRpZXMsIHRhcmdldCk7XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBwcm9wZXJ0eUtleSkgPT0gbnVsbCkge1xuICAgIHNldFByb3BEZXNjcmlwdG9yKHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB0aGUgZGVjb3JhdGVkIHByb3BlcnR5IGFzIGEgbWFwcGVkIHByb3BlcnR5IG9mIHRoZSBFbnRpdHkgc2V0dGluZyBpdHMgc2V0dGVycyBhbmQgZ2V0dGVycyAodGhpcyBpcyBpbXBvcnRhbnQgZm9yIHRoZSBhdHRyaWJ1dGUgbWFwcGluZyBmb3IgaW5zZXJ0aW5nIGluIHRoZSBkYXRhYmFzZSkuIEJlc2lkZXMgdGhpcywgYWxsIHRoZSBwYXJhbWV0ZXJzIGluaXRpYWxpemVkIHdpdGggdGhlIGVudGl0eSBtb2RlbCB3aWxsIGhhdmUgdGhlIGNvcnJlY3Qgc2V0dGVycyBhbmQgZ2V0dGVycy4gWW91IGNhbiBhbHNvIHNldCBzb21lIHByb3BlcnRpZXMgYXMgcHJpbWFyeUtleXMsIHNlY29uZGFyeUtleXMsIGNyZWF0ZWRBdCBvciB1cGRhdGVkQXQuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdHNdIC0gVGhlIGxpc3Qgb2Ygb3B0aW9ucy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMucHJpbWFyeUtleV0gLSBJZiB0cnVlLCB0aGUgZGVjb3JhdGVkIHByb3BlcnR5IHdpbGwgYmUgdGhlIGVudGl0eSBQcmltYXJ5IEtleS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdHMuc2Vjb25kYXJ5XSAtIElmIHRydWUsIHRoZSBkZWNvcmF0ZWQgcHJvcGVydHkgd2lsbCBiZSB0aGUgZW50aXR5IFNlY29uZGFyeSBLZXkuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLmNyZWF0ZWRBdF0gLSBJZiB0cnVlLCB0aGUgZGVjb3JhdGVkIHByb3BlcnR5IHdpbGwgYmUgdGhlIGVudGl0eSBjcmVhdGVkIGF0IGZpZWxkLCBiZWluZyBvdmVyd3JpdHRlbiB3aXRoIHRoZSBjdXJyZW50IGRhdGUgaXNvIHN0cmluZyB3aGVuIGNyZWF0ZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRzLnVwZGF0ZWRBdF0gLSBJZiB0cnVlLCB0aGUgZGVjb3JhdGVkIHByb3BlcnR5IHdpbGwgYmUgdGhlIGVudGl0eSB1cGRhdGVkIGF0IGZpZWxkLCBiZWluZyBvdmVyd3JpdHRlbiB3aXRoIHRoZSBjdXJyZW50IGRhdGUgaXNvIHN0cmluZyB3aGVuIGNyZWF0ZWQgb3IgdXBkYXRlZC5cbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqIGNsYXNzIE1vZGVsIGV4dGVuZHMgRW50aXR5IHtcbiAqICAgQHByb3AoeyBwcmltYXJ5S2V5OiB0cnVlIH0pXG4gKiAgIHByb3BlcnR5MTogc3RyaW5nO1xuICpcbiAqICAgQHByb3AoeyBzZWNvbmRhcnlLZXk6IHRydWUgfSlcbiAqICAgcHJvcGVydHkyOiBzdHJpbmc7XG4gKlxuICogICBAcHJvcCh7IGNyZWF0ZWRBdDogdHJ1ZSB9KVxuICogICBjQXQ6IHN0cmluZztcbiAqXG4gKiAgIEBwcm9wKHsgdXBkYXRlZEF0OiB0cnVlIH0pXG4gKiAgIHVBdDogc3RyaW5nO1xuICogfVxuICpcbiAqIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsKHtcbiAqICAgcHJvcGVydHkxOiAnMScsXG4gKiAgIHByb3BlcnR5MjogJzInLFxuICogICBjQXQ6ICczJyxcbiAqICAgdUF0OiAnNCcsXG4gKiAgIGV4dHJhQXR0cmlidXRlOiAnNScsXG4gKiB9KTtcbiAqXG4gKiBjb25zb2xlLmxvZyhtb2RlbC5wcm9wZXJ0eTEpIC8vICcxJ1xuICogY29uc29sZS5sb2cobW9kZWwucHJvcGVydHkyKSAvLyAnMidcbiAqIGNvbnNvbGUubG9nKG1vZGVsLmNBdCkgLy8gJzMnXG4gKiBjb25zb2xlLmxvZyhtb2RlbC51QXQpIC8vICc0J1xuICogY29uc29sZS5sb2cobW9kZWwuZXh0cmFBdHRyaWJ1dGUpIC8vICc1J1xuICpcbiAqIG1vZGVsLnByb3BlcnR5MSA9ICdjaGFuZ2VkMSc7XG4gKiBjb25zb2xlLmxvZyhtb2RlbC5wcm9wZXJ0eTEpIC8vICdjaGFuZ2VkMSc7XG4gKlxuICogbW9kZWwucHJvcGVydHkyID0gJ2NoYW5nZWQyJztcbiAqIGNvbnNvbGUubG9nKG1vZGVsLnByb3BlcnR5MikgLy8gJ2NoYW5nZWQyJztcbiAqXG4gKiBtb2RlbC5jQXQgPSAnY2hhbmdlZDMnO1xuICogY29uc29sZS5sb2cobW9kZWwuY0F0KSAvLyAnY2hhbmdlZDMnO1xuICpcbiAqIG1vZGVsLnVBdCA9ICdjaGFuZ2VkNCc7XG4gKiBjb25zb2xlLmxvZyhtb2RlbC51QXQpIC8vICdjaGFuZ2VkNCc7XG4gKlxuICogbW9kZWwuZXh0cmFBdHRyaWJ1dGUgPSAnY2hhbmdlZDUnO1xuICogY29uc29sZS5sb2cobW9kZWwuZXh0cmFBdHRyaWJ1dGUpIC8vICdjaGFuZ2VkNSc7XG4gKlxuICogbW9kZWwuZXh0cmFBdHRyaWJ1dGUyID0gJ2NoYW5nZWQ2JzsgLy8gRVJST1I6IHRoZSBzZXR0ZXIgZG9lcyBub3QgZXhpc3QhXG4gKlxuICogY29uc29sZS5sb2cobW9kZWwuX3ByaW1hcnlLZXkpIC8vICdwcm9wZXJ0eTEnO1xuICogY29uc29sZS5sb2cobW9kZWwuX3NlY29uZGFyeUtleSkgLy8gJ3Byb3BlcnR5Mic7XG4gKiBjb25zb2xlLmxvZyhtb2RlbC5fY3JlYXRlZEF0S2V5KSAvLyAnY0F0JztcbiAqIGNvbnNvbGUubG9nKG1vZGVsLl91cGRhdGVkQXRLZXkpIC8vICd1QXQnO1xuICpcbiAqIG1vZGVsLmNyZWF0ZSgpOyAvLyBJbiB0aGUgZGF0YWJhc2UgaXQgd2lsbCBiZSBzYXZlZCBsaWtlIHRoaXM6IHsgcHJvcGVydHkxOiAnTW9kZWwtY2hhbmdlZDEnLCBwcm9wZXJ0eTI6ICdNb2RlbC1jaGFuZ2VkMicsIGNBdDogJzIwMjItMDItMDdUMTY6MTY6NDQuOTc1WicsIHVBdDogJzIwMjItMDItMDdUMTY6MTY6NDQuOTc1WicsIGV4dHJhQXR0cmlidXRlOiAnY2hhbmdlZDUnIH07XG4gKiBgYGBcbiAqXG4gKiBAY2F0ZWdvcnkgUHJvcGVydHkgRGVjb3JhdG9yc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvcChvcHRzPzogUHJvcE9wdGlvbnMpIHtcbiAgcmV0dXJuICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xuICAgIC8vIFRBUkdFVCBJUyBUSEUgQ0xBU1MgUFJPVE9UWVBFXG4gICAgc2V0UHJvcEdldHRlcnNBbmRTZXR0ZXJzKHRhcmdldCwgcHJvcGVydHlLZXkpO1xuXG4gICAgY29uc3Qgb2JqID0ge1xuICAgICAgW3ByaW1hcnlLZXlNZXRhZGF0YUtleV06IG9wdHM/LnByaW1hcnlLZXksXG4gICAgICBbc2Vjb25kYXJ5S2V5TWV0YWRhdGFLZXldOiBvcHRzPy5zZWNvbmRhcnlLZXksXG4gICAgICBbY3JlYXRlZEF0S2V5TWV0YWRhdGFLZXldOiBvcHRzPy5jcmVhdGVkQXQsXG4gICAgICBbdXBkYXRlZEF0S2V5TWV0YWRhdGFLZXldOiBvcHRzPy51cGRhdGVkQXQsXG4gICAgfTtcblxuICAgIE9iamVjdC5lbnRyaWVzKG9iaikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gUmVmbGVjdC5nZXRNZXRhZGF0YShrZXksIHRhcmdldCk7XG4gICAgICAgIGlmIChjdXJyZW50VmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGhhdmUgMiBwcm9wZXJ0aWVzIGFzICR7a2V5fWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoa2V5LCBwcm9wZXJ0eUtleSwgdGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufVxuIl19