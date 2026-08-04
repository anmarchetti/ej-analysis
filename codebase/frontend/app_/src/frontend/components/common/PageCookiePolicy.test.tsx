import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as cookiesUtils from 'frontend/utils/cookies.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { PageCookiePolicy } from './PageCookiePolicy';

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children }) => (
        <button onClick={onClick} onKeyDown={jest.fn()}>
            {children}
        </button>
    ),
}));

const mockGetCookie = jest.spyOn(cookiesUtils, 'getCookie').mockReturnValue('');
const mockSetCookie = jest.spyOn(cookiesUtils, 'setCookie').mockImplementation(jest.fn());

const resetMocks = () => ({
    getPhrase: jest.fn(p => p),
    getSetting: () => 'test',
});

let mocks;

describe('<PageCookiePolicy />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<PageCookiePolicy {...mocks} />);

        expect(screen.getByTestId('cookie-policy-wrapper')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.CookiePolicyLabelsAccept);
    });

    it('should not render when cookie-policy cookie exists', () => {
        mockGetCookie.mockReturnValueOnce('1');

        const { container } = render(<PageCookiePolicy {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should close call setCookie and close component on button click', async () => {
        const { rerender } = render(<PageCookiePolicy {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockSetCookie).toHaveBeenCalled();

        rerender(<PageCookiePolicy {...mocks} />);

        expect(screen.queryByTestId('cookie-policy-wrapper')).not.toBeInTheDocument();
    });
});
