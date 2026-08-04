import { Tokens } from 'code/tokens';

import { Tokenizer } from './tokenizer';

describe('Tokenizer', () => {
    describe('replaceToken', () => {
        test('should replace token in string', () => {
            const str = Tokenizer.replaceToken('test {guid} string', Tokens.Guid, 'new guid');
            expect(str).toEqual('test new guid string');
        });

        test('should replace multiple tokens in string', () => {
            const str = Tokenizer.replaceToken('test {guid} {guid} string', Tokens.Guid, 'new guid');
            expect(str).toEqual('test new guid new guid string');
        });
    });

    describe('replaceTokens', () => {
        test('should replace multiple token in string', () => {
            const str = Tokenizer.replaceTokens('test {guid} string {title}', {
                [Tokens.Guid]: 'new guid',
                [Tokens.Title]: 'new title',
            });
            expect(str).toEqual('test new guid string new title');
        });
    });

    describe('cleanUpDashesInGuid', () => {
        test('should remove dashes from guid string', () => {
            const str = Tokenizer.cleanUpDashesInGuid('3542fca1-b6c0-4195-9c63-e7c75912850a');
            expect(str).toEqual('3542fca1b6c041959c63e7c75912850a');
        });
    });

    describe('findGuid', () => {
        test('should find guid is string', () => {
            const str = Tokenizer.findGuid('test 3542FCA1-B6C0-4195-9C63-E7C75912850A test');
            expect(str).toEqual('3542FCA1-B6C0-4195-9C63-E7C75912850A');
        });

        test('should return undefined if no guid found ', () => {
            const str = Tokenizer.findGuid('test 95-9c63-e7c75912850a test');
            expect(str).toEqual(undefined);
        });
    });
});
