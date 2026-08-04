import { EMAIL_MAX_LENGTH, EMAIL_PATTERN } from 'code/validation.config';
import { TValidationRules } from 'models/data/validation/IValidationRules';

import 'reflect-metadata';

export const METADATA_KEY = '@validate';

/** Set object metadata. */
export function validate(validationRule: TValidationRules[]) {
    return function validateDecorator(target: AnyObject, propertyKey: string): void {
        Reflect.defineMetadata(METADATA_KEY, validationRule, target, propertyKey);
    };
}

export function getValidatorRule(target: AnyObject, propertyKey: string): TValidationRules[] {
    return Reflect.getMetadata(METADATA_KEY, target, propertyKey);
}

/// Luhn Validation (https://en.wikipedia.org/wiki/Luhn_algorithm#Implementation_of_standard_Mod_10)
/// The last digit of a credit card number is a checksum, this algorithm checks that check sum
/// Implementation based on: https://gist.github.com/ShirtlessKirk/2134376
export function luhnValidation(cardNumber: string): boolean {
    // Pre-calculated results for values 0-9, the result varies based on the position
    // from the end of the string.
    // If the position from the end of the string is odd, the result is in the first array,
    // If the position from the end of the string is even the result is in the second array.
    const preCalculatedResults = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 2, 4, 6, 8, 1, 3, 5, 7, 9],
    ];

    // Need to know if the current position is odd or even - 0 for odd, 1 for even
    // (this is so we can index into the results array)
    // We start at position 1 - so default to odd
    let oddOrEven = 0;

    let sum = 0;
    let position = cardNumber.length;

    while (position--) {
        sum += preCalculatedResults[oddOrEven][parseInt(cardNumber.charAt(position), 10)];

        // Flip the odd or even tracking variable
        oddOrEven ^= 1;
    }

    return sum % 10 === 0 && sum > 0;
}

/**
 * General email validation
 */
export function checkIfEmailValid(email: string): boolean {
    return !(!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email));
}

/**
 * Levenshtein distance algorithm https://en.wikipedia.org/wiki/Levenshtein_distance
 * Used to measure the minimum number of single character edits (insertions, deletions or substitutions)
 * required to change one word into the other.
 * @param source
 * @param target
 * @returns {number}
 *
 */
export function levenshteinDistance(source: string, target: string): number {
    const sourceLength = source.length;
    const targetLength = target.length;
    const distanceMatrix: number[][] = [];

    for (let i = 0; i <= sourceLength; i++) {
        distanceMatrix[i] = [];
        distanceMatrix[i][0] = i;
    }

    for (let j = 1; j <= targetLength; j++) {
        distanceMatrix[0][j] = j;
    }

    for (let j = 1; j <= targetLength; j++) {
        for (let i = 1; i <= sourceLength; i++) {
            if (source[i - 1] === target[j - 1]) {
                distanceMatrix[i][j] = distanceMatrix[i - 1][j - 1];
            } else {
                distanceMatrix[i][j] = Math.min(
                    distanceMatrix[i - 1][j] + 1, // deletion
                    distanceMatrix[i][j - 1] + 1, // insertion
                    distanceMatrix[i - 1][j - 1] + 1, // substitution
                );
            }
        }
    }

    return distanceMatrix[sourceLength][targetLength];
}
