"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.table = exports.prop = exports.hasOne = exports.hasMany = exports.compositeKey = exports.aliases = exports.aliasTo = void 0;
__exportStar(require("./lib/Entity"), exports);
__exportStar(require("./lib/Entity/DynamoPaginator"), exports);
var index_1 = require("./lib/Decorators/index");
Object.defineProperty(exports, "aliasTo", { enumerable: true, get: function () { return index_1.aliasTo; } });
Object.defineProperty(exports, "aliases", { enumerable: true, get: function () { return index_1.aliases; } });
Object.defineProperty(exports, "compositeKey", { enumerable: true, get: function () { return index_1.compositeKey; } });
Object.defineProperty(exports, "hasMany", { enumerable: true, get: function () { return index_1.hasMany; } });
Object.defineProperty(exports, "hasOne", { enumerable: true, get: function () { return index_1.hasOne; } });
Object.defineProperty(exports, "prop", { enumerable: true, get: function () { return index_1.prop; } });
Object.defineProperty(exports, "table", { enumerable: true, get: function () { return index_1.table; } });
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return index_1.validate; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsiaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUE2QjtBQUM3QiwrREFBNkM7QUFDN0MsZ0RBU2dDO0FBUjlCLGdHQUFBLE9BQU8sT0FBQTtBQUNQLGdHQUFBLE9BQU8sT0FBQTtBQUNQLHFHQUFBLFlBQVksT0FBQTtBQUNaLGdHQUFBLE9BQU8sT0FBQTtBQUNQLCtGQUFBLE1BQU0sT0FBQTtBQUNOLDZGQUFBLElBQUksT0FBQTtBQUNKLDhGQUFBLEtBQUssT0FBQTtBQUNMLGlHQUFBLFFBQVEsT0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gJy4vbGliL0VudGl0eSc7XG5leHBvcnQgKiBmcm9tICcuL2xpYi9FbnRpdHkvRHluYW1vUGFnaW5hdG9yJztcbmV4cG9ydCB7XG4gIGFsaWFzVG8sXG4gIGFsaWFzZXMsXG4gIGNvbXBvc2l0ZUtleSxcbiAgaGFzTWFueSxcbiAgaGFzT25lLFxuICBwcm9wLFxuICB0YWJsZSxcbiAgdmFsaWRhdGUsXG59IGZyb20gJy4vbGliL0RlY29yYXRvcnMvaW5kZXgnO1xuIl19