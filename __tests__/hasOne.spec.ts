/* eslint-disable max-classes-per-file */
import * as Joi from 'joi';
import { Entity } from '../src/lib/Entity';
import { aliases } from '../src/lib/decorators/methods/aliases';
import { hasOne } from '../src/lib/decorators/methods/relations';
import { prop } from '../src/lib/decorators/methods/props';
import { validate } from '../src/lib/decorators/methods/validations';

class ChildModel extends Entity {
  @prop()
  @aliases(['alias1'])
  @validate(Joi.string().required())
  pk: string;

  @prop()
  @validate(Joi.string())
  sk: string;
}

class TestModel extends Entity {
  @prop()
  pk: number;

  @prop()
  sk: number;

  @hasOne(ChildModel, { nestedObject: true })
  @aliases(['childAlias'])
  childProperty: ChildModel | Record<string, any>;

  @hasOne(ChildModel, { required: true, nestedObject: true })
  child2: ChildModel;
}

class TestModelWithRelated extends Entity {
  @prop()
  pk: number;

  @prop()
  sk: number;

  @hasOne(ChildModel, { required: false, nestedObject: false })
  child1: ChildModel;

  @hasOne(ChildModel, { required: true, nestedObject: false })
  child2: ChildModel;
}

describe('Has one', () => {
  test('should set the child correctly', () => {
    const model = new TestModel({ pk: 1, sk: 2 });
    expect(model.childProperty).toBeInstanceOf(ChildModel);
    expect(model.childProperty.attributes).toStrictEqual({});
  });

  test('should correctly proxy the child data', () => {
    const model = new TestModel({ pk: 1, sk: 2 });
    expect(model.childPropertyPk).toBeUndefined();
    model.childProperty.pk = '1';
    expect(model.childPropertyPk).toEqual('1');
    expect(model.childPropertyAlias1).toEqual('1');
    model.childPropertySk = '2';
    expect(model.childProperty.sk).toEqual('2');
    model.childPropertyAlias1 = '3';
    expect(model.childProperty.pk).toEqual('3');
  });

  test('it should work correctly with aliases', () => {
    const model = new TestModel({ pk: 1, sk: 2 });

    expect(model.childAlias).toBeInstanceOf(ChildModel);
    expect(model.childAlias.attributes).toStrictEqual({});
    expect(model.childProperty).toBeInstanceOf(ChildModel);
    expect(model.childProperty.attributes).toStrictEqual({});

    model.childAlias = {
      pk: 'child-1',
      sk: 'child-1',
    };

    expect(model.childAlias).toBeInstanceOf(ChildModel);
    expect(model.childAlias.attributes).toStrictEqual({
      pk: 'child-1',
      sk: 'child-1',
    });

    expect(model.childProperty).toBeInstanceOf(ChildModel);
    expect(model.childProperty.attributes).toStrictEqual({
      pk: 'child-1',
      sk: 'child-1',
    });
  });

  test('should let child properties to be initialized', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childPropertyPk: '1',
      childProperty: {
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    });

    expect(model.pk).toEqual(1);
    expect(model.sk).toEqual(2);
    expect(model.childProperty.pk).toEqual('1');
    expect(model.childProperty.sk).toEqual('2');
  });

  test('should let to assign a new child', () => {
    const model = new TestModel({ pk: 2, sk: 3 });
    model.childProperty.pk = '1';
    expect(model.childProperty.pk).toEqual('1');
    expect(model.childPropertyPk).toEqual('1');
    expect(model.childPropertySk).toBeUndefined();
    expect(model.pk).toEqual(2);
    expect(model.sk).toEqual(3);
    const newChild = new ChildModel({ pk: '4', sk: '5' });
    model.childProperty = newChild;
    expect(model.childProperty.pk).toEqual('4');
    expect(model.childPropertyPk).toEqual('4');
    expect(model.childPropertySk).toEqual('5');
    expect(model.pk).toEqual(2);
    expect(model.sk).toEqual(3);
  });

  test('attributes should include the child attributes', () => {
    const model = new TestModel({
      sk: 2,
      childPropertyPk: '1',
      childProperty: {
        sk: '2',
      },
    });

    model.pk = 1;
    model.childProperty.pk = '3';
    expect(model.childProperty.pk).toEqual('3');

    expect(model.attributes).toStrictEqual({
      pk: 1,
      sk: 2,
      childProperty: {
        pk: '3',
        sk: '2',
      },
    });
  });

  test('when child is blank, it should not include its key', () => {
    const model = new TestModel({ pk: 1, sk: 2 });

    expect(model.attributes).toStrictEqual({
      pk: 1,
      sk: 2,
    });
  });

  test('it correctly validates the child when there is no error in the child or parent', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childProperty: {
        alias1: '1',
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    });

    expect(model.valid).toBeTruthy();
    expect(model.validatedAttributes).toStrictEqual({
      pk: 1,
      sk: 2,
      childProperty: {
        pk: '1',
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    });
  });

  test('it correctly validates the child when validating the parent', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childProperty: {
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    });

    expect(model.valid).toBeFalsy();
  });

  test('it correctly validates the child when there is no error in the child or parent in the static method', () => {
    const {
      error,
      value,
    } = TestModel.validate({
      pk: 1,
      sk: 2,
      childProperty: {
        alias1: '1',
        sk: '2',
      },
      child2: {
        alias1: '1',
      },
    });

    expect(value).toStrictEqual({
      pk: 1,
      sk: 2,
      childProperty: {
        pk: '1',
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    });

    expect(error).toBeUndefined();
  });

  test('it correctly validates the child when validating the parent in the static Method', () => {
    const {
      error,
      value,
    } = TestModel.validate({
      pk: 1,
      sk: 2,
      childProperty: {
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    });

    expect(value).toStrictEqual({
      pk: 1,
      sk: 2,
      childProperty: {
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    });

    expect(error).toBeInstanceOf(Joi.ValidationError);
    expect(error?.message).toEqual('"childProperty.pk" is required');
  });

  test('it validates a required hasOne on the static method', () => {
    const {
      error,
      value,
    } = TestModel.validate({
      pk: 1,
      sk: 2,
      childProperty: {
        pk: '1',
        sk: '2',
      },
    });

    expect(value).toStrictEqual({
      pk: 1,
      sk: 2,
      childProperty: {
        pk: '1',
        sk: '2',
      },
    });

    expect(error).toBeInstanceOf(Joi.ValidationError);
    expect(error?.message).toEqual('"child2" is required');
  });

  test('it validates a required hasOne on the instance method', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childProperty: {
        pk: '1',
        sk: '2',
      },
    });

    expect(model.valid).toBeFalsy();
    expect(model.error).toBeInstanceOf(Joi.ValidationError);
    expect(model.error?.message).toEqual('"child2" is required');
  });

  describe('Related models', () => {
    test('When there is a related model missing it is invalid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
      });

      expect(model.valid).toBeFalsy();
      expect(model.error).toBeInstanceOf(Joi.ValidationError);
      expect(model.error?.message).toEqual('"child2" is required');
    });

    test('When the required child is present and it is valid, the parent is valid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        child2: {
          pk: '1',
          sk: '2',
        },
      });

      expect(model.valid).toBeTruthy();
      expect(model.error).toBeUndefined();
    });

    test('When both children are present and are valid, the parent is valid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        child1: {
          pk: '1',
          sk: '2',
        },
        child2: {
          pk: '1',
          sk: '2',
        },
      });

      expect(model.valid).toBeTruthy();
      expect(model.error).toBeUndefined();
    });

    test('When both children are present and the required one is invalid, the parent is invalid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        child1: {
          pk: '1',
          sk: '2',
        },
        child2: {
          sk: '2',
        },
      });

      expect(model.valid).toBeFalsy();
      expect(model.error).toBeInstanceOf(Joi.ValidationError);
      expect(model.error?.message).toEqual('"child2.pk" is required');
    });

    test('When both children are present and the not required one is invalid, the parent is invalid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        child1: {
          sk: '2',
        },
        child2: {
          pk: '1',
          sk: '2',
        },
      });

      expect(model.valid).toBeFalsy();
      expect(model.error).toBeInstanceOf(Joi.ValidationError);
      expect(model.error?.message).toEqual('"child1.pk" is required');
    });

    test('When both are valid, the attributes does include the not nested models', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        child1: {
          pk: '1',
          sk: '2',
        },
        child2: {
          pk: '1',
          sk: '2',
        },
      });

      model.validate();

      expect(model.validatedAttributes).toStrictEqual({
        pk: 1,
        sk: 2,
        child1: {
          pk: '1',
          sk: '2',
        },
        child2: {
          pk: '1',
          sk: '2',
        },
      });
    });

    test('When both are invalid, the attributes does include the not nested models', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        child1: {
          sk: '2',
        },
        child2: {
          sk: '2',
        },
      });

      model.validate();

      expect(model.validatedAttributes).toStrictEqual({
        pk: 1,
        sk: 2,
        child1: {
          sk: '2',
        },
        child2: {
          sk: '2',
        },
      });
    });
  });

  describe('Child parent instance', () => {
    test('It should not instantiate anything when there is not parent', () => {
      const model = new ChildModel({
        pk: '1',
        sk: '2',
      });

      expect(model.parents).toStrictEqual([]);
    });

    test('It should be correctly set when instantiating the parent with it', () => {
      const model = new TestModel({
        pk: 1,
        sk: 2,
        childProperty: {
          pk: '1',
          sk: '2',
        },
      });

      expect(model.childProperty.parents).toStrictEqual([model]);
    });

    test('It should be correctly set when setting instances after the parent is already instantiated', () => {
      const model = new TestModel({
        pk: 1,
        sk: 2,
      });

      model.childProperty = new ChildModel({
        pk: '1',
        sk: '2',
      });

      expect(model.childProperty.parents).toStrictEqual([model]);
    });

    test('It should be correctly set when setting objects after the parent is already instantiated', () => {
      const model = new TestModel({
        pk: 1,
        sk: 2,
      });

      model.childProperty = {
        pk: '1',
        sk: '2',
      };

      expect(model.childProperty.parents).toStrictEqual([model]);
    });
  });

  test('Setting a child to null works', () => {
    const parent = new TestModel({
      pk: '1',
      sk: '2',
      childProperty: { pk: '3', sk: '4' },
      child2: { pk: '5', sk: '6' },
    });
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childProperty: { pk: '3', sk: '4' },
      child2: { pk: '5', sk: '6' },
    });

    // NEEDS EVAL BECAUSE OF TYPESCRIPT TYPE CHECKING
    // eslint-disable-next-line no-eval
    eval('parent.child2 = null');
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childProperty: { pk: '3', sk: '4' },
    });
  });

  test('Setting a child to undefined works', () => {
    const parent = new TestModel({
      pk: '1',
      sk: '2',
      childProperty: { pk: '3', sk: '4' },
      child2: { pk: '5', sk: '6' },
    });
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childProperty: { pk: '3', sk: '4' },
      child2: { pk: '5', sk: '6' },
    });

    // NEEDS EVAL BECAUSE OF TYPESCRIPT TYPE CHECKING
    // eslint-disable-next-line no-eval
    eval('parent.child2 = undefined');
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childProperty: { pk: '3', sk: '4' },
    });
  });
});
