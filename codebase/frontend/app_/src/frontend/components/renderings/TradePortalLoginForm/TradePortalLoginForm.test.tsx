import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockNextAuthUseSession } from 'frontend/__mocks__/next-auth';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { TradePortalSitePath } from 'models/enum/SitePath';

import TradePortalLoginForm, { TTradePortalLoginFormProps } from './TradePortalLoginForm';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-react'),
    Placeholder: () => <div data-tid='placeholder' />,
}));

const mockTradePortalSSOLoginComponent = jest.fn();

jest.mock('./components/TradePortalSSOLogin/TradePortalSSOLogin', () => ({
    __esModule: true,
    default: props => {
        mockTradePortalSSOLoginComponent(props);

        return <div data-tid='trade-portal-sso-login' />;
    },
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

const mockUseSessionResponse = {
    data: { user: { name: 'User', number: '1', ref: 'user' } },
    status: 'authenticated',
};

mockNextAuthUseSession.mockReturnValue(mockUseSessionResponse);

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(),
        isLoginPage: true,
        isMaintenance: false,
    },
    userStore: {
        loginAgent: {
            consultantNameErrors: [] as string[],
            agentNumberErrors: [] as string[],
            passwordErrors: [] as string[],
        },
        onLogin: jest.fn(p => p),
        onLogout: jest.fn(),
        updateUserData: jest.fn(p => p),
        setRedirectUrl: jest.fn(p => p),
        isLoggingIn: false,
        redirectUrlLocal: 'redirectUrlLocal',
    },
    routerStore: {
        redirectTo: jest.fn(),
        clearQuery: jest.fn(),
    },
    trackingStore: {
        trackValidation: jest.fn(),
    },
    queryParamStore: {
        needLogout: jest.fn(),
    },
});

const createProps = (): TTradePortalLoginFormProps => ({
    fields: {
        AgentNumberPlaceholder: mockSitecoreField('Log in'),
        ConsultantNamePlaceholder: mockSitecoreField('Consultant Name'),
        BottomTipText: mockSitecoreField('bottom text'),
        HeaderText: mockSitecoreField('Header text'),
        LogInButtonText: mockSitecoreField('agent num'),
        LogInErrorText: mockSitecoreField('password'),
        PasswordPlaceholder: mockSitecoreField('errorText'),
        SSOEnabled: mockSitecoreField(true),
        OldLoginFlowEnabled: mockSitecoreField(true),
        SSOLogInBackgroundImage: mockSitecoreField(mockSitecoreImageField('SSOLogInBackground')),
        SSOLogInButtonLabel: mockSitecoreField('SSOLogInButtonLabel'),
        SSOLogInSubtitle: mockSitecoreField('SSOLogInSubtitle'),
        SSOLogInTitle: mockSitecoreField('SSOLogInTitle'),
    },
    params: {} as any,
    rendering: function (): void {
        null;
    },
});
let props;
let mockStores;

describe('<TradePortalLoginForm />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should NOT render when no fields', () => {
        props.fields = null;
        const { container } = render(<TradePortalLoginForm {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render active Log in button if there are No errors', () => {
        render(<TradePortalLoginForm {...props} />);

        expect(screen.getByRole('button', { name: props.fields!.LogInButtonText.value })).not.toBeDisabled();
    });

    it('should disable Log in button if there are errors', () => {
        mockStores.userStore.loginAgent.consultantNameErrors = ['error'];
        render(<TradePortalLoginForm {...props} />);
        expect(screen.getByRole('button', { name: props.fields!.LogInButtonText.value })).not.toBeDisabled();
    });

    it('should not call callback if errors', async () => {
        mockStores.userStore.loginAgent.consultantNameErrors = ['error'];
        render(<TradePortalLoginForm {...props} />);
        const logInButton = screen.getByRole('button', {
            name: props.fields!.LogInButtonText.value,
        });
        await userEvent.click(logInButton);
        expect(mockStores.userStore.onLogin).not.toHaveBeenCalled();
        expect(mockStores.trackingStore.trackValidation).toBeCalled();
    });

    it('should call callback if no errors', async () => {
        render(<TradePortalLoginForm {...props} />);
        const logInButton = screen.getByRole('button', {
            name: props.fields!.LogInButtonText.value,
        });
        await userEvent.click(logInButton);
        expect(mockStores.userStore.onLogin).toHaveBeenCalled();
    });

    it('should set redirect to the main page', async () => {
        render(<TradePortalLoginForm {...props} />);
        const logInButton = screen.getByRole('button', {
            name: props.fields!.LogInButtonText.value,
        });
        await userEvent.click(logInButton);
        expect(mockStores.userStore.setRedirectUrl).toHaveBeenCalledWith(TradePortalSitePath.Home);
    });

    it('should render TradePortalSSOLogin component', () => {
        props.params.isCentered = false;
        render(<TradePortalLoginForm {...props} />);

        expect(screen.getByTestId('trade-portal-sso-login')).toBeInTheDocument();
        expect(mockTradePortalSSOLoginComponent).toHaveBeenCalledWith({
            SSOEnabled: props.fields!.SSOEnabled,
            SSOLogInBackgroundImage: props.fields!.SSOLogInBackgroundImage,
            SSOLogInButtonLabel: props.fields!.SSOLogInButtonLabel,
            SSOLogInSubtitle: props.fields!.SSOLogInSubtitle,
            SSOLogInTitle: props.fields!.SSOLogInTitle,
            isCentered: props.params.isCentered,
        });
    });

    it('calls updateUserData when new user is authenticated and session has no error', () => {
        render(<TradePortalLoginForm {...props} />);

        expect(mockStores.userStore.updateUserData).toHaveBeenCalledWith(mockUseSessionResponse.data);
        expect(mockStores.routerStore.redirectTo).toHaveBeenCalledWith(mockStores.userStore.redirectUrlLocal);
        expect(mockStores.userStore.onLogout).not.toHaveBeenCalled();
    });

    it('calls onLogout when session contains an error', () => {
        mockNextAuthUseSession.mockReturnValueOnce({
            ...mockUseSessionResponse,
            data: { ...mockUseSessionResponse.data, error: true },
        });

        render(<TradePortalLoginForm {...props} />);

        expect(mockStores.userStore.onLogout).toHaveBeenCalled();
        expect(mockStores.userStore.updateUserData).not.toHaveBeenCalled();
        expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
    });

    it('should not logout when session is undefined', () => {
        mockNextAuthUseSession.mockReturnValueOnce({ data: undefined, status: 'unauthenticated' });

        render(<TradePortalLoginForm {...props} />);

        expect(mockStores.userStore.onLogout).not.toHaveBeenCalled();
    });

    it('should not update user data when session is undefined', () => {
        mockNextAuthUseSession.mockReturnValueOnce({ data: undefined, status: 'unauthenticated' });

        render(<TradePortalLoginForm {...props} />);

        expect(mockStores.userStore.updateUserData).not.toHaveBeenCalled();
        expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
    });

    describe('logout functionality', () => {
        it('should call logout and clear query if needLogout returns truthy value', () => {
            mockStores.queryParamStore.needLogout.mockReturnValueOnce(true);

            render(<TradePortalLoginForm {...props} />);

            expect(mockStores.userStore.onLogout).toHaveBeenCalled();
            expect(mockStores.routerStore.clearQuery).toHaveBeenCalled();
        });

        it('should NOT call logout and clear query if needLogout returns falsy value', () => {
            mockStores.queryParamStore.needLogout.mockReturnValueOnce(false);

            render(<TradePortalLoginForm {...props} />);

            expect(mockStores.userStore.onLogout).not.toHaveBeenCalled();
            expect(mockStores.routerStore.clearQuery).not.toHaveBeenCalled();
        });
    });
});
