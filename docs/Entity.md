# Class: Entity

## Hierarchy

- `BasicEntity`

  ↳ **`Entity`**

## Table of contents

### Constructors

- [constructor](../wiki/Entity#constructor)

### Properties

- [\_attributes](../wiki/Entity#_attributes)
- [\_error](../wiki/Entity#_error)

### Accessors

- [\_createdAtKey](../wiki/Entity#_createdatkey)
- [\_dynamodb](../wiki/Entity#_dynamodb)
- [\_entityName](../wiki/Entity#_entityname)
- [\_primaryKey](../wiki/Entity#_primarykey)
- [\_secondaryKey](../wiki/Entity#_secondarykey)
- [\_tableName](../wiki/Entity#_tablename)
- [\_updatedAtKey](../wiki/Entity#_updatedatkey)
- [attributes](../wiki/Entity#attributes)
- [createAttributes](../wiki/Entity#createattributes)
- [dynamoAttributes](../wiki/Entity#dynamoattributes)
- [enumerableAttributes](../wiki/Entity#enumerableattributes)
- [error](../wiki/Entity#error)
- [finalAttributes](../wiki/Entity#finalattributes)
- [finalDynamoDBKey](../wiki/Entity#finaldynamodbkey)
- [primaryKeyDynamoDBValue](../wiki/Entity#primarykeydynamodbvalue)
- [relatedNotNestedModels](../wiki/Entity#relatednotnestedmodels)
- [relationsUpdateAttributes](../wiki/Entity#relationsupdateattributes)
- [secondaryKeyDynamoDBValue](../wiki/Entity#secondarykeydynamodbvalue)
- [transformedAttributes](../wiki/Entity#transformedattributes)
- [updateAttributes](../wiki/Entity#updateattributes)
- [valid](../wiki/Entity#valid)
- [validatedAttributes](../wiki/Entity#validatedattributes)
- [\_createdAtKey](../wiki/Entity#_createdatkey)
- [\_dynamodb](../wiki/Entity#_dynamodb)
- [\_entityName](../wiki/Entity#_entityname)
- [\_primaryKey](../wiki/Entity#_primarykey)
- [\_secondaryKey](../wiki/Entity#_secondarykey)
- [\_tableName](../wiki/Entity#_tablename)
- [\_updatedAtKey](../wiki/Entity#_updatedatkey)

### Methods

- [create](../wiki/Entity#create)
- [getAttribute](../wiki/Entity#getattribute)
- [load](../wiki/Entity#load)
- [parseDynamoAttributes](../wiki/Entity#parsedynamoattributes)
- [removeEntityFromKey](../wiki/Entity#removeentityfromkey)
- [setAttribute](../wiki/Entity#setattribute)
- [setEntityOnKey](../wiki/Entity#setentityonkey)
- [update](../wiki/Entity#update)
- [validate](../wiki/Entity#validate)
- [validateRelatedModels](../wiki/Entity#validaterelatedmodels)
- [\_query](../wiki/Entity#_query)
- [\_scan](../wiki/Entity#_scan)
- [createPaginator](../wiki/Entity#createpaginator)
- [deleteItem](../wiki/Entity#deleteitem)
- [getItem](../wiki/Entity#getitem)
- [initialize](../wiki/Entity#initialize)
- [prepareEntityAttributeNameAndValue](../wiki/Entity#prepareentityattributenameandvalue)
- [prepareEntityExpression](../wiki/Entity#prepareentityexpression)
- [prepareOptsForDelete](../wiki/Entity#prepareoptsfordelete)
- [prepareOptsForScanAndQuery](../wiki/Entity#prepareoptsforscanandquery)
- [query](../wiki/Entity#query)
- [queryAll](../wiki/Entity#queryall)
- [removeEntityFromKey](../wiki/Entity#removeentityfromkey)
- [scan](../wiki/Entity#scan)
- [scanAll](../wiki/Entity#scanall)
- [setEntityOnKey](../wiki/Entity#setentityonkey)
- [transformAttributes](../wiki/Entity#transformattributes)
- [validate](../wiki/Entity#validate)
- [validateAttributes](../wiki/Entity#validateattributes)

## Constructors

### constructor

• **new Entity**(`item?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `item?` | `Record`<`string`, `any`\> |

#### Overrides

BasicEntity.constructor

#### Defined in

[src/lib/classes/DynamoEntity.ts:19](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L19)

## Properties

### \_attributes

• `Protected` **\_attributes**: `Record`<`string`, `any`\> = `{}`

#### Inherited from

BasicEntity.\_attributes

#### Defined in

[src/lib/classes/BasicEntity.ts:18](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L18)

___

### \_error

• `Protected` **\_error**: `undefined` \| `ValidationError`

#### Inherited from

BasicEntity.\_error

#### Defined in

[src/lib/classes/BasicEntity.ts:104](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L104)

## Accessors

### \_createdAtKey

• `get` **_createdAtKey**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:51](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L51)

___

### \_dynamodb

• `get` **_dynamodb**(): `DocumentClient`

#### Returns

`DocumentClient`

#### Defined in

[src/lib/classes/DynamoEntity.ts:31](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L31)

___

### \_entityName

• `get` **_entityName**(): `string`

#### Returns

`string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:39](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L39)

___

### \_primaryKey

• `get` **_primaryKey**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:43](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L43)

___

### \_secondaryKey

• `get` **_secondaryKey**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:47](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L47)

___

### \_tableName

• `get` **_tableName**(): `string`

#### Returns

`string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:35](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L35)

___

### \_updatedAtKey

• `get` **_updatedAtKey**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:55](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L55)

___

### attributes

• `get` **attributes**(): `Record`<`string`, `any`\>

#### Returns

`Record`<`string`, `any`\>

#### Inherited from

BasicEntity.attributes

#### Defined in

[src/lib/classes/BasicEntity.ts:31](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L31)

• `set` **attributes**(`attributes`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`<`string`, `any`\> |

#### Returns

`void`

#### Inherited from

BasicEntity.attributes

#### Defined in

[src/lib/classes/BasicEntity.ts:35](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L35)

___

### createAttributes

• `get` **createAttributes**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `Item` | `Record`<`string`, `any`\> |
| `TableName` | `string` |

#### Defined in

[src/lib/classes/DynamoEntity.ts:359](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L359)

___

### dynamoAttributes

• `get` **dynamoAttributes**(): `Record`<`string`, `any`\>

#### Returns

`Record`<`string`, `any`\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:259](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L259)

___

### enumerableAttributes

• `get` **enumerableAttributes**(): `Record`<`string`, `any`\>

#### Returns

`Record`<`string`, `any`\>

#### Inherited from

BasicEntity.enumerableAttributes

#### Defined in

[src/lib/classes/BasicEntity.ts:61](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L61)

___

### error

• `get` **error**(): `undefined` \| `ValidationError`

#### Returns

`undefined` \| `ValidationError`

#### Inherited from

BasicEntity.error

#### Defined in

[src/lib/classes/BasicEntity.ts:162](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L162)

___

### finalAttributes

• `get` **finalAttributes**(): `Record`<`string`, `any`\>

#### Returns

`Record`<`string`, `any`\>

#### Inherited from

BasicEntity.finalAttributes

#### Defined in

[src/lib/classes/BasicEntity.ts:88](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L88)

___

### finalDynamoDBKey

• `Protected` `get` **finalDynamoDBKey**(): `Object`

#### Returns

`Object`

#### Defined in

[src/lib/classes/DynamoEntity.ts:153](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L153)

___

### primaryKeyDynamoDBValue

• `Protected` `get` **primaryKeyDynamoDBValue**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:141](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L141)

___

### relatedNotNestedModels

• `Protected` `get` **relatedNotNestedModels**(): `string`[]

#### Returns

`string`[]

#### Inherited from

BasicEntity.relatedNotNestedModels

#### Defined in

[src/lib/classes/BasicEntity.ts:96](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L96)

___

### relationsUpdateAttributes

• `get` **relationsUpdateAttributes**(): { `Update`: { `ConditionExpression?`: `string` ; `ExpressionAttributeNames?`: `ExpressionAttributeNameMap` ; `ExpressionAttributeValues?`: `ExpressionAttributeValueMap` ; `Key`: `Key` ; `ReturnValuesOnConditionCheckFailure?`: `string` ; `TableName`: `string` ; `UpdateExpression`: `string`  }  }[]

#### Returns

{ `Update`: { `ConditionExpression?`: `string` ; `ExpressionAttributeNames?`: `ExpressionAttributeNameMap` ; `ExpressionAttributeValues?`: `ExpressionAttributeValueMap` ; `Key`: `Key` ; `ReturnValuesOnConditionCheckFailure?`: `string` ; `TableName`: `string` ; `UpdateExpression`: `string`  }  }[]

#### Defined in

[src/lib/classes/DynamoEntity.ts:310](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L310)

___

### secondaryKeyDynamoDBValue

• `Protected` `get` **secondaryKeyDynamoDBValue**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:147](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L147)

___

### transformedAttributes

• `get` **transformedAttributes**(): `Record`<`string`, `any`\>

#### Returns

`Record`<`string`, `any`\>

#### Inherited from

BasicEntity.transformedAttributes

#### Defined in

[src/lib/classes/BasicEntity.ts:75](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L75)

___

### updateAttributes

• `get` **updateAttributes**(): `Update`

#### Returns

`Update`

#### Defined in

[src/lib/classes/DynamoEntity.ts:398](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L398)

___

### valid

• `get` **valid**(): `boolean`

#### Returns

`boolean`

#### Inherited from

BasicEntity.valid

#### Defined in

[src/lib/classes/BasicEntity.ts:158](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L158)

___

### validatedAttributes

• `get` **validatedAttributes**(): `Record`<`string`, `any`\>

#### Returns

`Record`<`string`, `any`\>

#### Inherited from

BasicEntity.validatedAttributes

#### Defined in

[src/lib/classes/BasicEntity.ts:84](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L84)

___

### \_createdAtKey

• `Static` `get` **_createdAtKey**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:53](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L53)

___

### \_dynamodb

• `Static` `get` **_dynamodb**(): `DocumentClient`

#### Returns

`DocumentClient`

#### Defined in

[src/lib/classes/DynamoEntity.ts:33](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L33)

___

### \_entityName

• `Static` `get` **_entityName**(): `string`

#### Returns

`string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:41](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L41)

___

### \_primaryKey

• `Static` `get` **_primaryKey**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:45](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L45)

___

### \_secondaryKey

• `Static` `get` **_secondaryKey**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:49](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L49)

___

### \_tableName

• `Static` `get` **_tableName**(): `string`

#### Returns

`string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:37](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L37)

___

### \_updatedAtKey

• `Static` `get` **_updatedAtKey**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[src/lib/classes/DynamoEntity.ts:57](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L57)

## Methods

### create

▸ **create**(): `Promise`<[`Entity`](../wiki/Entity)\>

#### Returns

`Promise`<[`Entity`](../wiki/Entity)\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:378](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L378)

___

### getAttribute

▸ `Protected` **getAttribute**(`key`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`any`

#### Inherited from

BasicEntity.getAttribute

#### Defined in

[src/lib/classes/BasicEntity.ts:53](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L53)

___

### load

▸ **load**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:288](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L288)

___

### parseDynamoAttributes

▸ **parseDynamoAttributes**(`item`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `item` | `Record`<`string`, `any`\> |

#### Returns

`Object`

#### Defined in

[src/lib/classes/DynamoEntity.ts:275](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L275)

___

### removeEntityFromKey

▸ `Protected` **removeEntityFromKey**(`key`): `Key`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `Key` |

#### Returns

`Key`

#### Defined in

[src/lib/classes/DynamoEntity.ts:184](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L184)

___

### setAttribute

▸ `Protected` **setAttribute**(`key`, `value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `value` | `any` |

#### Returns

`void`

#### Inherited from

BasicEntity.setAttribute

#### Defined in

[src/lib/classes/BasicEntity.ts:57](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L57)

___

### setEntityOnKey

▸ `Protected` **setEntityOnKey**(`key`): `Key`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `Key` |

#### Returns

`Key`

#### Defined in

[src/lib/classes/DynamoEntity.ts:166](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L166)

___

### update

▸ **update**(): `Promise`<[`Entity`](../wiki/Entity)\>

#### Returns

`Promise`<[`Entity`](../wiki/Entity)\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:462](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L462)

___

### validate

▸ **validate**(`_throw?`): `boolean`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `_throw` | `boolean` | `false` |

#### Returns

`boolean`

#### Inherited from

BasicEntity.validate

#### Defined in

[src/lib/classes/BasicEntity.ts:140](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L140)

___

### validateRelatedModels

▸ **validateRelatedModels**(`_throw?`): `boolean`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `_throw` | `boolean` | `false` |

#### Returns

`boolean`

#### Inherited from

BasicEntity.validateRelatedModels

#### Defined in

[src/lib/classes/BasicEntity.ts:106](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L106)

___

### \_query

▸ `Static` `Protected` **_query**(`opts`): `Promise`<`PromiseResult`<`QueryOutput`, `AWSError`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `QueryInput` |

#### Returns

`Promise`<`PromiseResult`<`QueryOutput`, `AWSError`\>\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:133](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L133)

___

### \_scan

▸ `Static` `Protected` **_scan**(`opts`): `Promise`<`PromiseResult`<`ScanOutput`, `AWSError`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `ScanInput` |

#### Returns

`Promise`<`PromiseResult`<`ScanOutput`, `AWSError`\>\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:137](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L137)

___

### createPaginator

▸ `Static` `Protected` **createPaginator**(`method`, `opts`): [`DynamoPaginator`](../wiki/DynamoPaginator)

#### Parameters

| Name | Type |
| :------ | :------ |
| `method` | `any` |
| `opts` | `any` |

#### Returns

[`DynamoPaginator`](../wiki/DynamoPaginator)

#### Defined in

[src/lib/classes/DynamoEntity.ts:67](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L67)

___

### deleteItem

▸ `Static` **deleteItem**(`key`): `Promise`<`AttributeMap`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `Key` |

#### Returns

`Promise`<`AttributeMap`\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:205](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L205)

___

### getItem

▸ `Static` **getItem**(`key`): `Promise`<`undefined` \| [`Entity`](../wiki/Entity)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `Key` |

#### Returns

`Promise`<`undefined` \| [`Entity`](../wiki/Entity)\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:221](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L221)

___

### initialize

▸ `Static` `Protected` **initialize**(`item`): [`Entity`](../wiki/Entity)

#### Parameters

| Name | Type |
| :------ | :------ |
| `item` | `Record`<`string`, `any`\> |

#### Returns

[`Entity`](../wiki/Entity)

#### Defined in

[src/lib/classes/DynamoEntity.ts:63](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L63)

___

### prepareEntityAttributeNameAndValue

▸ `Static` `Protected` **prepareEntityAttributeNameAndValue**(`opts`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `any` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `attributeName` | `any` |
| `attributeValue` | `any` |
| `opts` | `any` |

#### Defined in

[src/lib/classes/DynamoEntity.ts:76](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L76)

___

### prepareEntityExpression

▸ `Static` `Protected` **prepareEntityExpression**(`opts`, `key`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `any` |
| `key` | `any` |

#### Returns

`any`

#### Defined in

[src/lib/classes/DynamoEntity.ts:109](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L109)

___

### prepareOptsForDelete

▸ `Static` `Protected` **prepareOptsForDelete**(`opts`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `any` |

#### Returns

`any`

#### Defined in

[src/lib/classes/DynamoEntity.ts:129](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L129)

___

### prepareOptsForScanAndQuery

▸ `Static` `Protected` **prepareOptsForScanAndQuery**(`opts`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `any` |

#### Returns

`any`

#### Defined in

[src/lib/classes/DynamoEntity.ts:125](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L125)

___

### query

▸ `Static` **query**(`opts`): `Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `QueryOptions` |

#### Returns

`Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:234](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L234)

___

### queryAll

▸ `Static` **queryAll**(`opts`): `Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `QueryOptions` |

#### Returns

`Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:240](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L240)

___

### removeEntityFromKey

▸ `Static` `Protected` **removeEntityFromKey**(`key`): `Key`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `Key` |

#### Returns

`Key`

#### Defined in

[src/lib/classes/DynamoEntity.ts:198](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L198)

___

### scan

▸ `Static` **scan**(`opts?`): `Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts?` | `ScanOptions` |

#### Returns

`Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:245](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L245)

___

### scanAll

▸ `Static` **scanAll**(`opts?`): `Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts?` | `ScanOptions` |

#### Returns

`Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Defined in

[src/lib/classes/DynamoEntity.ts:251](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L251)

___

### setEntityOnKey

▸ `Static` `Protected` **setEntityOnKey**(`key`): `Key`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `Key` |

#### Returns

`Key`

#### Defined in

[src/lib/classes/DynamoEntity.ts:180](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoEntity.ts#L180)

___

### transformAttributes

▸ `Static` **transformAttributes**(`item`): `Record`<`string`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `item` | `Record`<`string`, `any`\> |

#### Returns

`Record`<`string`, `any`\>

#### Inherited from

BasicEntity.transformAttributes

#### Defined in

[src/lib/classes/BasicEntity.ts:170](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L170)

___

### validate

▸ `Static` **validate**(`item`, `_throw?`): `boolean`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `item` | `Record`<`string`, `any`\> | `undefined` |
| `_throw` | `boolean` | `true` |

#### Returns

`boolean`

#### Inherited from

BasicEntity.validate

#### Defined in

[src/lib/classes/BasicEntity.ts:178](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L178)

___

### validateAttributes

▸ `Static` **validateAttributes**(`item`): `Record`<`string`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `item` | `Record`<`string`, `any`\> |

#### Returns

`Record`<`string`, `any`\>

#### Inherited from

BasicEntity.validateAttributes

#### Defined in

[src/lib/classes/BasicEntity.ts:174](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/BasicEntity.ts#L174)
