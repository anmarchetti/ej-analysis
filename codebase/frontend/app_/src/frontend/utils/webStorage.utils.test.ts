import {
    getWebStorageItem,
    parseValueFromLocalStorage,
    removeWebStorageItem,
    setWebStorageItem,
    updateWebStorageItem,
} from './webStorage.utils';

describe('webStorage.utils', () => {
    let storage: Storage;

    beforeEach(() => {
        storage = window.localStorage;
        storage.clear();
    });

    describe('getWebStorageItem', () => {
        it('should return the value from storage without parsing if shouldParse is false', () => {
            const key = 'myKey';
            const value = 'myValue';
            storage.setItem(key, value);
            const result = getWebStorageItem(key, false, storage);
            expect(result).toBe(value);
        });

        it('should return the parsed value from storage if shouldParse is true', () => {
            const key = 'myKey';
            const value = '{"name":"John","age":30}';
            storage.setItem(key, value);
            const result = getWebStorageItem(key, true, storage);
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        it('should default shouldParse to false if not provided', () => {
            const key = 'myKey';
            const value = 'myValue';
            storage.setItem(key, value);
            const result = getWebStorageItem(key, undefined, storage);
            expect(result).toBe(value);
        });

        it('should return undefined if an error occurs', () => {
            const key = 'myKey';
            const mockStorage: Storage = {
                length: 0,
                clear: jest.fn(),
                key: jest.fn(),
                removeItem: jest.fn(),
                setItem: jest.fn(),
                getItem: jest.fn(() => {
                    throw new Error('Error occurred');
                }),
            };
            const result = getWebStorageItem(key, false, mockStorage);
            expect(result).toBeUndefined();
        });
    });

    describe('setWebStorageItem', () => {
        it('should set the value in storage', () => {
            const key = 'myKey';
            const value = 'myValue';
            setWebStorageItem(key, value, storage);
            const result = storage.getItem(key);
            expect(result).toBe(value);
        });

        it('should stringify the value if it is not a string', () => {
            const key = 'myKey';
            const value = { name: 'John', age: 30 };
            setWebStorageItem(key, value, storage);
            const result = storage.getItem(key);
            expect(result).toBe(JSON.stringify(value));
        });
    });

    describe('removeWebStorageItem', () => {
        it('should remove the value from storage', () => {
            const key = 'myKey';
            const value = 'myValue';
            storage.setItem(key, value);
            removeWebStorageItem(key, storage);
            const result = storage.getItem(key);
            expect(result).toBeNull();
        });
    });

    describe('updateWebStorageItem', () => {
        it('should merge new value with existing data', () => {
            const key = 'myKey';
            storage.setItem(key, JSON.stringify({ name: 'John', age: 30 }));
            updateWebStorageItem(key, { age: 31, city: 'NYC' }, storage);

            expect(getWebStorageItem(key, true, storage)).toEqual({ name: 'John', age: 31, city: 'NYC' });
        });

        it('should create new entry when key does NOT exist', () => {
            const key = 'newKey';
            updateWebStorageItem(key, { name: 'Jane', age: 25 }, storage);

            expect(getWebStorageItem(key, true, storage)).toEqual({ name: 'Jane', age: 25 });
        });

        it('should handle empty stored data gracefully', () => {
            const key = 'myKey';
            updateWebStorageItem(key, { name: 'Bob' }, storage);

            expect(getWebStorageItem(key, true, storage)).toEqual({ name: 'Bob' });
        });

        it('should preserve existing properties when updating with partial data', () => {
            const key = 'myKey';
            storage.setItem(key, JSON.stringify({ name: 'Alice', age: 28, country: 'USA' }));
            updateWebStorageItem(key, { status: 'active' }, storage);

            expect(getWebStorageItem(key, true, storage)).toEqual({
                name: 'Alice',
                age: 28,
                country: 'USA',
                status: 'active',
            });
        });

        it('should use localStorage by default when storage is NOT provided', () => {
            const key = 'defaultStorageKey';
            localStorage.setItem(key, JSON.stringify({ role: 'user' }));
            updateWebStorageItem(key, { permissions: ['read', 'write'] });

            expect(getWebStorageItem(key, true)).toEqual({ role: 'user', permissions: ['read', 'write'] });
        });

        it('should overwrite existing properties with new values', () => {
            const key = 'myKey';
            storage.setItem(key, JSON.stringify({ status: 'inactive', level: 1 }));
            updateWebStorageItem(key, { status: 'active', level: 2 }, storage);

            expect(getWebStorageItem(key, true, storage)).toEqual({ status: 'active', level: 2 });
        });
    });

    describe('parseValueFromLocalStorage', () => {
        it('should parse the value from localStorage if it is an array', () => {
            const value = '[[1,2,3]]';
            const result = parseValueFromLocalStorage(value);
            expect(result).toEqual([1, 2, 3]);
        });

        it('should parse the value from localStorage if it is not an array', () => {
            const value = '{"name":"John","age":30}';
            const result = parseValueFromLocalStorage(value);
            expect(result).toEqual({ name: 'John', age: 30 });
        });
    });
});
