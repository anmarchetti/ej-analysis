import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

export enum SitecoreKeyFieldName {
    Code = 'Code',
    Key = 'Key',
}

export const isSitecoreCheckboxSelected = (value?: TSitecoreCheckboxValue): boolean => value === '1';

export const getFieldValue = (field: ISitecoreField<string> | undefined): string => field?.value || '';

/**
 * Generic utility to extract an array of field values from Sitecore items array.
 * @param array - array of sitecore items
 * @param fieldName - the field name to extract (e.g., 'Code', 'Key')
 * @returns array of field values
 */
export const getOnlyFieldValuesFromSitecoreItemsArray = <
    FieldName extends SitecoreKeyFieldName | string,
    T extends { fields?: Record<FieldName, { value?: string }> | object },
>(
    array: T[],
    fieldName: FieldName,
): string[] =>
    array.reduce((values, item) => {
        let value: string | undefined;

        if (item?.fields && typeof item.fields === 'object' && fieldName in item.fields) {
            value = (item.fields as Record<FieldName, { value?: string }>)[fieldName]?.value;
        }

        if (value) {
            values.push(value);
        }

        return values;
    }, [] as string[]);
