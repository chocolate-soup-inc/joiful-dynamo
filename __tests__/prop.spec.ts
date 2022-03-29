import { Entity } from '../src/lib/Entity';
import { prop } from '../src/lib/decorators/methods/props';
import { hasOne } from '../src/lib/decorators/methods/relations';

class TestEntity extends Entity {
  public get _primaryKey() { return super._primaryKey; }

  public get _secondaryKey() { return super._secondaryKey; }

  public get _createdAtKey() { return super._createdAtKey; }

  public get _updatedAtKey() { return super._updatedAtKey; }

  public static get _primaryKey() { return super._primaryKey; }

  public static get _secondaryKey() { return super._secondaryKey; }

  public static get _createdAtKey() { return super._createdAtKey; }

  public static get _updatedAtKey() { return super._updatedAtKey; }
}

class SimpleModel extends TestEntity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop({ createdAt: true })
  _cat: string;

  @prop({ updatedAt: true })
  _uat: string;
}

class OtherSimpleModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;
}

class ParentModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @hasOne(OtherSimpleModel, { foreignKey: 'sk' })
  child: OtherSimpleModel;
}

class NoKeysModel extends TestEntity {
  @prop()
  pk: string;

  @prop()
  sk: string;
}

describe('Prop', () => {
  test('The getters and setters should be set correctly', () => {
    const instance = new SimpleModel();
    expect(instance.pk).toBeUndefined();
    expect(instance.sk).toBeUndefined();
    instance.pk = '1';
    instance.sk = '2';
    expect(instance.pk).toEqual('1');
    expect(instance.sk).toEqual('2');
  });

  test('When calling the getter method, expected the getAttribute function to be called', () => {
    const instance = new SimpleModel();
    const spy = jest.spyOn(instance, 'getAttribute');
    expect(instance.pk).toBeUndefined();
    expect(spy).toHaveBeenCalledWith('pk');
  });

  test('When calling the setter method, expected the setAttribute function to be called', () => {
    const instance = new SimpleModel();
    const spy = jest.spyOn(instance, 'setAttribute');
    instance.pk = '1';
    expect(spy).toHaveBeenCalledWith('pk', '1');
  });

  test('The primary key and secondary key methds should be set correctly', () => {
    const instance = new SimpleModel();
    expect(instance._primaryKey).toEqual('pk');
    expect(instance._secondaryKey).toEqual('sk');
    expect(instance._createdAtKey).toEqual('_cat');
    expect(instance._updatedAtKey).toEqual('_uat');
    expect(SimpleModel._primaryKey).toEqual('pk');
    expect(SimpleModel._secondaryKey).toEqual('sk');
    expect(SimpleModel._createdAtKey).toEqual('_cat');
    expect(SimpleModel._updatedAtKey).toEqual('_uat');
  });

  test('when using a class without any primary or secondary key it return undefined to the methods', () => {
    const instance = new NoKeysModel();
    expect(instance._primaryKey).toBeUndefined();
    expect(instance._secondaryKey).toBeUndefined();
    expect(instance._createdAtKey).toBeUndefined();
    expect(instance._updatedAtKey).toBeUndefined();
    expect(NoKeysModel._primaryKey).toBeUndefined();
    expect(NoKeysModel._secondaryKey).toBeUndefined();
    expect(NoKeysModel._createdAtKey).toBeUndefined();
    expect(NoKeysModel._updatedAtKey).toBeUndefined();
  });

  test('when the primary key has the entityName prefix and there is no secondary key, the values are correctly parsed and the secondary key copies the primary key', () => {
    const instance = new SimpleModel({ pk: 'SimpleModel-1' });
    expect(instance.pk).toEqual('1');
    expect(instance.sk).toBeUndefined();

    expect(instance.dbKey).toStrictEqual({
      pk: 'SimpleModel-1',
      sk: 'SimpleModel-1',
    });
  });

  test('when the secondary key has the entityName prefix', () => {
    const instance = new SimpleModel({ sk: 'SimpleModel-1' });
    expect(instance.sk).toEqual('1');

    expect(instance.dbKey).toStrictEqual({
      pk: undefined,
      sk: 'SimpleModel-1',
    });
  });

  test('when the primary and secondary keys and a random key has the entityName prefix', () => {
    const instance = new SimpleModel({ pk: 'SimpleModel-1', sk: 'SimpleModel-2', random: 'SimpleModel-3' });
    expect(instance.pk).toEqual('1');
    expect(instance.sk).toEqual('2');
    expect(instance.random).toEqual('SimpleModel-3');

    expect(instance.dbKey).toStrictEqual({
      pk: 'SimpleModel-1',
      sk: 'SimpleModel-2',
    });
  });

  test('when the sk has the parent prefix while the oher keys has the current model prefix and the sk is the foreign to a parent, it correctly sets the attributes.', () => {
    const instance = new OtherSimpleModel({ pk: 'OtherSimpleModel-1', sk: 'ParentModel-2', random: 'OtherSimpleModel-3' });
    expect(instance.pk).toEqual('1');
    expect(instance.sk).toEqual('2');
    expect(instance.random).toEqual('OtherSimpleModel-3');

    expect(instance.dbKey).toStrictEqual({
      pk: 'OtherSimpleModel-1',
      sk: 'ParentModel-2',
    });
  });

  test('when the primary, secondary and the random keys key has the entityName prefix and the sk is the foreign to a parent, it correctly sets the attributes.', () => {
    const instance = new OtherSimpleModel({ pk: 'OtherSimpleModel-1', sk: 'OtherSimpleModel-2', random: 'OtherSimpleModel-3' });
    expect(instance.pk).toEqual('1');
    expect(instance.sk).toEqual('2');
    expect(instance.random).toEqual('OtherSimpleModel-3');

    expect(instance.dbKey).toStrictEqual({
      pk: 'OtherSimpleModel-1',
      sk: 'ParentModel-2',
    });
  });

  test('when there is a parent with no children, the fk is set anyways', () => {
    const instance = new ParentModel();
    expect(instance.pk).toBeUndefined();
    expect(instance.sk).toBeUndefined();

    instance.pk = '1';

    expect(instance.pk).toEqual('1');
    expect(instance.sk).toEqual('1');

    expect(instance.dbKey).toStrictEqual({
      pk: 'ParentModel-1',
    });

    instance.sk = '2';

    expect(instance.pk).toEqual('1');
    expect(instance.sk).toEqual('2');

    expect(instance.dbKey).toStrictEqual({
      pk: 'ParentModel-1',
    });

    expect(instance.dbAttributes).toStrictEqual({
      _entityName: 'ParentModel',
      pk: 'ParentModel-1',
      sk: 'ParentModel-2',
    });
  });
});
