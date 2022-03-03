/* eslint-disable max-classes-per-file */
import * as Joi from 'joi';
import { Entity } from '../src/lib/Entity';
import { aliases } from '../src/lib/Decorators/aliases';
import { hasMany } from '../src/lib/Decorators/hasMany';
import { prop } from '../src/lib/Decorators/prop';
import { validate } from '../src/lib/Decorators/validate';

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
  childrenProperty: ChildModel[];

  @hasMany(ChildModel, { required: true, nestedObject: true, parentPropertyOnChild: 'parent' })
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
    expect(model.childrenProperty).toEqual([]);
  });

  test('should let children properties be set by apssing an array of instances', () => {
    const model = new TestModel({ pk: 1, sk: 2 });
    expect(model.childrenProperty).toEqual([]);
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

    expect(model.childrenProperty).toEqual([]);
    expect(model.childrenAlias).toEqual([]);
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
    });

    expect(model.transformedAttributes).toStrictEqual({
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

    expect(model.transformedAttributes).toStrictEqual({
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
    expect(model.transformedAttributes).toStrictEqual({
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
  });

  test('it correctly validates the children when there is no error in the child or parent in the static method', () => {
    expect(() => TestModel.validate({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        alias1: '1',
        sk: '2',
      }],
      requiredChildren: [{
        pk: '1',
      }],
    })).not.toThrowError();

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
    })).toBeTruthy();

    expect(TestModel.validateAttributes({
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

  test('it correctly validates the child when validating the parent in the static Method', () => {
    expect(() => TestModel.validate({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        sk: '2',
      }],
      requiredChildren: [{
        pk: '1',
      }],
    })).toThrowError('"childrenProperty[0].pk" is required');
  });

  test('it validates a required hasMany on the static method', () => {
    expect(() => TestModel.validate({
      pk: 1,
      sk: 2,
      childrenProperty: [{
        pk: '1',
        sk: '2',
      }],
    })).toThrowError('"requiredChildren" is required');
  });

  test('it validates a required hasMany on the instace method', () => {
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
  });

  describe('Related models', () => {
    test('When there is a related model missing it is invalid', () => {
      const model = new TestModelWithRelated({
        pk: 1,
        sk: 2,
      });

      expect(() => model.validate(true)).toThrowError('"requiredChildren" is required');
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
    });

    test('When both are valid, the attributes does not include the not nested models', () => {
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

      expect(model.validatedAttributes).toStrictEqual({
        pk: 1,
        sk: 2,
      });
    });

    test('When both are invalid, the attributes does not include the not nested models', () => {
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

      expect(model.validatedAttributes).toStrictEqual({
        pk: 1,
        sk: 2,
      });
    });
  });

  describe('Belongs To', () => {
    test('It correctly sets the getters and setters of the child', () => {
      const child = new ChildModel();
      expect(child.parent).toBeInstanceOf(TestModel);
    });
  });
});
