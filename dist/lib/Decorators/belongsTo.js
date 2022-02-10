"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBelongsTo = exports.getHasFromBelong = exports.getBelongsToModel = exports.getBelongsToModels = void 0;
const joi_1 = __importDefault(require("joi"));
require("reflect-metadata");
const relationHelpers_1 = require("./relationHelpers");
const belongsToMetadataKey = 'belongsTo';
function getBelongsToModels(target) {
    return Reflect.getMetadata(belongsToMetadataKey, target) || [];
}
exports.getBelongsToModels = getBelongsToModels;
function getBelongsToModel(target, propertyKey) {
    return Reflect.getMetadata(belongsToMetadataKey, target, propertyKey);
}
exports.getBelongsToModel = getBelongsToModel;
function getHasFromBelong(target, foreignKey, indexName, parentPropertyOnChild) {
    return Reflect.getMetadata(belongsToMetadataKey, target, `${foreignKey}${indexName}${parentPropertyOnChild || ''}`);
}
exports.getHasFromBelong = getHasFromBelong;
function setBelongsTo(target, ChildModel, propertyKey, type, opts = {}) {
    if ((opts === null || opts === void 0 ? void 0 : opts.foreignKey) && (opts === null || opts === void 0 ? void 0 : opts.indexName)) {
        Reflect.defineMetadata(belongsToMetadataKey, {
            indexName: opts === null || opts === void 0 ? void 0 : opts.indexName,
            foreignKey: opts === null || opts === void 0 ? void 0 : opts.foreignKey,
            parentPropertyOnChild: opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild,
            parent: target.constructor,
            child: ChildModel,
            propertyKey,
            type,
        }, ChildModel.prototype, `${opts.foreignKey}${opts.indexName}${(opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild) || ''}`);
        if (opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild) {
            Reflect.defineMetadata(belongsToMetadataKey, {
                model: target.constructor,
                opts,
            }, ChildModel.prototype, opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild);
        }
        const modelProperties = Reflect.getMetadata(relationHelpers_1.relationDescriptor, ChildModel.prototype) || [];
        modelProperties.push({
            model: target.constructor,
            opts,
            type: 'belongsTo',
            initializer: target.initialize,
        });
        Reflect.defineMetadata(relationHelpers_1.relationDescriptor, modelProperties, ChildModel.prototype);
        if (opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild) {
            let belongsToModels = Reflect.getMetadata(belongsToMetadataKey, ChildModel.prototype);
            if (belongsToModels) {
                belongsToModels.push(opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild);
            }
            else {
                belongsToModels = [opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild];
            }
            Reflect.defineMetadata(belongsToMetadataKey, belongsToModels, ChildModel.prototype);
        }
    }
    if (opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild) {
        const instancePropertyKey = `_${belongsToMetadataKey}_${opts === null || opts === void 0 ? void 0 : opts.parentPropertyOnChild}`;
        Object.defineProperty(ChildModel.prototype, opts.parentPropertyOnChild, {
            get() {
                if (this[instancePropertyKey] == null)
                    this[instancePropertyKey] = new target.constructor();
                return this[instancePropertyKey];
            },
            set(value) {
                if (value instanceof target.constructor) {
                    this[instancePropertyKey] = value;
                }
                else {
                    joi_1.default.assert(value, joi_1.default.object().unknown(true));
                    this[instancePropertyKey] = new target.constructor(value);
                }
            },
            enumerable: false,
            configurable: false,
        });
    }
}
exports.setBelongsTo = setBelongsTo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVsb25nc1RvLmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbImxpYi9EZWNvcmF0b3JzL2JlbG9uZ3NUby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4Q0FBc0I7QUFDdEIsNEJBQTBCO0FBQzFCLHVEQUsyQjtBQUUzQixNQUFNLG9CQUFvQixHQUFHLFdBQVcsQ0FBQztBQUV6QyxTQUFnQixrQkFBa0IsQ0FBQyxNQUFXO0lBQzVDLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDakUsQ0FBQztBQUZELGdEQUVDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsTUFBVyxFQUFFLFdBQW1CO0lBQ2hFLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUZELDhDQUVDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsTUFBVyxFQUFFLFVBQWtCLEVBQUUsU0FBaUIsRUFBRSxxQkFBOEI7SUFDakgsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxHQUFHLFVBQVUsR0FBRyxTQUFTLEdBQUcscUJBQXFCLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN0SCxDQUFDO0FBRkQsNENBRUM7QUFFRCxTQUFnQixZQUFZLENBQUMsTUFBVyxFQUFFLFVBQXVCLEVBQUUsV0FBbUIsRUFBRSxJQUEwQixFQUFFLE9BQTJCLEVBQUU7SUFDL0ksSUFBSSxDQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxVQUFVLE1BQUksSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFNBQVMsQ0FBQSxFQUFFO1FBQ3ZDLE9BQU8sQ0FBQyxjQUFjLENBQUMsb0JBQW9CLEVBQUU7WUFDM0MsU0FBUyxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxT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LENBQUMsSUFBSSxDQUFDLENBQzNCLENBQUM7b0JBRUYsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUMzRDtZQUNILENBQUM7WUFDRCxVQUFVLEVBQUUsS0FBSztZQUNqQixZQUFZLEVBQUUsS0FBSztTQUNwQixDQUFDLENBQUM7S0FDSjtBQUNILENBQUM7QUFuRUQsb0NBbUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEpvaSBmcm9tICdqb2knO1xuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcbmltcG9ydCB7XG4gIENvbnN0cnVjdG9yLFxuICBIYXNSZWxhdGlvbk9wdGlvbnMsXG4gIHJlbGF0aW9uRGVzY3JpcHRvcixcbiAgUmVsYXRpb25EZXNjcmlwdG9ycyxcbn0gZnJvbSAnLi9yZWxhdGlvbkhlbHBlcnMnO1xuXG5jb25zdCBiZWxvbmdzVG9NZXRhZGF0YUtleSA9ICdiZWxvbmdzVG8nO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmVsb25nc1RvTW9kZWxzKHRhcmdldDogYW55KSB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKGJlbG9uZ3NUb01ldGFkYXRhS2V5LCB0YXJnZXQpIHx8IFtdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmVsb25nc1RvTW9kZWwodGFyZ2V0OiBhbnksIHByb3BlcnR5S2V5OiBzdHJpbmcpIHtcbiAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoYmVsb25nc1RvTWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SGFzRnJvbUJlbG9uZyh0YXJnZXQ6IGFueSwgZm9yZWlnbktleTogc3RyaW5nLCBpbmRleE5hbWU6IHN0cmluZywgcGFyZW50UHJvcGVydHlPbkNoaWxkPzogc3RyaW5nKSB7XG4gIHJldHVybiBSZWZsZWN0LmdldE1ldGFkYXRhKGJlbG9uZ3NUb01ldGFkYXRhS2V5LCB0YXJnZXQsIGAke2ZvcmVpZ25LZXl9JHtpbmRleE5hbWV9JHtwYXJlbnRQcm9wZXJ0eU9uQ2hpbGQgfHwgJyd9YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCZWxvbmdzVG8odGFyZ2V0OiBhbnksIENoaWxkTW9kZWw6IENvbnN0cnVjdG9yLCBwcm9wZXJ0eUtleTogc3RyaW5nLCB0eXBlOiAnaGFzTWFueScgfCAnaGFzT25lJywgb3B0czogSGFzUmVsYXRpb25PcHRpb25zID0ge30pIHtcbiAgaWYgKG9wdHM/LmZvcmVpZ25LZXkgJiYgb3B0cz8uaW5kZXhOYW1lKSB7XG4gICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShiZWxvbmdzVG9NZXRhZGF0YUtleSwge1xuICAgICAgaW5kZXhOYW1lOiBvcHRzPy5pbmRleE5hbWUsXG4gICAgICBmb3JlaWduS2V5OiBvcHRzPy5mb3JlaWduS2V5LFxuICAgICAgcGFyZW50UHJvcGVydHlPbkNoaWxkOiBvcHRzPy5wYXJlbnRQcm9wZXJ0eU9uQ2hpbGQsXG4gICAgICBwYXJlbnQ6IHRhcmdldC5jb25zdHJ1Y3RvcixcbiAgICAgIGNoaWxkOiBDaGlsZE1vZGVsLFxuICAgICAgcHJvcGVydHlLZXksXG4gICAgICB0eXBlLFxuICAgIH0sIENoaWxkTW9kZWwucHJvdG90eXBlLCBgJHtvcHRzLmZvcmVpZ25LZXl9JHtvcHRzLmluZGV4TmFtZX0ke29wdHM/LnBhcmVudFByb3BlcnR5T25DaGlsZCB8fCAnJ31gKTtcblxuICAgIGlmIChvcHRzPy5wYXJlbnRQcm9wZXJ0eU9uQ2hpbGQpIHtcbiAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoYmVsb25nc1RvTWV0YWRhdGFLZXksIHtcbiAgICAgICAgbW9kZWw6IHRhcmdldC5jb25zdHJ1Y3RvcixcbiAgICAgICAgb3B0cyxcbiAgICAgIH0sIENoaWxkTW9kZWwucHJvdG90eXBlLCBvcHRzPy5wYXJlbnRQcm9wZXJ0eU9uQ2hpbGQpO1xuICAgIH1cblxuICAgIGNvbnN0IG1vZGVsUHJvcGVydGllczogUmVsYXRpb25EZXNjcmlwdG9ycyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEocmVsYXRpb25EZXNjcmlwdG9yLCBDaGlsZE1vZGVsLnByb3RvdHlwZSkgfHwgW107XG5cbiAgICBtb2RlbFByb3BlcnRpZXMucHVzaCh7XG4gICAgICBtb2RlbDogdGFyZ2V0LmNvbnN0cnVjdG9yLFxuICAgICAgb3B0cyxcbiAgICAgIHR5cGU6ICdiZWxvbmdzVG8nLFxuICAgICAgaW5pdGlhbGl6ZXI6IHRhcmdldC5pbml0aWFsaXplLFxuICAgIH0pO1xuXG4gICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShyZWxhdGlvbkRlc2NyaXB0b3IsIG1vZGVsUHJvcGVydGllcywgQ2hpbGRNb2RlbC5wcm90b3R5cGUpO1xuXG4gICAgaWYgKG9wdHM/LnBhcmVudFByb3BlcnR5T25DaGlsZCkge1xuICAgICAgbGV0IGJlbG9uZ3NUb01vZGVsczogc3RyaW5nW10gPSBSZWZsZWN0LmdldE1ldGFkYXRhKGJlbG9uZ3NUb01ldGFkYXRhS2V5LCBDaGlsZE1vZGVsLnByb3RvdHlwZSk7XG5cbiAgICAgIGlmIChiZWxvbmdzVG9Nb2RlbHMpIHtcbiAgICAgICAgYmVsb25nc1RvTW9kZWxzLnB1c2gob3B0cz8ucGFyZW50UHJvcGVydHlPbkNoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJlbG9uZ3NUb01vZGVscyA9IFtvcHRzPy5wYXJlbnRQcm9wZXJ0eU9uQ2hpbGRdO1xuICAgICAgfVxuXG4gICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKGJlbG9uZ3NUb01ldGFkYXRhS2V5LCBiZWxvbmdzVG9Nb2RlbHMsIENoaWxkTW9kZWwucHJvdG90eXBlKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0cz8ucGFyZW50UHJvcGVydHlPbkNoaWxkKSB7XG4gICAgY29uc3QgaW5zdGFuY2VQcm9wZXJ0eUtleSA9IGBfJHtiZWxvbmdzVG9NZXRhZGF0YUtleX1fJHtvcHRzPy5wYXJlbnRQcm9wZXJ0eU9uQ2hpbGR9YDtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDaGlsZE1vZGVsLnByb3RvdHlwZSwgb3B0cy5wYXJlbnRQcm9wZXJ0eU9uQ2hpbGQsIHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgaWYgKHRoaXNbaW5zdGFuY2VQcm9wZXJ0eUtleV0gPT0gbnVsbCkgdGhpc1tpbnN0YW5jZVByb3BlcnR5S2V5XSA9IG5ldyB0YXJnZXQuY29uc3RydWN0b3IoKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbaW5zdGFuY2VQcm9wZXJ0eUtleV07XG4gICAgICB9LFxuICAgICAgc2V0KHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHRhcmdldC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgIHRoaXNbaW5zdGFuY2VQcm9wZXJ0eUtleV0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBKb2kuYXNzZXJ0KFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBKb2kub2JqZWN0KCkudW5rbm93bih0cnVlKSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgdGhpc1tpbnN0YW5jZVByb3BlcnR5S2V5XSA9IG5ldyB0YXJnZXQuY29uc3RydWN0b3IodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIH0pO1xuICB9XG59XG4iXX0=