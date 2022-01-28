/* eslint-disable no-await-in-loop */
import { Key } from 'aws-sdk/clients/dynamodb';

type Constructor = { new(...args) };

type ConstructorOptions<TBase> = {
  method: Function;
  opts?: object;
  entityClass: TBase;
  tableName: string;
};

export class DynamoPaginator<TBase extends Constructor> {
  protected _dynamoMethod: Function;

  protected _opts: object;

  protected _items: any[] = [];

  protected _lastPageItems: any[];

  protected _startKey: Key;

  protected _tableName: string;

  protected _entityClass: TBase;

  constructor({
    method, opts, entityClass, tableName,
  }: ConstructorOptions<TBase>) {
    this._dynamoMethod = method;
    this._opts = opts || {};
    this._entityClass = entityClass;
    this._tableName = tableName;

    this[method.name] = this.next;
  }

  protected get options() {
    return {
      ...this._opts,
      TableName: this._tableName,
      ExclusiveStartKey: this._startKey,
    };
  }

  get lastPageItems() {
    return this._lastPageItems.map((i) => new this._entityClass(i));
  }

  get items() {
    return this._items.map((i) => new this._entityClass(i));
  }

  get morePages(): boolean {
    return (
      this._lastPageItems == null
      || (
        this._lastPageItems != null
        && this._startKey != null
      )
    );
  }

  async next() {
    if (!this.morePages) {
      throw new Error('All pages were already scanned');
    } else {
      const {
        Items: items,
        LastEvaluatedKey: lastEvaluatedKey,
      } = await this._dynamoMethod.call(this, this.options);

      this._lastPageItems = items;
      this._items = this._items.concat(items);
      this._startKey = lastEvaluatedKey;

      return this;
    }
  }

  async getAll() {
    while (this.morePages) {
      await this.next();
    }

    return this;
  }
}
