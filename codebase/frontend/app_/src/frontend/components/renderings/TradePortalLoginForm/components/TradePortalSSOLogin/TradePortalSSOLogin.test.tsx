import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { TradePortalSitePath } from 'models/enum/SitePath';

import TradePortalSSOLogin, { TTradePortalSSOLoginProps } from './TradePortalSSOLogin';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text'>{field.value}</div>,
}));

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockButtonComponent(props);

        return (
            <div data-tid='button' onClick={onClick}>
                {children}
            </div>
        );
    },
}));

const mockJSSImageNextComponent = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNextComponent(props);

        return <div data-tid='jss-image-next' />;
    },
}));

const createStores = () => ({
    userStore: {
        isLoggingIn: false,
        onSSOLogin: jest.fn(),
        setRedirectUrl: jest.fn(),
    },
    layoutStore: { sitePath: 'sitePath' },
});

const resetMocks = (): TTradePortalSSOLoginProps => ({
    SSOEnabled: mockSitecoreField(true),
    SSOLogInBackgroundImage: mockSitecoreField(mockSitecoreImageField('SSOLogInBackground')),
    SSOLogInButtonLabel: mockSitecoreField('SSOLogInButtonLabel'),
    SSOLogInSubtitle: mockSitecoreField('SSOLogInSubtitle'),
    SSOLogInTitle: mockSitecoreField('SSOLogInTitle'),
    isCentered: false,
});
let mocks;
let mockStores;

describe('<TradePortalSSOLogin />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should NOT render when SSOEnabled is false', () => {
        mocks.SSOEnabled = mockSitecoreField(false);
        const { container } = render(<TradePortalSSOLogin {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard', () => {
        const { container } = render(<TradePortalSSOLogin {...mocks} />);

        expect(container.querySelector('.ssoLogin')).not.toHaveClass('isCentered');
        expect(container.querySelector('.ssoLogin')).toHaveClass('wrapper');
        expect(container.querySelector('.ssoLogin')).not.toHaveClass('secondItem');
        expect(mockJSSImageNextComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                field: mocks.SSOLogInBackgroundImage,
                fill: true,
            }),
        );
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mocks.SSOLogInTitle.value);
        expect(screen.getByTestId('rich-text')).toHaveTextContent(mocks.SSOLogInSubtitle.value);
        expect(mockButtonComponent).toHaveBeenCalledWith({
            isReversed: true,
            disabled: mockStores.userStore.isLoggingIn,
            dataTid: 'sso-sign-in-button',
            className: 'ssoLoginButton',
        });
        expect(screen.getByTestId('button')).toHaveTextContent(mocks.SSOLogInButtonLabel.value);
    });

    it('should render classname isCentered when isCentered prop is true', () => {
        mocks.isCentered = true;
        const { container } = render(<TradePortalSSOLogin {...mocks} />);

        expect(container.querySelector('.ssoLogin')).toHaveClass('isCentered');
    });

    it('should set disabled button prop when isButtonDisabled prop is true', () => {
        mockStores.userStore.isLoggingIn = true;
        render(<TradePortalSSOLogin {...mocks} />);

        expect(mockButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({ disabled: mockStores.userStore.isLoggingIn }),
        );
    });

    it('should set disabled button prop when isButtonDisabled prop is true', () => {
        render(<TradePortalSSOLogin {...mocks} />);

        fireEvent.click(screen.getByTestId('button'));

        expect(mockStores.userStore.setRedirectUrl).toHaveBeenCalledWith(TradePortalSitePath.Home);
        expect(mockStores.userStore.onSSOLogin).toHaveBeenCalledWith(
            `${mockStores.layoutStore.sitePath}${TradePortalSitePath.Login}`,
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<TradePortalSSOLogin {...mocks} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
