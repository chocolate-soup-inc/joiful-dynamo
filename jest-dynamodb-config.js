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
      }, {
        AttributeName: '_entityName',
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
      }, {
        IndexName: 'byEntityName',
        KeySchema: [{
          AttributeName: '_entityName',
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
      }, {
        AttributeName: '_fk',
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
      },{
        IndexName: 'byFK',
        KeySchema: [{
          AttributeName: '_fk',
          KeyType: 'HASH',
        }],
        Projection: {
          ProjectionType: 'ALL',
        },
      }],
    },
    {
      TableName: 'test-only-pk',
      KeySchema: [{
        AttributeName: 'pk',
        KeyType: 'HASH',
      }],
      AttributeDefinitions: [{
        AttributeName: 'pk',
        AttributeType: 'S',
      }],
      BillingMode: 'PAY_PER_REQUEST',
    },
    {
      TableName: 'test-foreign-sk',
      KeySchema: [{
        AttributeName: 'pk',
        KeyType: 'HASH',
      }, {
        AttributeName: '_fk',
        KeyType: 'RANGE',
      }],
      AttributeDefinitions: [{
        AttributeName: 'pk',
        AttributeType: 'S',
      }, {
        AttributeName: '_fk',
        AttributeType: 'S',
      }],
      BillingMode: 'PAY_PER_REQUEST',
    },
  ],
};