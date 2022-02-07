# Class: DynamoPaginator

## Table of contents

### Constructors

- [constructor](../wiki/DynamoPaginator#constructor)

### Properties

- [\_dynamoMethod](../wiki/DynamoPaginator#_dynamomethod)
- [\_initializer](../wiki/DynamoPaginator#_initializer)
- [\_items](../wiki/DynamoPaginator#_items)
- [\_lastPageItems](../wiki/DynamoPaginator#_lastpageitems)
- [\_opts](../wiki/DynamoPaginator#_opts)
- [\_startKey](../wiki/DynamoPaginator#_startkey)
- [\_tableName](../wiki/DynamoPaginator#_tablename)

### Accessors

- [items](../wiki/DynamoPaginator#items)
- [lastPageItems](../wiki/DynamoPaginator#lastpageitems)
- [morePages](../wiki/DynamoPaginator#morepages)
- [options](../wiki/DynamoPaginator#options)

### Methods

- [getAll](../wiki/DynamoPaginator#getall)
- [next](../wiki/DynamoPaginator#next)

## Constructors

### constructor

• **new DynamoPaginator**(`__namedParameters`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `ConstructorOptions` |

#### Defined in

[src/lib/classes/DynamoPaginator.ts:26](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L26)

## Properties

### \_dynamoMethod

• `Protected` **\_dynamoMethod**: `Function`

#### Defined in

[src/lib/classes/DynamoPaginator.ts:12](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L12)

___

### \_initializer

• `Protected` **\_initializer**: (`item`: `Record`<`string`, `any`\>) => `any`

#### Type declaration

▸ (`item`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `item` | `Record`<`string`, `any`\> |

##### Returns

`any`

#### Defined in

[src/lib/classes/DynamoPaginator.ts:24](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L24)

___

### \_items

• `Protected` **\_items**: `any`[] = `[]`

#### Defined in

[src/lib/classes/DynamoPaginator.ts:16](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L16)

___

### \_lastPageItems

• `Protected` **\_lastPageItems**: `any`[]

#### Defined in

[src/lib/classes/DynamoPaginator.ts:18](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L18)

___

### \_opts

• `Protected` **\_opts**: `object`

#### Defined in

[src/lib/classes/DynamoPaginator.ts:14](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L14)

___

### \_startKey

• `Protected` **\_startKey**: `Key`

#### Defined in

[src/lib/classes/DynamoPaginator.ts:20](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L20)

___

### \_tableName

• `Protected` **\_tableName**: `string`

#### Defined in

[src/lib/classes/DynamoPaginator.ts:22](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L22)

## Accessors

### items

• `get` **items**(): `any`[]

#### Returns

`any`[]

#### Defined in

[src/lib/classes/DynamoPaginator.ts:49](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L49)

___

### lastPageItems

• `get` **lastPageItems**(): `any`[]

#### Returns

`any`[]

#### Defined in

[src/lib/classes/DynamoPaginator.ts:45](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L45)

___

### morePages

• `get` **morePages**(): `boolean`

#### Returns

`boolean`

#### Defined in

[src/lib/classes/DynamoPaginator.ts:53](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L53)

___

### options

• `Protected` `get` **options**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `ExclusiveStartKey` | `Key` |
| `TableName` | `string` |

#### Defined in

[src/lib/classes/DynamoPaginator.ts:37](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L37)

## Methods

### getAll

▸ **getAll**(): `Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Returns

`Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Defined in

[src/lib/classes/DynamoPaginator.ts:80](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L80)

___

### next

▸ **next**(): `Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Returns

`Promise`<[`DynamoPaginator`](../wiki/DynamoPaginator)\>

#### Defined in

[src/lib/classes/DynamoPaginator.ts:63](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/classes/DynamoPaginator.ts#L63)
