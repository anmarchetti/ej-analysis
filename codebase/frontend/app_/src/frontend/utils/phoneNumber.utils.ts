export const stripLeadingZeroForUKAndIreland = (phone: string, dialingCode?: string): string => {
    if ((dialingCode === '44' || dialingCode === '353') && phone.startsWith('0')) {
        return phone.substring(1);
    }

    return phone;
};

export const trimPhoneNumber = (phone?: string, dialingCode?: string): string => {
    if (!phone || !dialingCode) return phone || '';

    phone = phone.replace(/\s/g, ''); // remove all whitespaces

    if (phone.startsWith(dialingCode)) {
        // International code is in the source, remove it
        phone = phone.replace(dialingCode, '');
    }

    if (phone.startsWith('0')) {
        phone = phone.substring(1); // remove leading zero
    }

    return phone;
};
