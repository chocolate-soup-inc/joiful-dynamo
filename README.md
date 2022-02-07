# Joiful Dynamo

## What this package does?

Joiful-Dynamo uses [Typescript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) to easily let developers to manage data models. This IS NOT a complete ORM, but a facilitator to make the experience of using [AWS DynamoDB]((https://aws.amazon.com/dynamodb)) easier and with less code repetition. This packages was developed with the [Single Table Adjacency List Design Pattern](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-adjacency-graphs.html) in mind.

The decorators includes:
 - [validate](https://chocolate-soup-inc.github.io/joiful-dynamo/modules/Decorators.html#validate) that relies on [Joi](https://joi.dev/) for a very customizable validation experience
 - [aliases](https://chocolate-soup-inc.github.io/joiful-dynamo/modules/Decorators.html#aliases) and [aliasTo](https://chocolate-soup-inc.github.io/joiful-dynamo/modules/Decorators.html#aliasTo) for creating property aliases without duplicating data and columns in the database.
 - [compositeKey](https://chocolate-soup-inc.github.io/joiful-dynamo/modules/Decorators.html#compositeKey) for creating [well designed sort keys](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-sort-keys.html) that helps filtering and sorting data.
 - [hasOne](https://chocolate-soup-inc.github.io/joiful-dynamo/modules/Decorators.html#hasOne) and [hasMany](https://chocolate-soup-inc.github.io/joiful-dynamo/modules/Decorators.html#hasMany) for creating data relations. Relations can be nested data (saving the data as a map inside the parent record) or totally separate records in the same dynamodb table.

See the full docs at [https://chocolate-soup-inc.github.io/joiful-dynamo/](https://chocolate-soup-inc.github.io/joiful-dynamo/).

## Why

Using [AWS DynamoDB](https://aws.amazon.com/dynamodb) is always a very challenging and verbose experience. Some packages achieved very good experiences when interacting with data, like [TypeORM](https://typeorm.io/#/) and [Sequelize](https://sequelize.org/) but they don't connect to DynamoDB. Some dynamodb libraries are awesome (like [DynamoDB Toolbox](https://github.com/jeremydaly/dynamodb-toolbox)) but misses some basic functionality like data validation and transforming. Also, if you want to use a one table design it gets even harder to find complete solutions. So, joiful-dynamo connects the experience of using Joi as a validation library to a better experience with dynamodb.

As this library was architected with single table design in mind, if you want to use a multi table design, use it at your own risk.

## Installation and Basic Usage

Using npm:
```
npm i --save joiful-dynamodb
```

Using yarn:
```
yarn add joiful-dynamodb
```

```ts
import {
  Entity,
  aliases,
  aliasTo,
  props,
  table,
  validate,
} from 'joiful-dynamo';

import * as Joi from 'joi';

@table('test-table')
class TestModel extends Entity {
  @prop({ primaryKey: true });
  @validate(Joi.string().required())
  @aliases(['primary'])
  pk: string;

  @prop()
  @validate(Joi.string().trim().required())
  name: string;

  @prop()
  @aliasTo('name')
  fullName: string;

  @prop({ createdAt: true })
  _createdAt: string;

  @prop({ updatedAt: true })
  _updatedAt: string;
}

const instance = new TestModel({
  pk: '1',
  fullName: '   test name  ',
  extraAttribute: 'extra',
});

const createValid = async () => {
  await instance.create();
  /*
    Data saved to DB:
    {
      pk: 'TestModel-1',
      name: 'test name',
      extraAttribute: 'extra',
      _createdAt: '2022-02-07T22:43:30.344Z',
      _updatedAt: '2022-02-07T22:43:30.344Z',
      _entityName: 'TestModel',
    }
  */
};

createValid();


const invalidInstance = new TestMode({
  name: 'Name',
});

console.log(invalidInstance.valid) // false

invalidInstance.create() // Throws error.
```

For more examples and full docs, access [https://chocolate-soup-inc.github.io/joiful-dynamo/](https://chocolate-soup-inc.github.io/joiful-dynamo/).

## Additional References
- [AWS SDK DocumentClient Reference](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html)
- [Best Practices for DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single Table Adjacency List Design Pattern](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-adjacency-graphs.html)
## Contributions and Feedback

Contributions, ideas and bug reports are welcome and greatly appreciated. Please add [issues](https://github.com/chocolate-soup-inc/joiful-dynamo/issues) for suggestions and bug reports or create a pull request.