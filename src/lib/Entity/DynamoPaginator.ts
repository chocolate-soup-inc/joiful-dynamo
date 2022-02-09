/* eslint-disable no-await-in-loop */
import { Key } from 'aws-sdk/clients/dynamodb';

type ConstructorOptions = {
  method: Function;
  opts?: object;
  tableName: string;
  initializer: (item: Record<string, any>) => any;
};

export class DynamoPaginator {
  protected _dynamoMethod: Function;

  protected _opts: object;

  protected _items: any[] = [];

  protected _lastPageItems: any[];

  protected _startKey: Key;

  protected _tableName: string;

  protected _initializer: (item: Record<string, any>) => any;

  constructor({
    method, opts, tableName, initializer,
  }: ConstructorOptions) {
    this._dynamoMethod = method;
    this._opts = opts || {};
    this._tableName = tableName;
    this._initializer = initializer;

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
    return this._lastPageItems;
  }

  get items() {
    return this._items;
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

      const instances = items.map((i) => this._initializer(i));

      this._lastPageItems = instances;
      this._items = this._items.concat(instances);
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
