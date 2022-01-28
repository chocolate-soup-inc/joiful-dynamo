import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import { Entity, Table } from 'dynamodb-toolbox';
import * as Joi from 'joi';
import JD from '../src-old/index';
import { JoifulEntityConstructor, JoifulEntityAttributes } from '../src-old/createEntity';

const DocumentClient = new DynamoDB.DocumentClient();

const testTable = new Table({
  // Specify table name (used by DynamoDB)
  name: 'test-table',
  // Define partition and sort keys
  partitionKey: 'pk',
  sortKey: 'sk',
  // Add the DocumentClient
  DocumentClient,
  // Disable execute so it don't really try to do nothing in Dynamo
  autoExecute: false,
});

let testEntity: Entity<{}>;
let testJoi: Joi.ObjectSchema<any>;
let TestModel: any;
describe('Testing the Entity Creation', () => {
  beforeEach(() => {
    JD.createEntity({
      name: 'testEntity',
      beforeValidate: (attributes) => attributes,
      attributes: {
        pk: {
          type: 'string',
          partitionKey: true,
        },
        sk: {
          type: 'string',
          sortKey: true,
        },
        customAttribute: {
          type: 'number',
          validate: Joi.number().required(),
        },
      },
      table: testTable,
    });

    ({
      entity: testEntity,
      joi: testJoi,
      model: TestModel,
    } = JD.entities.testEntity);
  });

  describe('Testing basic getters and setters attributes methods', () => {
    test('the getters and setters work for the schema attributes work as expected.', () => {
      const instance = new TestModel();
      expect(instance.customAttribute).toBe(undefined);
      instance.customAttribute = 1;
      expect(instance.customAttribute).toBe(1);
    });

    test('getters for not schema variables fail', async () => {
      const instance = new TestModel();
      expect(() => instance.notSchemaAttribute).toThrow(
        'notSchemaAttribute is not a valid attribute.',
      );
    });

    test('setters for not schema variables fail', async () => {
      const instance = new TestModel();
      expect(() => {
        instance.notSchemaAttribute = 1;
      }).toThrow('notSchemaAttribute is not a valid attribute.');
    });

    test('setting variable through the constructor works', async () => {
      const instance = new TestModel({
        customAttribute: 1,
      });
      expect(instance.customAttribute).toBe(1);
    });

    test('setting not schema variables through the constructor works', async () => {
      const instance = new TestModel({
        notSchemaAttribute: 1,
      });
      expect(instance.attributes).toStrictEqual({ notSchemaAttribute: 1 });
    });

    test('the attributes getter should return all the attributes', async () => {
      const instance = new TestModel({
        pk: 'pk-123',
        notSchemaAttribute: 1,
      });
      instance.customAttribute = 2;

      expect(instance.attributes).toStrictEqual({
        pk: 'pk-123',
        notSchemaAttribute: 1,
        customAttribute: 2,
      });
    });

    // test.only('It should accept unknown attributes', async () => {
    //   expect(await TestModel.put({
    //     pk: 1,
    //     sk: 2,
    //     customAttribute: 1,
    //     notSchemaAttribute: 1,
    //     plan: 'test!',
    //   })).toStrictEqual({

    //   });
    // });
  });

  describe('Testing the CRUD methods', () => {
    let basicParams: Record<string, any>;
    let joiSpy: jest.SpyInstance;
    let instance: any;

    beforeEach(() => {
      basicParams = {
        pk: 'pk-123',
        sk: 'sk',
        customAttribute: 1,
      };
      instance = new TestModel(basicParams);
      joiSpy = jest.spyOn(testJoi, 'validate');
    });

    describe('Delete', () => {
      test('The static delete method calls Dynamodb Toolbox delete method', async () => {
        const entitySpy = jest.spyOn(testEntity, 'delete');
        await TestModel.delete(basicParams);
        expect(entitySpy).toHaveBeenCalled();
      });

      test('The delete method calls Dynamodb Toolbox delete method', async () => {
        const entitySpy = jest.spyOn(testEntity, 'delete');
        await instance.delete();
        expect(entitySpy).toHaveBeenCalled();
      });
    });

    describe('Get', () => {
      test('The static get method calls Dynamodb Toolbox get method', async () => {
        const entitySpy = jest.spyOn(testEntity, 'get');
        await TestModel.get(basicParams);
        expect(entitySpy).toHaveBeenCalled();
      });

      test('The get method calls Dynamodb Toolbox get method', async () => {
        const entitySpy = jest.spyOn(testEntity, 'get');
        await instance.get();
        expect(entitySpy).toHaveBeenCalled();
      });
    });

    describe('Put', () => {
      test('The static put method calls Dynamodb Toolbox put method', async () => {
        const entitySpy = jest.spyOn(testEntity, 'put');
        await TestModel.put(basicParams);
        expect(joiSpy).toHaveBeenCalled();
        expect(entitySpy).toHaveBeenCalled();
      });

      test('The put method calls Dynamodb Toolbox put method', async () => {
        const entitySpy = jest.spyOn(testEntity, 'put');
        await instance.put();
        expect(joiSpy).toHaveBeenCalled();
        expect(entitySpy).toHaveBeenCalled();
      });

      test('When the object is not valid', async () => {
        const entitySpy = jest.spyOn(testEntity, 'put');
        instance.customAttribute = undefined;
        expect(() => instance.put()).toThrowError('"customAttribute" is required');
        expect(joiSpy).toHaveBeenCalled();
        expect(entitySpy).not.toHaveBeenCalled();
      });
    });

    describe('Update', () => {
      test('The static update method calls Dynamodb Toolbox update method', async () => {
        const entitySpy = jest.spyOn(testEntity, 'update');
        await TestModel.update(basicParams);
        expect(joiSpy).toHaveBeenCalled();
        expect(entitySpy).toHaveBeenCalled();
      });

      test('The update method calls Dynamodb Toolbox update method', async () => {
        const entitySpy = jest.spyOn(testEntity, 'update');
        await instance.update();
        expect(joiSpy).toHaveBeenCalled();
        expect(entitySpy).toHaveBeenCalled();
      });

      test('When the object is not valid', async () => {
        const entitySpy = jest.spyOn(testEntity, 'update');
        instance.customAttribute = undefined;
        expect(() => instance.update()).toThrowError('"customAttribute" is required');
        expect(joiSpy).toHaveBeenCalled();
        expect(entitySpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('List methods', () => {
    test('The static scan method calls the Dynamodb Toolbox scan method', async () => {
      const entitySpy = jest.spyOn(testEntity, 'scan');
      await TestModel.scan();
      expect(entitySpy).toHaveBeenCalled();
    });

    test('The static query method calls the Dynamodb Toolbox query method', async () => {
      const entitySpy = jest.spyOn(testEntity, 'query');
      await TestModel.query('pk-123');
      expect(entitySpy).toHaveBeenCalled();
    });
  });

  describe('Testing the transform method', () => {
    let TransformModel: any;
    let basicParams: Record<string, any>;

    beforeEach(() => {
      JD.createEntity({
        name: 'transformEntity',
        beforeValidate: (attributes) => attributes,
        attributes: {
          pk: {
            type: 'string',
            partitionKey: true,
          },
          sk: {
            type: 'string',
            sortKey: true,
          },
          customAttribute: {
            type: 'number',
            validate: Joi.number().required(),
          },
          pk0: ['pk', 0],
          pk1: ['pk', 1],
          sk0: ['sk', 0],
          sk1: ['sk', 1],
        },
        table: testTable,
      });

      ({
        model: TransformModel,
      } = JD.entities.transformEntity);

      basicParams = {
        pk0: 'pk0',
        pk1: 'pk1',
        sk0: 'sk0',
        sk1: 'sk1',
        customAttribute: 1,
      };

      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('It should return the correct attributes', async () => {
      const transformed = await TransformModel.getTransformedAttributes(basicParams);
      expect(transformed).toStrictEqual({
        pk: 'pk0#pk1',
        sk: 'sk0#sk1',
        pk0: 'pk0',
        pk1: 'pk1',
        sk0: 'sk0',
        sk1: 'sk1',
        customAttribute: 1,
        _et: 'transformEntity',
        _ct: new Date().toISOString(),
        _md: new Date().toISOString(),
      });
    });

    test('It should return the attributes even when the model is invalid', async () => {
      const transformed = await TransformModel.getTransformedAttributes({
        pk: 1,
        sk: 1,
      });

      expect(transformed).toStrictEqual({
        pk: '1',
        sk: '1',
        _et: 'transformEntity',
        _ct: new Date().toISOString(),
        _md: new Date().toISOString(),
      });
    });
  });
});

describe('Testing Before Validate Method', () => {
  let tableParams: JoifulEntityConstructor;
  let basicParams: Record<string, any>;

  beforeEach(() => {
    basicParams = {
      pk: 'pk-123',
      sk: 'sk',
    };

    tableParams = {
      name: 'testEntity',
      attributes: {
        pk: {
          type: 'string',
          partitionKey: true,
        },
        sk: {
          type: 'string',
          sortKey: true,
        },
        customAttribute: 'number',
      },
      table: testTable,
    };
  });

  test('When there is not beforeValidate it should work fine', async () => {
    const {
      entity,
      model,
    } = JD.createEntity({
      ...tableParams,
    });

    const entitySpy = jest.spyOn(entity, 'put');
    await model.put(basicParams);
    expect(entitySpy).toHaveBeenCalled();
  });

  test('It should stop the save when throwing an error', async () => {
    const {
      entity,
      joi,
      model,
    } = JD.createEntity({
      ...tableParams,
      beforeValidate: () => { throw new Error('Test Error'); },
    });

    const entitySpy = jest.spyOn(entity, 'put');
    const joiSpy = jest.spyOn(joi, 'validate');
    expect(() => model.put(basicParams)).toThrowError('Test Error');
    expect(joiSpy).not.toHaveBeenCalled();
    expect(entitySpy).not.toHaveBeenCalled();
  });

  test('It should update the attributes when returning an object', async () => {
    const newReturn = { pk: 'pk-234', sk: 'sk-2' };
    const {
      entity,
      joi,
      model,
    } = JD.createEntity({
      ...tableParams,
      beforeValidate: () => newReturn,
    });

    const entitySpy = jest.spyOn(entity, 'put');
    const joiSpy = jest.spyOn(joi, 'validate');
    await model.put(basicParams);
    expect(joiSpy).toHaveBeenCalled();
    expect(joiSpy).toHaveBeenCalledWith(newReturn, {
      convert: true,
    });
    expect(entitySpy).toHaveBeenCalled();
    expect(entitySpy).toHaveBeenCalledWith(newReturn, undefined, undefined);
  });
});

describe('Testing aliases', () => {
  let tableParams: JoifulEntityConstructor;
  let basicParams: Record<string, any>;

  beforeEach(() => {
    basicParams = {
      pk: 'pk-123',
      sk: 'sk',
    };

    tableParams = {
      name: 'testEntity',
      attributes: {
        pk: {
          type: 'string',
          partitionKey: true,
        },
        sk: {
          type: 'string',
          sortKey: true,
        },
        customAttribute: {
          type: 'number',
          aliases: ['aliasAttribute1', 'aliasAttribute2'],
        },
      },
      table: testTable,
    };
  });

  test('The getters and setters should work', async () => {
    const {
      model: EntityModel,
    } = JD.createEntity({
      ...tableParams,
    });

    const instance = new EntityModel({
      basicParams,
      customAttribute: 1,
    });

    expect(instance.customAttribute).toBe(1);
    expect(instance.aliasAttribute1).toBe(1);
    expect(instance.aliasAttribute2).toBe(1);
    expect(() => {
      instance.customAttribute = 2;
    }).not.toThrowError();
    expect(instance.customAttribute).toBe(2);
    expect(instance.aliasAttribute1).toBe(2);
    expect(instance.aliasAttribute2).toBe(2);
    expect(() => {
      instance.aliasAttribute1 = 3;
    }).not.toThrowError();
    expect(instance.customAttribute).toBe(3);
    expect(instance.aliasAttribute1).toBe(3);
    expect(instance.aliasAttribute2).toBe(3);
    expect(() => {
      instance.aliasAttribute2 = 4;
    }).not.toThrowError();
    expect(instance.customAttribute).toBe(4);
    expect(instance.aliasAttribute1).toBe(4);
    expect(instance.aliasAttribute2).toBe(4);
    expect(() => {
      instance.aliasAttribute3 = 5;
    }).toThrowError();
  });

  test('The validation should be correct', async () => {
    const newTableParamsAttibutes: JoifulEntityAttributes = {
      ...tableParams.attributes,
      customAttribute: {
        type: 'number',
        validate: Joi.number().max(3).required(),
        aliases: ['aliasAttribute1', 'aliasAttribute2'],
      },
    };

    const {
      model: EntityModel,
    } = JD.createEntity({
      ...tableParams,
      attributes: newTableParamsAttibutes,
    });

    const instance = new EntityModel({
      ...basicParams,
      aliasAttribute1: 4,
    });

    expect(() => instance.put()).toThrowError();

    instance.aliasAttribute2 = 2;

    expect(() => instance.put()).not.toThrowError();

    expect(() => EntityModel.put({
      ...basicParams,
      aliasAttribute1: 4,
    })).toThrowError();

    expect(() => EntityModel.put({
      ...basicParams,
      aliasAttribute2: 2,
    })).not.toThrowError();
  });
});
