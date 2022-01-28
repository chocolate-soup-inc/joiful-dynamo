"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
function createJDModel(entity, joi, attributesAliases, beforeValidate) {
    var _this = this;
    var _a;
    if (beforeValidate === void 0) { beforeValidate = function (attributes) { return attributes; }; }
    var jdValidate = function (item, throwError) {
        if (throwError === void 0) { throwError = true; }
        var attributes = beforeValidate(item);
        var _a = joi.validate(attributes || item, {
            convert: true,
        }), error = _a.error, warning = _a.warning, value = _a.value;
        if (error) {
            if (throwError)
                throw error;
            // eslint-disable-next-line no-console
            console.error(error);
        }
        // eslint-disable-next-line no-console
        if (warning)
            console.warn('Validation Warning', warning);
        return value;
    };
    var deleteFunc = function (item, options, params) { return entity.delete(item, options, params); };
    var get = function (item, options, params) { return entity.get(item, options, params); };
    var put = function (item, options, params) {
        var validatedItem = jdValidate(item);
        return entity.put(validatedItem, options, params);
    };
    var update = function (item, options, params) {
        var validatedItem = jdValidate(item);
        return entity.update(validatedItem, options, params);
    };
    var query = function (pk, options, params) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, entity.query(pk, options, params)];
    }); }); };
    var scan = function (options, params) { return entity.scan(options, params); };
    var batchWrite = function (items, batchWriteOptions, params) { return entity.table.batchWrite(items, batchWriteOptions, params); };
    var getTransformedAttributes = function (attributes) { return __awaiter(_this, void 0, void 0, function () {
        var joiTransformedAttributes, dynamodbTransformedAttributes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    joiTransformedAttributes = jdValidate(attributes, false);
                    return [4 /*yield*/, entity.put(joiTransformedAttributes, {
                            execute: false,
                        })];
                case 1:
                    dynamodbTransformedAttributes = _a.sent();
                    return [2 /*return*/, dynamodbTransformedAttributes === null || dynamodbTransformedAttributes === void 0 ? void 0 : dynamodbTransformedAttributes.Item];
            }
        });
    }); };
    var allAttributesList = Object.entries(attributesAliases).reduce(function (agg, _a) {
        var key = _a[0], aliases = _a[1];
        agg.push(key);
        if (aliases == null) {
            return agg;
        }
        if (typeof aliases === 'string') {
            agg.push(aliases);
            return agg;
        }
        return agg.concat(aliases);
    }, []);
    var getFieldAlias = function (fieldName) {
        for (var _i = 0, _a = Object.entries(attributesAliases); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if ((typeof value === 'string' && value === fieldName)
                || (Array.isArray(value) && value.includes(fieldName))) {
                return key;
            }
        }
        return fieldName;
    };
    var jdModel = (_a = /** @class */ (function () {
            function JDModel(item) {
                this._attributes = {};
                this._validatedAttributes = {};
                if (item) {
                    for (var _i = 0, _a = Object.entries(item); _i < _a.length; _i++) {
                        var _b = _a[_i], key = _b[0], value = _b[1];
                        this.attributes[getFieldAlias(key)] = value;
                    }
                }
                this.entity = entity;
                this.joi = joi;
                // eslint-disable-next-line no-constructor-return
                return new Proxy(this, {
                    get: function (target, name, receiver) {
                        if (Reflect.has(target, name)) {
                            return Reflect.get(target, name, receiver);
                        }
                        var stringName = name.toString();
                        if (allAttributesList.includes(stringName)) {
                            return target._attributes[getFieldAlias(stringName)];
                        }
                        throw new Error("".concat(String(name), " is not a valid attribute."));
                    },
                    set: function (target, name, value, receiver) {
                        if (Reflect.has(target, name)) {
                            return Reflect.set(target, name, value, receiver);
                        }
                        var stringName = name.toString();
                        if (allAttributesList.includes(stringName)) {
                            target._attributes[getFieldAlias(stringName)] = value;
                            return true;
                        }
                        throw new Error("".concat(String(name), " is not a valid attribute."));
                    },
                });
            }
            Object.defineProperty(JDModel.prototype, "attributes", {
                get: function () {
                    return this._attributes;
                },
                set: function (attributes) {
                    this._attributes = attributes;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(JDModel.prototype, "validatedAttributes", {
                get: function () {
                    return this._validatedAttributes;
                },
                enumerable: false,
                configurable: true
            });
            JDModel.queryAll = function (pk, options, params) {
                return __awaiter(this, void 0, void 0, function () {
                    var queryResponse, items;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, query(pk, options, params)];
                            case 1:
                                queryResponse = _a.sent();
                                items = queryResponse.Items || [];
                                while (queryResponse.LastEvaluatedKey != null) {
                                    queryResponse = queryResponse.next();
                                    items = items.concat(queryResponse.Items);
                                }
                                return [2 /*return*/, __assign(__assign({}, queryResponse), { Items: items })];
                        }
                    });
                });
            };
            JDModel.scanAll = function (options, params) {
                return __awaiter(this, void 0, void 0, function () {
                    var queryResponse, items;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, scan(options, params)];
                            case 1:
                                queryResponse = _a.sent();
                                items = queryResponse.Items || [];
                                while (queryResponse.LastEvaluatedKey != null) {
                                    queryResponse = queryResponse.next();
                                    items = items.concat(queryResponse.Items);
                                }
                                return [2 /*return*/, __assign(__assign({}, queryResponse), { Items: items })];
                        }
                    });
                });
            };
            JDModel.prototype.validate = function () {
                var value = jdValidate(this.attributes);
                this._validatedAttributes = value;
                return value;
            };
            JDModel.prototype.delete = function (option, params) {
                return deleteFunc(this.attributes, option, params);
            };
            JDModel.prototype.get = function (option, params) {
                return get(this.attributes, option, params);
            };
            JDModel.prototype.put = function (options, params) {
                return put(this.attributes, options, params);
            };
            JDModel.prototype.update = function (options, params) {
                return update(this.attributes, options, params);
            };
            JDModel.prototype.getTransformedAttributes = function () {
                return getTransformedAttributes(this.attributes);
            };
            return JDModel;
        }()),
        _a.validate = jdValidate,
        _a.batchWrite = batchWrite,
        _a.delete = deleteFunc,
        _a.get = get,
        _a.put = put,
        _a.update = update,
        _a.query = query,
        _a.scan = scan,
        _a.getTransformedAttributes = getTransformedAttributes,
        _a);
    return jdModel;
}
exports.default = createJDModel;
