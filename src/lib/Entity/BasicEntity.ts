import Joi from 'joi';
import _ from 'lodash';
import {
  getHasManyModels,
  getHasManyNotNestedModels,
  getHasOneModel,
  getHasOneModels,
  getHasOneNotNestedModels,
  setPropGettersAndSetters,
  transformAliasAttributes,
  transformCompositeKeyAttributes,
  transformHasManyAttributes,
  transformHasOneAttributes,
  validateAttributes,
} from '../Decorators';

export class BasicEntity {
  protected _attributes: Record<string, any> = {};

  [key: string]: any;

  // ---------------- BASIC ATTRIBUTES SETTINGS ----------------

  constructor(item: Record<string, any> = {}) {
    this.attributes = item;

    this.getAttribute = this.getAttribute.bind(this);
    this.setAttribute = this.setAttribute.bind(this);
  }

  /**
   * Gets all the attributes from the instance before any transformation. Alias are already removed and only the final properties are returned.
   */
  get attributes(): Record<string, any> {
    return this._attributes || {};
  }

  /**
   * Sets the attributes from the instance. It deals with children properties too.
   */
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

  /** @internal */
  get enumerableAttributes(): Record<string, any> {
    return Object.keys(this.constructor.prototype).reduce((agg, key) => {
      let value;
      if (this.relatedNotNestedModels.includes(key)) {
        value = this[`_noInitializer${_.capitalize(key)}`];
      } else {
        value = this[key];
      }

      if (value !== undefined) agg[key] = value;
      return agg;
    }, {} as Record<string, any>);
  }

  /** @internal */
  get transformedAttributes(): Record<string, any> {
    let attributes = transformAliasAttributes(this, this.enumerableAttributes);
    attributes = transformHasManyAttributes(this, attributes);
    attributes = transformHasOneAttributes(this, attributes);
    attributes = transformCompositeKeyAttributes(this, attributes);

    return attributes;
  }

  /** @internal */
  get validatedAttributes(): Record<string, any> {
    return validateAttributes(this, this.transformedAttributes);
  }

  /**
   * Validates the instance attributes and returns the final transformed and validated attributes (before any dynamodb specific transformations like addin the entity name to the pk and sk, for example).
   */
  get finalAttributes(): Record<string, any> {
    return this.validatedAttributes;
  }

  // ---------------- BASIC ATTRIBUTES SETTINGS ----------------

  // ---------------- VALIDATION SUPPORT SETTINGS ----------------

  protected get relatedNotNestedModels() {
    return getHasOneNotNestedModels(this).concat(getHasManyNotNestedModels(this));
  }

  // ---------------- VALIDATION SUPPORT SETTINGS ----------------

  // ---------------- VALIDATION SETTINGS ----------------

  protected _error: Joi.ValidationError | undefined;

  /** @internal */
  validateRelatedModels(_throw: boolean = false): boolean {
    for (const hasOneModel of getHasOneNotNestedModels(this)) {
      const instance: BasicEntity | undefined = this[`_noInitializer${_.capitalize(hasOneModel)}`];

      if (instance == null) {
        const {
          opts: {
            required = false,
          } = {},
        } = getHasOneModel(this, hasOneModel) || {};

        if (required) {
          const error = new Joi.ValidationError(`"${hasOneModel}" is required.`, this, this.attributes);
          if (_throw) {
            throw error;
          } else {
            this._error = error;
            return false;
          }
        } else {
          continue;
        }
      }

      const valid = instance.validate(_throw);
      if (!valid) {
        this._error = instance.error;
        return false;
      }
    }

    return true;
  }

  /**
   * Validates the current instance.
   * @param {boolean} _throw - If true, throws an error if the instance is invalid. If false, saves the error to the error property and returns true or false.
   */
  validate(_throw: boolean = false): boolean {
    this._error = undefined;
    try {
      validateAttributes(this, this.transformedAttributes);
      this.validateRelatedModels(true);
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

  /**
   * Returns a boolean indicating if the current instance is valid or not.
   */
  get valid() {
    return this.validate();
  }

  /**
   * If a validation was ran without throwing exceptions, the errors found are kept in the error variable. This getter returns that error.
   */
  get error() {
    return this._error;
  }

  // ---------------- VALIDATION SETTINGS ----------------

  // ---------------- STATIC METHODS ----------------

  /** @ignore */
  static transformAttributes(item: Record<string, any>): Record<string, any> {
    return new this(item).transformedAttributes;
  }

  /**
   * Returns the transformed attributes of the item. Similar to {@link Entity.finalAttributes | Instance finalAttributes getter}.
   * @param {Record<string, any>} item - The attributes to use for the transformation.
   */
  static validateAttributes(item: Record<string, any>): Record<string, any> {
    return new this(item).validatedAttributes;
  }

  /**
   * Creates as instance of the current class with the attributes provided and validates it. See {@link Entity.validate | Instance Validate} for more details.
   * @param {Record<string, any>} item - The attributes to use when creating the instance.
   * @param {boolean} [_throw = true] - If it should throw an error or not when validating.
   */
  static validate(item: Record<string, any>, _throw: boolean = true) {
    return new this(item).validate(_throw);
  }

  // ---------------- STATIC METHODS ----------------
}
