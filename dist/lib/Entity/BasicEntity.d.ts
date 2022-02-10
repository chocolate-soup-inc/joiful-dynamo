import Joi from 'joi';
export declare class BasicEntity {
    protected _attributes: Record<string, any>;
    [key: string]: any;
    constructor(item?: Record<string, any>);
    /**
     * Gets all the attributes from the instance before any transformation. Alias are already removed and only the final properties are returned.
     */
    get attributes(): Record<string, any>;
    /**
     * Sets the attributes from the instance. It deals with children properties too.
     */
    set attributes(attributes: Record<string, any>);
    protected getAttribute(key: string): any;
    protected setAttribute(key: string, value: any): void;
    /** @internal */
    get enumerableAttributes(): Record<string, any>;
    /** @internal */
    get transformedAttributes(): Record<string, any>;
    /** @internal */
    get validatedAttributes(): Record<string, any>;
    /**
     * Validates the instance attributes and returns the final transformed and validated attributes (before any dynamodb specific transformations like addin the entity name to the pk and sk, for example).
     */
    get finalAttributes(): Record<string, any>;
    protected get relatedNotNestedModels(): string[];
    protected _error: Joi.ValidationError | undefined;
    /** @internal */
    validateRelatedModels(_throw?: boolean): boolean;
    /**
     * Validates the current instance.
     * @param {boolean} _throw - If true, throws an error if the instance is invalid. If false, saves the error to the error property and returns true or false.
     */
    validate(_throw?: boolean): boolean;
    /**
     * Returns a boolean indicating if the current instance is valid or not.
     */
    get valid(): boolean;
    /**
     * If a validation was ran without throwing exceptions, the errors found are kept in the error variable. This getter returns that error.
     */
    get error(): Joi.ValidationError | undefined;
    /** @ignore */
    static transformAttributes(item: Record<string, any>): Record<string, any>;
    /**
     * Returns the transformed attributes of the item. Similar to {@link Entity.finalAttributes | Instance finalAttributes getter}.
     * @param {Record<string, any>} item - The attributes to use for the transformation.
     */
    static validateAttributes(item: Record<string, any>): Record<string, any>;
    /**
     * Creates as instance of the current class with the attributes provided and validates it. See {@link Entity.validate | Instance Validate} for more details.
     * @param {Record<string, any>} item - The attributes to use when creating the instance.
     * @param {boolean} [_throw = true] - If it should throw an error or not when validating.
     */
    static validate(item: Record<string, any>, _throw?: boolean): boolean;
}
