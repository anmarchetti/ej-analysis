import * as React from 'react';
import { render } from '@testing-library/react';

import ChallengeShopper from './ChallengeShopper';

jest.mock('frontend/services/logging', () => ({
    logger: { info: jest.fn(), error: jest.fn() },
}));

describe('ChallengeShopper', () => {
    let originalSubmit: any;

    beforeAll(() => {
        originalSubmit = (HTMLFormElement.prototype as any).submit;
    });

    afterAll(() => {
        (HTMLFormElement.prototype as any).submit = originalSubmit;
    });

    afterEach(() => {
        (HTMLFormElement.prototype as any).submit = originalSubmit;
    });

    const createProps = () => ({
        acsTransID: 'acsTransID',
        acsURL: 'https://acs.example.com/path',
        messageVersion: 'messageVersion',
        threeDSServerTransID: 'threeDSServerTransID',
        onError: jest.fn(),
    });

    it('should render form with hidden creq field and submit on mount', () => {
        const submitSpy = jest.fn();
        (HTMLFormElement.prototype as any).submit = submitSpy;

        const props = createProps();

        const { container } = render(<ChallengeShopper {...props} />);

        const hidden = container.querySelector('input[name="creq"]');

        expect(hidden).toBeInTheDocument();
        expect(submitSpy).toHaveBeenCalled();
        expect(props.onError).not.toHaveBeenCalled();
    });

    it.each([
        ['https://acs.example.com', 'threeDSServerTransID', 'acsTrans', true],
        ['invalidAcsURL', 'threeDSServerTransID', 'acsTrans', false],
        ['https://acs.example.com', '', 'acsTrans', false],
        ['https://acs.example.com', 'threeDSServerTransID', '', false],
    ])('should call onError if input data is not valid %s', (acsURL, threeDSServerTransID, acsTransID, isValid) => {
        const onError = jest.fn();
        const submitSpy = jest.fn();
        (HTMLFormElement.prototype as any).submit = submitSpy;

        render(
            <ChallengeShopper
                acsTransID={acsTransID as string}
                acsURL={acsURL as string}
                messageVersion='messageVersion'
                threeDSServerTransID={threeDSServerTransID as string}
                onError={onError}
            />,
        );

        if (isValid) {
            expect(onError).not.toHaveBeenCalled();
            expect(submitSpy).toHaveBeenCalled();
        } else {
            expect(onError).toHaveBeenCalledTimes(1);
            expect(submitSpy).not.toHaveBeenCalled();
        }
    });
});
