/** @internal */
export function setPropGettersAndSetters(target: any, propertyName: string): void {
  const currentDescriptor = Object.getOwnPropertyDescriptor(target, propertyName);
  if (currentDescriptor != null && currentDescriptor.configurable === false) return;

  Object.defineProperty(target, propertyName, {
    get() {
      return this.getAttribute(propertyName);
    },
    set(v) {
      this.setAttribute(propertyName, v);
    },
    configurable: true,
    enumerable: true,
  });
}
