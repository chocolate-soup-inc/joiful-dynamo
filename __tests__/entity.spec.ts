import { DynamoPaginator } from '../src/lib/classes/DynamoPaginator';
import { Entity } from '../src/lib/classes/Entity';
import { prop } from '../src/lib/decorators/prop';
import { dynamodbDocumentClient, table } from '../src/lib/decorators/table';

jest.setTimeout(30000);

const tableName = 'test-table';

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

describe('Entity', () => {
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
        beforeAll(async () => {
          await dynamodbDocumentClient.batchWrite({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'scan-1',
                    sk: 'scan-2',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'scan-3',
                    sk: 'scan-4',
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
          await expect(async () => {
            await response.next();
          }).rejects.toThrowError('All pages were already scanned');
        });
      });
    });

    describe('Query', () => {
      const queryOptions = {
        IndexName: 'bySK',
        KeyConditionExpression: 'sk = :v',
        ExpressionAttributeValues: {
          ':v': 'query-2',
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
        beforeAll(async () => {
          await dynamodbDocumentClient.batchWrite({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'query-1',
                    sk: 'query-2',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'query-3',
                    sk: 'query-2',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'query-4',
                    sk: 'query-5',
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
          await expect(async () => {
            await response.next();
          }).rejects.toThrowError('All pages were already scanned');
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
        beforeAll(async () => {
          await dynamodbDocumentClient.batchWrite({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'get-1',
                    sk: 'get-2',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'get-3',
                    sk: 'get-4',
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
          await expect(async () => {
            await TestModel.getItem({
              pk: 'get-1',
            });
          }).rejects.toThrowError('The number of conditions on the keys is invalid');
        });
      });
    });

    describe('Delete Item', () => {
      test('should return error when the item is not found', async () => {
        await expect(async () => {
          await TestModel.deleteItem({
            pk: 'delete-1',
            sk: 'delete-2',
          });
        }).rejects.toThrowError('Item does not exist.');
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.batchWrite({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'delete-1',
                    sk: 'delete-2',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'delete-3',
                    sk: 'delete-4',
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
            pk: 'delete-1',
            sk: 'delete-2',
          });
        });

        test('It should effectivelly delete the item in the database', async () => {
          const scanOptions = {
            FilterExpression: 'begins_with(pk, :v)',
            ExpressionAttributeValues: {
              ':v': 'delete',
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
      });
    });

    describe('Instance Load', () => {
      test('It should throw an error if nothing is found', async () => {
        const instance = new TestModel({
          pk: 'load-1',
          sk: 'load-2',
        });

        await expect(() => instance.load()).rejects.toThrowError('Record not found.');
      });

      describe('When there is some data registered', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.batchWrite({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'load-1',
                    sk: 'load-2',
                    extraProp: 'database-extra-1',
                  },
                },
              }, {
                PutRequest: {
                  Item: {
                    pk: 'load-3',
                    sk: 'load-4',
                    extraProp: 'database-extra-2',
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
      });
    });

    describe('Instance Create', () => {
      test('It should throw an error if nothing is set', async () => {
        const instance = new TestModel();

        await expect(() => instance.create()).rejects.toThrowError('One of the required keys was not given a value');
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
                    pk: 'create-1',
                    sk: 'create-2',
                    createdAt: now,
                    updatedAt: now,
                    extraAttribute: 1,
                  },
                },
              }],
            },
          }).promise();
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
          const scanOptions = {
            FilterExpression: 'begins_with(pk, :v)',
            ExpressionAttributeValues: {
              ':v': 'create',
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
        });
      });
    });

    describe('Instance Update', () => {
      test('It should throw an error if nothing is set', async () => {
        const instance = new TestModel();

        await expect(() => instance.update()).rejects.toThrowError('You cannot save an instance with no attributes at all.');
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
                    pk: 'update-1',
                    sk: 'update-2',
                    createdAt: now,
                    updatedAt: now,
                    extraAttribute: 1,
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
              ':v': 'update',
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
              ':v': 'update',
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
});
