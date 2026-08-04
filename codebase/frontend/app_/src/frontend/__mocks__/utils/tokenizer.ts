export const mockReplaceToken = jest.fn((phrase, token, replacer) => (phrase ? `${phrase} ${replacer}` : ''));

export const mockReplaceTokens = jest.fn((s, v) => `${s} ${Object.values(v)}`);

export const mockTokenizer = {
    replaceToken: mockReplaceToken,
    replaceTokens: mockReplaceTokens,
};
