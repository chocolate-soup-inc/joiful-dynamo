# joiful-dynamodb

## Table of contents

### Classes

- [DynamoPaginator](../wiki/DynamoPaginator)
- [Entity](../wiki/Entity)

### Functions

- [aliasTo](../wiki/Exports#aliasto)
- [aliases](../wiki/Exports#aliases)
- [compositeKey](../wiki/Exports#compositekey)
- [hasOne](../wiki/Exports#hasone)
- [prop](../wiki/Exports#prop)
- [table](../wiki/Exports#table)
- [validate](../wiki/Exports#validate)

## Functions

### aliasTo

▸ **aliasTo**(`aliasToName`): (`target`: `any`, `propertyKey`: `string`) => `void`

Sets the decorated property as an alias of another property.

**`remarks`**

Once the aliasTo decorator is set on an Entity Class model property, the instance, the setters and getters will be set and both variables will be linked.

**`example`**
```
class Model extends Entity {
   myProperty number;

   @aliasTo('myProperty')
   aliasProperty: number;
}

const model = new Model({
   aliasProperty: 1;
})

console.log(model.myProperty) // 1
console.log(model.aliasProperty) // 1

model.myProperty = 2;

console.log(model.myProperty) // 2
console.log(model.aliasProperty) // 2

model.aliasProperty = 3;

console.log(model.myProperty) // 3
console.log(model.aliasProperty) // 3
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `aliasToName` | `string` | The name of the prop to which this prop should be an alias of. |

#### Returns

`fn`

▸ (`target`, `propertyKey`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `any` |
| `propertyKey` | `string` |

##### Returns

`void`

#### Defined in

[src/lib/decorators/aliases.ts:68](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/decorators/aliases.ts#L68)

___

### aliases

▸ **aliases**(`aliasesNames`): (`target`: `any`, `propertyKey`: `string`) => `void`

Sets a list of aliases for the decorated property.

**`remarks`**

Once the aliases decorator is set on an Entity Class model property, the instance will have getters and setters of each of the aliases.

**`example`**
```
class Model extends Entity {
  @aliases(['alias1', 'alias2'])
  myProperty number;
}

const model = new Model({
  alias1: 1,
});

console.log(model.myProperty) // 1
console.log(model.alias1) // 1
console.log(model.alias2) // 1

model.myProperty = 2;

console.log(model.myProperty) // 2
console.log(model.alias1) // 2
console.log(model.alias2) // 2

model.alias2 = 3;

console.log(model.myProperty) // 3
console.log(model.alias1) // 3
console.log(model.alias2) // 3
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `aliasesNames` | `string`[] | A list of aliases for the current property. |

#### Returns

`fn`

▸ (`target`, `propertyKey`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `any` |
| `propertyKey` | `string` |

##### Returns

`void`

#### Defined in

[src/lib/decorators/aliases.ts:110](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/decorators/aliases.ts#L110)

___

### compositeKey

▸ **compositeKey**(`fields`, `opts?`): (`target`: `any`, `propertyKey`: `string`) => `void`

Transforms the decoratored property into a combination of other properties separated by a specific delimiter.

**`example`**
```
class Model extends Entity {
  @compositeKey(['field1', 'field2'])
  compositeProperty: string;

  @prop()
  field1: string;

  @prop()
  field2: string;
}

const model = new Model({ field1: 'part1', field2: 'part2' });

console.log(model.compositeProperty) // undefined;
console.log(model.field1) // 'part1'
console.log(model.field2) // 'part2'

console.log(model.transformedAttributes) // { compositeProperty: 'part1#part2', field1: 'part1', field2: 'part2' }
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fields` | `string`[] | An ordered list containing the name of the properties to be combined. The combination will be done in this order. |
| `opts?` | `Options` | - |

#### Returns

`fn`

▸ (`target`, `propertyKey`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `any` |
| `propertyKey` | `string` |

##### Returns

`void`

#### Defined in

[src/lib/decorators/compositeKey.ts:50](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/decorators/compositeKey.ts#L50)

___

### hasOne

▸ **hasOne**(`ChildModel`, `opts?`): (`target`: `any`, `propertyKey`: `string`) => `void`

Sets the decorated property as another entity.

**`remarks`**

Besides validations and setting the child instance, it also creates getters and setters for all child instances in the parent. Look example for more details.

**`example`**
```
import * as Joi from 'joi';

class ChildModel extends Entity {
  @prop()
  @validate(Joi.string().required())
  pk: string;

  @prop()
  sk: string;

  @prop()
  fk: string;
}

class ParentModel extends Entity {
  @prop({ primaryKey: true })
  pk: string;

  @hasOne(ChildModel, { nestedObject: true, required: true })
  child1: ChildModel;

  @hasOne(ChildModel, { nestedObject: false, required: false, foreignKey: 'fk' })
  child2: ChildModel;
}

const parent = new ParentModel({
  pk: '1',
  child1: {
    pk: 'pk-from-child-1',
    sk: 'sk-from-child-1',
  },
  child2Sk: 'sk-from-child-2',
});

console.log(parent.child1.pk) // 'pk-from-child-1'
console.log(parent.child1.sk) // 'sk-from-child-1'
console.log(parent.child1Pk) // 'pk-from-child-1'
console.log(parent.child1Sk) // 'sk-from-child-1'

console.log(parent.child2.pk) // undefined
console.log(parent.child2.sk) // 'sk-from-child-2'
console.log(parent.child2Pk) // undefined
console.log(parent.child2Sk) // 'sk-from-child-2'

parent.child2.pk = 'pk-from-child-2';

console.log(parent.child2.pk) // 'pk-from-child-2'
console.log(parent.child2.sk) // 'sk-from-child-2'
console.log(parent.child2Pk) // 'pk-from-child-2'
console.log(parent.child2Sk) // 'sk-from-child-2'

console.log(parent.transformedAttributes) // { child1: { pk: 'pk-from-child-1', sk: 'sk-from-child-1' } } # The child2 does not appear in the attributes because it will become a new record.

console.log(parent.valid) // false # As child 2 is invalid, parent is invalid also.

model.child2 = undefined;

console.log(parent.valid) // true # As child 2 is not required, parent is valid.

model.child1 = undefined;

console.log(parent.valid) // false # As child 1 is required, the parent is invalid.

parent.create() // This will insert 2 records in the database. The parent and the child 2. Both will have the property fk set to 'ParentModel-1'
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ChildModel` | `Constructor` | The class of which the property should be an instance of. This class needs to extend the Entity class. |
| `opts?` | `RelationOptions` | - |

#### Returns

`fn`

▸ (`target`, `propertyKey`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `any` |
| `propertyKey` | `string` |

##### Returns

`void`

#### Defined in

[src/lib/decorators/hasOne.ts:190](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/decorators/hasOne.ts#L190)

___

### prop

▸ **prop**(`opts?`): (`target`: `any`, `propertyKey`: `string`) => `void`

Sets the decorated property as a mapped property of the Entity setting its setters and getters (this is important for the attribute mapping for inserting in the database). Besides this, all the parameters initialized with the entity model will have the correct setters and getters. You can also set some properties as primaryKeys, secondaryKeys, createdAt or updatedAt.

**`example`**
```
class Model extends Entity {
  @prop({ primaryKey: true })
  property1: string;

  @prop({ secondaryKey: true })
  property2: string;

  @prop({ createdAt: true })
  cAt: string;

  @prop({ updatedAt: true })
  uAt: string;
}

const model = new Model({
  property1: '1',
  property2: '2',
  cAt: '3',
  uAt: '4',
  extraAttribute: '5',
});

console.log(model.property1) // '1'
console.log(model.property2) // '2'
console.log(model.cAt) // '3'
console.log(model.uAt) // '4'
console.log(model.extraAttribute) // '5'

model.property1 = 'changed1';
console.log(model.property1) // 'changed1';

model.property2 = 'changed2';
console.log(model.property2) // 'changed2';

model.cAt = 'changed3';
console.log(model.cAt) // 'changed3';

model.uAt = 'changed4';
console.log(model.uAt) // 'changed4';

model.extraAttribute = 'changed5';
console.log(model.extraAttribute) // 'changed5';

model.extraAttribute2 = 'changed6'; // ERROR: the setter does not exist!

console.log(model._primaryKey) // 'property1';
console.log(model._secondaryKey) // 'property2';
console.log(model._createdAtKey) // 'cAt';
console.log(model._updatedAtKey) // 'uAt';

model.create(); // In the database it will be saved like this: { property1: 'Model-changed1', property2: 'Model-changed2', cAt: '2022-02-07T16:16:44.975Z', uAt: '2022-02-07T16:16:44.975Z', extraAttribute: 'changed5' };
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts?` | `PropOptions` |

#### Returns

`fn`

▸ (`target`, `propertyKey`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `any` |
| `propertyKey` | `string` |

##### Returns

`void`

#### Defined in

[src/lib/decorators/prop.ts:121](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/decorators/prop.ts#L121)

___

### table

▸ **table**(`name`, `opts?`): (`constructor`: `Function`) => `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `opts?` | `Options` |

#### Returns

`fn`

▸ (`constructor`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `constructor` | `Function` |

##### Returns

`void`

#### Defined in

[src/lib/decorators/table.ts:31](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/decorators/table.ts#L31)

___

### validate

▸ **validate**(`joi`): (`target`: `any`, `propertyKey`: `string`) => `void`

Adds validation to the decorated property using Joi validation library.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `joi` | `Schema`<`any`\> | The Joi validation schema. |

#### Returns

`fn`

▸ (`target`, `propertyKey`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `target` | `any` |
| `propertyKey` | `string` |

##### Returns

`void`

#### Defined in

[src/lib/decorators/validate.ts:20](https://github.com/chocolate-soup-inc/joiful-dynamo/blob/fa1feab8/src/lib/decorators/validate.ts#L20)
