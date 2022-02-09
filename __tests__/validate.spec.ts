/* eslint-disable max-classes-per-file */
import * as Joi from 'joi';
import { Entity } from '../src/lib/Entity';
import { validate } from '../src/lib/Decorators/validate';

class NoValidationModel extends Entity {
  pk: string;
}

@validate(Joi.object().unknown(true).and('attribute1', 'attribute2'))
class TestModel extends Entity {
  @validate(Joi.string().required().trim())
  pk: string;

  @validate(Joi.string().required().trim())
  sk: string;

  @validate(Joi.string())
  attribute1: string;

  @validate(Joi.string())
  attribute2: string;
}

describe('Validation', () => {
  describe('When there is no validation at all', () => {
    test('an instance with all data should be valid', () => {
      const model = new NoValidationModel({ pk: '123' });
      expect(model.valid).toEqual(true);
    });

    test('a class should return valid in its static method', () => {
      expect(() => NoValidationModel.validate({ pk: 123 })).not.toThrowError();
    });
  });

  describe('When there is validation', () => {
    describe('with a blank instance', () => {
      test('it should be invalid', () => {
        const model = new TestModel();
        expect(model.valid).toBeFalsy();
      });
    });

    describe('with valid attributes', () => {
      const validParams = {
        pk: '1',
        sk: '2',
      };

      test('correctly validates the instance', () => {
        const model = new TestModel(validParams);
        expect(model.valid).toBeTruthy();
      });

      test('correctly validates with the static method', () => {
        expect(() => TestModel.validate(validParams)).not.toThrowError();
      });

      test('correctly validates the instance when not validated fields are present', () => {
        const model = new TestModel({
          ...validParams,
          notSchemaAttribute: 123,
        });

        expect(model.valid).toBeTruthy();
      });

      // test('contanis no errors when valid', () => {
      //   const model = new TestModel({
      //     ...validParams,
      //     notSchemaAttribute: 123,
      //   });

      //   expect(model.errors).toStrictEqual({});
      // });

      test('does not throw an error when not validated fields are present', () => {
        expect(() => TestModel.validate({
          ...validParams,
          notSchemaAttribute: 123,
        })).not.toThrowError();
      });

      test('correctly set the attributes', () => {
        const model = new TestModel({
          ...validParams,
          notSchemaAttribute: 123,
        });

        expect(model.pk).toEqual('1');
        expect(model.sk).toEqual('2');
        expect(model.notSchemaAttribute).toEqual(123);
      });

      test('correctly apply joi transformations to the attributes', () => {
        const model = new TestModel({
          pk: '    1  ',
          sk: '  2     ',
          notSchemaAttribute: '  123  ',
        });

        expect(model.validatedAttributes.pk).toEqual('1');
        expect(model.validatedAttributes.sk).toEqual('2');
        expect(model.validatedAttributes.notSchemaAttribute).toEqual('  123  ');
      });
    });

    describe('with invalid attributes', () => {
      const invalidParams = {
        pk: 1,
        sk: '2',
      };

      test('should be invalid', () => {
        const model = new TestModel(invalidParams);
        expect(model.valid).toBeFalsy();
      });

      test('should reset the errors after the errors are fixed', () => {
        const model = new TestModel(invalidParams);
        expect(model.valid).toBeFalsy();
        expect(model.error).toBeInstanceOf(Joi.ValidationError);
        model.pk = '1';
        expect(model.valid).toBeTruthy();
        expect(model.error).toBeUndefined();
      });

      test('should throw error on static validate method', () => {
        expect(() => TestModel.validate(invalidParams)).toThrowError('"pk" must be a string');
      });

      test('should throw both errors on static validade method', () => {
        expect(() => TestModel.validate({})).toThrow('"pk" is required. "sk" is required');
      });
    });
  });

  describe('Entity level validations', () => {
    const validParams = {
      pk: '1',
      sk: '2',
    };

    test('It should be valid when attribute1 and attribute2 are undefined', () => {
      const model = new TestModel(validParams);
      expect(model.valid).toBeTruthy();
    });

    test('It is not valid when only attribute1 is present', () => {
      const model = new TestModel({
        ...validParams,
        attribute1: '1',
      });

      expect(model.valid).toBeFalsy();
    });

    test('It is not valid when only attribute2 is present', () => {
      const model = new TestModel({
        ...validParams,
        attribute2: '2',
      });

      expect(model.valid).toBeFalsy();
    });

    test('It is valid when both attribute1 and attribute2 are present', () => {
      const model = new TestModel({
        ...validParams,
        attribute1: '1',
        attribute2: '2',
      });

      expect(model.valid).toBeTruthy();
    });
  });
});
