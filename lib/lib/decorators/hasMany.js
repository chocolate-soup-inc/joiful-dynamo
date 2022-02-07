"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformHasManyAttributes = exports.hasMany = exports.setHasManyDescriptor = exports.getHasManyNotNestedModels = exports.getHasManyNestedModels = exports.getHasManyModel = exports.getHasManyModels = void 0;
const joi_1 = __importDefault(require("joi"));
const lodash_1 = __importDefault(require("lodash"));
require("reflect-metadata");
const hasManyMetadataKey = Symbol('hasMany');
function getHasManyModels(target) {
    return Reflect.getMetadata(hasManyMetadataKey, target);
}
exports.getHasManyModels = getHasManyModels;
function getHasManyModel(target, propertyKey) {
    return Reflect.getMetadata(hasManyMetadataKey, target, propertyKey);
}
exports.getHasManyModel = getHasManyModel;
function getHasManyNestedModels(target) {
    const models = getHasManyModels(target) || [];
    return models.filter((model) => {
        const { opts, } = getHasManyModel(target, model) || {};
        return opts === null || opts === void 0 ? void 0 : opts.nestedObject;
    });
}
exports.getHasManyNestedModels = getHasManyNestedModels;
function getHasManyNotNestedModels(target) {
    const models = getHasManyModels(target) || [];
    return models.filter((model) => {
        const { opts, } = getHasManyModel(target, model) || {};
        return !(opts === null || opts === void 0 ? void 0 : opts.nestedObject);
    });
}
exports.getHasManyNotNestedModels = getHasManyNotNestedModels;
function setHasManyDescriptor(target, modelName, ChildModel) {
    const propertyKey = `_${hasManyMetadataKey.toString()}_${modelName}`;
    if (target[propertyKey] == null)
        target[propertyKey] = [];
    Object.defineProperty(target, modelName, {
        get() {
            return target[propertyKey];
        },
        set(value) {
            try {
                joi_1.default.assert(value, joi_1.default
                    .array()
                    .items(joi_1.default
                    .any()
                    .custom((v) => (v instanceof ChildModel))));
                target[propertyKey] = value;
            }
            catch (error) {
                joi_1.default.assert(value, joi_1.default
                    .array()
                    .items(joi_1.default
                    .object()
                    .unknown(true)));
            }
            target[propertyKey] = value.map((v) => new ChildModel(v));
        },
        enumerable: true,
        configurable: false,
    });
}
exports.setHasManyDescriptor = setHasManyDescriptor;
function hasMany(ChildModel, opts) {
    return (target, propertyKey) => {
        const reflectTarget = target.constructor;
        Reflect.defineMetadata(hasManyMetadataKey, {
            model: ChildModel,
            opts,
        }, reflectTarget, propertyKey);
        let models = Reflect.getMetadata(hasManyMetadataKey, reflectTarget);
        if (models) {
            models.push(propertyKey);
        }
        else {
            models = [propertyKey];
        }
        Reflect.defineMetadata(hasManyMetadataKey, models, reflectTarget);
        setHasManyDescriptor(target, propertyKey, ChildModel);
    };
}
exports.hasMany = hasMany;
function transformHasManyAttributes(target, item) {
    const finalAttributes = lodash_1.default.cloneDeep(item);
    const nestedModels = getHasManyNestedModels(target) || [];
    for (const model of nestedModels) {
        if (item[model] != null) {
            finalAttributes[model] = item[model].map((value) => {
                const { model: ModelClass, } = getHasManyModel(target, model) || {};
                if (value instanceof ModelClass)
                    return value.attributes;
                // VALUE IS AN OBJECT
                const instance = new ModelClass(model);
                return instance.attributes;
            });
        }
    }
    const notNestedModels = getHasManyNotNestedModels(target) || [];
    for (const model of notNestedModels) {
        delete finalAttributes[model];
    }
    return finalAttributes;
}
exports.transformHasManyAttributes = transformHasManyAttributes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzTWFueS5qcyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlcyI6WyJsaWIvZGVjb3JhdG9ycy9oYXNNYW55LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUFzQjtBQUN0QixvREFBdUI7QUFDdkIsNEJBQTBCO0FBRzFCLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRTdDLFNBQWdCLGdCQUFnQixDQUFDLE1BQVc7SUFDMUMsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFGRCw0Q0FFQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxNQUFXLEVBQUUsV0FBbUI7SUFDOUQsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztBQUN0RSxDQUFDO0FBRkQsMENBRUM7QUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxNQUFXO0lBQ2hELE1BQU0sTUFBTSxHQUFhLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV4RCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM3QixNQUFNLEVBQ0osSUFBSSxHQUNMLEdBQUcsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFekMsT0FBTyxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsWUFBWSxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVZELHdEQVVDO0FBRUQsU0FBZ0IseUJBQXlCLENBQUMsTUFBVztJQUNuRCxNQUFNLE1BQU0sR0FBYSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFeEQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDN0IsTUFBTSxFQUNK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RUFBRSxDQUFDO0lBQ3BFLEtBQUssTUFBTSxLQUFLLElBQUksWUFBWSxFQUFFO1FBQ2hDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRTtZQUN2QixlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNqRCxNQUFNLEVBQ0osS0FBSyxFQUFFLFVBQVUsR0FDbEIsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFekMsSUFBSSxLQUFLLFlBQVksVUFBVTtvQkFBRSxPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUM7Z0JBRXpELHFCQUFxQjtnQkFDckIsTUFBTSxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZDLE9BQU8sUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUM3QixDQUFDLENBQUMsQ0FBQztTQUNKO0tBQ0Y7SUFFRCxNQUFNLGVBQWUsR0FBYSx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUUsS0FBSyxNQUFNLEtBQUssSUFBSSxlQUFlLEVBQUU7UUFDbkMsT0FBTyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDL0I7SUFFRCxPQUFPLGVBQWUsQ0FBQztBQUN6QixDQUFDO0FBMUJELGdFQTBCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBKb2kgZnJvbSAnam9pJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuaW1wb3J0IHsgQ29uc3RydWN0b3IsIFJlbGF0aW9uTW9kZWwsIFJlbGF0aW9uT3B0aW9ucyB9IGZyb20gJy4vZGVjb3JhdG9yVHlwZXMnO1xuXG5jb25zdCBoYXNNYW55TWV0YWRhdGFLZXkgPSBTeW1ib2woJ2hhc01hbnknKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc01hbnlNb2RlbHModGFyZ2V0OiBhbnkpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKGhhc01hbnlNZXRhZGF0YUtleSwgdGFyZ2V0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc01hbnlNb2RlbCh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZyk6IFJlbGF0aW9uTW9kZWwge1xuICByZXR1cm4gUmVmbGVjdC5nZXRNZXRhZGF0YShoYXNNYW55TWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzTWFueU5lc3RlZE1vZGVscyh0YXJnZXQ6IGFueSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbW9kZWxzOiBzdHJpbmdbXSA9IGdldEhhc01hbnlNb2RlbHModGFyZ2V0KSB8fCBbXTtcblxuICByZXR1cm4gbW9kZWxzLmZpbHRlcigobW9kZWwpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICBvcHRzLFxuICAgIH0gPSBnZXRIYXNNYW55TW9kZWwodGFyZ2V0LCBtb2RlbCkgfHwge307XG5cbiAgICByZXR1cm4gb3B0cz8ubmVzdGVkT2JqZWN0O1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc01hbnlOb3ROZXN0ZWRNb2RlbHModGFyZ2V0OiBhbnkpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG1vZGVsczogc3RyaW5nW10gPSBnZXRIYXNNYW55TW9kZWxzKHRhcmdldCkgfHwgW107XG5cbiAgcmV0dXJuIG1vZGVscy5maWx0ZXIoKG1vZGVsKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgb3B0cyxcbiAgICB9ID0gZ2V0SGFzTWFueU1vZGVsKHRhcmdldCwgbW9kZWwpIHx8IHt9O1xuXG4gICAgcmV0dXJuICFvcHRzPy5uZXN0ZWRPYmplY3Q7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SGFzTWFueURlc2NyaXB0b3IoXG4gIHRhcmdldDogYW55LFxuICBtb2RlbE5hbWU6IHN0cmluZyxcbiAgQ2hpbGRNb2RlbDogQ29uc3RydWN0b3IsXG4pIHtcbiAgY29uc3QgcHJvcGVydHlLZXkgPSBgXyR7aGFzTWFueU1ldGFkYXRhS2V5LnRvU3RyaW5nKCl9XyR7bW9kZWxOYW1lfWA7XG4gIGlmICh0YXJnZXRbcHJvcGVydHlLZXldID09IG51bGwpIHRhcmdldFtwcm9wZXJ0eUtleV0gPSBbXTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBtb2RlbE5hbWUsIHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGFyZ2V0W3Byb3BlcnR5S2V5XTtcbiAgICB9LFxuICAgIHNldCh2YWx1ZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgSm9pLmFzc2VydChcbiAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICBKb2lcbiAgICAgICAgICAgIC5hcnJheSgpXG4gICAgICAgICAgICAuaXRlbXMoXG4gICAgICAgICAgICAgIEpvaVxuICAgICAgICAgICAgICAgIC5hbnkoKVxuICAgICAgICAgICAgICAgIC5jdXN0b20oKHYpID0+ICh2IGluc3RhbmNlb2YgQ2hpbGRNb2RlbCkpLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgKTtcblxuICAgICAgICB0YXJnZXRbcHJvcGVydHlLZXldID0gdmFsdWU7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBKb2kuYXNzZXJ0KFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgIEpvaVxuICAgICAgICAgICAgLmFycmF5KClcbiAgICAgICAgICAgIC5pdGVtcyhcbiAgICAgICAgICAgICAgSm9pXG4gICAgICAgICAgICAgICAgLm9iamVjdCgpXG4gICAgICAgICAgICAgICAgLnVua25vd24odHJ1ZSksXG4gICAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICB0YXJnZXRbcHJvcGVydHlLZXldID0gdmFsdWUubWFwKCh2KSA9PiBuZXcgQ2hpbGRNb2RlbCh2KSk7XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzTWFueShDaGlsZE1vZGVsOiBDb25zdHJ1Y3Rvciwgb3B0cz86IFJlbGF0aW9uT3B0aW9ucykge1xuICByZXR1cm4gKHRhcmdldDogYW55LCBwcm9wZXJ0eUtleTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgY29uc3QgcmVmbGVjdFRhcmdldCA9IHRhcmdldC5jb25zdHJ1Y3RvcjtcbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKGhhc01hbnlNZXRhZGF0YUtleSwge1xuICAgICAgbW9kZWw6IENoaWxkTW9kZWwsXG4gICAgICBvcHRzLFxuICAgIH0sIHJlZmxlY3RUYXJnZXQsIHByb3BlcnR5S2V5KTtcblxuICAgIGxldCBtb2RlbHM6IHN0cmluZ1tdID0gUmVmbGVjdC5nZXRNZXRhZGF0YShoYXNNYW55TWV0YWRhdGFLZXksIHJlZmxlY3RUYXJnZXQpO1xuXG4gICAgaWYgKG1vZGVscykge1xuICAgICAgbW9kZWxzLnB1c2gocHJvcGVydHlLZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtb2RlbHMgPSBbcHJvcGVydHlLZXldO1xuICAgIH1cblxuICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXG4gICAgICBoYXNNYW55TWV0YWRhdGFLZXksXG4gICAgICBtb2RlbHMsXG4gICAgICByZWZsZWN0VGFyZ2V0LFxuICAgICk7XG5cbiAgICBzZXRIYXNNYW55RGVzY3JpcHRvcih0YXJnZXQsIHByb3BlcnR5S2V5LCBDaGlsZE1vZGVsKTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUhhc01hbnlBdHRyaWJ1dGVzKHRhcmdldDogYW55LCBpdGVtOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSB7XG4gIGNvbnN0IGZpbmFsQXR0cmlidXRlcyA9IF8uY2xvbmVEZWVwKGl0ZW0pO1xuXG4gIGNvbnN0IG5lc3RlZE1vZGVsczogc3RyaW5nW10gPSBnZXRIYXNNYW55TmVzdGVkTW9kZWxzKHRhcmdldCkgfHwgW107XG4gIGZvciAoY29uc3QgbW9kZWwgb2YgbmVzdGVkTW9kZWxzKSB7XG4gICAgaWYgKGl0ZW1bbW9kZWxdICE9IG51bGwpIHtcbiAgICAgIGZpbmFsQXR0cmlidXRlc1ttb2RlbF0gPSBpdGVtW21vZGVsXS5tYXAoKHZhbHVlKSA9PiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBtb2RlbDogTW9kZWxDbGFzcyxcbiAgICAgICAgfSA9IGdldEhhc01hbnlNb2RlbCh0YXJnZXQsIG1vZGVsKSB8fCB7fTtcblxuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBNb2RlbENsYXNzKSByZXR1cm4gdmFsdWUuYXR0cmlidXRlcztcblxuICAgICAgICAvLyBWQUxVRSBJUyBBTiBPQkpFQ1RcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgTW9kZWxDbGFzcyhtb2RlbCk7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5hdHRyaWJ1dGVzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgbm90TmVzdGVkTW9kZWxzOiBzdHJpbmdbXSA9IGdldEhhc01hbnlOb3ROZXN0ZWRNb2RlbHModGFyZ2V0KSB8fCBbXTtcbiAgZm9yIChjb25zdCBtb2RlbCBvZiBub3ROZXN0ZWRNb2RlbHMpIHtcbiAgICBkZWxldGUgZmluYWxBdHRyaWJ1dGVzW21vZGVsXTtcbiAgfVxuXG4gIHJldHVybiBmaW5hbEF0dHJpYnV0ZXM7XG59XG4iXX0=