import Joi from 'joi';
import { Entity } from '../src/lib/Entity';
import { aliases } from '../src/lib/decorators/methods/aliases';
import { compositeKey } from '../src/lib/decorators/methods/compositeKeys';
import { prop } from '../src/lib/decorators/methods/props';
import { hasMany, hasOne } from '../src/lib/decorators/methods/relations';
import { validate } from '../src/lib/decorators/methods/validations';

class TestChildModel extends Entity {
  @prop()
  @validate(Joi.string().required())
  p1Child: string | undefined;
}

class TestModel extends Entity {
  @prop()
  @aliases(['alias1', 'aliasp1'])
  @validate(Joi.string().required())
  p1: string | undefined;

  @prop()
  @validate(Joi.string().trim().lowercase())
  stringProp: string;

  @prop()
  @compositeKey(['p1', 'stringProp'])
  compositeProp: string;

  @hasMany(TestChildModel, { nestedObject: true })
  @aliases(['p1NestedManyAlias'])
  p1NestedMany: TestChildModel[];

  @hasMany(TestChildModel, { nestedObject: false, ignoredInvalid: true })
  @aliases(['p1NotNestedManyAlias'])
  p1NotNestedMany: TestChildModel[];

  @hasOne(TestChildModel, { nestedObject: true, ignoredInvalid: true })
  @aliases(['p1NestedOneAlias'])
  p1NestedOne: TestChildModel;

  @hasOne(TestChildModel, { nestedObject: false })
  @aliases(['p1NotNestedOneAlias'])
  p1NotNestedOne: TestChildModel;

  public get _currentPrototypePropertyList(): string[] {
    return super._currentPrototypePropertyList;
  }

  public get _propertyList(): string[] {
    return super._propertyList;
  }

  public get currentPrototypeAttributeList() {
    return super.currentPrototypeAttributeList;
  }

  public get attributeList() {
    return super.attributeList;
  }
}

class ExtendedTestModel extends TestModel {
  @prop()
  @aliases(['alias2', 'aliasp2'])
  p2: string;

  @hasMany(TestChildModel, { nestedObject: true })
  @aliases(['p2NestedManyAlias'])
  p2NestedMany: TestChildModel[];

  @hasMany(TestChildModel, { nestedObject: false })
  @aliases(['p2NotNestedManyAlias'])
  p2NotNestedMany: TestChildModel[];

  @hasOne(TestChildModel, { nestedObject: true })
  @aliases(['p2NestedOneAlias'])
  p2NestedOne: TestChildModel;

  @hasOne(TestChildModel, { nestedObject: false })
  @aliases(['p2NotNestedOneAlias'])
  p2NotNestedOne: TestChildModel;
}

describe('Entity', () => {
  test('Testing the property and attribute list methods', () => {
    const testModel = new TestModel({
      p1Extra: 'p1',
    });
    const extendedTestModel = new ExtendedTestModel({
      p2Extra: 'p2',
    });

    expect(testModel.attributes).toStrictEqual({
      p1Extra: 'p1',
    });

    expect(extendedTestModel.attributes).toStrictEqual({
      p2Extra: 'p2',
    });

    expect(testModel._currentPrototypePropertyList.sort()).toStrictEqual([
      'p1',
      'compositeProp',
      'stringProp',
      'p1Extra',
      'p1NestedMany',
      'p1NotNestedMany',
      'p1NestedOne',
      'p1NotNestedOne',
    ].sort());
    expect(testModel._propertyList.sort()).toStrictEqual([
      'p1',
      'compositeProp',
      'stringProp',
      'p1Extra',
      'p1NestedMany',
      'p1NotNestedMany',
      'p1NestedOne',
      'p1NotNestedOne',
    ].sort());
    expect(testModel.currentPrototypeAttributeList.sort()).toStrictEqual([
      'p1',
      'compositeProp',
      'stringProp',
      'p1Extra',
      'p1NestedMany',
      'p1NestedManyAlias',
      'p1NotNestedMany',
      'p1NotNestedManyAlias',
      'p1NestedOne',
      'p1NestedOneAlias',
      'p1NotNestedOne',
      'p1NotNestedOneAlias',
      'alias1',
      'aliasp1',
    ].sort());
    expect(testModel.attributeList.sort()).toStrictEqual([
      'p1',
      'compositeProp',
      'stringProp',
      'p1Extra',
      'p1NestedMany',
      'p1NestedManyAlias',
      'p1NotNestedMany',
      'p1NotNestedManyAlias',
      'p1NestedOne',
      'p1NestedOneAlias',
      'p1NotNestedOne',
      'p1NotNestedOneAlias',
      'alias1',
      'aliasp1',
    ].sort());

    expect(extendedTestModel._currentPrototypePropertyList.sort()).toStrictEqual([
      'p2',
      'p2Extra',
      'p2NestedMany',
      'p2NotNestedMany',
      'p2NestedOne',
      'p2NotNestedOne',
    ].sort());
    expect(extendedTestModel._propertyList.sort()).toStrictEqual([
      'p1',
      'compositeProp',
      'stringProp',
      'p1NestedMany',
      'p1NotNestedMany',
      'p1NestedOne',
      'p1NotNestedOne',
      'p2',
      'p2Extra',
      'p2NestedMany',
      'p2NotNestedMany',
      'p2NestedOne',
      'p2NotNestedOne',
    ].sort());
    expect(extendedTestModel.currentPrototypeAttributeList.sort()).toStrictEqual([
      'p2',
      'p2Extra',
      'p2NestedMany',
      'p2NestedManyAlias',
      'p2NotNestedMany',
      'p2NotNestedManyAlias',
      'p2NestedOne',
      'p2NestedOneAlias',
      'p2NotNestedOne',
      'p2NotNestedOneAlias',
      'alias2',
      'aliasp2',
    ].sort());
    expect(extendedTestModel.attributeList.sort()).toStrictEqual([
      'p1',
      'compositeProp',
      'stringProp',
      'p1NestedMany',
      'p1NestedManyAlias',
      'p1NotNestedMany',
      'p1NotNestedManyAlias',
      'p1NestedOne',
      'p1NestedOneAlias',
      'p1NotNestedOne',
      'p1NotNestedOneAlias',
      'alias1',
      'aliasp1',
      'p2',
      'p2Extra',
      'p2NestedMany',
      'p2NestedManyAlias',
      'p2NotNestedMany',
      'p2NotNestedManyAlias',
      'p2NestedOne',
      'p2NestedOneAlias',
      'p2NotNestedOne',
      'p2NotNestedOneAlias',
      'alias2',
      'aliasp2',
    ].sort());
  });

  test('setAttribute and getAttribute methods', () => {
    const testModelSpy = jest.spyOn(TestModel.prototype, 'setAttribute');
    const testChildModelSpy = jest.spyOn(TestChildModel.prototype, 'setAttribute');
    const extendedTestModelSpy = jest.spyOn(ExtendedTestModel.prototype, 'setAttribute');

    // THE SET ATTRIBUTE IS THE SAME FUNCTION SINCE ONE EXTENDS FROM THE OTHER
    expect(testModelSpy).toStrictEqual(extendedTestModelSpy);

    expect(testModelSpy).toHaveBeenCalledTimes(0);
    expect(testChildModelSpy).toHaveBeenCalledTimes(0);
    expect(extendedTestModelSpy).toHaveBeenCalledTimes(0);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const testModel = new TestModel({
      p1NestedOne: {
        p1Child: 'p1',
      },
    });

    expect(testModelSpy).toHaveBeenCalledTimes(1);
    // THE CHILD METHOD IS CALLED TWICE BECAUSE AFTER VALIDATING THE CHILD OVER THE SCHEMA, THE ATTRIBUTES ARE SET AGAIN WITH THE CONVERTED JOI VALUES.
    expect(testChildModelSpy).toHaveBeenCalledTimes(2);
    expect(extendedTestModelSpy).toHaveBeenCalledTimes(1);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const extendedTestModel = new ExtendedTestModel({
      p2NestedOne: {
        p1Child: 'p2',
      },
    });

    expect(testModelSpy).toHaveBeenCalledTimes(2);
    // THE CHILD METHOD IS CALLED TWICE BECAUSE AFTER VALIDATING THE CHILD OVER THE SCHEMA, THE ATTRIBUTES ARE SET AGAIN WITH THE CONVERTED JOI VALUES.
    expect(testChildModelSpy).toHaveBeenCalledTimes(4);
    expect(extendedTestModelSpy).toHaveBeenCalledTimes(2);

    testModelSpy.mockRestore();
    testChildModelSpy.mockRestore();
    extendedTestModelSpy.mockRestore();
  });

  test('The attributes getter ignores undefined values but does not ignore null values', () => {
    const testModel = new TestModel({
      p1: 'p1',
      p2: 'p2',
      p3: null,
      p4: undefined,
      p1NestedOne: {
        p1Child: undefined,
      },
      p1NotNestedOne: {
        p1Child: null,
      },
    });

    expect(testModel.attributes).toStrictEqual({
      p1: 'p1',
      p2: 'p2',
      p3: null,
      p1NotNestedOne: {
        p1Child: null,
      },
    });
  });

  describe('Validation related methods and properties', () => {
    let instance;

    beforeEach(() => {
      instance = new TestModel({
        alias1: '123',
        stringProp: '   TeSt  ',
        p1NestedMany: [{
          p1Child: 'child1',
        }],
        p1NotNestedMany: [{
          invalid: 'child2',
        }],
        p1NestedOne: {
          testChild: 'child3',
        },
        p1NotNestedOne: {
          p1Child: 'child4',
        },
      });
    });

    test('The basic attributes are started correctly', () => {
      expect(instance.dirty).toBeTruthy();
      expect(instance.error).toBeUndefined();
      expect(instance.validatedAttributes).toBeUndefined();
      expect(instance.transformedAttributes).toBeUndefined();

      expect(instance.attributes).toStrictEqual({
        p1: '123',
        stringProp: 'test',
        p1NestedMany: [{
          p1Child: 'child1',
        }],
        p1NotNestedMany: [{
          invalid: 'child2',
        }],
        p1NestedOne: {
          testChild: 'child3',
        },
        p1NotNestedOne: {
          p1Child: 'child4',
        },
      });
    });

    test('When transform attributes is called it correctly sets the related attributes', () => {
      const transformAttributesResponse = instance.transformAttributes();
      expect(transformAttributesResponse).toStrictEqual({
        p1: '123',
        stringProp: 'test',
        compositeProp: '123#test',
        p1NestedMany: [{
          p1Child: 'child1',
        }],
        p1NotNestedMany: [{
          invalid: 'child2',
        }],
        p1NestedOne: {
          testChild: 'child3',
        },
        p1NotNestedOne: {
          p1Child: 'child4',
        },
      });

      expect(instance.dirty).toBeTruthy();
      expect(instance.error).toBeUndefined();
      expect(instance.validatedAttributes).toBeUndefined();

      // THE INVALID CHILDREN WITH THE "IGNORE INVALID" SET TO TRUE ARE REMOVED
      expect(instance.validate().value).toStrictEqual({
        p1: '123',
        stringProp: 'test',
        compositeProp: '123#test',
        p1NestedMany: [{
          p1Child: 'child1',
        }],
        p1NotNestedMany: [],
        p1NotNestedOne: {
          p1Child: 'child4',
        },
      });
    });

    describe('When validate is called', () => {
      let error;
      let value;

      beforeEach(() => {
        ({
          error,
          value,
        } = instance.validate());
      });

      test('It sets the correct attributes', () => {
        expect(instance.dirty).toBeFalsy();
        expect(instance.error).toEqual(error);
        expect(instance.validatedAttributes).toStrictEqual(value);
        expect(error).toBeUndefined();

        expect(value).toStrictEqual({
          p1: '123',
          stringProp: 'test',
          compositeProp: '123#test',
          p1NestedMany: [{
            p1Child: 'child1',
          }],
          p1NotNestedMany: [],
          p1NotNestedOne: {
            p1Child: 'child4',
          },
        });
      });

      test('When a child attribute is changed, the parent attributes as set correctly', () => {
        instance.p1NestedOne.p1Child = 'test';

        expect(instance.dirty).toBeTruthy();
        expect(instance.error).toBeUndefined();
        expect(instance.validatedAttributes).toBeUndefined();
        expect(instance.transformedAttributes).toBeUndefined();
      });

      test('When the parent is invalid and some children who should have invalid ignored are invalid', () => {
        instance.p1 = undefined;
        instance.p1NestedMany[0].p1Child = undefined;
        instance.p1NestedOne = new TestChildModel({ test: '123' });

        expect(instance.dirty).toBeTruthy();
        expect(instance.error).toBeUndefined();
        expect(instance.validatedAttributes).toBeUndefined();

        // IT DOES IGNORE BLANK CHILDREN
        expect(instance.validate().value).toStrictEqual({
          stringProp: 'test',
          p1NotNestedMany: [],
          p1NotNestedOne: {
            p1Child: 'child4',
          },
        });

        ({
          error,
          value,
        } = instance.validate());

        expect(instance.dirty).toBeFalsy();
        expect(instance.error).toEqual(error);
        expect(instance.validatedAttributes).toStrictEqual(value);
        expect(error).toBeInstanceOf(Joi.ValidationError);
        expect(error?.message).toEqual('"p1" is required');
      });

      test('When the parent is valid and some children who should and should not have invalid ignored are invalid', () => {
        instance.p1NestedMany[0].p1Child = undefined;
        instance.p1NotNestedOne = new TestChildModel({ test: '123' });

        expect(instance.dirty).toBeTruthy();
        expect(instance.error).toBeUndefined();
        expect(instance.validatedAttributes).toBeUndefined();

        // IT DOES NOT IGNORE BLANK CHILDREN WHO SHOULD NOT BE IGNORED AND IGNORES THE ONES WHO SHOULD
        expect(instance.validate().value).toStrictEqual({
          p1: '123',
          stringProp: 'test',
          compositeProp: '123#test',
          p1NotNestedMany: [],
          p1NotNestedOne: {
            test: '123',
          },
        });

        ({
          error,
          value,
        } = instance.validate());

        expect(instance.dirty).toBeFalsy();
        expect(instance.error).toEqual(error);
        expect(instance.validatedAttributes).toStrictEqual(value);
        expect(error).toBeInstanceOf(Joi.ValidationError);
        expect(error?.message).toEqual('"p1NotNestedOne.p1Child" is required');
      });
    });
  });
});
