export const encodeSHA256 = async (data: string): Promise<string> => {
    const notation = 16;
    const characters = 2;

    const msgUint8 = new TextEncoder().encode(data);
    const buffer = await crypto.subtle.digest('SHA-256', msgUint8);

    const hashArray = Array.from(new Uint8Array(buffer));
    const hashHex = hashArray.map(byte => byte.toString(notation).padStart(characters, '0')).join('');

    return hashHex;
};
