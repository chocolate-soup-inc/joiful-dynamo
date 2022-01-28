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
Object.defineProperty(exports, "__esModule", { value: true });
var dynamodb_toolbox_1 = require("dynamodb-toolbox");
var DynamoDB = require("aws-sdk/clients/dynamodb");
var createEntity_1 = require("./lib/createEntity");
var jd = {
    configureTable: function (params, reuse) {
        var _this = this;
        if (reuse === void 0) { reuse = false; }
        if (reuse && this.table)
            return this.table;
        var DocumentClient = new DynamoDB.DocumentClient();
        this.table = new dynamodb_toolbox_1.Table(__assign({ 
            // partitionKey: 'pk',
            DocumentClient: DocumentClient }, params));
        Object.entries(this.entities).forEach(function (_a) {
            var value = _a[1];
            try {
                value.entity.table = _this.table;
            }
            catch (error) {
                if (!error.message.includes('This entity is already assigned a Table'))
                    throw error;
            }
        });
        return this.table;
    },
    createEntity: createEntity_1.default,
    entities: {},
};
exports.default = jd;
