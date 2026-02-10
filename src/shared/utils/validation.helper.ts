export class ValidationHelper {
  // Accept UUID v4 (used by TypeORM) or numeric strings (for sandbox quick tests)
  static isValidObjectId(id?: string): boolean {
    if (!id || typeof id !== 'string') return false;
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const numeric = /^\d+$/;
    return uuidV4.test(id) || numeric.test(id);
  }
}
