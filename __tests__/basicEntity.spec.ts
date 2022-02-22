import { aliases, prop } from '../src/lib/Decorators';
import { Entity } from '../src/lib/Entity';

class A extends Entity {
  @prop()
  @aliases(['propertyFromA'])
  aProperty: string;
}

class B extends A {
  @prop()
  bProperty: string;
}

class C extends B {
  @prop()
  @aliases(['aliasTest'])
  cProperty: string;
}

describe('Basic Entity', () => {
  test('It correctly sets the propertyList when there are heritance', () => {
    expect(A.propertyList.sort()).toStrictEqual(['aProperty'].sort());
    expect(B.propertyList.sort()).toStrictEqual(['aProperty', 'bProperty'].sort());
    expect(C.propertyList.sort()).toStrictEqual(['aProperty', 'bProperty', 'cProperty'].sort());
  });

  test('It correctly sets the attributeList when there are heritance', () => {
    expect(A.attributeList.sort()).toStrictEqual(['aProperty', 'propertyFromA'].sort());
    expect(B.attributeList.sort()).toStrictEqual(['aProperty', 'propertyFromA', 'bProperty'].sort());
    expect(C.attributeList.sort()).toStrictEqual(['aProperty', 'propertyFromA', 'bProperty', 'cProperty', 'aliasTest'].sort());
  });
});
