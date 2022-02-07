/* eslint-disable max-classes-per-file */
import * as Joi from 'joi';
import { Entity } from '../src/lib/classes/Entity';
import { aliases } from '../src/lib/decorators/aliases';
import { hasOne } from '../src/lib/decorators/hasOne';
import { prop } from '../src/lib/decorators/prop';
import { validate } from '../src/lib/decorators/validate';

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
  childProperty: ChildModel;

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

  // test('should not let to assign the child property to not valid values', () => {
  //   const model = new TestModel({ pk: 1, sk: 2 });
  //   expect(() => {
  //     model.childProperty = 1;
  //   }).toThrowError();
  // });

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
    expect(model.childPropertyPk).toEqual('1');
    expect(model.childPropertySk).toBeUndefined();
    expect(model.pk).toEqual(2);
    expect(model.sk).toEqual(3);
    const newChild = new ChildModel({ pk: '4', sk: '5' });
    model.childProperty = newChild;
    expect(model.childPropertyPk).toEqual('4');
    expect(model.childPropertySk).toEqual('5');
    expect(model.pk).toEqual(2);
    expect(model.sk).toEqual(3);
  });

  test('attributes should include the child attributes', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childPropertyPk: '1',
      childProperty: {
        sk: '2',
      },
    });

    expect(model.attributes).toStrictEqual({
      pk: 1,
      sk: 2,
    });

    expect(model.transformedAttributes).toStrictEqual({
      pk: 1,
      sk: 2,
      childProperty: {
        pk: '1',
        sk: '2',
      },
    });
  });

  test('when child is blank, it should not include its key', () => {
    const model = new TestModel({ pk: 1, sk: 2 });

    expect(model.transformedAttributes).toStrictEqual({
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
    expect(model.transformedAttributes).toStrictEqual({
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
    expect(() => TestModel.validate({
      pk: 1,
      sk: 2,
      childProperty: {
        alias1: '1',
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    })).not.toThrowError();

    expect(TestModel.validate({
      pk: 1,
      sk: 2,
      childProperty: {
        alias1: '1',
        sk: '2',
      },
      child2: {
        alias1: '1',
      },
    })).toBeTruthy();

    expect(TestModel.validateAttributes({
      pk: 1,
      sk: 2,
      childProperty: {
        alias1: '1',
        sk: '2',
      },
      child2: {
        alias1: '1',
      },
    })).toStrictEqual({
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

  test('it correctly validates the child when validating the parent in the static Method', () => {
    expect(() => TestModel.validate({
      pk: 1,
      sk: 2,
      childProperty: {
        sk: '2',
      },
      child2: {
        pk: '1',
      },
    })).toThrowError('"childProperty.pk" is required');
  });

  test('it validates a required hasOne on the static method', () => {
    expect(() => TestModel.validate({
      pk: 1,
      sk: 2,
      childProperty: {
        pk: '1',
        sk: '2',
      },
    })).toThrowError('"child2" is required');
  });

  test('it validates a required hasOne on the instace method', () => {
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
  });

  describe('Related models', () => {
    test('When there is a related model missing it is invalid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
      });

      expect(() => model.validate(true)).toThrowError('"child2" is required');
      expect(model.valid).toBeFalsy();
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
    });

    test('When both are valid, the attributes does not include the not nested models', () => {
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

      expect(model.validatedAttributes).toStrictEqual({
        pk: 1,
        sk: 2,
      });
    });

    test('When both are invalid, the attributes does not include the not nested models', () => {
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

      expect(model.validatedAttributes).toStrictEqual({
        pk: 1,
        sk: 2,
      });
    });
  });
});
