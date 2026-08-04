import { Tokens } from 'code/tokens';

export class Tokenizer {
    public static guidRegex = /([0-9A-F]{8}[-][0-9A-F]{4}[-][0-9A-F]{4}[-][0-9A-Fa-f]{4}[-][0-9A-Fa-f]{12})/g;

    /**
     * Will replace tokens in string. Can replace multiple tokens.
     * @param initialString string to replace
     * @param token token to replace
     * @param value value to add
     */
    public static replaceToken(initialString: Nullable<string>, token: Tokens, value: string = ''): string {
        return initialString ? initialString.replace(new RegExp(token.toString(), 'g'), value) : '';
    }

    /**
     * Will replace multiple tokens in string.
     * @param initialString string to replace
     * @param tokens hash with tokens {token: value}
     */
    public static replaceTokens(initialString: Nullable<string>, tokens: { [key: string]: string }): string {
        if (!initialString) {
            return '';
        }

        let string = initialString;

        for (const token in tokens) {
            string = Tokenizer.replaceToken(string, token as Tokens, tokens[token]);
        }

        return string;
    }

    /**
     * Will return string without dashes.
     * @param initialString string to replace
     */
    public static cleanUpDashesInGuid(initialString: Nullable<string>): Nullable<string> {
        return initialString?.replace(/-/g, '');
    }

    /**
     * Will return guld from string if exists, if not then will return null
     * @param initialString string to search
     */
    public static findGuid(initialString: Nullable<string>): Nullable<string> {
        const match = initialString?.match(this.guidRegex);

        return match?.[0];
    }
}
