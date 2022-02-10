import { Key } from 'aws-sdk/clients/dynamodb';
declare type ConstructorOptions = {
    method: Function;
    opts?: object;
    tableName: string;
    initializer: (item: Record<string, any>) => any;
};
export declare class DynamoPaginator {
    protected _dynamoMethod: Function;
    protected _opts: object;
    protected _items: any[];
    protected _lastPageItems: any[];
    protected _startKey: Key;
    protected _tableName: string;
    protected _initializer: (item: Record<string, any>) => any;
    constructor({ method, opts, tableName, initializer, }: ConstructorOptions);
    protected get options(): {
        TableName: string;
        ExclusiveStartKey: Key;
    };
    get lastPageItems(): any[];
    get items(): any[];
    get morePages(): boolean;
    next(): Promise<this>;
    getAll(): Promise<this>;
}
export {};
