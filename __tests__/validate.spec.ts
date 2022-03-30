/* eslint-disable max-classes-per-file */
import * as Joi from 'joi';
import { Entity } from '../src/lib/Entity';
import { validate } from '../src/lib/decorators/methods/validations';

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

  @validate(Joi.string().default('defaultValue'))
  attributeWithDefault: string;
}

describe('Validation', () => {
  describe('When there is no validation at all', () => {
    test('an instance with all data should be valid', () => {
      const model = new NoValidationModel({ pk: '123' });
      expect(model.valid).toBeTruthy();
    });

    test('a class should return valid in its static method', () => {
      const {
        error,
        value,
      } = NoValidationModel.validate({ pk: 123 });

      expect(error).toBeUndefined();
      expect(value).toStrictEqual({
        pk: 123,
      });
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
        expect(model.validatedAttributes).toBeUndefined();
        expect(model.valid).toBeTruthy();
        expect(model.error).toBeUndefined();
        expect(model.validatedAttributes).not.toBeUndefined();
      });

      test('correctly validates with the static method', () => {
        const {
          error,
          value,
        } = TestModel.validate(validParams);

        expect(error).toBeUndefined();
        expect(value).toStrictEqual({
          pk: '1',
          sk: '2',
          attributeWithDefault: 'defaultValue',
        });
      });

      test('correctly validates the instance when not validated fields are present', () => {
        const model = new TestModel({
          ...validParams,
          notSchemaAttribute: 123,
        });

        expect(model.validatedAttributes).toBeUndefined();
        expect(model.valid).toBeTruthy();
        expect(model.error).toBeUndefined();
        expect(model.validatedAttributes).not.toBeUndefined();
        expect(model.validatedAttributes?.notSchemaAttribute).toEqual(123);
      });

      test('does not return an error when not validated fields are present', () => {
        const {
          error,
          value,
        } = TestModel.validate({
          ...validParams,
          notSchemaAttribute: 123,
        });

        expect(error).toBeUndefined();
        expect(value).toStrictEqual({
          pk: '1',
          sk: '2',
          notSchemaAttribute: 123,
          attributeWithDefault: 'defaultValue',
        });
      });

      test('correctly apply joi transformations to the attributes', () => {
        const model = new TestModel({
          pk: '    1  ',
          sk: '  2     ',
          notSchemaAttribute: '  123  ',
        });

        expect(model.attributes).toStrictEqual({
          pk: '1',
          sk: '2',
          notSchemaAttribute: '  123  ',
        });

        expect(model.validate()).toStrictEqual({
          error: undefined,
          value: {
            pk: '1',
            sk: '2',
            notSchemaAttribute: '  123  ',
            attributeWithDefault: 'defaultValue',
          },
        });

        expect(model.validatedAttributes).toStrictEqual({
          pk: '1',
          sk: '2',
          notSchemaAttribute: '  123  ',
          attributeWithDefault: 'defaultValue',
        });
      });
    });

    describe('with invalid attributes', () => {
      const invalidParams = {
        pk: 1,
        sk: '2',
      };

      test('should be invalid', () => {
        const model = new TestModel(invalidParams);
        expect(model.validatedAttributes).toBeUndefined();
        expect(model.valid).toBeFalsy();
        expect(model.error).toBeInstanceOf(Joi.ValidationError);
        expect(model.error?.message).toEqual('"pk" must be a string');
        expect(model.validatedAttributes).not.toBeUndefined();
      });

      test('should reset the errors after the errors are fixed', () => {
        const model = new TestModel(invalidParams);
        expect(model.valid).toBeFalsy();
        expect(model.error).toBeInstanceOf(Joi.ValidationError);
        model.pk = '1';
        expect(model.valid).toBeTruthy();
        expect(model.error).toBeUndefined();
      });

      test('should return error on static validate method', () => {
        const {
          error,
          value,
        } = TestModel.validate(invalidParams);

        expect(error).toBeInstanceOf(Joi.ValidationError);
        expect(error?.message).toEqual('"pk" must be a string');
        expect(value).toStrictEqual({
          pk: 1,
          sk: '2',
          attributeWithDefault: 'defaultValue',
        });
      });

      test('should return both errors on static validade method', () => {
        const {
          error,
          value,
        } = TestModel.validate({});

        expect(error).toBeInstanceOf(Joi.ValidationError);
        expect(error?.message).toEqual('"pk" is required. "sk" is required');
        expect(value).toStrictEqual({
          attributeWithDefault: 'defaultValue',
        });
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
      expect(model.error).toBeInstanceOf(Joi.ValidationError);
      expect(model.error?.message).toEqual('"value" contains [attribute1] without its required peers [attribute2]');
    });

    test('It is not valid when only attribute2 is present', () => {
      const model = new TestModel({
        ...validParams,
        attribute2: '2',
      });

      expect(model.valid).toBeFalsy();
      expect(model.error).toBeInstanceOf(Joi.ValidationError);
      expect(model.error?.message).toEqual('"value" contains [attribute2] without its required peers [attribute1]');
    });

    test('It is valid when both attribute1 and attribute2 are present', () => {
      const model = new TestModel({
        ...validParams,
        attribute1: '1',
        attribute2: '2',
      });

      expect(model.valid).toBeTruthy();
      expect(model.error).toBeUndefined();
    });
  });
});
