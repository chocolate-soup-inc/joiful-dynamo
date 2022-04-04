import Joi from 'joi';
import _ from 'lodash';
import { transformCompositeKeyAttributes } from './decorators/helpers/compositeKeys';

import {
  defaultValidateOptions,
  joiSchema,
  joiSchemaKeys,
  validateAttributes,
} from './decorators/helpers/validations';

import {
  setPropGettersAndSetters,
} from './decorators/properties/props';
import { getParentPropertyName } from './decorators/properties/relations';

import {
  getAliasesForProperty,
} from './decorators/reflections/aliases';

import {
  getCreatedAtKey,
  getPrimaryKey,
  getSecondaryKey,
  getUpdatedAtKey,
} from './decorators/reflections/props';

import {
  getChildPropertiesKeys,
  getRelations,
} from './decorators/reflections/relations';

import {
  getTableDynamoDbInstance,
  getTableName,
} from './decorators/reflections/table';

export const entityColumnName = '_entityName';

export class Entity {
  [key: string]: any;

  constructor(item: Record<string, any> = {}) {
    this.setAttributes(item);
  }

  protected _extraAttributesKeys: string[] = [];

  protected _attributes: Record<string, any> = {};

  get attributes() {
    const attributes = Object.entries(this._attributes).reduce((agg, [key, value]: [string, any]) => {
      let newValue = _.cloneDeep(value);
      const childRelation = this.childrenRelations.find((rel) => rel.propertyName === key);

      if (childRelation && value != null) {
        if (childRelation.type === 'hasMany') {
          newValue = _.compact(newValue.map((item) => item.attributes).filter((item) => !_.isEmpty(item)));
        } else if (childRelation.type === 'hasOne') {
          newValue = newValue.attributes;
        }
      }

      agg[key] = newValue;

      return agg;
    }, {} as Record<string, any>);

    return _.omitBy(attributes, (value) => {
      return (
        (_.isObjectLike(value) && _.isEmpty(value))
        || (!_.isObjectLike(value) && _.isUndefined(value))
      );
    });
  }

  set attributes(item: Record<string, any>) {
    this.setAttributes(item);
  }

  protected setAttributes(item: Record<string, any>, opts?: { doNotSetDirty?: boolean }) {
    delete item[entityColumnName];

    const currentDirty = this.dirty;

    // NEED TO ADD THE CHILD PROPERTIES AFTER THE OTHER PROPERTIES SO IF A CHILD IS FULLY PASSED IT DOESN'T OVERRIDE THE CHILD PROPERTY
    const childPropertiesKeys = getChildPropertiesKeys(this);

    for (const [key, value] of Object.entries(item)) {
      if (!childPropertiesKeys.includes(key)) {
        if (!this.attributeList.includes(key)) {
          setPropGettersAndSetters(this, key);
          this._extraAttributesKeys.push(key);
        }

        this[key] = value;
      }
    }

    for (const key of childPropertiesKeys) {
      if (Object.keys(item).includes(key)) {
        this[key] = item[key];
      }
    }

    if (opts?.doNotSetDirty) this.dirty = currentDirty;
  }

  protected _validatedAttributes: Record<string, any> | undefined;

  get validatedAttributes() { return this._validatedAttributes; }

  set validatedAttributes(v: Record<string, any> | undefined) { this._validatedAttributes = v; }

  protected get _dynamodb() { return getTableDynamoDbInstance(this.constructor); }

  protected static get _dynamodb() { return this.prototype._dynamodb; }

  protected get _tableName() { return getTableName(this.constructor); }

  protected static get _tableName() { return this.prototype._tableName; }

  get _entityName() { return this.constructor.name; }

  static get _entityName() { return this.prototype._entityName; }

  protected get _primaryKey() { return getPrimaryKey(this); }

  protected static get _primaryKey() { return this.prototype._primaryKey; }

  protected get _secondaryKey() { return getSecondaryKey(this); }

  protected static get _secondaryKey() { return this.prototype._secondaryKey; }

  protected get _createdAtKey() { return getCreatedAtKey(this); }

  protected static get _createdAtKey() { return this.prototype._createdAtKey; }

  protected get _updatedAtKey() { return getUpdatedAtKey(this); }

  protected static get _updatedAtKey() { return this.prototype._updatedAtKey; }

  protected get _entityPrefix() { return `${this._entityName}-`; }

  protected static get _entityPrefix() { return this.prototype._entityPrefix; }

  protected get _joiSchema() { return joiSchema(this); }

  protected static get _joiSchema() { return this.prototype._joiSchema; }

  protected _dirty: boolean = false;

  get dirty() { return this._dirty; }

  protected set dirty(v) {
    if (!this._dirty && v) {
      this.error = undefined;
      this.validatedAttributes = undefined;
    }

    for (const parent of this.parents) {
      parent.dirty = v;
    }

    this._dirty = v;
  }

  get error(): Joi.ValidationError | undefined {
    return this._error;
  }

  protected set error(v: Joi.ValidationError | undefined) {
    if (v != null) this._valid = false;
    else this._valid = true;

    this._error = v;
  }

  protected get _currentPrototypePropertyList(): string[] {
    return (
      Object.keys(this.constructor.prototype) || []
    ).concat(this._extraAttributesKeys || []);
  }

  protected get _propertyList(): string[] {
    let properties = this._currentPrototypePropertyList;

    if (Entity.prototype.isPrototypeOf(this.constructor.prototype)) {
      const Model: typeof Entity = this.constructor.prototype;
      properties = properties.concat(Object.getPrototypeOf(Model)._currentPrototypePropertyList);
    }

    return properties;
  }

  protected get currentPrototypeAttributeList(): string[] {
    const currentProperties = this._currentPrototypePropertyList;

    const aliases = currentProperties.reduce((agg, item) => {
      return agg.concat(getAliasesForProperty(this.constructor.prototype, item));
    }, [] as string[]);

    return currentProperties.concat(aliases).sort((a, b) => a.localeCompare(b));
  }

  protected get attributeList(): string[] {
    let attributes = this.currentPrototypeAttributeList;

    if (Entity.prototype.isPrototypeOf(this.constructor.prototype)) {
      const Model: typeof Entity = this.constructor.prototype;
      attributes = attributes.concat(Object.getPrototypeOf(Model).attributeList);
    }

    return _.compact(attributes);
  }

  public static get attributeList() {
    return this.prototype.attributeList;
  }

  protected get parentRelations() {
    return getRelations(this, ['belongsTo']);
  }

  get parents(): Entity[] {
    return _.compact(
      this.parentRelations.map((rel) => {
        const parentPropertyName = getParentPropertyName(rel.Model, rel.parentPropertyName, this);
        return this[parentPropertyName];
      }),
    );
  }

  protected get childrenRelations() {
    return getRelations(this, ['hasMany', 'hasOne']);
  }

  get dbParentForeignKeys() {
    const transformedAttributes = this.transformAttributes();

    return this.parentRelations.reduce((agg, rel) => {
      const {
        foreignKey,
        Model: ParentModel,
      } = rel;

      if (foreignKey) {
        const value = transformedAttributes[foreignKey] || this[foreignKey];

        if (typeof value === 'string' && !value.startsWith(ParentModel._entityPrefix)) {
          agg[foreignKey] = `${ParentModel._entityPrefix}${value}`;
        } else {
          agg[foreignKey] = value;
        }
      }

      return agg;
    }, {} as Record<string, string>);
  }

  get dbChildrenForeignKeys() {
    const transformedAttributes = this.transformAttributes();

    return this.childrenRelations.reduce((agg, rel) => {
      const {
        foreignKey,
      } = rel;

      if (foreignKey != null && this._primaryKey != null) {
        agg[foreignKey] = `${this._entityPrefix}${transformedAttributes[foreignKey] || this[foreignKey]}`;
      }

      return agg;
    }, {} as Record<string, string>);
  }

  get dbKey(): Record<string, any> {
    const dbKey = {};

    const transformedAttributes = this.transformAttributes();

    if (this._primaryKey) dbKey[this._primaryKey] = transformedAttributes[this._primaryKey] || this[this._primaryKey];

    if (this._secondaryKey) dbKey[this._secondaryKey] = transformedAttributes[this._secondaryKey] || this[this._secondaryKey];

    if (this._primaryKey && this._secondaryKey && dbKey[this._secondaryKey] == null) {
      dbKey[this._secondaryKey] = dbKey[this._primaryKey];
    }

    for (const [key, value] of Object.entries(dbKey)) {
      const parentKeyValue = this.dbParentForeignKeys[key];
      if (parentKeyValue != null) {
        dbKey[key] = parentKeyValue;
      } else if (value != null) {
        dbKey[key] = `${this._entityPrefix}${value}`;
      } else if (Object.keys(this.dbParentForeignKeys).includes(key)) {
        dbKey[key] = undefined;
      }
    }

    return dbKey;
  }

  get dbAttributes(): Record<string, any> {
    if (this.validatedAttributes == null) this.validate();
    if (this.validatedAttributes == null || _.isEmpty(this.validatedAttributes)) {
      throw new Error('Entity cannot be empty.');
    }
    if (this.error) throw this.error;

    const currentDBAttributes = this.validatedAttributes;

    const now = new Date().toISOString();
    if (this._createdAtKey) {
      this[this._createdAtKey] = now;
      currentDBAttributes[this._createdAtKey] = now;
    }
    if (this._updatedAtKey) {
      this[this._updatedAtKey] = now;
      currentDBAttributes[this._updatedAtKey] = now;
    }

    return {
      ...currentDBAttributes,
      ...this.dbChildrenForeignKeys,
      ...this.dbParentForeignKeys,
      ...this.dbKey,
      [entityColumnName]: this._entityName,
    };
  }

  protected getAttribute(key: string) {
    return this._attributes[key];
  }

  protected setAttribute(key: string, value: any) {
    if (key === entityColumnName) return value;

    let transformedValue = _.cloneDeep(value);

    // REMOVE ENTITY PREFIX WHEN SETTING ATTRIBUTE FOR PRIMARY AND SECONDARY KEY
    if (
      [this._primaryKey, this._secondaryKey].includes(key)
      && transformedValue != null
      && typeof transformedValue === 'string'
      && transformedValue.startsWith(this._entityPrefix)
    ) {
      transformedValue = transformedValue.split(this._entityPrefix).slice(1).join(this._entityPrefix);
    }

    // TRANSFORM THE VALUE THROUGH THE JOI SCHEMA
    const fieldJoiSchema = joiSchemaKeys(this);
    if (fieldJoiSchema[key] != null) {
      if (transformedValue instanceof Entity) {
        const { value: newAttributes } = fieldJoiSchema[key].validate(
          transformedValue.attributes,
          defaultValidateOptions,
        );

        transformedValue.attributes = newAttributes;
      } else {
        ({ value: transformedValue } = fieldJoiSchema[key].validate(
          transformedValue,
          defaultValidateOptions,
        ));
      }
    }

    // REMOVED THIS PREFIXES FROM FOREIGN KEYS TO CHILDREN
    const childRelation = this.childrenRelations.find((rel) => rel.foreignKey === key);
    if (
      childRelation != null
      && transformedValue != null
      && typeof transformedValue === 'string'
      && transformedValue.startsWith(this._entityPrefix)
    ) {
      transformedValue = transformedValue.split(this._entityPrefix).slice(1).join(this._entityPrefix);
    }

    // REMOVE PARENT PREFIXES TO FOREIGN KEYS
    const parentRelation = this.parentRelations.find((rel) => rel.foreignKey === key);
    if (
      parentRelation != null
      && transformedValue != null
      && typeof transformedValue === 'string'
      && transformedValue.startsWith(parentRelation.Model._entityPrefix)
    ) {
      transformedValue = transformedValue.split(parentRelation.Model._entityPrefix).slice(1).join(parentRelation.Model._entityPrefix);
    }

    this._attributes[key] = transformedValue;
    this.dirty = true;
    return transformedValue;
  }

  protected transformAttributes() {
    return transformCompositeKeyAttributes(this, this.attributes);
  }

  protected static transformAttributes(item: Record<string, any>) {
    return new this(item).transformAttributes();
  }

  validate() {
    const {
      value,
      error,
    } = validateAttributes(this, this.transformAttributes());

    this.dirty = false;
    this.validatedAttributes = value;

    if (error) this.error = error;
    else this.error = undefined;

    return {
      value,
      error,
    };
  }

  static validate(item: Record<string, any>) {
    return new this(item).validate();
  }

  get valid(): boolean {
    if (this.dirty) this.validate();
    return this._valid;
  }

  toJSON() {
    return {
      key: this.dbKey,
      attributes: this.attributes,
      validatedAttributes: this.validatedAttributes,
      dirty: this.dirty,
      error: this.error?.message,
    };
  }
}
