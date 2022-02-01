import Joi from 'joi';
import {
  getHasManyModels,
  getHasOneModels,
  setPropGettersAndSetters,
  transformAliasAttributes,
  transformCompositeKeyAttributes,
  transformHasManyAttributes,
  transformHasOneAttributes,
  validateAttributes,
} from '../decorators';

export class BasicEntity {
  protected _attributes: Record<string, any> = {};

  [key: string]: any;

  // ---------------- BASIC ATTRIBUTES SETTINGS ----------------

  constructor(item: Record<string, any> = {}) {
    this.attributes = item;

    this.getAttribute = this.getAttribute.bind(this);
    this.setAttribute = this.setAttribute.bind(this);
  }

  get attributes(): Record<string, any> {
    return this._attributes || {};
  }

  set attributes(attributes: Record<string, any>) {
    // WE SHOULD ORGANIZE THE ENTRIES ORDER SO IT SETS THE CHILD PROPERTIES BEFORE SETTING THE REST (SO IT DOES NOT OVERWRITE)
    const entries = Object.entries(attributes);
    const hasOneModels = getHasOneModels(this) || [];
    const hasManyModels = getHasManyModels(this) || [];
    const allModels = hasOneModels.concat(hasManyModels);
    entries.sort(([aKey], [bKey]) => {
      if (allModels.includes(aKey) && !allModels.includes(bKey)) return -1;
      if (!allModels.includes(aKey) && allModels.includes(bKey)) return 1;
      return 0;
    });

    for (const [key, value] of entries) {
      setPropGettersAndSetters(this.constructor.prototype, key);
      this[key] = value;
    }
  }

  protected getAttribute(key: string): any {
    return this.attributes[key];
  }

  protected setAttribute(key: string, value: any): void {
    this.attributes[key] = value;
  }

  get enumerableAttributes(): Record<string, any> {
    return Object.keys(this.constructor.prototype).reduce((agg, key) => {
      const value = this[key];

      if (value !== undefined) agg[key] = value;
      return agg;
    }, {} as Record<string, any>);
  }

  get transformedAttributes(): Record<string, any> {
    let attributes = transformAliasAttributes(this, this.enumerableAttributes);
    attributes = transformHasManyAttributes(this, attributes);
    attributes = transformHasOneAttributes(this, attributes);
    attributes = transformCompositeKeyAttributes(this, attributes);

    return attributes;
  }

  get validatedAttributes(): Record<string, any> {
    return validateAttributes(this, this.transformedAttributes);
  }

  get finalAttributes(): Record<string, any> {
    return this.validatedAttributes;
  }

  // ---------------- BASIC ATTRIBUTES SETTINGS ----------------

  // ---------------- VALIDATION SETTINGS ----------------

  protected _error: Joi.ValidationError | undefined;

  validate(_throw: boolean = false) {
    this._error = undefined;
    try {
      validateAttributes(this, this.transformedAttributes);
      return true;
    } catch (error) {
      if (_throw) {
        throw error;
      } else if (error instanceof Joi.ValidationError) {
        this._error = error;
        return false;
      }

      throw error;
    }
  }

  get valid() {
    return this.validate();
  }

  get error() {
    return this._error;
  }

  // ---------------- VALIDATION SETTINGS ----------------

  // ---------------- STATIC METHODS ----------------

  static transformAttributes(item: Record<string, any>): Record<string, any> {
    return new this(item).transformedAttributes;
  }

  static validateAttributes(item: Record<string, any>): Record<string, any> {
    return new this(item).validatedAttributes;
  }

  static validate(item: Record<string, any>, _throw: boolean = true) {
    return new this(item).validate(_throw);
  }

  // ---------------- STATIC METHODS ----------------
}
