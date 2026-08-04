import { handleEnterAndSpacePress } from './event.utils';

describe('handleEnterAndSpacePress', () => {
    test('should call action if charcode is 13', () => {
        const event = { charCode: 13 };
        const action = jest.fn();
        handleEnterAndSpacePress(event, action);
        expect(action).toBeCalled();
    });

    test('should call action if charcode is 32', () => {
        const event = { charCode: 32 };
        const action = jest.fn();
        handleEnterAndSpacePress(event, action);
        expect(action).toBeCalled();
    });

    test('should not call action if charcode is not suitable', () => {
        const event = { charCode: 3 };
        const action = jest.fn();
        handleEnterAndSpacePress(event, action);
        expect(action).not.toBeCalled();
    });
});
