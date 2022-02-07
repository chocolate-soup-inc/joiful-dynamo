export type Constructor = { new(...args: any[]) };

export type RelationOptions = {
  required?: boolean;
  nestedObject?: boolean;
  foreignKey?: string;
};

export type RelationModel = {
  model: any,
  opts?: RelationOptions,
} | undefined;
