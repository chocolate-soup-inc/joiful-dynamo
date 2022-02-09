import AWS from 'aws-sdk';
import { Entity } from '../src/lib/Entity';
import { table } from '../src/lib/Decorators';

const tableName = 'test-table';

@table(tableName)
class TestModel extends Entity {}

describe('Table Decorator', () => {
  it('sets the tableName correctly in the instance', () => {
    const instance = new TestModel();
    expect(instance._tableName).toEqual(tableName);
  });

  it('sets the tableName correctly in the static method', () => {
    expect(TestModel._tableName).toEqual(tableName);
  });

  it('sets the dynamodb document client', () => {
    const instance = new TestModel();
    expect(instance._dynamodb).toBeInstanceOf(AWS.DynamoDB.DocumentClient);
  });

  it('sets the dynamodb document client in the static class', () => {
    expect(TestModel._dynamodb).toBeInstanceOf(AWS.DynamoDB.DocumentClient);
  });
});
