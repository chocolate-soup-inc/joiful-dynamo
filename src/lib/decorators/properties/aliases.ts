/** @internal */
export function setAliasDescriptor(target: any, aliasKey: string, propertyKey: string): void {
  Object.defineProperty(target, aliasKey, {
    get() {
      return this[propertyKey];
    },
    set(v) {
      this[propertyKey] = v;
    },
    configurable: false,
    enumerable: false,
  });
}
