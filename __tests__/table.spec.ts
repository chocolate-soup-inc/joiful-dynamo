import AWS from 'aws-sdk';
import { Entity } from '../src/lib/classes/Entity';
import { table } from '../src/lib/decorators/table';

const tableName = 'test-table';

@table(tableName)
class TestModel extends Entity {}

describe('Table Decorator', () => {
  it('sets the tableName correctly in the instance', () => {
    const instance = new TestModel();
    expect(instance.tableName).toEqual(tableName);
  });

  it('sets the tableName correctly in the static method', () => {
    expect(TestModel.tableName).toEqual(tableName);
  });

  it('sets the dynamodb document client', () => {
    const instance = new TestModel();
    expect(instance.dynamodb).toBeInstanceOf(AWS.DynamoDB.DocumentClient);
  });

  it('sets the dynamodb document client in the static class', () => {
    expect(TestModel.dynamodb).toBeInstanceOf(AWS.DynamoDB.DocumentClient);
  });
});
