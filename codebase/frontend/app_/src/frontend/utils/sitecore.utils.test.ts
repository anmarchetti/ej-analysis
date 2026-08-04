import {
    getFieldValue,
    getOnlyFieldValuesFromSitecoreItemsArray,
    isSitecoreCheckboxSelected,
    SitecoreKeyFieldName,
} from 'frontend/utils/sitecore.utils';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { mockSitecoreField } from './tests.utils';

describe('isSitecoreCheckboxSelected', () => {
    test('should return true when value is "1"', () => {
        expect(isSitecoreCheckboxSelected('1')).toBe(true);
    });

    test('should return false when  value is undefined', () => {
        expect(isSitecoreCheckboxSelected(undefined)).toBe(false);
    });
});

describe('getFieldValue', () => {
    it('should return empty string if no field value', () => {
        expect(getFieldValue({} as ISitecoreField<string>)).toBe('');
    });

    it('should return sitecore field value', () => {
        expect(getFieldValue(mockSitecoreField('test'))).toBe('test');
    });
});

describe('getOnlyFieldValuesFromSitecoreItemsArray', () => {
    it('should return only values from array', () => {
        const array = [
            { fields: { Key: { value: 'KEY1' } } },
            { fields: { Key: { value: 'KEY2' } } },
            { fields: { Key: { value: undefined } } },
            { fields: {} },
            {},
        ];
        const result = getOnlyFieldValuesFromSitecoreItemsArray(array, SitecoreKeyFieldName.Key);
        expect(result).toEqual(['KEY1', 'KEY2']);
    });

    it('should return an empty array if no keys exist', () => {
        const array = [
            { fields: { Code: { value: '' } } },
            { fields: { Code: { value: undefined } } },
            { fields: {} },
            {},
        ];
        const result = getOnlyFieldValuesFromSitecoreItemsArray(array, SitecoreKeyFieldName.Code);
        expect(result).toEqual([]);
    });
});
