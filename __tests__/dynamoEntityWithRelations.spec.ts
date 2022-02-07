/* eslint-disable no-await-in-loop */
import { Entity } from '../src/lib/Entity';
import {
  dynamodbDocumentClient, hasOne, prop, table,
} from '../src/lib/Decorators';

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
class ParentModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @prop({ secondaryKey: true })
  sk: string;

  @prop()
  name: string;

  @hasOne(ChildModel, { nestedObject: false, foreignKey: '_fk' })
  child: ChildModel;
}

describe('Dynamo Entity Relations', () => {
  afterEach(async () => {
    const {
      items: parentItems,
    } = await ParentModel.scanAll();

    for (const parentItem of parentItems) {
      await ParentModel.deleteItem({
        pk: parentItem.pk,
        sk: parentItem.sk,
      });
    }

    const {
      items: childItems,
    } = await ChildModel.scanAll();

    for (const childItem of childItems) {
      await ChildModel.deleteItem({
        pk: childItem.pk,
        sk: childItem.sk,
      });
    }
  });

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
    expect(parentItems[0]._fk).toBeUndefined();
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
    expect(childItems[0]._fk).toEqual('ParentModel-1');
    expect(parentItems[0]._fk).toEqual('ParentModel-1');
  });

  describe('When the parent exists', () => {
    beforeEach(async () => {
      await dynamodbDocumentClient.batchWrite({
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
      }).promise();
    });

    test('When there the parent exists, but the child does not is correctly updates the parent and creates the child with the create method.', async () => {
      let {
        items: parentItems,
      } = await ParentModel.scanAll();

      let {
        items: childItems,
      } = await ChildModel.scanAll();

      expect(parentItems).toHaveLength(1);
      expect(childItems).toHaveLength(0);
      expect(parentItems[0].name).toEqual('Old Name');
      expect(parentItems[0]._fk).toBeUndefined();

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
      expect(childItems[0]._fk).toEqual('ParentModel-1');
      expect(parentItems[0]._fk).toEqual('ParentModel-1');
    });

    test('When there the parent exists, but the child does not is correctly updates the parent and creates the child with the update method.', async () => {
      let {
        items: parentItems,
      } = await ParentModel.scanAll();

      let {
        items: childItems,
      } = await ChildModel.scanAll();

      expect(parentItems).toHaveLength(1);
      expect(childItems).toHaveLength(0);
      expect(parentItems[0].name).toEqual('Old Name');
      expect(parentItems[0]._fk).toBeUndefined();

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
      expect(childItems[0]._fk).toEqual('ParentModel-1');
      expect(parentItems[0]._fk).toEqual('ParentModel-1');
    });

    describe('When the child exists', () => {
      beforeEach(async () => {
        await dynamodbDocumentClient.batchWrite({
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
        }).promise();
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
        expect(parentItems[0]._fk).toBeUndefined();

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
        expect(childItems[0]._fk).toEqual('ParentModel-1');
        expect(parentItems[0]._fk).toEqual('ParentModel-1');
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
        expect(parentItems[0]._fk).toBeUndefined();

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
        expect(childItems[0]._fk).toEqual('ParentModel-1');
        expect(parentItems[0]._fk).toEqual('ParentModel-1');
      });
    });
  });
});
