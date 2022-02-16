/* eslint-disable no-await-in-loop */
import { DynamoPaginator } from '../src/lib/Entity/DynamoPaginator';
import { Entity } from '../src/lib/Entity';
import { prop } from '../src/lib/Decorators/prop';
import { dynamodbDocumentClient, table } from '../src/lib/Decorators/table';
import { hasMany, hasOne, validate } from '../src/lib/Decorators';
import Joi from 'joi';

const tableName = 'test-table';
const onlyPkTableName = 'test-only-pk';

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
        pk: '1',
        sk: undefined,
      },
      data: {
        pk: '1',
        extraAttribute: '3',
      },
      error: '"sk" is required',
    });

    instance.sk = '   2   ';
    expect(instance.toJSON()).toStrictEqual({
      key: {
        pk: '1',
        sk: '2',
      },
      data: {
        pk: '1',
        sk: '   2   ',
        extraAttribute: '3',
      },
      validatedData: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
      },
    });

    instance.child = new TestModel({
      pk: '3',
      sk: '4',
    });

    expect(instance.toJSON()).toStrictEqual({
      key: {
        pk: '1',
        sk: '2',
      },
      data: {
        pk: '1',
        sk: '   2   ',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
      },
      validatedData: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
      },
    });

    instance.children = [new OtherModel({
      pk: '5',
      sk: '6',
    })];

    expect(instance.toJSON()).toStrictEqual({
      key: {
        pk: '1',
        sk: '2',
      },
      data: {
        pk: '1',
        sk: '   2   ',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
      },
      validatedData: {
        pk: '1',
        sk: '2',
        extraAttribute: '3',
        child: {
          pk: '3',
          sk: '4',
        },
      },
    });
  });

  describe('Dynamodb Key', () => {
    test('It correctly returns the correct data in a model with both primary and secondary keys', () => {
      const instance = new TestModel({ pk: '1', sk: '2', extraAttribute: '3' });
      expect(instance.dbKey).toStrictEqual({
        pk: '1',
        sk: '2',
      });

      expect(instance.transformedDBKey).toStrictEqual({
        pk: 'TestModel-1',
        sk: 'TestModel-2',
      });

      const otherInstance = new TestModel({ pk: '1', extraAttribute: '3' });
      expect(otherInstance.dbKey).toStrictEqual({
        pk: '1',
        sk: undefined,
      });

      expect(otherInstance.transformedDBKey).toStrictEqual({
        pk: 'TestModel-1',
        sk: undefined,
      });
    });

    test('It correctly returns the correct data in a model with only a primary key', () => {
      const instance = new ModelWithNoSecondaryKey({ pk: '1', sk: '2', extraAttribute: '3' });
      expect(instance.dbKey).toStrictEqual({
        pk: '1',
      });

      expect(instance.transformedDBKey).toStrictEqual({
        pk: 'ModelWithNoSecondaryKey-1',
      });

      const otherInstance = new ModelWithNoSecondaryKey({ pk: '1', extraAttribute: '3' });
      expect(otherInstance.dbKey).toStrictEqual({
        pk: '1',
      });

      expect(otherInstance.transformedDBKey).toStrictEqual({
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
          await dynamodbDocumentClient.batchWrite({
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
          }).promise();
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
          await dynamodbDocumentClient.batchWrite({
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
          }).promise();
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
      });
    });

    describe('Get', () => {
      test('It should return undefined when there is no data in the database', async () => {
        const response = await TestModel.getItem({
          pk: 'get-1',
          sk: 'get-2',
        });
        expect(response).toBeUndefined();
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.batchWrite({
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
          }).promise();
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
          })).rejects.toThrowError('The number of conditions on the keys is invalid');
        });

        test('It should only return items of the correct model', async () => {
          const testModelResponse = await TestModel.getItem({
            pk: 'get-1',
            sk: 'get-2',
          });

          const otherModelResponse = await OtherModel.getItem({
            pk: 'get-1',
            sk: 'get-2',
          });

          expect(testModelResponse).toBeInstanceOf(TestModel);
          expect(otherModelResponse).toBeUndefined();
        });
      });
    });

    describe('Delete Item', () => {
      test('should return error when the item is not found', async () => {
        await expect(TestModel.deleteItem({
          pk: 'delete-1',
          sk: 'delete-2',
        })).rejects.toThrowError('The conditional request failed');
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.batchWrite({
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
          }).promise();
        });

        test('It should return the deleted item attributes', async () => {
          const response = await TestModel.deleteItem({
            pk: 'delete-1',
            sk: 'delete-2',
          });

          expect(response).toEqual({
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
          })).rejects.toThrowError('The conditional request failed');

          await expect(TestModel.deleteItem({
            pk: 'delete-3',
            sk: 'delete-4',
          })).resolves.not.toThrow('The conditional request failed');
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
          await dynamodbDocumentClient.batchWrite({
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
            },
          }).promise();
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

        test('It should not load if using the wrong model', async () => {
          const instance = new OtherModel({
            pk: 'load-1',
            sk: 'load-2',
          });

          await expect(instance.load).rejects.toThrowError('Record not found.');
        });
      });
    });

    describe('Instance Create', () => {
      test('It should throw an error if nothing is set', async () => {
        const instance = new TestModel();

        await expect(instance.create()).rejects.toThrowError('You cannot save an instance with no attributes at all.');
      });

      describe('When there is some data registered', () => {
        let now;

        beforeEach(async () => {
          jest.useFakeTimers();

          now = new Date().toISOString();

          await dynamodbDocumentClient.batchWrite({
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
          }).promise();

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

          let instance = await TestModel.getItem({
            pk: 'create-1',
            sk: 'create-3',
          });

          expect(instance).toBeUndefined();

          instance = new TestModel({
            pk: 'create-1',
            sk: 'create-3',
          });

          expect(instance.createdAt).toBeUndefined();
          expect(instance.updatedAt).toBeUndefined();

          await instance.create();

          scanResult = await TestModel.scanAll(scanOptions);
          existingItems = scanResult.items;

          expect(existingItems).toHaveLength(2);

          expect(instance.pk).toEqual('create-1');
          expect(instance.sk).toEqual('create-3');
          expect(instance.createdAt).not.toBeUndefined();
          expect(instance.updatedAt).not.toBeUndefined();

          const response = await dynamodbDocumentClient.get({
            TableName: tableName,
            Key: {
              pk: 'TestModel-create-1',
              sk: 'TestModel-create-3',
            },
          }).promise();

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

        await expect(instance.update()).rejects.toThrowError('You cannot save an instance with no attributes at all.');
      });

      describe('When there is some data registered', () => {
        let now;
        beforeEach(async () => {
          now = new Date().toISOString();
          await dynamodbDocumentClient.batchWrite({
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
          }).promise();
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
          if (instance == null) return;

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
          if (newGetInstance == null) return;

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

          let instance = await TestModel.getItem({
            pk: 'update-1',
            sk: 'update-3',
          });

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
      await dynamodbDocumentClient.batchWrite({
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
      }).promise();
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
});
