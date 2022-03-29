import { Paginator } from '@aws-sdk/types';
import { QueryCommandOutput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';

export class DynamoPaginator {
  protected _items: any[] = [];

  protected _lastPageItems: any[];

  protected _startKey: { [key: string]: any; } | undefined;

  protected _initializer: (item: Record<string, any>) => any;

  private _paginator: Paginator<ScanCommandOutput | QueryCommandOutput>;

  constructor(paginator: Paginator<ScanCommandOutput | QueryCommandOutput>, initializer: (item: Record<string, any>) => any) {
    this._paginator = paginator;
    this._initializer = initializer;
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

  parsePage(page: QueryCommandOutput | ScanCommandOutput) {
    const {
      Items: items = [],
      LastEvaluatedKey: lastEvaluatedKey,
    } = page;

    const instances = items.map((i) => this._initializer(i));

    this._lastPageItems = instances;
    this._items = this._items.concat(instances);
    this._startKey = lastEvaluatedKey;
  }

  async next() {
    if (!this.morePages) {
      throw new Error('All pages were already scanned');
    } else {
      const {
        value: page,
      } = await this._paginator.next();

      this.parsePage(page);
      return this;
    }
  }

  async getAll() {
    for await (const page of this._paginator) {
      this.parsePage(page);
    }

    return this;
  }
}
