import 'reflect-metadata';
import Joi from 'joi';
/** @internal */
export declare const getValidatedFields: (target: any) => string[];
/** @internal */
export declare const getPropertyValidate: (target: any, key: string) => Joi.Schema | undefined;
/**
 * Adds validation to the decorated property or decorated Entity using Joi validation library.
 * @param {Joi.Schema} joi - The Joi validation schema.
 * @remarks
 *
 * If you are setting the decorated Entity it NEEDS to be of Joi.object() type. Remember that if you set a new validation object in the Entitiy itself you need to add the .unknown(true) if you want to accept any attribute.
 * @example
 * ```
 * import * as Joi from 'joi';
 *
 * @validate(Joi.object().unknown(true).and('attribute1', 'attribute2'))
 * class Model extends Entity {
 *   @validate(Joi.string().required().trim())
 *   pk: string;
 *
 *   @validate(Joi.string().trim())
 *   sk: string;
 *
 *   @validate(Joi.string())
 *   attribute1: string;
 *
 *   @validate(Joi.string())
 *   attribute2: string;
 * }
 *
 * const model = new Model({ pk: '1' });
 *
 * console.log(model.valid) // true
 *
 * model.sk = '2'
 * console.log(model.valid) // true
 *
 * model.pk = undefined;
 * console.log(model.valid) // false
 *
 * model.pk = '   1 2   ';
 * console.log(model.validatedAttributes) // { pk: '1 2', sk: '2' } # The joi transfromation happens when validating but doesn't change the original attributes. But the transformed attributes are the ones used on save.
 *
 * model.attribute1 = '1'
 * console.log(model.valid) // false # It is invalid because of the entity level validation with the Joi.object().and()
 *
 * model.attribute2 = '2'
 * console.log(model.valid) // true # It is now valid because it passes the Joi.object().and() validation.
 * ```
 *
 * @category Property Decorators
 */
export declare function validate(joi: Joi.Schema): (target: any, propertyKey?: string | undefined) => void;
/** @internal */
export declare function joiSchema(target: any): any;
/** @internal */
export declare function validateAttributes(target: any, item: Record<string, any>): any;
