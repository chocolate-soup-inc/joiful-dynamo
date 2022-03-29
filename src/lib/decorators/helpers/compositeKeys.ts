import _ from 'lodash';
import {
  getCompositeKey,
  getCompositeKeyDelimiter,
  getCompositeKeys,
} from '../reflections/compositeKeys';

/** @internal */
export function transformCompositeKeyAttributes(target: any, item: Record<string, any>) {
  const newItem = _.cloneDeep(item);
  const compositeKeys = getCompositeKeys(target);

  for (const key of compositeKeys) {
    const fields = getCompositeKey(target, key);

    if (fields) {
      const delimiter = getCompositeKeyDelimiter(target);

      const keyParts = fields.map((field) => newItem[field]);

      if (
        _.difference(fields, Object.keys(newItem)).length > 0
        || keyParts.filter((part) => part == null).length > 0
      ) {
        // SET AS BLANK
        delete newItem[key];
        continue;
      } else {
        newItem[key] = keyParts.join(delimiter);
      }
    }
  }

  return newItem;
}
