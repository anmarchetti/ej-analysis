/** if user comes from easyjet.com then we have special query params */
export const isDotcomQuery = (query: qs.ParsedQs): boolean => {
    const { destinations, departure_airports, dd, rd } = query as { [key: string]: string | undefined };

    return !!(destinations && departure_airports && dd && rd);
};
