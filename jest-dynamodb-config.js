module.exports = {
  port: 4567,
  tables: [
    {
      TableName: 'test-table',
      KeySchema: [{
        AttributeName: 'pk',
        KeyType: 'HASH',
      },{
        AttributeName: 'sk',
        KeyType: 'RANGE',
      }],
      AttributeDefinitions: [{
        AttributeName: 'pk',
        AttributeType: 'S',
      }, {
        AttributeName: 'sk',
        AttributeType: 'S',
      }],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [{
        IndexName: 'bySK',
        KeySchema: [{
          AttributeName: 'sk',
          KeyType: 'HASH',
        }],
        Projection: {
          ProjectionType: 'ALL',
        },
      }],
    },
    {
      TableName: 'test-relations-table',
      KeySchema: [{
        AttributeName: 'pk',
        KeyType: 'HASH',
      },{
        AttributeName: 'sk',
        KeyType: 'RANGE',
      }],
      AttributeDefinitions: [{
        AttributeName: 'pk',
        AttributeType: 'S',
      }, {
        AttributeName: 'sk',
        AttributeType: 'S',
      }],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [{
        IndexName: 'bySK',
        KeySchema: [{
          AttributeName: 'sk',
          KeyType: 'HASH',
        }],
        Projection: {
          ProjectionType: 'ALL',
        },
      }],
    },
  ],
};