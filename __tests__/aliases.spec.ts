import { Entity } from '../src/lib/Entity';
import { aliases, aliasTo } from '../src/lib/decorators/methods/aliases';

class TestModel extends Entity {
  @aliases(['alias1', 'alias2'])
  property: string;

  @aliasTo('property')
  alias3: string;

  public transformAttributes() { return super.transformAttributes(); }

  public static transformAttributes(item: Record<string, any>) { return super.transformAttributes(item); }

  public static get attributeList() {
    return super.attributeList;
  }
}

describe('Aliases Decorator', () => {
  test('It contains the correct attribute list', () => {
    expect(TestModel.attributeList).toStrictEqual([
      'alias1',
      'alias2',
      'alias3',
      'property',
    ]);
  });

  test('It correctly sets the alias when setting the property', () => {
    const instance = new TestModel();
    const propertyValue = 'test-value';
    instance.property = propertyValue;
    expect(instance.alias1).toEqual(propertyValue);
    expect(instance.alias2).toEqual(propertyValue);
    expect(instance.alias3).toEqual(propertyValue);
  });

  test('It correctly sets the property when setting the alias', () => {
    const instance = new TestModel();
    expect(instance.property).toBeUndefined();
    instance.property = '0';
    expect(instance.property).toEqual('0');
    instance.alias1 = '1';
    expect(instance.property).toEqual('1');
    instance.alias2 = '2';
    expect(instance.property).toEqual('2');
    instance.alias3 = '3';
    expect(instance.property).toEqual('3');
  });

  test('It correctly set the aliases when initializing with data', () => {
    const model1 = new TestModel({ alias1: '1' });
    expect(model1.attributes).toStrictEqual({ property: '1' });
    const model2 = new TestModel({ alias2: '2' });
    expect(model2.attributes).toStrictEqual({ property: '2' });
    const model3 = new TestModel({ property: '1' });
    expect(model3.alias1).toEqual('1');
    expect(model3.alias2).toEqual('1');
    expect(model3.alias3).toEqual('1');
    const model4 = new TestModel({ alias3: '3' });
    expect(model4.attributes).toStrictEqual({ property: '3' });
  });

  test('Expects the attributes to be correct', () => {
    const instance = new TestModel({ alias1: '1' });
    instance.alias3 = '2';

    expect(instance.attributes).toStrictEqual({
      property: '2',
    });

    expect(instance.transformAttributes()).toStrictEqual({
      property: '2',
    });
  });

  test('Expects the transformed attributes to be correct in the static method', () => {
    expect(TestModel.transformAttributes({ alias1: '1', alias3: '2' })).toStrictEqual({
      property: '2',
    });
  });
});
