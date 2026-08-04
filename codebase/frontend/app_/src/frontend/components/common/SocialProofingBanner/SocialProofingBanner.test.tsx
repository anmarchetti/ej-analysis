import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SiteSettings from 'models/enum/SiteSettings';

import SocialProofingBanner, { ISocialProofingBannerProps } from './SocialProofingBanner';

const createProps = (): ISocialProofingBannerProps => ({
    dataIdToObserve: 'test-class',
    shouldHide: false,
});

let mockProps: ISocialProofingBannerProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/Cross', () => ({
    __esModule: true,
    default: () => <div data-tid='cross-icon' />,
}));

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text-with-links'>{field.value}</div>,
}));

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockButtonComponent(props);

        return (
            <button onClick={onClick} onKeyDown={jest.fn()} data-tid='button'>
                {children}
            </button>
        );
    },
}));

const mutationDisconnect = jest.fn();

const mockMutationObserver = jest.fn(callback => ({
    observe: callback,
    disconnect: mutationDisconnect,
    takeRecords: jest.fn(),
}));

const mockGetSetting = jest.fn().mockImplementation(key => {
    switch (key) {
        case SiteSettings.SocialProofingTrendingText:
            return 'message';
        case SiteSettings.SocialProofingTrendingIcon:
            return 'icon';
        default:
            return true;
    }
});

window.MutationObserver = mockMutationObserver;

describe('<SocialProofingBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                getSetting: mockGetSetting,
            },
        });
    });

    it('should NOT render when shouldHide is true', () => {
        mockProps.shouldHide = true;

        const { container } = render(<SocialProofingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isEnabled is false', () => {
        mockStores.layoutStore.getSetting = jest.fn().mockReturnValueOnce(false);

        const { container } = render(<SocialProofingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when message is empty', () => {
        mockStores.layoutStore.getSetting = jest.fn().mockReturnValue(true);

        const { container } = render(<SocialProofingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when proofitData component does NOT exist', () => {
        jest.spyOn(document, 'getElementById').mockReturnValueOnce(null);

        const { container } = render(<SocialProofingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when hotelViews number < MIN_NUMBER_OF_VIEWS', () => {
        jest.spyOn(document, 'getElementById').mockReturnValueOnce({
            getAttribute: jest.fn().mockReturnValueOnce('50'),
        } as unknown as HTMLElement);

        const { container } = render(<SocialProofingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when hotelViews number does NOT exist', () => {
        jest.spyOn(document, 'getElementById')
            .mockReturnValueOnce(null)
            .mockReturnValueOnce({
                getAttribute: jest.fn().mockReturnValueOnce(undefined),
            } as unknown as HTMLElement);

        const { container } = render(<SocialProofingBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(mutationDisconnect).toHaveBeenCalled();
    });

    it('should call MutationObserver disconnect on unmount', () => {
        const { unmount } = render(<SocialProofingBanner {...mockProps} />);

        expect(mutationDisconnect).not.toHaveBeenCalled();

        unmount();

        expect(mutationDisconnect).toHaveBeenCalled();
    });

    describe('Banner render when hotelViews number > MIN_NUMBER_OF_VIEWS', () => {
        beforeEach(() => {
            jest.spyOn(document, 'getElementById').mockReturnValueOnce({
                getAttribute: jest.fn().mockReturnValueOnce('150'),
            } as unknown as HTMLElement);
        });

        it('should standard render', () => {
            render(<SocialProofingBanner {...mockProps} />);

            expect(screen.getByTestId('social-proofing-banner')).toHaveClass('wrapper');
            expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('message');
            expect(screen.getByTestId('cross-icon')).toBeInTheDocument();
            expect(screen.getByRole('button')).toBeInTheDocument();
            expect(mutationDisconnect).not.toHaveBeenCalled();
            expect(mockJSSIMageNextProps).toHaveBeenCalledWith({
                field: { value: { src: 'icon', width: 24, height: 24 } },
            });
        });

        it('should render luxury styling when isLuxury is true', () => {
            mockProps.isLuxury = true;

            render(<SocialProofingBanner {...mockProps} />);

            expect(screen.getByTestId('social-proofing-banner-container')).toHaveClass('container luxury');
        });

        it('should add animation and close banner on button click', async () => {
            render(<SocialProofingBanner />);

            await userEvent.click(screen.getByRole('button'));

            expect(screen.getByTestId('social-proofing-banner')).toHaveClass('exit');
            await waitFor(() => {
                expect(screen.queryByTestId('social-proofing-banner')).not.toBeInTheDocument();
            });
        });

        it('should call onClose from props on button click', async () => {
            const mockOnClose = jest.fn();

            render(<SocialProofingBanner onClose={mockOnClose} />);

            await userEvent.click(screen.getByRole('button'));

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });
    });
});
