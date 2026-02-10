"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationHelper = void 0;
class ValidationHelper {
    static isValidObjectId(id) {
        if (!id || typeof id !== 'string')
            return false;
        const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const numeric = /^\d+$/;
        return uuidV4.test(id) || numeric.test(id);
    }
}
exports.ValidationHelper = ValidationHelper;
//# sourceMappingURL=validation.helper.js.map