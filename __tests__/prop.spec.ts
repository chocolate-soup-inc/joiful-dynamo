import { Entity } from '../src/lib/classes/Entity';
import { prop } from '../src/lib/decorators/prop';

class SimpleModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop({ createdAt: true })
  _cat: string;

  @prop({ updatedAt: true })
  _uat: string;
}

class NoKeysModel extends Entity {
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
});
