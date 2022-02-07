"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformHasOneAttributes = exports.hasOne = exports.setHasOnePropertiesDescriptor = exports.setHasOneDescriptor = exports.getHasOneProperty = exports.getHasOneProperties = exports.getHasOneNotNestedModels = exports.getHasOneNestedModels = exports.getHasOneModel = exports.getHasOneModels = exports.hasOneMetadataKey = void 0;
require("reflect-metadata");
const lodash_1 = __importDefault(require("lodash"));
const joi_1 = __importDefault(require("joi"));
const aliases_1 = require("./aliases");
const prop_1 = require("./prop");
exports.hasOneMetadataKey = 'hasOne';
const hasOnePropertiesMetadataKey = 'hasOneProperties';
function getHasOneModels(target) {
    return Reflect.getMetadata(exports.hasOneMetadataKey, target);
}
exports.getHasOneModels = getHasOneModels;
function getHasOneModel(target, propertyKey) {
    return Reflect.getMetadata(exports.hasOneMetadataKey, target, propertyKey);
}
exports.getHasOneModel = getHasOneModel;
function getHasOneNestedModels(target) {
    const models = getHasOneModels(target) || [];
    return models.filter((model) => {
        const { opts, } = getHasOneModel(target, model) || {};
        return opts === null || opts === void 0 ? void 0 : opts.nestedObject;
    });
}
exports.getHasOneNestedModels = getHasOneNestedModels;
function getHasOneNotNestedModels(target) {
    const models = getHasOneModels(target) || [];
    return models.filter((model) => {
        const { opts, } = getHasOneModel(target, model) || {};
        return !(opts === null || opts === void 0 ? void 0 : opts.nestedObject);
    });
}
exports.getHasOneNotNestedModels = getHasOneNotNestedModels;
function getHasOneProperties(target) {
    return Reflect.getMetadata(hasOnePropertiesMetadataKey, target);
}
exports.getHasOneProperties = getHasOneProperties;
function getHasOneProperty(target, propertyKey) {
    return Reflect.getMetadata(hasOnePropertiesMetadataKey, target, propertyKey) || {};
}
exports.getHasOneProperty = getHasOneProperty;
function setHasOneDescriptor(target, modelName, ChildModel) {
    const propertyKey = `_${exports.hasOneMetadataKey}_${modelName}`;
    Object.defineProperty(target, modelName, {
        get() {
            if (this[propertyKey] == null)
                this[propertyKey] = new ChildModel();
            return this[propertyKey];
        },
        set(value) {
            if (value instanceof ChildModel) {
                this[propertyKey] = value;
            }
            else {
                joi_1.default.assert(value, joi_1.default.object().unknown(true));
                this[propertyKey] = new ChildModel(value);
            }
        },
        enumerable: true,
        configurable: false,
    });
    Object.defineProperty(target, `_noInitializer${lodash_1.default.capitalize(modelName)}`, {
        get() {
            return this[propertyKey];
        },
        enumerable: false,
        configurable: false,
    });
}
exports.setHasOneDescriptor = setHasOneDescriptor;
function setHasOnePropertiesDescriptor(target, modelName, ChildModel) {
    const propDescriptors = Object.keys(ChildModel.prototype);
    const aliasDescriptors = Object.keys((0, aliases_1.getAliasesMap)(ChildModel.prototype));
    const descriptors = propDescriptors.concat(aliasDescriptors);
    descriptors.forEach((key) => {
        const propertyKey = `${modelName}${lodash_1.default.capitalize(key)}`;
        Object.defineProperty(target, propertyKey, {
            get() {
                if (this[modelName])
                    return this[modelName][key];
                return undefined;
            },
            set(value) {
                if (this[modelName] == null) {
                    this[modelName] = new ChildModel({
                        [key]: value,
                    });
                }
                else {
                    this[modelName][key] = value;
                }
            },
            configurable: false,
        });
    });
}
exports.setHasOnePropertiesDescriptor = setHasOnePropertiesDescriptor;
function hasOne(ChildModel, opts) {
    return (target, propertyKey) => {
        // SET THE LIST OF MODELS
        Reflect.defineMetadata(exports.hasOneMetadataKey, {
            model: ChildModel,
            opts,
        }, target, propertyKey);
        if (opts === null || opts === void 0 ? void 0 : opts.foreignKey) {
            (0, prop_1.setPropGettersAndSetters)(target, opts === null || opts === void 0 ? void 0 : opts.foreignKey);
        }
        let models = Reflect.getMetadata(exports.hasOneMetadataKey, target);
        if (models) {
            models.push(propertyKey);
        }
        else {
            models = [propertyKey];
        }
        Reflect.defineMetadata(exports.hasOneMetadataKey, models, target);
        setHasOneDescriptor(target, propertyKey, ChildModel);
        setHasOnePropertiesDescriptor(target, propertyKey, ChildModel);
    };
}
exports.hasOne = hasOne;
function transformHasOneAttributes(target, item) {
    const finalAttributes = lodash_1.default.cloneDeep(item);
    const nestedModels = getHasOneNestedModels(target) || [];
    for (const model of nestedModels) {
        delete finalAttributes[model];
        if (item[model] != null) {
            const { model: ModelClass, } = getHasOneModel(target, model) || {};
            let instance = item[model];
            if (!(item[model] instanceof ModelClass)) {
                instance = new ModelClass(item[model]);
            }
            if (Object.keys(instance.attributes).length > 0) {
                finalAttributes[model] = instance.attributes;
            }
        }
    }
    const notNestedModels = getHasOneNotNestedModels(target) || [];
    for (const model of notNestedModels) {
        delete finalAttributes[model];
    }
    return finalAttributes;
}
exports.transformHasOneAttributes = transformHasOneAttributes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzT25lLmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbImxpYi9kZWNvcmF0b3JzL2hhc09uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIsb0RBQXVCO0FBQ3ZCLDhDQUFzQjtBQUN0Qix1Q0FBMEM7QUFFMUMsaUNBQWtEO0FBRXJDLFFBQUEsaUJBQWlCLEdBQUcsUUFBUSxDQUFDO0FBQzFDLE1BQU0sMkJBQTJCLEdBQUcsa0JBQWtCLENBQUM7QUFFdkQsU0FBZ0IsZUFBZSxDQUFDLE1BQVc7SUFDekMsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLHlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFGRCwwQ0FFQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxNQUFXLEVBQUUsV0FBbUI7SUFDN0QsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLHlCQUFpQixFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBRkQsd0NBRUM7QUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxNQUFXO0lBQy9DLE1BQU0sTUFBTSxHQUFhLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFdkQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDN0IsTUFBTSxFQUNKLElBQUksR0FDTCxHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXhDLE9BQU8sSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFlBQVksQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFWRCxzREFVQztBQUVELFNBQWdCLHdCQUF3QixDQUFDLE1BQVc7SUFDbEQsTUFBTSxNQUFNLEdBQWEsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUV2RCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENB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LEdBQWEsd0JBQXdCLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3pFLEtBQUssTUFBTSxLQUFLLElBQUksZUFBZSxFQUFFO1FBQ25DLE9BQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQy9CO0lBRUQsT0FBTyxlQUFlLENBQUM7QUFDekIsQ0FBQztBQTlCRCw4REE4QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBKb2kgZnJvbSAnam9pJztcbmltcG9ydCB7IGdldEFsaWFzZXNNYXAgfSBmcm9tICcuL2FsaWFzZXMnO1xuaW1wb3J0IHsgQ29uc3RydWN0b3IsIFJlbGF0aW9uTW9kZWwsIFJlbGF0aW9uT3B0aW9ucyB9IGZyb20gJy4vZGVjb3JhdG9yVHlwZXMnO1xuaW1wb3J0IHsgc2V0UHJvcEdldHRlcnNBbmRTZXR0ZXJzIH0gZnJvbSAnLi9wcm9wJztcblxuZXhwb3J0IGNvbnN0IGhhc09uZU1ldGFkYXRhS2V5ID0gJ2hhc09uZSc7XG5jb25zdCBoYXNPbmVQcm9wZXJ0aWVzTWV0YWRhdGFLZXkgPSAnaGFzT25lUHJvcGVydGllcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRIYXNPbmVNb2RlbHModGFyZ2V0OiBhbnkpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKGhhc09uZU1ldGFkYXRhS2V5LCB0YXJnZXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzT25lTW9kZWwodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpOiBSZWxhdGlvbk1vZGVsIHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoaGFzT25lTWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzT25lTmVzdGVkTW9kZWxzKHRhcmdldDogYW55KTogc3RyaW5nW10ge1xuICBjb25zdCBtb2RlbHM6IHN0cmluZ1tdID0gZ2V0SGFzT25lTW9kZWxzKHRhcmdldCkgfHwgW107XG5cbiAgcmV0dXJuIG1vZGVscy5maWx0ZXIoKG1vZGVsKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgb3B0cyxcbiAgICB9ID0gZ2V0SGFzT25lTW9kZWwodGFyZ2V0LCBtb2RlbCkgfHwge307XG5cbiAgICByZXR1cm4gb3B0cz8ubmVzdGVkT2JqZWN0O1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhhc09uZU5vdE5lc3RlZE1vZGVscyh0YXJnZXQ6IGFueSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbW9kZWxzOiBzdHJpbmdbXSA9IGdldEhhc09uZU1vZGVscyh0YXJnZXQpIHx8IFtdO1xuXG4gIHJldHVybiBtb2RlbHMuZmlsdGVyKChtb2RlbCkgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIG9wdHMsXG4gICAgfSA9IGdldEhhc09uZU1vZGVsKHRhcmdldCwgbW9kZWwpIHx8IHt9O1xuXG4gICAgcmV0dXJuICFvcHRzPy5uZXN0ZWRPYmplY3Q7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzT25lUHJvcGVydGllcyh0YXJnZXQ6IGFueSk6IHN0cmluZ1tdIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoaGFzT25lUHJvcGVydGllc01ldGFkYXRhS2V5LCB0YXJnZXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzT25lUHJvcGVydHkodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpOiB7IGVudGl0eTogc3RyaW5nLCBrZXk6IHN0cmluZyB9IHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoaGFzT25lUHJvcGVydGllc01ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KSB8fCB7fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEhhc09uZURlc2NyaXB0b3IodGFyZ2V0OiBhbnksIG1vZGVsTmFtZTogc3RyaW5nLCBDaGlsZE1vZGVsOiBDb25zdHJ1Y3Rvcikge1xuICBjb25zdCBwcm9wZXJ0eUtleSA9IGBfJHtoYXNPbmVNZXRhZGF0YUtleX1fJHttb2RlbE5hbWV9YDtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBtb2RlbE5hbWUsIHtcbiAgICBnZXQoKSB7XG4gICAgICBpZiAodGhpc1twcm9wZXJ0eUtleV0gPT0gbnVsbCkgdGhpc1twcm9wZXJ0eUtleV0gPSBuZXcgQ2hpbGRNb2RlbCgpO1xuICAgICAgcmV0dXJuIHRoaXNbcHJvcGVydHlLZXldO1xuICAgIH0sXG4gICAgc2V0KHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBDaGlsZE1vZGVsKSB7XG4gICAgICAgIHRoaXNbcHJvcGVydHlLZXldID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBKb2kuYXNzZXJ0KFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgIEpvaS5vYmplY3QoKS51bmtub3duKHRydWUpLFxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXNbcHJvcGVydHlLZXldID0gbmV3IENoaWxkTW9kZWwodmFsdWUpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICB9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBgX25vSW5pdGlhbGl6ZXIke18uY2FwaXRhbGl6ZShtb2RlbE5hbWUpfWAsIHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpc1twcm9wZXJ0eUtleV07XG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEhhc09uZVByb3BlcnRpZXNEZXNjcmlwdG9yKHRhcmdldDogYW55LCBtb2RlbE5hbWU6IHN0cmluZywgQ2hpbGRNb2RlbDogQ29uc3RydWN0b3IpIHtcbiAgY29uc3QgcHJvcERlc2NyaXB0b3JzID0gT2JqZWN0LmtleXMoQ2hpbGRNb2RlbC5wcm90b3R5cGUpO1xuICBjb25zdCBhbGlhc0Rlc2NyaXB0b3JzID0gT2JqZWN0LmtleXMoZ2V0QWxpYXNlc01hcChDaGlsZE1vZGVsLnByb3RvdHlwZSkpO1xuXG4gIGNvbnN0IGRlc2NyaXB0b3JzID0gcHJvcERlc2NyaXB0b3JzLmNvbmNhdChhbGlhc0Rlc2NyaXB0b3JzKTtcblxuICBkZXNjcmlwdG9ycy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBjb25zdCBwcm9wZXJ0eUtleSA9IGAke21vZGVsTmFtZX0ke18uY2FwaXRhbGl6ZShrZXkpfWA7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eUtleSwge1xuICAgICAgZ2V0KCkge1xuICAgICAgICBpZiAodGhpc1ttb2RlbE5hbWVdKSByZXR1cm4gdGhpc1ttb2RlbE5hbWVdW2tleV07XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9LFxuICAgICAgc2V0KHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzW21vZGVsTmFtZV0gPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXNbbW9kZWxOYW1lXSA9IG5ldyBDaGlsZE1vZGVsKHtcbiAgICAgICAgICAgIFtrZXldOiB2YWx1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzW21vZGVsTmFtZV1ba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNPbmUoQ2hpbGRNb2RlbDogQ29uc3RydWN0b3IsIG9wdHM/OiBSZWxhdGlvbk9wdGlvbnMpIHtcbiAgcmV0dXJuICh0YXJnZXQ6IGFueSwgcHJvcGVydHlLZXk6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIC8vIFNFVCBUSEUgTElTVCBPRiBNT0RFTFNcbiAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKGhhc09uZU1ldGFkYXRhS2V5LCB7XG4gICAgICBtb2RlbDogQ2hpbGRNb2RlbCxcbiAgICAgIG9wdHMsXG4gICAgfSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG5cbiAgICBpZiAob3B0cz8uZm9yZWlnbktleSkge1xuICAgICAgc2V0UHJvcEdldHRlcnNBbmRTZXR0ZXJzKHRhcmdldCwgb3B0cz8uZm9yZWlnbktleSk7XG4gICAgfVxuXG4gICAgbGV0IG1vZGVsczogc3RyaW5nW10gPSBSZWZsZWN0LmdldE1ldGFkYXRhKGhhc09uZU1ldGFkYXRhS2V5LCB0YXJnZXQpO1xuXG4gICAgaWYgKG1vZGVscykge1xuICAgICAgbW9kZWxzLnB1c2gocHJvcGVydHlLZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtb2RlbHMgPSBbcHJvcGVydHlLZXldO1xuICAgIH1cblxuICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXG4gICAgICBoYXNPbmVNZXRhZGF0YUtleSxcbiAgICAgIG1vZGVscyxcbiAgICAgIHRhcmdldCxcbiAgICApO1xuXG4gICAgc2V0SGFzT25lRGVzY3JpcHRvcih0YXJnZXQsIHByb3BlcnR5S2V5LCBDaGlsZE1vZGVsKTtcbiAgICBzZXRIYXNPbmVQcm9wZXJ0aWVzRGVzY3JpcHRvcih0YXJnZXQsIHByb3BlcnR5S2V5LCBDaGlsZE1vZGVsKTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUhhc09uZUF0dHJpYnV0ZXModGFyZ2V0OiBhbnksIGl0ZW06IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcbiAgY29uc3QgZmluYWxBdHRyaWJ1dGVzID0gXy5jbG9uZURlZXAoaXRlbSk7XG5cbiAgY29uc3QgbmVzdGVkTW9kZWxzOiBzdHJpbmdbXSA9IGdldEhhc09uZU5lc3RlZE1vZGVscyh0YXJnZXQpIHx8IFtdO1xuXG4gIGZvciAoY29uc3QgbW9kZWwgb2YgbmVzdGVkTW9kZWxzKSB7XG4gICAgZGVsZXRlIGZpbmFsQXR0cmlidXRlc1ttb2RlbF07XG5cbiAgICBpZiAoaXRlbVttb2RlbF0gIT0gbnVsbCkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBtb2RlbDogTW9kZWxDbGFzcyxcbiAgICAgIH0gPSBnZXRIYXNPbmVNb2RlbCh0YXJnZXQsIG1vZGVsKSB8fCB7fTtcblxuICAgICAgbGV0IGluc3RhbmNlID0gaXRlbVttb2RlbF07XG4gICAgICBpZiAoIShpdGVtW21vZGVsXSBpbnN0YW5jZW9mIE1vZGVsQ2xhc3MpKSB7XG4gICAgICAgIGluc3RhbmNlID0gbmV3IE1vZGVsQ2xhc3MoaXRlbVttb2RlbF0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoT2JqZWN0LmtleXMoaW5zdGFuY2UuYXR0cmlidXRlcykubGVuZ3RoID4gMCkge1xuICAgICAgICBmaW5hbEF0dHJpYnV0ZXNbbW9kZWxdID0gaW5zdGFuY2UuYXR0cmlidXRlcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBub3ROZXN0ZWRNb2RlbHM6IHN0cmluZ1tdID0gZ2V0SGFzT25lTm90TmVzdGVkTW9kZWxzKHRhcmdldCkgfHwgW107XG4gIGZvciAoY29uc3QgbW9kZWwgb2Ygbm90TmVzdGVkTW9kZWxzKSB7XG4gICAgZGVsZXRlIGZpbmFsQXR0cmlidXRlc1ttb2RlbF07XG4gIH1cblxuICByZXR1cm4gZmluYWxBdHRyaWJ1dGVzO1xufVxuIl19