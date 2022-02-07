import * as Joi from 'joi';
import { Entity } from '../src/lib/classes/Entity';
import { compositeKey } from '../src/lib/decorators/compositeKey';
import { prop } from '../src/lib/decorators/prop';
import { validate } from '../src/lib/decorators/validate';

class TestModel extends Entity {
  @prop()
  @validate(Joi.string().required())
  @compositeKey(['field1', 'field2'])
  composite: string;

  @prop()
  field1: string;

  @prop()
  field2: string;
}

class TestModelWithDelimiter extends Entity {
  @prop()
  @validate(Joi.string().required())
  @compositeKey(['field1', 'field2'], { delimiter: '---' })
  composite: string;

  @prop()
  field1: string;

  @prop()
  field2: string;
}

class TestModelWithNestedComposite extends Entity {
  @prop()
  @compositeKey(['field1', 'field2'])
  composite0: string;

  @compositeKey(['composite0', 'composite2'])
  composite1: string;

  @prop()
  @compositeKey(['composite0', 'field3'])
  composite2: string;

  @prop()
  field1: string;

  @prop()
  field2: string;

  @prop()
  field3: string;
}

describe('Composite Keys', () => {
  describe('Instance', () => {
    test('It correctly set the composite key with default parameters', () => {
      const model = new TestModel({
        field1: '1',
        field2: 2,
      });

      expect(model.transformedAttributes.composite).toEqual('1#2');
      expect(model.valid).toBeTruthy();
    });

    test('When one of the values is blank, it does not set the composite key', () => {
      const model = new TestModel({
        field1: '1',
      });

      expect(model.transformedAttributes.composite).toBeUndefined();
      expect(model.valid).toBeFalsy();
    });

    test('When the value is set, it is overriden', () => {
      const model = new TestModel({
        composite: '123',
        field1: '1',
        field2: 2,
      });

      expect(model.composite).toEqual('123');
      expect(model.transformedAttributes.composite).toEqual('1#2');
    });

    test('When the value is set, it is overriden event if the value becomes null', () => {
      const model = new TestModel({
        composite: '123',
        field1: '1',
      });

      expect(model.composite).toEqual('123');
      expect(model.transformedAttributes.composite).toBeUndefined();
      expect(model.valid).toBeFalsy();
    });

    test('When the delimiter is set', () => {
      const model = new TestModelWithDelimiter({
        composite: '123',
        field1: '1',
        field2: '2',
      });

      expect(model.transformedAttributes.composite).toEqual('1---2');
    });

    test('when there is a nested composite key, it works as expected', () => {
      const model = new TestModelWithNestedComposite({
        field1: '1',
        field2: '2',
        field3: '3',
      });

      expect(model.transformedAttributes).toStrictEqual({
        composite0: '1#2',
        composite1: '1#2#1#2#3',
        composite2: '1#2#3',
        field1: '1',
        field2: '2',
        field3: '3',
      });
    });
  });

  describe('Static Class', () => {
    test('It correctly set the composite key with default parameters', () => {
      expect(TestModel.transformAttributes({
        field1: '1',
        field2: 2,
      })).toStrictEqual({
        composite: '1#2',
        field1: '1',
        field2: 2,
      });
    });

    test('When one of the values is blank, it does not set the composite key', () => {
      expect(TestModel.transformAttributes({
        field1: '1',
      })).toStrictEqual({
        field1: '1',
      });
    });

    test('When the value is set, it is overriden', () => {
      expect(TestModel.transformAttributes({
        composite: '123',
        field1: '1',
        field2: 2,
      })).toStrictEqual({
        composite: '1#2',
        field1: '1',
        field2: 2,
      });
    });

    test('When the value is set, it is overriden event if the value becomes null', () => {
      expect(TestModel.transformAttributes({
        composite: '123',
        field1: '1',
      })).toStrictEqual({
        field1: '1',
      });
    });

    test('When the delimiter is set', () => {
      expect(TestModelWithDelimiter.transformAttributes({
        composite: '123',
        field1: '1',
        field2: '2',
      })).toStrictEqual({
        composite: '1---2',
        field1: '1',
        field2: '2',
      });
    });

    test('when there is a nested composite key, it works as expected', () => {
      expect(TestModelWithNestedComposite.transformAttributes({
        field1: '1',
        field2: '2',
        field3: '3',
      })).toStrictEqual({
        composite0: '1#2',
        composite1: '1#2#1#2#3',
        composite2: '1#2#3',
        field1: '1',
        field2: '2',
        field3: '3',
      });
    });
  });
});
