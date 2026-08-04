import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';

import { createMockStores } from 'frontend/__mocks__';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import MobileBackButton from './MobileBackButton';

jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid={props.dataTid} onClick={onClick}>
                {children}
            </button>
        );
    },
}));

let mockStores;
let mockRouter;

describe('<MobileBackButton />', () => {
    beforeEach(() => {
        mockButtonProps.mockClear();

        mockRouter = {
            query: {},
        };

        jest.mocked(useRouter).mockReturnValue(mockRouter as any);

        mockStores = createMockStores({
            layoutStore: {
                getPhrase: jest.fn(phrase => phrase),
            },
        });
    });

    it('should NOT render when backUrl is NOT provided', () => {
        mockRouter.query[QueryParamName.BackUrl] = undefined;

        const { container } = render(<MobileBackButton />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render when backUrl is provided', () => {
        mockRouter.query[QueryParamName.BackUrl] = 'https://example.com';

        render(<MobileBackButton />);

        expect(screen.getByTestId('mobile-back-button-container')).toBeInTheDocument();
        expect(screen.getByTestId('mobile-back-button')).toBeInTheDocument();
    });

    it('should use default back button text from dictionary when no custom text is provided', () => {
        mockRouter.query[QueryParamName.BackUrl] = 'https://example.com';

        render(<MobileBackButton />);

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsButtonsBack);
        expect(screen.getByTestId('mobile-back-button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsBack);
    });

    it('should use buttonText prop when provided', () => {
        mockRouter.query[QueryParamName.BackUrl] = 'https://example.com';

        render(<MobileBackButton buttonText='Custom Back' />);

        expect(screen.getByTestId('mobile-back-button')).toHaveTextContent('Custom Back');
        expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalled();
    });

    it('should use backButtonText from query params when provided', () => {
        mockRouter.query[QueryParamName.BackUrl] = 'https://example.com';
        mockRouter.query[QueryParamName.BackButtonText] = 'Query%20Back%20Text';

        render(<MobileBackButton />);

        expect(screen.getByTestId('mobile-back-button')).toHaveTextContent('Query Back Text');
    });

    it('should decode URI encoded backButtonText from query params', () => {
        mockRouter.query[QueryParamName.BackUrl] = 'https://example.com';
        mockRouter.query[QueryParamName.BackButtonText] = 'Back%20to%20Home%20%26%20More';

        render(<MobileBackButton />);

        expect(screen.getByTestId('mobile-back-button')).toHaveTextContent('Back to Home & More');
    });

    it('should prioritize backButtonText from query over buttonText prop', () => {
        mockRouter.query[QueryParamName.BackUrl] = 'https://example.com';
        mockRouter.query[QueryParamName.BackButtonText] = 'Query%20Text';

        render(<MobileBackButton buttonText='Prop Text' />);

        expect(screen.getByTestId('mobile-back-button')).toHaveTextContent('Query Text');
        expect(screen.getByTestId('mobile-back-button')).not.toHaveTextContent('Prop Text');
    });

    it('should navigate to backUrl when button is clicked', async () => {
        const backUrl = 'https://example.com/back';
        mockRouter.query[QueryParamName.BackUrl] = backUrl;

        const originalLocation = globalThis.location;
        Object.defineProperty(globalThis, 'location', {
            value: { href: '' },
            writable: true,
            configurable: true,
        });

        render(<MobileBackButton />);

        await userEvent.click(screen.getByTestId('mobile-back-button'));

        expect(globalThis.location.href).toBe(backUrl);

        Object.defineProperty(globalThis, 'location', {
            value: originalLocation,
            writable: true,
            configurable: true,
        });
    });

    it('should apply className prop to container', () => {
        mockRouter.query[QueryParamName.BackUrl] = 'https://example.com';

        render(<MobileBackButton className='custom-class' />);

        expect(screen.getByTestId('mobile-back-button-container')).toHaveClass('custom-class');
    });

    it('should pass correct props to Button component', () => {
        mockRouter.query[QueryParamName.BackUrl] = 'https://example.com';

        render(<MobileBackButton className='test-class' />);

        expect(mockButtonProps).toHaveBeenCalledWith({
            isTransparent: true,
            isFullWidth: true,
            dataTid: 'mobile-back-button',
        });
    });
});
