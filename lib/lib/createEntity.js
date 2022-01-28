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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Entity_1 = require("dynamodb-toolbox/dist/classes/Entity");
var Joi = require("joi");
var createJDModel_1 = require("./createJDModel");
var utils_1 = require("./utils");
var parseAttributeOptions = function (options) {
    if (typeof options === 'string' || !(0, utils_1.isObject)(options))
        return { options: options };
    var aliases = options.aliases, validate = options.validate, entityOptions = __rest(options, ["aliases", "validate"]);
    return {
        aliases: aliases,
        validate: validate,
        options: entityOptions,
    };
};
var parseOptions = function (attributes) {
    var joiAttributeDefinitions = {};
    var dynamoAttributeDefinitions = {};
    var attributesAliases = {};
    for (var _i = 0, _a = Object.entries(attributes); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (typeof value === 'string') {
            dynamoAttributeDefinitions[key] = value;
        }
        else {
            var parsed = void 0;
            if (Array.isArray(value)) {
                parsed = parseAttributeOptions(value[2]);
            }
            else if ((0, utils_1.isObject)(value)) {
                parsed = parseAttributeOptions(value);
            }
            var validate = parsed.validate, options = parsed.options, aliases = parsed.aliases;
            attributesAliases[key] = aliases;
            if (validate)
                joiAttributeDefinitions[key] = validate;
            if (Array.isArray(value)) {
                dynamoAttributeDefinitions[key] = [value[0], value[1], options];
            }
            else {
                dynamoAttributeDefinitions[key] = options;
            }
        }
    }
    return {
        joiAttributeDefinitions: joiAttributeDefinitions,
        dynamoAttributeDefinitions: dynamoAttributeDefinitions,
        attributesAliases: attributesAliases,
    };
};
function createEntity(params) {
    var _a = parseOptions(params.attributes), joiAttributeDefinitions = _a.joiAttributeDefinitions, dynamoAttributeDefinitions = _a.dynamoAttributeDefinitions, attributesAliases = _a.attributesAliases;
    var beforeValidate = params.beforeValidate, _b = params.joiExtensions, joiExtensions = _b === void 0 ? function (joi) { return joi; } : _b, restParams = __rest(params, ["beforeValidate", "joiExtensions"]);
    if (this.entities) {
        var entity = new Entity_1.default(__assign(__assign({ table: this.table }, restParams), { attributes: dynamoAttributeDefinitions }));
        var joi = Joi.object();
        for (var _i = 0, _c = Object.entries(attributesAliases); _i < _c.length; _i++) {
            var _d = _c[_i], key = _d[0], value = _d[1];
            if (Array.isArray(value)) {
                for (var _e = 0, value_1 = value; _e < value_1.length; _e++) {
                    var name_1 = value_1[_e];
                    joi = joi.rename(name_1, key, {
                        multiple: true,
                        override: true,
                    });
                }
            }
            else if (typeof value === 'string') {
                joi = joi.rename(value, key, {
                    multiple: true,
                    override: true,
                });
            }
        }
        joi = joi.keys(joiAttributeDefinitions).unknown(true);
        joi = joiExtensions(joi);
        var model = (0, createJDModel_1.default)(entity, joi, attributesAliases, beforeValidate);
        this.entities[params.name] = {
            entity: entity,
            joi: joi,
            model: model,
        };
        return {
            entity: entity,
            joi: joi,
            model: model,
        };
    }
    throw new Error('entites array is not set.');
}
exports.default = createEntity;
