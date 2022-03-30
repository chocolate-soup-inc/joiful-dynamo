import Joi from 'joi';
import { aliases } from '../src/lib/decorators/methods/aliases';
import { prop } from '../src/lib/decorators/methods/props';
import { validate } from '../src/lib/decorators/methods/validations';
import { compositeKey } from '../src/lib/decorators/methods/compositeKeys';
import { Entity } from '../src/lib/Entity';

class A extends Entity {
  @prop()
  @aliases(['aliasA'])
  @validate(Joi.string().required().trim())
  a: string;
}

class B extends A {
  @prop()
  @aliases(['aliasB'])
  b: string;
}

class C extends B {
  @prop()
  @aliases(['aliasC'])
  c: string;

  @prop()
  @compositeKey(['a', 'b'])
  composite: string;

  public get attributeList(): string[] {
    return super.attributeList;
  }
}

describe('Entity inheritance', () => {
  test('It should set the correct attributeList', () => {
    const instance = new C();
    expect(instance.attributeList.sort()).toStrictEqual([
      'a',
      'aliasA',
      'b',
      'aliasB',
      'c',
      'aliasC',
      'composite',
    ].sort());
  });

  test('It should correctly deal with attributes', () => {
    const instance = new C({ a: 'a', b: 'b', c: 'c' });
    expect(instance.attributes).toStrictEqual({
      a: 'a',
      b: 'b',
      c: 'c',
    });
  });

  test('It should correctly deal with aliases', () => {
    const instance = new C({ aliasA: 'a', aliasB: 'b', c: 'c' });
    expect(instance.attributes).toStrictEqual({
      a: 'a',
      b: 'b',
      c: 'c',
    });
  });

  test('It should correctly deal with validations when valid', () => {
    const instance = new C({ aliasA: 'a', aliasB: 'b', c: 'c' });
    expect(instance.attributes).toStrictEqual({
      a: 'a',
      b: 'b',
      c: 'c',
    });

    expect(instance.valid).toBeTruthy();
  });

  test('It should correctly deal with validations when invalid', () => {
    const instance = new C({ aliasB: 'b', c: 'c' });
    expect(instance.attributes).toStrictEqual({
      b: 'b',
      c: 'c',
    });

    expect(instance.valid).toBeFalsy();
  });

  test('It should correctly deal with composite keys', () => {
    const instance = new C({ aliasA: 'a', aliasB: 'b', c: 'c' });
    expect(instance.attributes).toStrictEqual({
      a: 'a',
      b: 'b',
      c: 'c',
    });

    expect(instance.validate().value).toStrictEqual({
      a: 'a',
      b: 'b',
      c: 'c',
      composite: 'a#b',
    });
  });
});
