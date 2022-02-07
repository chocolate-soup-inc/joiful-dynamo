/** @internal */
export type Constructor = { new(...args: any[]) };

/** @internal */
export type RelationOptions = {
  required?: boolean;
  nestedObject?: boolean;
  foreignKey?: string;
};

/** @internal */
export type RelationModel = {
  model: any,
  opts?: RelationOptions,
} | undefined;
