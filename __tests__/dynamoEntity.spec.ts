/* eslint-disable no-await-in-loop */
import Joi from 'joi';

import {
  BatchWriteCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

import _ from 'lodash';
import { DynamoPaginator } from '../src/lib/DynamoPaginator';
import { DynamoEntity as Entity } from '../src/lib/DynamoEntity';
import { prop } from '../src/lib/decorators/methods/props';
import { dynamodbDocumentClient, table } from '../src/lib/decorators/methods/table';
import { validate } from '../src/lib/decorators/methods/validations';
import { hasMany, hasOne } from '../src/lib/decorators/methods/relations';

const tableName = 'test-table';
const onlyPkTableName = 'test-only-pk';
const foreignSkTableName = 'test-foreign-sk';
const relationsTableName = 'test-relations-table';

@table(tableName)
class TestModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop({ createdAt: true })
  createdAt: string;

  @prop({ updatedAt: true })
  updatedAt: string;

  @prop()
  extraProp: string;

  public static initialize(item: Record<string, any>) {
    return super.initialize(item);
  }
}

@table(tableName)
class OtherModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop({ createdAt: true })
  createdAt: string;

  @prop({ updatedAt: true })
  updatedAt: string;
}

@table(onlyPkTableName)
class ModelWithNoSecondaryKey extends Entity {
  @prop({ primaryKey: true })
  pk: string;
}

@table(tableName)
class ModelForTestingJSONTransforming extends Entity {
  @validate(Joi.string().trim().required())
  @prop({ primaryKey: true })
  pk: string;

  @validate(Joi.string().trim().required())
  @prop({ secondaryKey: true })
  sk: string;

  @hasOne(TestModel, { required: false, nestedObject: true })
  child: TestModel;

  @hasMany(OtherModel, { required: false, nestedObject: false })
  children: OtherModel[];
}

@table(foreignSkTableName)
class ChildWithForeignSecondaryKey extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  _fk: string;
}
@table(foreignSkTableName)
class ModelWithForeignSecondaryKey extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  _fk: string;

  @hasOne(ChildWithForeignSecondaryKey, { nestedObject: false, indexName: 'test-index-name', foreignKey: '_fk' })
  child: ChildWithForeignSecondaryKey;
}

describe('Dynamo Entity', () => {
  afterEach(async () => {
    for (const Model of [TestModel, OtherModel, ModelWithNoSecondaryKey]) {
      const {
        items,
      } = await Model.scanAll();

      for (const item of items) {
        await Model.deleteItem(item.attributes);
      }
    }
  });

  describe('toJSON method', () => {
    const instance = new ModelForTestingJSONTransforming({ pk: '1', extraAttribute: '3' });
    expect(instance.toJSON()).toStrictEqual({
      key: {
        pk: 'ModelForTestingJSONTransforming-1',
        sk: 'ModelForTestingJSONTransforming-1',
      },
      attributes: {
        pk: '1',
        extraAttribute: '3',
      },
      validatedAttributes: undefined,
      dirty: true,
      error: undefined,
    });

    instance.validate();

    expect(instance.toJSON()).toEqual({
      key: {
        pk: 'ModelForTestingJSONTransforming-1',
        sk: 'ModelForTestingJSONTransforming-1',
      },
      attributes: {
        pk: '1',
        extraAttribute: '3',
      },
      validatedAttributes: {
        pk: '1',
        extraAttribute: '3',
      },
      dirty: false,
      error: '"sk" is required',
    });

    instance.sk = '   2   ';

    expect(instance.toJSON()).toEqual({
      key: {
        pk: 'ModelForTestingJSONTransforming-1',
        sk: 'ModelForTestingJSONTransforming-2',
      },
      attributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
      },
      validatedAttributes: undefined,
      dirty: true,
      error: undefined,
    });

    instance.validate();

    expect(instance.toJSON()).toEqual({
      key: {
        pk: 'ModelForTestingJSONTransforming-1',
        sk: 'ModelForTestingJSONTransforming-2',
      },
      attributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
      },
      validatedAttributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
      },
      dirty: false,
      error: undefined,
    });

    instance.child = new TestModel({
      pk: '3',
      sk: '4',
    });

    expect(instance.toJSON()).toStrictEqual({
      key: {
        pk: 'ModelForTestingJSONTransforming-1',
        sk: 'ModelForTestingJSONTransforming-2',
      },
      attributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
      },
      dirty: true,
      error: undefined,
      validatedAttributes: undefined,
    });

    instance.validate();

    expect(instance.toJSON()).toEqual({
      key: {
        pk: 'ModelForTestingJSONTransforming-1',
        sk: 'ModelForTestingJSONTransforming-2',
      },
      attributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
      },
      validatedAttributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
      },
      dirty: false,
      error: undefined,
    });

    instance.children = [new OtherModel({
      pk: '5',
      sk: '6',
    })];

    expect(instance.toJSON()).toStrictEqual({
      key: {
        pk: 'ModelForTestingJSONTransforming-1',
        sk: 'ModelForTestingJSONTransforming-2',
      },
      attributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
        children: [{
          pk: '5',
          sk: '6',
        }],
      },
      dirty: true,
      error: undefined,
      validatedAttributes: undefined,
    });

    instance.validate();

    expect(instance.toJSON()).toEqual({
      key: {
        pk: 'ModelForTestingJSONTransforming-1',
        sk: 'ModelForTestingJSONTransforming-2',
      },
      attributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
        children: [{
          pk: '5',
          sk: '6',
        }],
      },
      validatedAttributes: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
        children: [{
          pk: '5',
          sk: '6',
        }],
      },
      dirty: false,
      error: undefined,
    });
  });

  describe('Dynamodb Key', () => {
    test('It correctly returns the correct data in a model with both primary and secondary keys', () => {
      const instance = new TestModel({ pk: '1', sk: '2', extraAttribute: '3' });
      expect(instance.dbKey).toStrictEqual({
        pk: 'TestModel-1',
        sk: 'TestModel-2',
      });

      const otherInstance = new TestModel({ pk: '1', extraAttribute: '3' });
      expect(otherInstance.dbKey).toStrictEqual({
        pk: 'TestModel-1',
        sk: 'TestModel-1',
      });
    });

    test('It correctly returns the correct data in a model with only a primary key', () => {
      const instance = new ModelWithNoSecondaryKey({ pk: '1', sk: '2', extraAttribute: '3' });
      expect(instance.dbKey).toStrictEqual({
        pk: 'ModelWithNoSecondaryKey-1',
      });

      const otherInstance = new ModelWithNoSecondaryKey({ pk: '1', extraAttribute: '3' });
      expect(otherInstance.dbKey).toStrictEqual({
        pk: 'ModelWithNoSecondaryKey-1',
      });
    });
  });

  describe('Database integration', () => {
    describe('Scan', () => {
      test('It should return no items when there is not data in the database', async () => {
        const response = await TestModel.scan();
        expect(response).toBeInstanceOf(DynamoPaginator);
        expect(response.items).toStrictEqual([]);
        expect(response.lastPageItems).toStrictEqual([]);
        expect(response.morePages).toBeFalsy();
      });

      test('It should return no items when there is not data in the database when getting all', async () => {
        const response = await TestModel.scanAll();
        expect(response).toBeInstanceOf(DynamoPaginator);
        expect(response.items).toStrictEqual([]);
        expect(response.lastPageItems).toStrictEqual([]);
        expect(response.morePages).toBeFalsy();
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'TestModel-scan-1',
                    sk: 'TestModel-scan-2',
                    _entityName: 'TestModel',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'TestModel-scan-3',
                    sk: 'TestModel-scan-4',
                    _entityName: 'TestModel',
                  },
                },
              }],
            },
          }));
        });

        test('It should return the correct items when there is data in the database', async () => {
          const response = await TestModel.scan();
          expect(response).toBeInstanceOf(DynamoPaginator);
          expect(response.items.length).toEqual(2);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.items[1]).toBeInstanceOf(TestModel);
          const responseAttributes = response.items.map((item) => item.attributes);
          expect(responseAttributes).toContainEqual({
            pk: 'scan-1',
            sk: 'scan-2',
          });
          expect(responseAttributes).toContainEqual({
            pk: 'scan-3',
            sk: 'scan-4',
          });
          expect(response.morePages).toBeFalsy();
        });

        test('It should return the correct items when there is data in the database and the all method is used', async () => {
          const response = await TestModel.scanAll();
          expect(response).toBeInstanceOf(DynamoPaginator);
          expect(response.items.length).toEqual(2);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.items[1]).toBeInstanceOf(TestModel);
          const responseAttributes = response.items.map((item) => item.attributes);
          expect(responseAttributes).toContainEqual({
            pk: 'scan-1',
            sk: 'scan-2',
          });
          expect(responseAttributes).toContainEqual({
            pk: 'scan-3',
            sk: 'scan-4',
          });
          expect(response.morePages).toBeFalsy();
        });

        test('It should return only limited items when using a Limit option and should let the pagination to work', async () => {
          const response = await TestModel.scan({
            Limit: 1,
          });
          expect(response).toBeInstanceOf(DynamoPaginator);
          expect(response.items.length).toEqual(1);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.morePages).toBeTruthy();
          expect(response.lastPageItems.length).toEqual(1);
          await response.next();
          expect(response.items.length).toEqual(2);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.items[1]).toBeInstanceOf(TestModel);
          expect(response.morePages).toBeTruthy();
          expect(response.lastPageItems.length).toEqual(1);
          await response.next();
          expect(response.items.length).toEqual(2);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.items[1]).toBeInstanceOf(TestModel);
          expect(response.morePages).toBeFalsy();
          expect(response.lastPageItems.length).toEqual(0);
          await expect(response.next()).rejects.toThrowError('All pages were already scanned');
        });

        test('Scan only returns the items of the correct model', async () => {
          const { items: testModelItems } = await TestModel.scanAll();
          const { items: otherModelItems } = await OtherModel.scanAll();

          expect(testModelItems).toHaveLength(2);
          expect(otherModelItems).toHaveLength(0);
        });
      });
    });

    describe('Query', () => {
      const queryOptions = {
        IndexName: 'bySK',
        KeyConditionExpression: 'sk = :v',
        ExpressionAttributeValues: {
          ':v': 'TestModel-query-2',
        },
      };

      const entityNameQueryOptions = {
        IndexName: 'byEntityName',
        KeyConditionExpression: '#en = :en',
        ExpressionAttributeNames: {
          '#en': '_entityName',
        },
        ExpressionAttributeValues: {
          ':en': TestModel._entityName,
        },
      };

      test('It should return no items when there is not data in the database', async () => {
        const response = await TestModel.query(queryOptions);
        expect(response).toBeInstanceOf(DynamoPaginator);
        expect(response.items).toStrictEqual([]);
        expect(response.lastPageItems).toStrictEqual([]);
        expect(response.morePages).toBeFalsy();
      });

      test('It should return no items when there is not data in the database when getting all', async () => {
        const response = await TestModel.queryAll(queryOptions);
        expect(response).toBeInstanceOf(DynamoPaginator);
        expect(response.items).toStrictEqual([]);
        expect(response.lastPageItems).toStrictEqual([]);
        expect(response.morePages).toBeFalsy();
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'TestModel-query-1',
                    sk: 'TestModel-query-2',
                    _entityName: 'TestModel',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'TestModel-query-3',
                    sk: 'TestModel-query-2',
                    _entityName: 'TestModel',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'TestModel-query-4',
                    sk: 'TestModel-query-5',
                    _entityName: 'TestModel',
                  },
                },
              }],
            },
          }));
        });

        test('It should return the correct items when there is data in the database', async () => {
          const response = await TestModel.query(queryOptions);
          expect(response).toBeInstanceOf(DynamoPaginator);
          expect(response.items.length).toEqual(2);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.items[1]).toBeInstanceOf(TestModel);
          const responseAttributes = response.items.map((item) => item.attributes);
          expect(responseAttributes).toContainEqual({
            pk: 'query-1',
            sk: 'query-2',
          });
          expect(responseAttributes).toContainEqual({
            pk: 'query-3',
            sk: 'query-2',
          });
          expect(response.morePages).toBeFalsy();
        });

        test('It should return the correct items when there is data in the database and the all method is used', async () => {
          const response = await TestModel.queryAll(queryOptions);
          expect(response).toBeInstanceOf(DynamoPaginator);
          expect(response.items.length).toEqual(2);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.items[1]).toBeInstanceOf(TestModel);
          const responseAttributes = response.items.map((item) => item.attributes);
          expect(responseAttributes).toContainEqual({
            pk: 'query-1',
            sk: 'query-2',
          });
          expect(responseAttributes).toContainEqual({
            pk: 'query-3',
            sk: 'query-2',
          });
          expect(response.morePages).toBeFalsy();
        });

        test('It should return only limited items when using a Limit option and should let the pagination to work', async () => {
          const response = await TestModel.query({
            ...queryOptions,
            Limit: 1,
          });
          expect(response).toBeInstanceOf(DynamoPaginator);
          expect(response.items.length).toEqual(1);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.morePages).toBeTruthy();
          expect(response.lastPageItems.length).toEqual(1);
          await response.next();
          expect(response.items.length).toEqual(2);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.items[1]).toBeInstanceOf(TestModel);
          expect(response.morePages).toBeTruthy();
          expect(response.lastPageItems.length).toEqual(1);
          await response.next();
          expect(response.items.length).toEqual(2);
          expect(response.items[0]).toBeInstanceOf(TestModel);
          expect(response.items[1]).toBeInstanceOf(TestModel);
          expect(response.morePages).toBeFalsy();
          expect(response.lastPageItems.length).toEqual(0);
          await expect(response.next()).rejects.toThrowError('All pages were already scanned');
        });

        test('Query only returns the items of the correct model', async () => {
          const { items: testModelItems } = await TestModel.queryAll(queryOptions);
          const { items: otherModelItems } = await OtherModel.queryAll(queryOptions);

          expect(testModelItems).toHaveLength(2);
          expect(otherModelItems).toHaveLength(0);
        });

        test('It should also work with an Index that includes the entityName in it', async () => {
          const { items } = await TestModel.queryAll(entityNameQueryOptions);
          expect(items).toHaveLength(3);
        });
      });
    });

    describe('Get', () => {
      test('It should return undefined when there is no data in the database', async () => {
        await expect(() => TestModel.getItem({
          pk: 'get-1',
          sk: 'get-2',
        })).rejects.toThrowError('Record not found.');
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'TestModel-get-1',
                    sk: 'TestModel-get-2',
                    _entityName: 'TestModel',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'TestModel-get-3',
                    sk: 'TestModel-get-4',
                    _entityName: 'TestModel',
                  },
                },
              }],
            },
          }));
        });

        test('It should return the correct object when there is data', async () => {
          const response = await TestModel.getItem({
            pk: 'get-1',
            sk: 'get-2',
          });

          expect(response).toBeInstanceOf(TestModel);
          expect(response?.attributes).toStrictEqual({
            pk: 'get-1',
            sk: 'get-2',
          });
        });

        test('It should throw an error if not passing a full key to the method', async () => {
          await expect(TestModel.getItem({
            pk: 'get-1',
          })).rejects.toThrowError('Record not found.');
        });

        test('It should throw an error if not passing a full key to the method', async () => {
          await expect(TestModel.getItem({
            sk: 'get-2',
          })).rejects.toThrowError('The number of conditions on the keys is invalid');
        });

        test('It should only return items of the correct model', async () => {
          const testModelResponse = await TestModel.getItem({
            pk: 'get-1',
            sk: 'get-2',
          });

          await expect(() => OtherModel.getItem({
            pk: 'get-1',
            sk: 'get-2',
          })).rejects.toThrowError('Record not found.');

          expect(testModelResponse).toBeInstanceOf(TestModel);
        });
      });
    });

    describe('Delete Item', () => {
      test('should return error when the item is not found', async () => {
        await expect(TestModel.deleteItem({
          pk: 'delete-1',
          sk: 'delete-2',
        })).rejects.toThrowError('Record not found.');
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'TestModel-delete-1',
                    sk: 'TestModel-delete-2',
                    _entityName: 'TestModel',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'TestModel-delete-3',
                    sk: 'TestModel-delete-4',
                    _entityName: 'TestModel',
                  },
                },
              }],
            },
          }));
        });

        test('It should return the deleted item attributes', async () => {
          const response = await TestModel.deleteItem({
            pk: 'delete-1',
            sk: 'delete-2',
          });

          expect(response.Attributes).toStrictEqual({
            pk: 'TestModel-delete-1',
            sk: 'TestModel-delete-2',
            _entityName: 'TestModel',
          });
        });

        test('It should effectivelly delete the item in the database', async () => {
          const scanOptions = {
            FilterExpression: 'begins_with(pk, :v)',
            ExpressionAttributeValues: {
              ':v': 'TestModel-delete',
            },
          };
          const { items: beforeDeleteItems } = await TestModel.scanAll(scanOptions);
          expect(beforeDeleteItems).toHaveLength(2);
          await TestModel.deleteItem({
            pk: 'delete-1',
            sk: 'delete-2',
          });
          const { items: afterDeleteItems } = await TestModel.scanAll(scanOptions);
          expect(afterDeleteItems).toHaveLength(1);
        });

        test('It should delete only from the correct model', async () => {
          await expect(OtherModel.deleteItem({
            pk: 'delete-3',
            sk: 'delete-4',
          })).rejects.toThrowError('Record not found.');

          await expect(TestModel.deleteItem({
            pk: 'delete-3',
            sk: 'delete-4',
          })).resolves.not.toThrow('Record not found.');
        });
      });
    });

    describe('Instance Delete', () => {
      test('should return error when the item is not found', async () => {
        const instance = new TestModel({ pk: 'instance-delete-1', sk: 'instance-delete-2' });
        await expect(() => instance.delete()).rejects.toThrowError('Record not found.');
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'TestModel-instance-delete-1',
                    sk: 'TestModel-instance-delete-2',
                    _entityName: 'TestModel',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'TestModel-instance-delete-3',
                    sk: 'TestModel-instance-delete-4',
                    _entityName: 'TestModel',
                  },
                },
              }],
            },
          }));
        });

        test('It should return the deleted item attributes', async () => {
          const instance = new TestModel({ pk: 'instance-delete-1', sk: 'instance-delete-2' });
          const response = await instance.delete();

          expect(response.Attributes).toEqual({
            pk: 'TestModel-instance-delete-1',
            sk: 'TestModel-instance-delete-2',
            _entityName: 'TestModel',
          });
        });

        test('It should effectivelly delete the item in the database', async () => {
          const scanOptions = {
            FilterExpression: 'begins_with(pk, :v)',
            ExpressionAttributeValues: {
              ':v': 'TestModel-instance-delete',
            },
          };
          const { items: beforeDeleteItems } = await TestModel.scanAll(scanOptions);
          expect(beforeDeleteItems).toHaveLength(2);

          const instance = new TestModel({ pk: 'instance-delete-1', sk: 'instance-delete-2' });
          await instance.delete();

          const { items: afterDeleteItems } = await TestModel.scanAll(scanOptions);
          expect(afterDeleteItems).toHaveLength(1);
        });

        test('It should delete only from the correct model', async () => {
          const otherModel = new OtherModel({
            pk: 'instance-delete-3',
            sk: 'instance-delete-4',
          });
          await expect(otherModel.delete()).rejects.toThrowError('Record not found.');

          const testModel = new TestModel({
            pk: 'instance-delete-3',
            sk: 'instance-delete-4',
          });

          await expect(testModel.delete()).resolves.not.toThrow('Record not found.');
        });
      });
    });

    describe('Instance Load', () => {
      test('It should throw an error if nothing is found', async () => {
        const instance = new TestModel({
          pk: 'load-1',
          sk: 'load-2',
        });

        await expect(instance.load()).rejects.toThrowError('Record not found.');
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'TestModel-load-1',
                    sk: 'TestModel-load-2',
                    extraProp: 'database-extra-1',
                    _entityName: 'TestModel',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'TestModel-load-3',
                    sk: 'TestModel-load-4',
                    extraProp: 'database-extra-2',
                    _entityName: 'TestModel',
                  },
                },
              }],
              [foreignSkTableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'ChildWithForeignSecondaryKey-2',
                    _fk: 'ModelWithForeignSecondaryKey-1',
                    _entityName: 'ChildWithForeignSecondaryKey',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'ModelWithForeignSecondaryKey-1',
                    _fk: 'ModelWithForeignSecondaryKey-1',
                    _entityName: 'ModelWithForeignSecondaryKey',
                  },
                },
              }],
            },
          }));
        });

        test('It should load the data correctly', async () => {
          const instance = new TestModel({
            pk: 'load-1',
            sk: 'load-2',
          });

          expect(instance.extraProp).toBeUndefined();

          await instance.load();

          expect(instance.extraProp).toEqual('database-extra-1');
        });

        test('Load with full dynamodb pk and sk works using the initialize method', async () => {
          const instance = TestModel.initialize({
            pk: 'TestModel-load-1',
            sk: 'TestModel-load-2',
            _entityName: 'TestModel',
          });

          expect(instance.extraProp).toBeUndefined();

          await instance.load();

          expect(instance.extraProp).toEqual('database-extra-1');
        });

        test('It should correctly parse the primary key and secondary key', async () => {
          const instance = new TestModel({
            pk: 'load-1',
            sk: 'load-2',
          });

          await instance.load();
          expect(instance.pk).toEqual('load-1');
          expect(instance.sk).toEqual('load-2');
        });

        test('It should correctly parse the primary key and secondary key when the secondary key is a foreignKey', async () => {
          const parentInstance = new ModelWithForeignSecondaryKey({
            pk: '1',
            _fk: '1',
          });

          await parentInstance.load();
          expect(parentInstance.pk).toEqual('1');
          expect(parentInstance._fk).toEqual('1');

          const childInstnace = new ChildWithForeignSecondaryKey({
            pk: '2',
            _fk: '1',
          });

          await childInstnace.load();
          expect(childInstnace.pk).toEqual('2');
          expect(childInstnace._fk).toEqual('1');

          let { items: parentItems } = await ModelWithForeignSecondaryKey.scanAll();
          expect(parentItems).toHaveLength(1);
          await parentInstance.delete();
          ({ items: parentItems } = await ModelWithForeignSecondaryKey.scanAll());
          expect(parentItems).toHaveLength(0);

          let { items: childItems } = await ChildWithForeignSecondaryKey.scanAll();
          expect(childItems).toHaveLength(1);
          await childInstnace.delete();
          ({ items: childItems } = await ChildWithForeignSecondaryKey.scanAll());
          expect(childItems).toHaveLength(0);
        });

        test('It should not load if using the wrong model', async () => {
          const instance = new OtherModel({
            pk: 'load-1',
            sk: 'load-2',
          });

          await expect(() => instance.load()).rejects.toThrowError('Record not found.');
        });
      });
    });

    describe('Instance Create', () => {
      test('It should throw an error if nothing is set', async () => {
        const instance = new TestModel({
          pk: undefined,
        });
        instance.validate();

        await expect(instance.create()).rejects.toThrowError('Entity cannot be empty.');
      });

      describe('When there is some data registered', () => {
        let now;

        beforeEach(async () => {
          jest.useFakeTimers();

          now = new Date().toISOString();

          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'TestModel-create-1',
                    sk: 'TestModel-create-2',
                    createdAt: now,
                    updatedAt: now,
                    extraAttribute: 1,
                    _entityName: 'TestModel',
                  },
                },
              }],
            },
          }));

          jest.useRealTimers();
        });

        afterEach(async () => {
          jest.useRealTimers();
        });

        test('It updates an existing item and sets a new createdAt and updatedAt', async () => {
          const instance = await TestModel.getItem({
            pk: 'create-1',
            sk: 'create-2',
          });

          expect(instance).not.toBeUndefined();
          if (instance == null) return;

          expect(instance.attributes).toStrictEqual({
            pk: 'create-1',
            sk: 'create-2',
            createdAt: now,
            updatedAt: now,
            extraAttribute: 1,
          });

          const newInstance = new TestModel({
            pk: 'create-1',
            sk: 'create-2',
          });

          expect(newInstance.attributes).toStrictEqual({
            pk: 'create-1',
            sk: 'create-2',
          });

          await newInstance.create();

          expect(newInstance.pk).toEqual('create-1');
          expect(newInstance.sk).toEqual('create-2');
          expect(newInstance.createdAt).not.toEqual(now);
          expect(newInstance.createdAt).not.toBeUndefined();
          expect(newInstance.updatedAt).not.toEqual(now);
          expect(newInstance.updatedAt).not.toBeUndefined();
          expect(newInstance.extraAttribute).toBeUndefined();

          const newGetInstance = await TestModel.getItem({
            pk: 'create-1',
            sk: 'create-2',
          });

          expect(newGetInstance).not.toBeUndefined();
          if (newGetInstance == null) return;

          expect(newGetInstance.pk).toEqual('create-1');
          expect(newGetInstance.sk).toEqual('create-2');
          expect(newGetInstance.createdAt).not.toEqual(now);
          expect(newGetInstance.createdAt).not.toBeUndefined();
          expect(newGetInstance.updatedAt).not.toEqual(now);
          expect(newGetInstance.updatedAt).not.toBeUndefined();
          expect(newGetInstance.extraAttribute).toBeUndefined();
        });

        test('It creates a new item when it does not match the key', async () => {
          jest.useFakeTimers();

          const scanOptions = {
            FilterExpression: 'begins_with(pk, :v)',
            ExpressionAttributeValues: {
              ':v': 'TestModel-create',
            },
          };
          let scanResult = await TestModel.scanAll(scanOptions);
          let existingItems = scanResult.items;

          expect(existingItems).toHaveLength(1);

          let instance;
          await expect(async () => {
            instance = await TestModel.getItem({
              pk: 'create-1',
              sk: 'create-3',
            });
          }).rejects.toThrowError('Record not found.');

          expect(instance).toBeUndefined();

          instance = new TestModel({
            pk: 'create-1',
            sk: 'create-3',
          });

          expect(instance.createdAt).toBeUndefined();
          expect(instance.updatedAt).toBeUndefined();

          await instance.create();

          expect(instance.pk).toEqual('create-1');
          expect(instance.sk).toEqual('create-3');
          expect(instance.createdAt).not.toBeUndefined();
          expect(instance.updatedAt).not.toBeUndefined();

          scanResult = await TestModel.scanAll();
          existingItems = scanResult.items;

          expect(existingItems).toHaveLength(2);

          const response = await dynamodbDocumentClient.send(new GetCommand({
            TableName: tableName,
            Key: {
              pk: 'TestModel-create-1',
              sk: 'TestModel-create-3',
            },
          }));

          // IT CORRECTLY SETS ALL THE ATTRIBUTES
          expect(response.Item).toStrictEqual({
            pk: 'TestModel-create-1',
            sk: 'TestModel-create-3',
            _entityName: 'TestModel',
            createdAt: instance.createdAt,
            updatedAt: instance.updatedAt,
          });
        });
      });
    });

    describe('Instance Update', () => {
      test('It should throw an error if nothing is set', async () => {
        const instance = new TestModel();

        await expect(() => instance.update()).rejects.toThrowError('Entity cannot be empty.');
      });

      describe('When there is some data registered', () => {
        let now;
        beforeEach(async () => {
          now = new Date().toISOString();
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'TestModel-update-1',
                    sk: 'TestModel-update-2',
                    createdAt: now,
                    updatedAt: now,
                    extraAttribute: 1,
                    _entityName: 'TestModel',
                  },
                },
              }],
            },
          }));
        });

        test('It updates an existing item and sets a new createdAt and updatedAt', async () => {
          const scanOptions = {
            FilterExpression: 'begins_with(pk, :v)',
            ExpressionAttributeValues: {
              ':v': 'TestModel-update',
            },
          };
          let scanResult = await TestModel.scanAll(scanOptions);
          let existingItems = scanResult.items;

          expect(existingItems).toHaveLength(1);

          const instance = await TestModel.getItem({
            pk: 'update-1',
            sk: 'update-2',
          });

          expect(instance).not.toBeUndefined();

          expect(instance.attributes).toStrictEqual({
            pk: 'update-1',
            sk: 'update-2',
            createdAt: now,
            updatedAt: now,
            extraAttribute: 1,
          });

          const newInstance = new TestModel({
            pk: 'update-1',
            sk: 'update-2',
            newAttribute: 2,
          });

          expect(newInstance.attributes).toStrictEqual({
            pk: 'update-1',
            sk: 'update-2',
            newAttribute: 2,
          });

          await newInstance.update();

          expect(newInstance.pk).toEqual('update-1');
          expect(newInstance.sk).toEqual('update-2');
          expect(newInstance.createdAt).toEqual(now);
          expect(newInstance.updatedAt).not.toEqual(now);
          expect(newInstance.updatedAt).not.toBeUndefined();
          expect(newInstance.extraAttribute).toEqual(1);
          expect(newInstance.newAttribute).toEqual(2);

          const newGetInstance = await TestModel.getItem({
            pk: 'update-1',
            sk: 'update-2',
          });

          expect(newGetInstance).not.toBeUndefined();

          expect(newGetInstance.pk).toEqual('update-1');
          expect(newGetInstance.sk).toEqual('update-2');
          expect(newGetInstance.createdAt).toEqual(now);
          expect(newGetInstance.createdAt).not.toBeUndefined();
          expect(newGetInstance.updatedAt).not.toEqual(now);
          expect(newGetInstance.updatedAt).not.toBeUndefined();
          expect(newGetInstance.extraAttribute).toEqual(1);
          expect(newGetInstance.newAttribute).toEqual(2);

          scanResult = await TestModel.scanAll(scanOptions);
          existingItems = scanResult.items;

          expect(existingItems).toHaveLength(1);
        });

        test('It creates a new item when it does not match the key', async () => {
          const scanOptions = {
            FilterExpression: 'begins_with(pk, :v)',
            ExpressionAttributeValues: {
              ':v': 'TestModel-update',
            },
          };
          let scanResult = await TestModel.scanAll(scanOptions);
          let existingItems = scanResult.items;

          expect(existingItems).toHaveLength(1);

          let instance;
          await expect(async () => {
            instance = await TestModel.getItem({
              pk: 'update-1',
              sk: 'update-3',
            });
          }).rejects.toThrowError('Record not found.');

          expect(instance).toBeUndefined();

          instance = new TestModel({
            pk: 'update-1',
            sk: 'update-3',
          });

          expect(instance.createdAt).toBeUndefined();
          expect(instance.updatedAt).toBeUndefined();

          await instance.create();

          scanResult = await TestModel.scanAll(scanOptions);
          existingItems = scanResult.items;

          expect(existingItems).toHaveLength(2);

          expect(instance.pk).toEqual('update-1');
          expect(instance.sk).toEqual('update-3');
          expect(instance.createdAt).not.toBeUndefined();
          expect(instance.updatedAt).not.toBeUndefined();
        });
      });
    });
  });

  describe('Testing a model with no secondary Key', () => {
    beforeEach(async () => {
      await dynamodbDocumentClient.send(new BatchWriteCommand({
        RequestItems: {
          [onlyPkTableName]: [{
            PutRequest: {
              Item: {
                pk: 'ModelWithNoSecondaryKey-1',
                extraAttribute: 'extra-1',
                _entityName: 'ModelWithNoSecondaryKey',
              },
            },
          }, {
            PutRequest: {
              Item: {
                pk: 'ModelWithNoSecondaryKey-2',
                extraAttribute: 'extra-2',
                _entityName: 'ModelWithNoSecondaryKey',
              },
            },
          }],
        },
      }));
    });

    test('Scan works', async () => {
      const { items } = await ModelWithNoSecondaryKey.scanAll();

      expect(items).toHaveLength(2);
    });

    test('Get', async () => {
      const item = await ModelWithNoSecondaryKey.getItem({ pk: '1' });

      expect(item).toBeInstanceOf(ModelWithNoSecondaryKey);
      expect(item.pk).toEqual('1');
      expect(item.extraAttribute).toEqual('extra-1');
    });

    test('Delete', async () => {
      let { items } = await ModelWithNoSecondaryKey.scanAll();
      expect(items).toHaveLength(2);

      await ModelWithNoSecondaryKey.deleteItem({ pk: '1' });

      ({ items } = await ModelWithNoSecondaryKey.scanAll());
      expect(items).toHaveLength(1);
    });

    test('Instance Load', async () => {
      const instance = new ModelWithNoSecondaryKey({ pk: '1' });
      expect(instance.extraAttribute).toBeUndefined();
      await instance.load();
      expect(instance.extraAttribute).toEqual('extra-1');
    });

    test('Instance Create', async () => {
      const instance = new ModelWithNoSecondaryKey({ pk: '3' });
      let { items } = await ModelWithNoSecondaryKey.scanAll();
      expect(items).toHaveLength(2);

      await instance.create();
      ({ items } = await ModelWithNoSecondaryKey.scanAll());
      expect(items).toHaveLength(3);
    });

    test('Instance Update', async () => {
      const instance = new ModelWithNoSecondaryKey({ pk: '1', extraAttribute: 'new-extra' });
      let { items } = await ModelWithNoSecondaryKey.scanAll();
      expect(items).toHaveLength(2);

      await instance.update();

      ({ items } = await ModelWithNoSecondaryKey.scanAll());
      expect(items).toHaveLength(2);

      const newInstance = await ModelWithNoSecondaryKey.getItem({
        pk: '1',
      });

      expect(newInstance.extraAttribute).toEqual('new-extra');
    });
  });

  describe('Testing a model where the secondary key is a foreign key', () => {
    test('It should correctly set the secondary key equal to the primary key', async () => {
      const model = new ModelWithForeignSecondaryKey({
        pk: '1',
      });

      expect(model._fk).toEqual('1');
      expect(model.dbKey).toStrictEqual({
        pk: 'ModelWithForeignSecondaryKey-1',
        _fk: 'ModelWithForeignSecondaryKey-1',
      });
    });

    test('It keeps it null when it is blank', () => {
      const model = new ModelWithForeignSecondaryKey();

      expect(model._fk).toBeUndefined();
      expect(model.dbKey).toStrictEqual({
        pk: undefined,
        _fk: undefined,
      });
    });

    test('It does overrides the value if something is set', () => {
      const model = new ModelWithForeignSecondaryKey({
        pk: '1',
        _fk: '2',
      });

      expect(model._fk).toEqual('2');
      expect(model.dbKey).toStrictEqual({
        pk: 'ModelWithForeignSecondaryKey-1',
        _fk: 'ModelWithForeignSecondaryKey-2',
      });
    });

    test('It correctly sets the secondary key when belonging to another model', () => {
      const model = new ChildWithForeignSecondaryKey({
        pk: '1',
        _fk: '2',
      });

      expect(model._fk).toEqual('2');
      expect(model.dbKey).toStrictEqual({
        pk: 'ChildWithForeignSecondaryKey-1',
        _fk: 'ModelWithForeignSecondaryKey-2',
      });
    });
  });
});

@table(relationsTableName)
class ChildModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop()
  _fk: string;
}

@table(relationsTableName)
class ChildModel2 extends ChildModel {}

@table(relationsTableName)
class ParentModel extends Entity {
  protected transformAttributes() {
    const attributes = super.transformAttributes();

    if (!_.isEmpty(attributes.pk) && !_.isEmpty(attributes.sk)) {
      attributes._fk = `${attributes.pk}-${attributes.sk}`;
    }

    return attributes;
  }

  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop()
  _fk: string;

  @hasOne(ChildModel2, { nestedObject: true })
  child2: ChildModel2;

  @hasOne(ChildModel, { nestedObject: false, foreignKey: '_fk', indexName: 'byFK' })
  child: ChildModel;

  @hasMany(ChildModel, { nestedObject: false, foreignKey: '_fk', indexName: 'byFK' })
  children: ChildModel[];
}

describe('Dynamo Entity with transform attributes setting the _fk', () => {
  afterEach(async () => {
    for (const Model of [ChildModel, ParentModel]) {
      const {
        items,
      } = await Model.scanAll();

      for (const item of items) {
        await Model.deleteItem(item.attributes);
      }
    }
  });

  describe('When there is a child', () => {
    beforeEach(async () => {
      await dynamodbDocumentClient.send(new BatchWriteCommand({
        RequestItems: {
          [relationsTableName]: [{
            PutRequest: {
              Item: {
                pk: 'ParentModel-1',
                sk: 'ParentModel-2',
                _fk: 'ParentModel-1-2',
                _entityName: 'ParentModel',
              },
            },
          }, {
            PutRequest: {
              Item: {
                pk: 'ChildModel-3',
                sk: 'ChildModel-4',
                _fk: 'ParentModel-1-2',
                _entityName: 'ChildModel',
              },
            },
          }],
        },
      }));
    });

    test('It correctly loads the related using the transformAttributes when the _fk is not present', async () => {
      const parent = new ParentModel({ pk: '1', sk: '2' });
      // FK SET AUTOMATICALLY AS PARENT TRANSFORMED _FK BUT IT IS A BLANK CHILD
      expect(parent.child.attributes).toStrictEqual({ _fk: '1-2' });
      expect(parent.children).toHaveLength(0);
      await parent.loadWithRelated();
      expect(parent.child.attributes).toStrictEqual({ pk: '3', sk: '4', _fk: '1-2' });
      expect(parent.children).toHaveLength(1);
      expect(parent.children[0].attributes).toStrictEqual(parent.child.attributes);
    });

    test('When the parent transform attributes does not set the _fk', async () => {
      const parent = new ParentModel({ pk: '1' });
      // FK SET AUTOMATICALLY AS PARENT PK BECAUSE TRANSFORMED _FK IS BLANK
      expect(parent.child.attributes).toStrictEqual({ _fk: '1' });
      expect(parent.children).toHaveLength(0);
      await expect(() => parent.loadWithRelated()).rejects.toThrowError('Record not found.');
      expect(parent.child.attributes).toStrictEqual({ _fk: '1' });
      expect(parent.children).toHaveLength(0);
    });
  });

  describe('When there is no child', () => {
    test('The create method works as expected', async () => {
      let { items: parents } = await ParentModel.scanAll();
      expect(parents).toHaveLength(0);

      const parent = new ParentModel({ pk: '1', sk: '2', child2: { pk: '3', sk: '4' } });
      await parent.create();

      ({ items: parents } = await ParentModel.scanAll());
      expect(parents).toHaveLength(1);
      expect(parents[0].child2.attributes).toStrictEqual({
        pk: '3',
        sk: '4',
      });
    });

    test('The create update method works as expected', async () => {
      let { items: parents } = await ParentModel.scanAll();
      expect(parents).toHaveLength(0);

      const parent = new ParentModel({ pk: '1', sk: '2', child2: { pk: '3', sk: '4' } });
      await parent.update();

      ({ items: parents } = await ParentModel.scanAll());
      expect(parents).toHaveLength(1);
      expect(parents[0].child2.attributes).toStrictEqual({
        pk: '3',
        sk: '4',
      });
    });
  });
});
