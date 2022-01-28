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

  test('The primary key and secondary key methds should be set correctly', () => {
    const instance = new SimpleModel();
    expect(instance.primaryKey).toEqual('pk');
    expect(instance.secondaryKey).toEqual('sk');
    expect(instance.createdAtKey).toEqual('_cat');
    expect(instance.updatedAtKey).toEqual('_uat');
    expect(SimpleModel.primaryKey).toEqual('pk');
    expect(SimpleModel.secondaryKey).toEqual('sk');
    expect(SimpleModel.createdAtKey).toEqual('_cat');
    expect(SimpleModel.updatedAtKey).toEqual('_uat');
  });

  test('when using a class without any primary or secondary key it return undefined to the methods', () => {
    const instance = new NoKeysModel();
    expect(instance.primaryKey).toBeUndefined();
    expect(instance.secondaryKey).toBeUndefined();
    expect(instance.createdAtKey).toBeUndefined();
    expect(instance.updatedAtKey).toBeUndefined();
    expect(NoKeysModel.primaryKey).toBeUndefined();
    expect(NoKeysModel.secondaryKey).toBeUndefined();
    expect(NoKeysModel.createdAtKey).toBeUndefined();
    expect(NoKeysModel.updatedAtKey).toBeUndefined();
  });
});
