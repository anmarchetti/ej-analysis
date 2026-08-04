/**
 * Return string with guests info: 1 Adl 2 Chld 3 Inf
 * @param adults number of adults
 * @param children number of children
 * @param infants number of infants
 */
export const formatGuests = (adults: number, children: number, infants: number) => {
    const values: string[] = [];

    if (adults) {
        values.push(`${adults} Adl`);
    }

    if (children) {
        values.push(`${children} Chld`);
    }

    if (infants) {
        values.push(`${infants} Inf`);
    }

    return values.join(', ');
};
