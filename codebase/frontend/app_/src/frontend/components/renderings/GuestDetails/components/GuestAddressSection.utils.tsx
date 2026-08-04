import { getWepApiUri } from 'code/endpoints';
import { createDebouncedRequest } from 'frontend/utils/debouncedRequest.utils';
import AxiosRequest from 'frontend/utils/request';

export const searchAddressItem = createDebouncedRequest<
    [option: { id: string }, params: { iso2: string; onChange: (data) => void }],
    { id: string }
>((signal, { id }, params) => {
    const { iso2 = 'GB', onChange } = params;

    return AxiosRequest.get(`${getWepApiUri()}/address-lookup/retrieve`, {
        signal,
        params: {
            value: id,
            countryCode: iso2,
        },
    }).then(({ data }) => {
        onChange(data);

        return data;
    });
}, 300);

export const searchAddressList = createDebouncedRequest<[query: string, params: { iso2: string }], { id: string }[]>(
    (signal, query, params) => {
        const { iso2 = 'GB' } = params;

        return AxiosRequest.get(`${getWepApiUri()}/address-lookup`, {
            signal,
            params: {
                addressToFind: query,
                countryCode: iso2,
            },
        }).then(
            r =>
                r.data?.items?.map(item => ({
                    ...item,
                    label: item.addressLine,
                    value: item.addressLine,
                })) ?? [],
        );
    },
    300,
);
