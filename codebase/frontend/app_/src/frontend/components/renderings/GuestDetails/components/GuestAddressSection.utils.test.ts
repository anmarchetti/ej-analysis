import AxiosRequest from 'frontend/utils/request';

import { searchAddressItem, searchAddressList } from './GuestAddressSection.utils';

describe('searchAddressItem', () => {
    it('should call the API with correct parameters and returns data', async () => {
        const mockOnChange = jest.fn();
        AxiosRequest.get = jest.fn().mockResolvedValue({ data: { id: '123' } });

        const result = await searchAddressItem({ id: '123' }, { iso2: 'US', onChange: mockOnChange });

        expect(AxiosRequest.get).toHaveBeenCalledWith('http://test/api/v1.0/address-lookup/retrieve', {
            params: { countryCode: 'US', value: '123' },
            signal: expect.any(Object),
        });
        expect(mockOnChange).toHaveBeenCalledWith({ id: '123' });
        expect(result).toEqual({ id: '123' });
    });

    it('should handle API errors gracefully', async () => {
        AxiosRequest.get = jest.fn().mockRejectedValue(new Error('API Error'));

        await expect(searchAddressItem({ id: '123' }, { iso2: 'US', onChange: jest.fn() })).rejects.toThrow(
            'API Error',
        );
    });
});

describe('searchAddressList', () => {
    it('should call the API with correct parameters and maps the response', async () => {
        AxiosRequest.get = jest.fn().mockResolvedValue({
            data: {
                items: [
                    { addressLine: '123 Main St', id: '1' },
                    { addressLine: '456 Elm St', id: '2' },
                ],
            },
        });

        const result = await searchAddressList('query', { iso2: 'US' });

        expect(AxiosRequest.get).toHaveBeenCalledWith('http://test/api/v1.0/address-lookup', {
            params: { addressToFind: 'query', countryCode: 'US' },
            signal: expect.any(Object),
        });
        expect(result).toEqual([
            { addressLine: '123 Main St', id: '1', label: '123 Main St', value: '123 Main St' },
            { addressLine: '456 Elm St', id: '2', label: '456 Elm St', value: '456 Elm St' },
        ]);
    });

    it('should return an empty array when no items are found', async () => {
        AxiosRequest.get = jest.fn().mockResolvedValue({ data: { items: [] } });

        const result = await searchAddressList('query', { iso2: 'US' });

        expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
        AxiosRequest.get = jest.fn().mockRejectedValue(new Error('API Error'));

        await expect(searchAddressList('query', { iso2: 'US' })).rejects.toThrow('API Error');
    });
});
