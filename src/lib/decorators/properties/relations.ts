import _ from 'lodash';
import { addChildPropertiesKey } from '../reflections/relations';
import { setPropGettersAndSetters } from './props';

export function getParentPropertyName(target, propertyName, ChildModel) {
  return `${ChildModel._entityName}_belongsTo_${target._entityName}_on_${propertyName}`;
}

function isChild(value, ChildModel) {
  return value instanceof ChildModel;
}

function isChildArray(value, ChildModel) {
  return Array.isArray(value) && value.every((v) => isChild(v, ChildModel));
}

function isObjectArray(value) {
  return Array.isArray(value) && value.every(_.isPlainObject);
}

function hasOneSetter(
  target: any,
  propertyName: string,
  ChildModel: any,
  value: any,
  foreignKey: string | undefined,
) {
  let finalvalue;
  if (isChild(value, ChildModel)) {
    finalvalue = value;
  } else if (_.isPlainObject(value)) {
    finalvalue = new ChildModel(value);
  } else {
    throw new Error(`Bad argument error for ${propertyName}. It should be an instance of ${ChildModel._entityName}`);
  }

  if (foreignKey) finalvalue[foreignKey] = target.transformAttributes()[foreignKey] || target[foreignKey];

  return target.setAttribute(propertyName, finalvalue);
}

function hasOneGetter(
  target: any,
  propertyName: string,
  ChildModel: any,
  foreignKey: string | undefined,
) {
  return target.getAttribute(propertyName) || hasOneSetter(target, propertyName, ChildModel, new ChildModel(), foreignKey);
}

function hasManySetter(
  target: any,
  propertyName: string,
  ChildModel: any,
  value: any,
  foreignKey: string | undefined,
) {
  let finalValue;
  if (isChildArray(value, ChildModel)) {
    finalValue = value;
    target.setAttribute(propertyName, value);
  } else if (isObjectArray(value)) {
    finalValue = value.map((v) => new ChildModel(v));
  } else {
    throw new Error(`Bad argument error for ${propertyName}. It should be an array of instances of ${ChildModel._entityName}`);
  }

  if (foreignKey) {
    finalValue.forEach((v) => {
      v[foreignKey] = target.transformAttributes()[foreignKey] || target[foreignKey];
    });
  }

  return target.setAttribute(propertyName, finalValue);
}

function hasManyGetter(
  target: any,
  propertyName: string,
  ChildModel: any,
  foreignKey: string | undefined,
) {
  return target.getAttribute(propertyName) || hasManySetter(target, propertyName, ChildModel, [], foreignKey);
}

export function addRelationDescriptor({
  target,
  type,
  propertyName,
  ChildModel,
  foreignKey,
}: {
  target: any,
  type: 'hasMany' | 'hasOne',
  propertyName: string;
  ChildModel: any;
  foreignKey?: string;
}) {
  const parentPropertyName = getParentPropertyName(target, propertyName, ChildModel);

  if (type === 'hasOne') {
    Object.defineProperty(target, propertyName, {
      get() { return hasOneGetter(this, propertyName, ChildModel, foreignKey); },
      set(v) {
        const instance = hasOneSetter(this, propertyName, ChildModel, v, foreignKey);
        instance[parentPropertyName] = this;
      },
      enumerable: true,
      configurable: false,
    });
  } else if (type === 'hasMany') {
    Object.defineProperty(target, propertyName, {
      get() { return hasManyGetter(this, propertyName, ChildModel, foreignKey); },
      set(v) {
        const instances = hasManySetter(this, propertyName, ChildModel, v, foreignKey);
        instances.forEach((instance) => {
          instance[parentPropertyName] = this;
        });
      },
      enumerable: true,
      configurable: false,
    });
  }

  Object.defineProperty(target, parentPropertyName, {
    get() { return this[`_${parentPropertyName}`]; },
    set(v) { this[`_${parentPropertyName}`] = v; },
    enumerable: false,
    configurable: false,
  });

  if (foreignKey) {
    Object.defineProperty(target, foreignKey, {
      get() {
        const v = this.getAttribute(foreignKey);
        if (v == null && this._primaryKey) return this.getAttribute(this._primaryKey);
        return v;
      },
      set(value) {
        this.setAttribute(foreignKey, value);
      },
      enumerable: true,
      configurable: true,
    });

    // setPropGettersAndSetters(target, foreignKey);
    setPropGettersAndSetters(ChildModel.prototype, foreignKey);
  }
}

/** @internal */
export function setHasOnePropertiesDescriptor(target: any, modelName: string, ChildModel: any) {
  ChildModel.prototype.attributeList.forEach((key) => {
    const propertyName = `${modelName}${_.capitalize(key)}`;

    addChildPropertiesKey(target, propertyName);

    Object.defineProperty(target, propertyName, {
      get() {
        if (this[modelName]) return this[modelName][key];
        return undefined;
      },
      set(value) {
        if (this[modelName] == null) {
          this[modelName] = new ChildModel({
            [key]: value,
          });
        } else {
          this[modelName][key] = value;
        }
      },
      configurable: false,
      enumerable: false,
    });
  });
}
