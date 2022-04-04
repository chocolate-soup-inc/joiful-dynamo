/* eslint-disable max-classes-per-file */
import * as Joi from 'joi';
import { Entity } from '../src/lib/Entity';
import { aliases } from '../src/lib/decorators/methods/aliases';
import { hasMany } from '../src/lib/decorators/methods/relations';
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

  @hasMany(ChildModel, { nestedObject: true })
  @aliases(['childrenAlias'])
  childrenProperty: ChildModel[] | Record<string, any>[];

  @hasMany(ChildModel, { required: true, nestedObject: true })
  requiredChildren: ChildModel[];
}

class TestModelWithRelated extends Entity {
  @prop()
  pk: number;

  @prop()
  sk: number;

  @hasMany(ChildModel, { required: false, nestedObject: false })
  childrenProperty: ChildModel[];

  @hasMany(ChildModel, { required: true, nestedObject: false })
  requiredChildren: ChildModel[];
}

describe('Has many', () => {
  test('should set the children correctly', () => {
    const model = new TestModel({ pk: 1, sk: 2 });
    expect(model.childrenProperty).toStrictEqual([]);
  });

  test('should let children properties be set by passing an array of instances', () => {
    const model = new TestModel({ pk: 1, sk: 2 });
    expect(model.childrenProperty).toStrictEqual([]);
    model.childrenProperty = [new ChildModel({
      pk: 'child-1',
      sk: 'child-1',
    }), new ChildModel({
      pk: 'child-2',
      sk: 'child-2',
    })];

    expect(model.childrenProperty).toHaveLength(2);
    expect(model.childrenProperty[0]).toBeInstanceOf(ChildModel);
    expect(model.childrenProperty[1]).toBeInstanceOf(ChildModel);
  });

  test('it should work correctly with aliases', () => {
    const model = new TestModel({ pk: 1, sk: 2 });

    expect(model.childrenProperty).toStrictEqual([]);
    expect(model.childrenAlias).toStrictEqual([]);
    model.childrenAlias = [new ChildModel({
      pk: 'child-1',
      sk: 'child-1',
    })];

    expect(model.childrenAlias).toHaveLength(1);
    expect(model.childrenAlias[0]).toBeInstanceOf(ChildModel);
    expect(model.childrenProperty).toHaveLength(1);
    expect(model.childrenProperty[0]).toBeInstanceOf(ChildModel);
  });

  test('should let children properties to be initialized', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        pk: '1',
      }, {
        sk: '2',
      }],
    });

    expect(model.pk).toEqual(1);
    expect(model.sk).toEqual(2);
    expect(model.childrenProperty[0].pk).toEqual('1');
    expect(model.childrenProperty[1].sk).toEqual('2');
  });

  test('should let assigning new children', () => {
    const model = new TestModel({ pk: 2, sk: 3 });
    const newChild = new ChildModel({ pk: '4', sk: '5' });
    model.childrenProperty = [newChild];
    expect(model.childrenProperty[0].pk).toEqual('4');
    expect(model.childrenProperty[0].sk).toEqual('5');
  });

  test('should let pushing a new child', () => {
    const model = new TestModel({ pk: 2, sk: 3 });
    const newChild = new ChildModel({ pk: '4', sk: '5' });
    expect(model.childrenProperty[0]).toBeUndefined();
    model.childrenProperty.push(newChild);
    expect(model.childrenProperty[0].pk).toEqual('4');
    expect(model.childrenProperty[0].sk).toEqual('5');
  });

  test('attributes should include the children attributes', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        pk: '1',
        sk: '2',
      }],
    });

    expect(model.attributes).toStrictEqual({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        pk: '1',
        sk: '2',
      }],
    });
  });

  test('when children is blank, it should not include its key', () => {
    const model = new TestModel({ pk: 1, sk: 2 });

    expect(model.attributes).toStrictEqual({
      pk: 1,
      sk: 2,
    });
  });

  test('it correctly validates the parent when there is no error in the children or parent', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        alias1: '1',
        sk: '2',
      }],
      requiredChildren: [{
        pk: '1',
      }],
    });

    expect(model.valid).toBeTruthy();
    expect(model.attributes).toStrictEqual({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        pk: '1',
        sk: '2',
      }],
      requiredChildren: [{
        pk: '1',
      }],
    });
  });

  test('it correctly validates the children when validating the parent', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        sk: '2',
      }],
      requiredChildren: [{
        pk: '1',
      }],
    });

    expect(model.valid).toBeFalsy();

    expect(model.attributes).toStrictEqual({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        sk: '2',
      }],
      requiredChildren: [{
        pk: '1',
      }],
    });
  });

  test('it correctly validates the children when there is no error in the child or parent in the static method', () => {
    expect(TestModel.validate({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        alias1: '1',
        sk: '2',
      }],
      requiredChildren: [{
        alias1: '1',
      }],
    })).toStrictEqual({
      error: undefined,
      value: {
        pk: 1,
        sk: 2,
        childrenProperty: [{
          pk: '1',
          sk: '2',
        }],
        requiredChildren: [{
          pk: '1',
        }],
      },
    });
  });

  test('it correctly validates the child when validating the parent in the static Method', () => {
    const {
      value,
      error,
    } = TestModel.validate({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        sk: '2',
      }],
      requiredChildren: [{
        pk: '1',
      }],
    });

    expect(value).toStrictEqual({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        sk: '2',
      }],
      requiredChildren: [{
        pk: '1',
      }],
    });

    expect(error).toBeInstanceOf(Joi.ValidationError);
    expect(error?.message).toEqual('"childrenProperty[0].pk" is required');
  });

  test('it validates a required hasMany on the static method', () => {
    const {
      value,
      error,
    } = TestModel.validate({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        pk: '1',
        sk: '2',
      }],
    });

    expect(value).toStrictEqual({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        pk: '1',
        sk: '2',
      }],
    });

    expect(error).toBeInstanceOf(Joi.ValidationError);
    expect(error?.message).toEqual('"requiredChildren" is required');
  });

  test('it validates a required hasMany on the instance method', () => {
    const model = new TestModel({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        pk: '1',
        sk: '2',
      }],
    });

    expect(model.valid).toBeFalsy();
    expect(model.error).toBeInstanceOf(Joi.ValidationError);
    expect(model.error?.message).toEqual('"requiredChildren" is required');
  });

  describe('Related models', () => {
    test('When there is a related model missing it is invalid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
      });

      model.validate();
      expect(model.error?.message).toEqual('"requiredChildren" is required');
      expect(model.valid).toBeFalsy();
    });

    test('When the required children is present and it is valid, the parent is valid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        requiredChildren: [{
          pk: '1',
          sk: '2',
        }],
      });

      expect(model.valid).toBeTruthy();
    });

    test('When both children are present and are valid, the parent is valid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        childrenProperty: [{
          pk: '1',
          sk: '2',
        }],
        requiredChildren: [{
          pk: '1',
          sk: '2',
        }],
      });

      expect(model.valid).toBeTruthy();
    });

    test('When both children are present and the required one is invalid, the parent is invalid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        childrenProperty: [{
          pk: '1',
          sk: '2',
        }],
        requiredChildren: [{
          sk: '2',
        }],
      });

      expect(model.valid).toBeFalsy();
      expect(model.error).toBeInstanceOf(Joi.ValidationError);
      expect(model.error?.message).toEqual('"requiredChildren[0].pk" is required');
    });

    test('When both children are present and the not required one is invalid, the parent is invalid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        childrenProperty: [{
          sk: '2',
        }],
        requiredChildren: [{
          pk: '1',
          sk: '2',
        }],
      });

      expect(model.valid).toBeFalsy();
      expect(model.error).toBeInstanceOf(Joi.ValidationError);
      expect(model.error?.message).toEqual('"childrenProperty[0].pk" is required');
    });

    test('When both are valid, the attributes include the not nested models', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        childrenProperty: [{
          pk: '1',
          sk: '2',
        }],
        requiredChildren: [{
          pk: '1',
          sk: '2',
        }],
      });

      model.validate();

      expect(model.validatedAttributes).toStrictEqual({
        pk: 1,
        sk: 2,
        childrenProperty: [{
          pk: '1',
          sk: '2',
        }],
        requiredChildren: [{
          pk: '1',
          sk: '2',
        }],
      });
    });

    test('When both are invalid, the attributes does include the not nested models but error is present', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
        childrenProperty: [{
          sk: '2',
        }],
        requiredChildren: [{
          sk: '2',
        }],
      });

      model.validate();

      expect(model.validatedAttributes).toStrictEqual({
        pk: 1,
        sk: 2,
        childrenProperty: [{
          sk: '2',
        }],
        requiredChildren: [{
          sk: '2',
        }],
      });

      expect(model.error).toBeInstanceOf(Joi.ValidationError);
      expect(model.error?.message).toEqual('"childrenProperty[0].pk" is required. "requiredChildren[0].pk" is required');
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
        childrenProperty: [{
          pk: '1',
          sk: '2',
        }],
      });

      expect(model.childrenProperty[0].parents).toStrictEqual([model]);
    });

    test('It should be correctly set when setting instances after the parent is already instantiated', () => {
      const model = new TestModel({
        pk: 1,
        sk: 2,
      });

      model.childrenProperty = [new ChildModel({
        pk: '1',
        sk: '2',
      })];

      expect(model.childrenProperty[0].parents).toStrictEqual([model]);
    });

    test('It should be correctly set when setting objects after the parent is already instantiated', () => {
      const model = new TestModel({
        pk: 1,
        sk: 2,
      });

      model.childrenProperty = [{
        pk: '1',
        sk: '2',
      }];

      expect(model.childrenProperty[0].parents).toStrictEqual([model]);
    });
  });

  // describe('Belongs To', () => {
  //   test('It correctly sets the getters and setters of the child', () => {
  //     const child = new ChildModel();
  //     expect(child.parent).toBeInstanceOf(TestModel);
  //   });
  // });

  test('Setting a child to null works', () => {
    const parent = new TestModel({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
      requiredChildren: [{ pk: '5', sk: '6' }],
    });
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
      requiredChildren: [{ pk: '5', sk: '6' }],
    });

    // NEEDS EVAL BECAUSE OF TYPESCRIPT TYPE CHECKING
    // eslint-disable-next-line no-eval
    eval('parent.requiredChildren = null');
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
    });
  });

  test('Setting a child to undefined works', () => {
    const parent = new TestModel({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
      requiredChildren: [{ pk: '5', sk: '6' }],
    });
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
      requiredChildren: [{ pk: '5', sk: '6' }],
    });

    // NEEDS EVAL BECAUSE OF TYPESCRIPT TYPE CHECKING
    // eslint-disable-next-line no-eval
    eval('parent.requiredChildren = undefined');
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
    });
  });

  test('Setting a child to [] works', () => {
    const parent = new TestModel({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
      requiredChildren: [{ pk: '5', sk: '6' }],
    });
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
      requiredChildren: [{ pk: '5', sk: '6' }],
    });

    // NEEDS EVAL BECAUSE OF TYPESCRIPT TYPE CHECKING
    // eslint-disable-next-line no-eval
    eval('parent.requiredChildren = []');
    expect(parent.attributes).toStrictEqual({
      pk: '1',
      sk: '2',
      childrenProperty: [{ pk: '3', sk: '4' }],
    });
  });
});
