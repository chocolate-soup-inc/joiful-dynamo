import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Entity } from '../src/lib/Entity';
import { table } from '../src/lib/decorators/methods/table';

const tableName = 'test-table';

@table(tableName)
class TestModel extends Entity {
  public get _dynamodb() { return super._dynamodb; }

  public static get _dynamodb() { return super._dynamodb; }

  public get _tableName() { return super._tableName; }

  public static get _tableName() { return super._tableName; }
}

describe('Table Decorator', () => {
  it('sets the tableName correctly in the instance', () => {
    const instance = new TestModel();
    expect(instance._tableName).toEqual(tableName);
  });

  it('correctly lets the user override the tableName with the setTableName method', () => {
    const instance = new TestModel();
    expect(instance._tableName).toEqual(tableName);
  });

  it('sets the tableName correctly in the static method', () => {
    expect(TestModel._tableName).toEqual(tableName);
  });

  it('sets the dynamodb document client', () => {
    const instance = new TestModel();
    expect(instance._dynamodb).toBeInstanceOf(DynamoDBDocumentClient);
  });

  it('sets the dynamodb document client in the static class', () => {
    expect(TestModel._dynamodb).toBeInstanceOf(DynamoDBDocumentClient);
  });
});
