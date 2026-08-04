import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as mobxModule from 'mobx';

import * as scrollUtilsModule from 'frontend/utils/scroll.utils';
import * as uiUtilsModule from 'frontend/utils/ui.utils';

import SummaryEditButton from './SummaryEditButton';

const mockRedirectTo = jest.fn().mockResolvedValue(undefined);
const mockBuildHotelDetailsQuery = jest.fn().mockReturnValue('?queryParams=test');
let mockIsExtrasPage = false;
let mockIsValidatingPackage = false;
let mockIsLoadingOffer = false;

const mockBookingStore = {
    get isValidatingPackage() {
        return mockIsValidatingPackage;
    },
    get isLoadingOffer() {
        return mockIsLoadingOffer;
    },
};

jest.mock('mobx', () => ({
    ...jest.requireActual('mobx'),
    when: jest.fn(predicate => {
        if (predicate()) {
            return Promise.resolve();
        }

        return Promise.resolve();
    }),
}));

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: mapStateToProps =>
        mapStateToProps({
            layoutStore: {
                isExtrasPage: mockIsExtrasPage,
                getPhrase: jest.fn((key: string) => key),
            },
            routerStore: { redirectTo: mockRedirectTo },
            queryParamStore: { buildHotelDetailsQuery: mockBuildHotelDetailsQuery },
            bookingStore: mockBookingStore,
        }),
}));

jest.mock('frontend/utils/scroll.utils', () => ({
    waitForFrames: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

jest.mock('models/enum/SitePath', () => ({
    __esModule: true,
    default: {
        Extras: '/booking',
    },
}));

describe('<SummaryEditButton />', () => {
    let whenSpy: jest.SpyInstance;
    let waitForFramesSpy: jest.SpyInstance;
    let scrollToElementSpy: jest.SpyInstance;

    beforeEach(() => {
        mockIsExtrasPage = false;
        mockIsValidatingPackage = false;
        mockIsLoadingOffer = false;

        jest.spyOn(window, 'scrollTo').mockImplementation();
        whenSpy = jest.spyOn(mobxModule, 'when');
        waitForFramesSpy = jest.spyOn(scrollUtilsModule, 'waitForFrames');
        scrollToElementSpy = jest.spyOn(uiUtilsModule, 'scrollToElement');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should render the button with dictionary key text', () => {
        render(<SummaryEditButton dataTid='test-edit-button' />);

        expect(screen.getByTestId('test-edit-button')).toHaveTextContent('Globals.Buttons.Edit');
    });

    it('should navigate to extras page, wait for validation/loading, and wait for DOM render when NOT on extras page', async () => {
        const user = userEvent.setup();
        mockIsExtrasPage = false;

        const mockElement = document.createElement('div');
        jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

        render(<SummaryEditButton dataTid='test-edit-button' scrollAnchorId='test-anchor' />);

        await user.click(screen.getByTestId('test-edit-button'));

        await waitFor(() => {
            expect(mockBuildHotelDetailsQuery).toHaveBeenCalled();
            expect(mockRedirectTo).toHaveBeenCalledWith('/booking?queryParams=test');
            expect(whenSpy).toHaveBeenCalled();
            expect(waitForFramesSpy).toHaveBeenCalled();
            expect(document.getElementById).toHaveBeenCalledWith('test-anchor');
            expect(scrollToElementSpy).toHaveBeenCalledWith(mockElement, 15);
        });
    });

    it('should NOT navigate or scroll when already on extras page and no scrollAnchorId provided', async () => {
        const user = userEvent.setup();
        mockIsExtrasPage = true;

        render(<SummaryEditButton dataTid='test-edit-button' />);

        await user.click(screen.getByTestId('test-edit-button'));

        await waitFor(() => {
            expect(mockRedirectTo).not.toHaveBeenCalled();
            expect(whenSpy).not.toHaveBeenCalled();
            expect(waitForFramesSpy).not.toHaveBeenCalled();
            expect(scrollToElementSpy).not.toHaveBeenCalled();
        });
    });

    it('should wait for combined validation and loading predicate', async () => {
        const user = userEvent.setup();
        mockIsExtrasPage = false;

        render(<SummaryEditButton dataTid='test-edit-button' />);

        await user.click(screen.getByTestId('test-edit-button'));

        await waitFor(() => {
            expect(whenSpy).toHaveBeenCalledTimes(1);

            const whenPredicate = whenSpy.mock.calls[0][0];
            expect(whenPredicate).toBeDefined();

            mockIsValidatingPackage = false;
            mockIsLoadingOffer = false;
            expect(whenPredicate()).toBe(true);

            mockIsValidatingPackage = true;
            expect(whenPredicate()).toBe(false);

            mockIsValidatingPackage = false;
            mockIsLoadingOffer = true;
            expect(whenPredicate()).toBe(false);
        });
    });

    describe('with scrollAnchorId prop', () => {
        it('should scroll to anchor when provided and anchor exists', async () => {
            const user = userEvent.setup();
            mockIsExtrasPage = false;

            const mockElement = document.createElement('div');
            jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

            render(<SummaryEditButton dataTid='test-edit-button' scrollAnchorId='scroll-anchor-cabin-bags' />);

            await user.click(screen.getByTestId('test-edit-button'));

            await waitFor(() => {
                expect(document.getElementById).toHaveBeenCalledWith('scroll-anchor-cabin-bags');
                expect(scrollToElementSpy).toHaveBeenCalledWith(mockElement, 15);
            });
        });

        it('should scroll to anchor when already on extras page', async () => {
            const user = userEvent.setup();
            mockIsExtrasPage = true;

            const mockElement = document.createElement('div');
            jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

            render(<SummaryEditButton dataTid='test-edit-button' scrollAnchorId='scroll-anchor-transfer' />);

            await user.click(screen.getByTestId('test-edit-button'));

            await waitFor(() => {
                expect(mockRedirectTo).not.toHaveBeenCalled();
                expect(whenSpy).not.toHaveBeenCalled();
                expect(waitForFramesSpy).not.toHaveBeenCalled();
                expect(document.getElementById).toHaveBeenCalledWith('scroll-anchor-transfer');
                expect(scrollToElementSpy).toHaveBeenCalledWith(mockElement, 15);
            });
        });

        it('should NOT scroll when scrollAnchorId is not provided', async () => {
            const user = userEvent.setup();
            mockIsExtrasPage = true;

            render(<SummaryEditButton dataTid='test-edit-button' />);

            await user.click(screen.getByTestId('test-edit-button'));

            await waitFor(() => {
                expect(scrollToElementSpy).not.toHaveBeenCalled();
            });
        });

        it('should NOT scroll when element is not found', async () => {
            const user = userEvent.setup();
            mockIsExtrasPage = true;

            jest.spyOn(document, 'getElementById').mockReturnValue(null);

            render(<SummaryEditButton dataTid='test-edit-button' scrollAnchorId='nonexistent-anchor' />);

            await user.click(screen.getByTestId('test-edit-button'));

            await waitFor(() => {
                expect(document.getElementById).toHaveBeenCalledWith('nonexistent-anchor');
                expect(scrollToElementSpy).not.toHaveBeenCalled();
            });
        });
    });

    describe('onClick callback', () => {
        it('should call onClick callback when provided', async () => {
            const user = userEvent.setup();
            const mockOnClick = jest.fn();

            render(<SummaryEditButton dataTid='test-edit-button' onClick={mockOnClick} />);

            await user.click(screen.getByTestId('test-edit-button'));

            await waitFor(() => {
                expect(mockOnClick).toHaveBeenCalledTimes(1);
            });
        });

        it('should NOT throw error when onClick is not provided', async () => {
            const user = userEvent.setup();

            render(<SummaryEditButton dataTid='test-edit-button' />);

            await user.click(screen.getByTestId('test-edit-button'));
        });
    });

    describe('isHidden prop', () => {
        it('should NOT render button when isHidden is true', () => {
            render(<SummaryEditButton dataTid='test-edit-button' isHidden={true} scrollAnchorId='test-anchor' />);

            expect(screen.queryByTestId('test-edit-button')).not.toBeInTheDocument();
        });

        it('should render button when isHidden is false or undefined', () => {
            const { rerender } = render(
                <SummaryEditButton dataTid='test-edit-button' isHidden={false} scrollAnchorId='test-anchor' />,
            );

            expect(screen.getByTestId('test-edit-button')).toBeInTheDocument();

            rerender(<SummaryEditButton dataTid='test-edit-button' scrollAnchorId='test-anchor' />);

            expect(screen.getByTestId('test-edit-button')).toBeInTheDocument();
        });
    });

    describe('loading state', () => {
        it('should disable button during async operations', async () => {
            const user = userEvent.setup();
            mockIsExtrasPage = false;

            let resolveRedirect: () => void;
            const redirectPromise = new Promise<void>(resolve => {
                resolveRedirect = resolve;
            });
            mockRedirectTo.mockReturnValue(redirectPromise);

            render(<SummaryEditButton dataTid='test-edit-button' />);

            const button = screen.getByTestId('test-edit-button');

            expect(button).not.toBeDisabled();

            await user.click(button);

            await waitFor(() => {
                expect(button).toBeDisabled();
            });

            resolveRedirect!();

            await waitFor(() => {
                expect(button).not.toBeDisabled();
            });
        });
    });
});
