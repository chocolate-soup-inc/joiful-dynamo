/* eslint-disable no-await-in-loop */
import { ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { prop } from '../src/lib/decorators/methods/props';
import { hasMany, hasOne } from '../src/lib/decorators/methods/relations';
import { dynamodbDocumentClient, table } from '../src/lib/decorators/methods/table';
import { DynamoEntity as Entity } from '../src/lib/DynamoEntity';

const tableName = 'test-relations-table';

@table(tableName)
class ChildModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop()
  name: string;

  @prop()
  _fk: string;
}

@table(tableName)
class ChildModel2 extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop()
  name: string;

  @prop()
  _fk: string;
}

@table(tableName)
class ParentModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop()
  name: string;

  @hasOne(ChildModel, {
    nestedObject: false,
    foreignKey: '_fk',
    indexName: 'byFK',
    // parentPropertyOnChild: 'parent1',
  })
  child: ChildModel;

  @hasMany(ChildModel, {
    nestedObject: false,
    foreignKey: '_fk',
    indexName: 'byFK',
    // parentPropertyOnChild: 'parent2',
  })
  children: ChildModel[];

  @hasMany(ChildModel2, {
    nestedObject: false,
    foreignKey: '_fk',
    indexName: 'byFK',
    // parentPropertyOnChild: 'parent',
  })
  children2: ChildModel2[];
}

describe('Dynamo Entity Relations', () => {
  afterEach(async () => {
    for (const Model of [ParentModel, ChildModel, ChildModel2]) {
      const { items } = await Model.scanAll();
      await Promise.all(items.map((item) => item.delete()));
    }
  });

  describe('hasOne', () => {
    test('When the child is not present, only the parent is added to the database', async () => {
      let {
        items: parentItems,
      } = await ParentModel.scanAll();

      let {
        items: childItems,
      } = await ChildModel.scanAll();

      expect(parentItems).toHaveLength(0);
      expect(childItems).toHaveLength(0);

      const model = new ParentModel({ pk: '1', sk: '1', name: 'Test Parent 1' });
      await model.create();

      ({
        items: parentItems,
      } = await ParentModel.scanAll());

      ({
        items: childItems,
      } = await ChildModel.scanAll());

      expect(parentItems).toHaveLength(1);
      expect(childItems).toHaveLength(0);
      expect(parentItems[0]._fk).toEqual('1');
    });

    test('When the child is present, both items are added to the database', async () => {
      let {
        items: parentItems,
      } = await ParentModel.scanAll();

      let {
        items: childItems,
      } = await ChildModel.scanAll();

      expect(parentItems).toHaveLength(0);
      expect(childItems).toHaveLength(0);

      const model = new ParentModel({
        pk: '1',
        sk: '1',
        name: 'Test Parent 1',
        child: {
          pk: '2',
          sk: '2',
        },
      });

      await model.create();

      ({
        items: parentItems,
      } = await ParentModel.scanAll());

      ({
        items: childItems,
      } = await ChildModel.scanAll());

      expect(parentItems).toHaveLength(1);
      expect(childItems).toHaveLength(1);
      expect(childItems[0]._fk).toEqual('1');
      expect(parentItems[0]._fk).toEqual('1');
    });

    describe('When the parent exists', () => {
      beforeEach(async () => {
        await dynamodbDocumentClient.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: [{
              PutRequest: {
                Item: {
                  pk: 'ParentModel-1',
                  sk: 'ParentModel-1',
                  _entityName: 'ParentModel',
                  name: 'Old Name',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              },
            }],
          },
        }));
      });

      test('When the parent exists, but the child does not, it correctly updates the parent and creates the child with the create method and the foreign keys.', async () => {
        let {
          Items: scanItems,
        } = await dynamodbDocumentClient.send(new ScanCommand({
          TableName: tableName,
        }));

        expect(scanItems).toHaveLength(1);
        expect(scanItems?.[0]._fk).toBeUndefined();
        expect(scanItems?.[0].pk).toEqual('ParentModel-1');

        let {
          items: parentItems,
        } = await ParentModel.scanAll();

        let {
          items: childItems,
        } = await ChildModel.scanAll();

        expect(parentItems).toHaveLength(1);
        expect(childItems).toHaveLength(0);
        expect(parentItems[0].name).toEqual('Old Name');
        expect(parentItems[0]._fk).toEqual('1');

        const model = new ParentModel({
          pk: '1',
          sk: '1',
          child: {
            pk: '2',
            sk: '2',
          },
        });

        await model.create();

        ({
          Items: scanItems,
        } = await dynamodbDocumentClient.send(new ScanCommand({
          TableName: tableName,
        })));

        expect(scanItems).toHaveLength(2);
        expect(scanItems?.[0]._entityName).toEqual('ParentModel');
        expect(scanItems?.[0]._fk).toEqual('ParentModel-1');
        expect(scanItems?.[0].pk).toEqual('ParentModel-1');

        ({
          items: parentItems,
        } = await ParentModel.scanAll());

        ({
          items: childItems,
        } = await ChildModel.scanAll());

        expect(parentItems).toHaveLength(1);
        expect(childItems).toHaveLength(1);

        expect(parentItems[0].name).toBeUndefined();
        expect(childItems[0]._fk).toEqual('1');
        expect(parentItems[0]._fk).toEqual('1');
      });

      test('When there the parent exists, but the child does not it correctly updates the parent and creates the child with the update method.', async () => {
        let {
          items: parentItems,
        } = await ParentModel.scanAll();

        let {
          items: childItems,
        } = await ChildModel.scanAll();

        expect(parentItems).toHaveLength(1);
        expect(childItems).toHaveLength(0);
        expect(parentItems[0].name).toEqual('Old Name');
        expect(parentItems[0]._fk).toEqual('1');

        const model = new ParentModel({
          pk: '1',
          sk: '1',
          child: {
            pk: '2',
            sk: '2',
          },
        });

        await model.update();

        ({
          items: parentItems,
        } = await ParentModel.scanAll());

        ({
          items: childItems,
        } = await ChildModel.scanAll());

        expect(parentItems).toHaveLength(1);
        expect(childItems).toHaveLength(1);

        expect(parentItems[0].name).toEqual('Old Name');
        expect(childItems[0]._fk).toEqual('1');
        expect(parentItems[0]._fk).toEqual('1');
      });

      describe('When the child exists', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'ChildModel-2',
                    sk: 'ChildModel-2',
                    _entityName: 'ChildModel',
                    name: 'Old Child Name',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                },
              }],
            },
          }));
        });

        test('When both the parent and the child exist, it correctly overrides the parent in the create but only updates the children in the create method.', async () => {
          let {
            items: parentItems,
          } = await ParentModel.scanAll();

          let {
            items: childItems,
          } = await ChildModel.scanAll();

          expect(parentItems).toHaveLength(1);
          expect(childItems).toHaveLength(1);
          expect(parentItems[0].name).toEqual('Old Name');
          expect(childItems[0].name).toEqual('Old Child Name');
          expect(childItems[0]._fk).toBeUndefined();
          expect(parentItems[0]._fk).toEqual('1');

          const model = new ParentModel({
            pk: '1',
            sk: '1',
            child: {
              pk: '2',
              sk: '2',
            },
          });

          await model.create();

          ({
            items: parentItems,
          } = await ParentModel.scanAll());

          ({
            items: childItems,
          } = await ChildModel.scanAll());

          expect(parentItems).toHaveLength(1);
          expect(childItems).toHaveLength(1);

          expect(parentItems[0].name).toBeUndefined();
          expect(childItems[0].name).toEqual('Old Child Name');
          expect(childItems[0]._fk).toEqual('1');
          expect(parentItems[0]._fk).toEqual('1');
        });

        test('When both the parent and the child exist, it correctly update both parent and child in the update method.', async () => {
          let {
            items: parentItems,
          } = await ParentModel.scanAll();

          let {
            items: childItems,
          } = await ChildModel.scanAll();

          expect(parentItems).toHaveLength(1);
          expect(childItems).toHaveLength(1);
          expect(parentItems[0].name).toEqual('Old Name');
          expect(childItems[0].name).toEqual('Old Child Name');
          expect(childItems[0]._fk).toBeUndefined();
          expect(parentItems[0]._fk).toEqual('1');

          const model = new ParentModel({
            pk: '1',
            sk: '1',
            child: {
              pk: '2',
              sk: '2',
            },
          });

          await model.update();

          ({
            items: parentItems,
          } = await ParentModel.scanAll());

          ({
            items: childItems,
          } = await ChildModel.scanAll());

          expect(parentItems).toHaveLength(1);
          expect(childItems).toHaveLength(1);

          expect(parentItems[0].name).toEqual('Old Name');
          expect(childItems[0].name).toEqual('Old Child Name');
          expect(childItems[0]._fk).toEqual('1');
          expect(parentItems[0]._fk).toEqual('1');
        });
      });
    });

    test('When the children are not present, only the parent is added to the database', async () => {
      let {
        items: parentItems,
      } = await ParentModel.scanAll();

      let {
        items: childItems,
      } = await ChildModel.scanAll();

      const model = new ParentModel({ pk: '1', sk: '1', name: 'Test Parent 1' });
      await model.create();

      ({
        items: parentItems,
      } = await ParentModel.scanAll());

      ({
        items: childItems,
      } = await ChildModel.scanAll());

      expect(parentItems).toHaveLength(1);
      expect(childItems).toHaveLength(0);
      expect(parentItems[0]._fk).toEqual('1');
    });
  });

  describe('hasMany', () => {
    test('When the children are present, all the items are added to the database', async () => {
      let {
        items: parentItems,
      } = await ParentModel.scanAll();

      let {
        items: childItems,
      } = await ChildModel.scanAll();

      expect(parentItems).toHaveLength(0);
      expect(childItems).toHaveLength(0);

      const model = new ParentModel({
        pk: '1',
        sk: '1',
        name: 'Parent with Children 1',
        children: [{
          pk: '2',
          sk: '2',
        }, {
          pk: '3',
          sk: '3',
        }],
      });

      await model.create();

      ({
        items: parentItems,
      } = await ParentModel.scanAll());

      ({
        items: childItems,
      } = await ChildModel.scanAll());

      childItems = childItems.sort((a: ChildModel, b: ChildModel) => a.pk.localeCompare(b.pk));

      expect(parentItems).toHaveLength(1);
      expect(childItems).toHaveLength(2);

      expect(parentItems[0].name).toEqual('Parent with Children 1');
      expect(parentItems[0]._fk).toEqual('1');
      expect(childItems[0]._fk).toEqual('1');
      expect(childItems[0].pk).toEqual('2');
      expect(childItems[1]._fk).toEqual('1');
      expect(childItems[1].pk).toEqual('3');
    });

    describe('When the parent exists', () => {
      beforeEach(async () => {
        await dynamodbDocumentClient.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: [{
              PutRequest: {
                Item: {
                  pk: 'ParentModel-1',
                  sk: 'ParentModel-1',
                  _entityName: 'ParentModel',
                  name: 'Old Name',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              },
            }],
          },
        }));
      });

      test('When there the parent exists, but the children do not, it correctly updates the parent and creates the children with the create method.', async () => {
        let {
          items: parentItems,
        } = await ParentModel.scanAll();

        let {
          items: childItems,
        } = await ChildModel.scanAll();

        expect(parentItems).toHaveLength(1);
        expect(parentItems[0].name).toEqual('Old Name');
        expect(parentItems[0]._fk).toEqual('1');

        expect(childItems).toHaveLength(0);

        const model = new ParentModel({
          pk: '1',
          sk: '1',
          children: [{
            pk: '2',
            sk: '2',
          }, {
            pk: '3',
            sk: '3',
          }],
        });

        await model.create();

        ({
          items: parentItems,
        } = await ParentModel.scanAll());

        ({
          items: childItems,
        } = await ChildModel.scanAll());

        childItems = childItems.sort((a: ChildModel, b: ChildModel) => a.pk.localeCompare(b.pk));

        expect(parentItems).toHaveLength(1);
        expect(childItems).toHaveLength(2);

        expect(parentItems[0].name).toBeUndefined();
        expect(parentItems[0]._fk).toEqual('1');
        expect(childItems[0]._fk).toEqual('1');
        expect(childItems[0].pk).toEqual('2');
        expect(childItems[1]._fk).toEqual('1');
        expect(childItems[1].pk).toEqual('3');
      });

      test('When there the parent exists, but the child does not it correctly updates the parent and creates the child with the update method.', async () => {
        let {
          items: parentItems,
        } = await ParentModel.scanAll();

        let {
          items: childItems,
        } = await ChildModel.scanAll();

        expect(parentItems).toHaveLength(1);
        expect(parentItems[0].name).toEqual('Old Name');
        expect(parentItems[0]._fk).toEqual('1');

        expect(childItems).toHaveLength(0);

        const model = new ParentModel({
          pk: '1',
          sk: '1',
          children: [{
            pk: '2',
            sk: '2',
          }, {
            pk: '3',
            sk: '3',
          }],
        });

        await model.update();

        ({
          items: parentItems,
        } = await ParentModel.scanAll());

        ({
          items: childItems,
        } = await ChildModel.scanAll());

        childItems = childItems.sort((a: ChildModel, b: ChildModel) => a.pk.localeCompare(b.pk));

        expect(parentItems).toHaveLength(1);
        expect(childItems).toHaveLength(2);

        expect(parentItems[0].name).toEqual('Old Name');
        expect(parentItems[0]._fk).toEqual('1');
        expect(childItems[0]._fk).toEqual('1');
        expect(childItems[0].pk).toEqual('2');
        expect(childItems[1]._fk).toEqual('1');
        expect(childItems[1].pk).toEqual('3');
      });

      describe('When a child exists', () => {
        beforeEach(async () => {
          await dynamodbDocumentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: [{
                PutRequest: {
                  Item: {
                    pk: 'ChildModel-2',
                    sk: 'ChildModel-2',
                    _entityName: 'ChildModel',
                    name: 'Old Child Name',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                },
              }],
            },
          }));
        });

        test('When the parent and some of the children exist, it correctly overrides the parent, only updates the existing children and creates the new children in the create method.', async () => {
          let {
            items: parentItems,
          } = await ParentModel.scanAll();

          let {
            items: childItems,
          } = await ChildModel.scanAll();

          expect(parentItems).toHaveLength(1);
          expect(childItems).toHaveLength(1);
          expect(parentItems[0].name).toEqual('Old Name');
          expect(childItems[0].name).toEqual('Old Child Name');
          expect(childItems[0]._fk).toBeUndefined();
          expect(parentItems[0]._fk).toEqual('1');

          const model = new ParentModel({
            pk: '1',
            sk: '1',
            children: [{
              pk: '2',
              sk: '2',
            }, {
              pk: '3',
              sk: '3',
            }],
          });

          await model.create();

          ({
            items: parentItems,
          } = await ParentModel.scanAll());

          ({
            items: childItems,
          } = await ChildModel.scanAll());

          childItems = childItems.sort((a: ChildModel, b: ChildModel) => a.pk.localeCompare(b.pk));

          expect(parentItems).toHaveLength(1);
          expect(childItems).toHaveLength(2);

          expect(parentItems[0].name).toBeUndefined();
          expect(parentItems[0]._fk).toEqual('1');

          expect(childItems[0].name).toEqual('Old Child Name');
          expect(childItems[0]._fk).toEqual('1');
          expect(childItems[0].pk).toEqual('2');

          expect(childItems[1].name).toBeUndefined();
          expect(childItems[1]._fk).toEqual('1');
          expect(childItems[1].pk).toEqual('3');
        });

        test('When the parent and some of the children exist, it correctly updates the parent, only updates the existing children and creates the new children in the create method.', async () => {
          let {
            items: parentItems,
          } = await ParentModel.scanAll();

          let {
            items: childItems,
          } = await ChildModel.scanAll();

          expect(parentItems).toHaveLength(1);
          expect(childItems).toHaveLength(1);
          expect(parentItems[0].name).toEqual('Old Name');
          expect(childItems[0].name).toEqual('Old Child Name');
          expect(childItems[0]._fk).toBeUndefined();
          expect(parentItems[0]._fk).toEqual('1');

          const model = new ParentModel({
            pk: '1',
            sk: '1',
            children: [{
              pk: '2',
              sk: '2',
            }, {
              pk: '3',
              sk: '3',
            }],
          });

          await model.update();

          ({
            items: parentItems,
          } = await ParentModel.scanAll());

          ({
            items: childItems,
          } = await ChildModel.scanAll());

          childItems = childItems.sort((a: ChildModel, b: ChildModel) => a.pk.localeCompare(b.pk));

          expect(parentItems).toHaveLength(1);
          expect(childItems).toHaveLength(2);

          expect(parentItems[0].name).toEqual('Old Name');
          expect(parentItems[0]._fk).toEqual('1');

          expect(childItems[0].name).toEqual('Old Child Name');
          expect(childItems[0]._fk).toEqual('1');
          expect(childItems[0].pk).toEqual('2');

          expect(childItems[1].name).toBeUndefined();
          expect(childItems[1]._fk).toEqual('1');
          expect(childItems[1].pk).toEqual('3');
        });
      });
    });
  });

  describe('relation queries', () => {
    beforeEach(async () => {
      await dynamodbDocumentClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: [{
            PutRequest: {
              Item: {
                pk: 'ParentModel-1',
                sk: 'ParentModel-1',
                _entityName: 'ParentModel',
                _fk: 'ParentModel-1',
                name: 'Old Name',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          }, {
            PutRequest: {
              Item: {
                pk: 'ChildModel-2',
                sk: 'ChildModel-2',
                _entityName: 'ChildModel',
                _fk: 'ParentModel-1',
                name: 'Child Name',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          }],
        },
      }));
    });

    test('When getting the model and just load related later, it works correctly', async () => {
      const parent = await ParentModel.getItem({
        pk: '1',
        sk: '1',
      });

      if (parent == null) return;

      expect(parent.child.attributes).toStrictEqual({
        _fk: '1',
      });
      expect(parent.child.pk).toBeUndefined();
      expect(parent.children).toStrictEqual([]);

      await parent.loadWithRelated();

      expect(parent.child).toBeInstanceOf(ChildModel);
      expect(parent.child.pk).toEqual('2');
      expect(parent.child.sk).toEqual('2');

      expect(parent.children).toHaveLength(1);
      expect(parent.children[0]).toBeInstanceOf(ChildModel);
      expect(parent.children[0].pk).toEqual('2');
      expect(parent.children[0].sk).toEqual('2');
    });

    test('When getting the model including related, it correctly sets the related data', async () => {
      const parent = await ParentModel.getItemWithRelated({
        pk: '1',
        sk: '1',
      });

      if (parent == null) return;

      expect(parent.child).toBeInstanceOf(ChildModel);
      expect(parent.child.pk).toEqual('2');
      expect(parent.child.sk).toEqual('2');

      expect(parent.children).toHaveLength(1);
      expect(parent.children[0]).toBeInstanceOf(ChildModel);
      expect(parent.children[0].pk).toEqual('2');
      expect(parent.children[0].sk).toEqual('2');
    });

    // test('When querying with related records it return the records correctly', async () => {
    //   let {
    //     items,
    //   } = await ParentModel.queryWithChildrenRecords({
    //     IndexName: 'byFK',
    //     KeyConditionExpression: '#fk = :fk',
    //     ExpressionAttributeNames: { '#fk': '_fk' },
    //     ExpressionAttributeValues: { ':fk': 'ParentModel-1' },
    //   }, '_fk');

    //   expect(items).toHaveLength(2);
    //   items = items.sort((a, b) => a._entityName.localeCompare(b._entityName));

    //   expect(items[0]).toBeInstanceOf(ChildModel);
    //   expect(items[1]).toBeInstanceOf(ParentModel);

    //   // ALTHOUGH ITEMS WERE QUERIED, DATA WAS NOT SET IN THE PARENT MODEL.
    //   expect(items[1].children).toEqual([]);
    //   expect(items[1].child.pk).toBeUndefined();
    // });

    // test('When querying all with related records it returns the records correctly', async () => {
    //   let {
    //     items,
    //   } = await ParentModel.queryAllWithChildrenRecords({
    //     IndexName: 'byFK',
    //     KeyConditionExpression: '#fk = :fk',
    //     ExpressionAttributeNames: { '#fk': '_fk' },
    //     ExpressionAttributeValues: { ':fk': 'ParentModel-1' },
    //   }, '_fk');

    //   expect(items).toHaveLength(2);
    //   items = items.sort((a, b) => a._entityName.localeCompare(b._entityName));

    //   expect(items[0]).toBeInstanceOf(ChildModel);
    //   expect(items[1]).toBeInstanceOf(ParentModel);

    //   // ALTHOUGH ITEMS WERE QUERIED, DATA WAS NOT SET IN THE PARENT MODEL.
    //   expect(items[1].children).toEqual([]);
    //   expect(items[1].child.pk).toBeUndefined();
    // });

    // test('When querying the child with related records it returns the records correctly', async () => {
    //   let {
    //     items,
    //   } = await ChildModel.queryWithChildrenRecords({
    //     IndexName: 'byFK',
    //     KeyConditionExpression: '#fk = :fk',
    //     ExpressionAttributeNames: { '#fk': '_fk' },
    //     ExpressionAttributeValues: { ':fk': 'ParentModel-1' },
    //   }, '_fk');

    //   expect(items).toHaveLength(2);
    //   items = items.sort((a, b) => a._entityName.localeCompare(b._entityName));

    //   expect(items[0]).toBeInstanceOf(ChildModel);
    //   expect(items[1]).toBeInstanceOf(ParentModel);

    //   // ALTHOUGH ITEMS WERE QUERIED, DATA WAS NOT SET IN THE PARENT MODEL.
    //   expect(items[1].children).toEqual([]);
    //   expect(items[1].child.pk).toBeUndefined();
    // });

    // test('When querying all the child with related records it returns the records correctly', async () => {
    //   let {
    //     items,
    //   } = await ChildModel.queryAllWithChildrenRecords({
    //     IndexName: 'byFK',
    //     KeyConditionExpression: '#fk = :fk',
    //     ExpressionAttributeNames: { '#fk': '_fk' },
    //     ExpressionAttributeValues: { ':fk': 'ParentModel-1' },
    //   }, '_fk');

    //   expect(items).toHaveLength(2);
    //   items = items.sort((a, b) => a._entityName.localeCompare(b._entityName));

    //   expect(items[0]).toBeInstanceOf(ChildModel);
    //   expect(items[1]).toBeInstanceOf(ParentModel);

    //   // ALTHOUGH ITEMS WERE QUERIED, DATA WAS NOT SET IN THE PARENT MODEL.
    //   expect(items[1].children).toEqual([]);
    //   expect(items[1].child.pk).toBeUndefined();
    // });
  });

  describe('belongsTo', () => {
    beforeEach(async () => {
      await dynamodbDocumentClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: [{
            PutRequest: {
              Item: {
                pk: 'ParentModel-1',
                sk: 'ParentModel-1',
                _entityName: 'ParentModel',
                _fk: 'ParentModel-1',
                name: 'Old Name',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          }, {
            PutRequest: {
              Item: {
                pk: 'ChildModel-2',
                sk: 'ChildModel-2',
                _entityName: 'ChildModel',
                _fk: 'ParentModel-1',
                name: 'Old Child Name',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          }],
        },
      }));
    });

    test('It correctly set the relations when getting an item and asking to include relations from the parent', async () => {
      const parent = await ParentModel.getItemWithRelated({
        pk: '1',
        sk: '1',
      });

      expect(parent.child).toBeInstanceOf(ChildModel);
      expect(parent.children).toHaveLength(1);
      expect(parent.child.parents).toStrictEqual([parent]);
      expect(parent.children[0].parents).toStrictEqual([parent]);
    });

    // test('It correctly set the relations when getting an item and asking to include relations from the child', async () => {
    //   const child = await ChildModel.getItemWithRelated({
    //     pk: '2',
    //     sk: '2',
    //   });

    //   expect(child.parents).toHaveLength(1);
    //   expect(child.parents[0]).toBeInstanceOf(ParentModel);
    //   expect(child.parents[0]).toBeInstanceOf(ParentModel);
    //   expect(child.parents[0].child).toStrictEqual(child);
    //   expect(child.parents[0].children).toStrictEqual([]);
    //   expect(child.parents[0].child.pk).toBeUndefined();
    //   expect(child.parents[0].children).toStrictEqual([child]);
    // });
  });

  describe('deleteWithChildren', () => {
    describe('When there are children', () => {
      beforeEach(async () => {
        await dynamodbDocumentClient.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: [{
              PutRequest: {
                Item: {
                  pk: 'ParentModel-1',
                  sk: 'ParentModel-1',
                  _entityName: 'ParentModel',
                  _fk: 'ParentModel-1',
                  name: 'Old Name',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              },
            }, {
              PutRequest: {
                Item: {
                  pk: 'ChildModel-2',
                  sk: 'ChildModel-2',
                  _entityName: 'ChildModel',
                  _fk: 'ParentModel-1',
                  name: 'Child Model Name',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              },
            }, {
              PutRequest: {
                Item: {
                  pk: 'ChildModel2-2',
                  sk: 'ChildModel2-2',
                  _entityName: 'ChildModel2',
                  _fk: 'ParentModel-1',
                  name: 'Child Model 2 Name',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              },
            }],
          },
        }));
      });

      test('It should correctly delete all the entities with the delete all method', async () => {
        let { items: parentItems } = await ParentModel.scanAll();
        expect(parentItems).toHaveLength(1);

        let { items: childItems } = await ChildModel.scanAll();
        expect(childItems).toHaveLength(1);

        let { items: child2Items } = await ChildModel2.scanAll();
        expect(child2Items).toHaveLength(1);

        const parent = await ParentModel.getItemWithRelated({
          pk: '1',
          sk: '1',
        });

        expect(parent.child.name).toEqual('Child Model Name');
        expect(parent.children).toHaveLength(1);
        expect(parent.children[0].name).toEqual('Child Model Name');
        expect(parent.children2).toHaveLength(1);
        expect(parent.children2[0].name).toEqual('Child Model 2 Name');

        await parent.deleteWithChildren();

        ({ items: parentItems } = await ParentModel.scanAll());
        expect(parentItems).toHaveLength(0);

        ({ items: childItems } = await ChildModel.scanAll());
        expect(childItems).toHaveLength(0);

        ({ items: child2Items } = await ChildModel2.scanAll());
        expect(child2Items).toHaveLength(0);
      });

      test('It should correctly delete only the parent entity with the delete method', async () => {
        let { items: parentItems } = await ParentModel.scanAll();
        expect(parentItems).toHaveLength(1);

        let { items: childItems } = await ChildModel.scanAll();
        expect(childItems).toHaveLength(1);

        let { items: child2Items } = await ChildModel2.scanAll();
        expect(child2Items).toHaveLength(1);

        const parent = await ParentModel.getItemWithRelated({
          pk: '1',
          sk: '1',
        });

        expect(parent.child.name).toEqual('Child Model Name');
        expect(parent.children).toHaveLength(1);
        expect(parent.children[0].name).toEqual('Child Model Name');
        expect(parent.children2).toHaveLength(1);
        expect(parent.children2[0].name).toEqual('Child Model 2 Name');

        await parent.delete();

        ({ items: parentItems } = await ParentModel.scanAll());
        expect(parentItems).toHaveLength(0);

        ({ items: childItems } = await ChildModel.scanAll());
        expect(childItems).toHaveLength(1);

        ({ items: child2Items } = await ChildModel2.scanAll());
        expect(child2Items).toHaveLength(1);
      });
    });

    describe('When there is no children', () => {
      beforeEach(async () => {
        await dynamodbDocumentClient.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: [{
              PutRequest: {
                Item: {
                  pk: 'ParentModel-1',
                  sk: 'ParentModel-1',
                  _entityName: 'ParentModel',
                  _fk: 'ParentModel-1',
                  name: 'Old Name',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              },
            }],
          },
        }));
      });

      test('It should correctly delete all the entities with the delete all method', async () => {
        let { items: parentItems } = await ParentModel.scanAll();
        expect(parentItems).toHaveLength(1);

        let { items: childItems } = await ChildModel.scanAll();
        expect(childItems).toHaveLength(0);

        let { items: child2Items } = await ChildModel2.scanAll();
        expect(child2Items).toHaveLength(0);

        const parent = await ParentModel.getItemWithRelated({
          pk: '1',
          sk: '1',
        });

        expect(parent.children).toHaveLength(0);
        expect(parent.children2).toHaveLength(0);

        await parent.deleteWithChildren();

        ({ items: parentItems } = await ParentModel.scanAll());
        expect(parentItems).toHaveLength(0);

        ({ items: childItems } = await ChildModel.scanAll());
        expect(childItems).toHaveLength(0);

        ({ items: child2Items } = await ChildModel2.scanAll());
        expect(child2Items).toHaveLength(0);
      });

      test('It should correctly delete only the parent entity with the delete method', async () => {
        let { items: parentItems } = await ParentModel.scanAll();
        expect(parentItems).toHaveLength(1);

        let { items: childItems } = await ChildModel.scanAll();
        expect(childItems).toHaveLength(0);

        let { items: child2Items } = await ChildModel2.scanAll();
        expect(child2Items).toHaveLength(0);

        const parent = await ParentModel.getItemWithRelated({
          pk: '1',
          sk: '1',
        });

        expect(parent.children).toHaveLength(0);
        expect(parent.children2).toHaveLength(0);

        await parent.delete();

        ({ items: parentItems } = await ParentModel.scanAll());
        expect(parentItems).toHaveLength(0);

        ({ items: childItems } = await ChildModel.scanAll());
        expect(childItems).toHaveLength(0);

        ({ items: child2Items } = await ChildModel2.scanAll());
        expect(child2Items).toHaveLength(0);
      });
    });
  });

  test('children without parent relations', async () => {
    let { items: children } = await ChildModel.scanAll();
    expect(children).toHaveLength(0);

    const child = new ChildModel({ sk: '1', pk: '2', name: 'Child Model Name' });
    child.update();

    ({ items: children } = await ChildModel.scanAll());
    expect(children).toHaveLength(1);
  });
});
