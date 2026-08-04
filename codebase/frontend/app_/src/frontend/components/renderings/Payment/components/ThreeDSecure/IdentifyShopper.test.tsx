import * as React from 'react';
import { render } from '@testing-library/react';

import { envPublic } from 'code/env';

import IdentifyShopper from './IdentifyShopper';

jest.mock('frontend/services/logging', () => ({
    logger: { info: jest.fn(), error: jest.fn() },
}));

describe('IdentifyShopper', () => {
    const createProps = () => ({
        methodNotificationURL: 'methodNotificationURL',
        threeDSMethodURL: 'https://example.com/3ds',
        threeDSServerTransID: 'threeDSServerTransID',
        onError: jest.fn(),
        onTimeoutError: jest.fn(),
    });

    let originalSubmit: any;

    beforeAll(() => {
        originalSubmit = (HTMLFormElement.prototype as any).submit;
    });

    afterAll(() => {
        (HTMLFormElement.prototype as any).submit = originalSubmit;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should render hidden input and submit the form on mount', () => {
        jest.useFakeTimers();

        const submitSpy = jest.fn();
        (HTMLFormElement.prototype as any).submit = submitSpy;

        const props = createProps();

        const { container } = render(<IdentifyShopper {...props} />);

        const hidden = container.querySelector('input[name="threeDSMethodData"]');
        expect(hidden).toBeInTheDocument();

        expect(submitSpy).toHaveBeenCalled();
        expect(props.onError).not.toHaveBeenCalled();
        expect(props.onTimeoutError).not.toHaveBeenCalled();
    });

    it.each([
        // [methodNotificationURL, threeDSMethodURL, threeDSServerTransID, isValid]
        ['methodNotificationURL', 'https://example.com/3ds', 'threeDSServerTransID', true],
        ['', 'https://example.com/3ds', 'threeDSServerTransID', false],
        ['methodNotificationURL', 'invalidTthreeDSMethodURL', 'threeDSServerTransID', false],
        ['methodNotificationURL', 'https://example.com/3ds', '', false],
    ])(
        'calls onError when input validity=%s',
        (methodNotificationURL, threeDSMethodURL, threeDSServerTransID, isValid) => {
            jest.useFakeTimers();

            const onError = jest.fn();
            const onTimeoutError = jest.fn();

            const submitSpy = jest.fn();
            (HTMLFormElement.prototype as any).submit = submitSpy;

            render(
                <IdentifyShopper
                    methodNotificationURL={methodNotificationURL as string}
                    threeDSMethodURL={threeDSMethodURL as string}
                    threeDSServerTransID={threeDSServerTransID as string}
                    onError={onError}
                    onTimeoutError={onTimeoutError}
                />,
            );

            if (isValid) {
                expect(onError).not.toHaveBeenCalled();
                expect(submitSpy).toHaveBeenCalled();
            } else {
                expect(onError).toHaveBeenCalledTimes(1);
                expect(submitSpy).not.toHaveBeenCalled();
            }

            expect(onTimeoutError).not.toHaveBeenCalled();
        },
    );

    it('should call onTimeoutError if not unmounted before fingerprint timeout elapses', () => {
        jest.useFakeTimers();

        // make the timeout near-immediate
        envPublic.THREEDS2_FINGERPRINT_TIMEOUT_MLS = 1;

        const props = createProps();
        const submitSpy = jest.fn();
        (HTMLFormElement.prototype as any).submit = submitSpy;

        render(<IdentifyShopper {...props} />);

        jest.runAllTimers();

        expect(props.onTimeoutError).toHaveBeenCalledTimes(1);
        expect(props.onError).not.toHaveBeenCalled();
    });
});
