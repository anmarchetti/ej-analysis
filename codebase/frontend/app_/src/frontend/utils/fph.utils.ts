import { createVerify } from 'node:crypto';

import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';

const SIGNED_FIELDS = [FlightPlusHotelQueryParamName.Discount];

export const canonicalise = (params: Record<string, string>): string =>
    Object.keys(params)
        .sort((a, b) => a.localeCompare(b))
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

export const validateBase64 = (s: string): boolean => /^[A-Za-z0-9+/]*={0,2}$/.test(s);

export const verifyFphSignature = (query: Record<string, string>, publicKey: string): boolean => {
    const normalisedPublicKey = publicKey.replaceAll(String.raw`\n`, '\n');
    const signature = (query[FlightPlusHotelQueryParamName.Signature] ?? '').replaceAll(' ', '+');

    if (!signature || !validateBase64(signature)) {
        return false;
    }

    try {
        const canonical = canonicalise(
            Object.fromEntries(SIGNED_FIELDS.map(key => [key, query[key]])) as Record<string, string>,
        );

        const verifier = createVerify('RSA-SHA256');
        verifier.update(canonical);
        verifier.end();

        return verifier.verify(normalisedPublicKey, signature, 'base64');
    } catch {
        return false;
    }
};
