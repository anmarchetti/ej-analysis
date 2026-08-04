import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Anchor } from 'code/anchors';
import { MockLocation } from 'frontend/__mocks__/location';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import {
    IFooterCopyrightProps,
    PageFooterCopyright,
    TERMS_PANEL_ID,
    TRACK_HOMEPAGE_ACTION_PARAMS,
} from './PageFooterCopyright';

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('frontend/components/common/AccordionButton', () => ({
    __esModule: true,
    default: ({ onClick }) => <div data-tid='accordion-button' onClick={onClick} />,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ onLinkClick }) => (
        <div data-tid='rich-text-with-links' onClick={() => onLinkClick({ target: { innerText: 'test-value' } })} />
    ),
}));

const createRouter = () => ({
    query: {},
    pathname: '/',
    asPath: '/',
    events: {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    },
    push: jest.fn(() => Promise.resolve(true)),
    prefetch: jest.fn(() => Promise.resolve(true)),
    replace: jest.fn(() => Promise.resolve(true)),
});

jest.mock('next/router', () => ({
    useRouter: () => mockRouter,
}));

let mockRouter;
let mockProps;

const createProps = (): IFooterCopyrightProps => ({
    fields: {
        LinkText: mockSitecoreField('link-value'),
        Description: mockSitecoreField('description-value'),
    },
    params: {},
    rendering: {},
    toggleOfferConditions: jest.fn(),
    trackHomepageAction: jest.fn(),
    showOfferConditions: false,
});

describe('<PageFooterCopyright />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockRouter = createRouter();
        mockProps = createProps();
    });

    it('should standard render', () => {
        const { getByTestId, container } = render(<PageFooterCopyright {...mockProps} />);

        expect(container.querySelector(`#${TERMS_PANEL_ID}`)).toBeInTheDocument();
        expect(getByTestId('accordion-button')).toBeInTheDocument();
        expect(getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.FooterColumnInner,
            rendering: mockProps.rendering,
        });
    });

    it('should NOT render both AccordionButton and RichTextWithLinks when Fields are null', () => {
        mockProps.fields = null;
        const { queryByTestId } = render(<PageFooterCopyright {...mockProps} />);

        expect(queryByTestId('accordion-button')).not.toBeInTheDocument();
        expect(queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('should subscribe/unsubscribe to Router events on mount/unmount', () => {
        const { unmount } = render(<PageFooterCopyright {...mockProps} />);

        expect(mockRouter.events.on).toHaveBeenCalledTimes(1);
        unmount();
        expect(mockRouter.events.off).toHaveBeenCalledTimes(1);
    });

    it('should call toggleOfferConditions on routeChangeStart when showOfferConditions is truthy', () => {
        mockProps.showOfferConditions = true;
        render(<PageFooterCopyright {...mockProps} />);
        const eventListener = mockRouter.events.on.mock.calls[0][1];

        eventListener();

        expect(mockProps.toggleOfferConditions).toHaveBeenCalledWith(false);
    });

    it('should not call toggleOfferConditions on routeChangeStart when showOfferConditions is falsy', () => {
        render(<PageFooterCopyright {...mockProps} />);
        const eventListener = mockRouter.events.on.mock.calls[0][1];

        eventListener();

        expect(mockProps.toggleOfferConditions).not.toHaveBeenCalled();
    });

    describe('AccordionButton click', () => {
        it('should call TrackHomePageAction with FooterOfferConditionsOpened when ShowOfferConditions is false', async () => {
            const { getByTestId } = render(<PageFooterCopyright {...mockProps} />);
            const accordion = getByTestId('accordion-button');

            await userEvent.click(accordion);

            expect(mockProps.trackHomepageAction).toHaveBeenCalledTimes(1);
            expect(mockProps.trackHomepageAction).toHaveBeenCalledWith(
                EventTypes.FooterOfferConditionsOpened,
                TRACK_HOMEPAGE_ACTION_PARAMS,
            );
            expect(mockProps.toggleOfferConditions).toHaveBeenCalledTimes(1);
            expect(mockProps.toggleOfferConditions).toHaveBeenCalledWith(true);
        });

        it('should call TrackHomePageAction with FooterOfferConditionsClosed when ShowOfferConditions is true', async () => {
            mockProps.showOfferConditions = true;
            const { getByTestId } = render(<PageFooterCopyright {...mockProps} />);
            const accordion = getByTestId('accordion-button');

            await userEvent.click(accordion);

            expect(mockProps.trackHomepageAction).toHaveBeenCalledTimes(1);
            expect(mockProps.trackHomepageAction).toHaveBeenCalledWith(
                EventTypes.FooterOfferConditionsClosed,
                TRACK_HOMEPAGE_ACTION_PARAMS,
            );
            expect(mockProps.toggleOfferConditions).toHaveBeenCalledTimes(1);
            expect(mockProps.toggleOfferConditions).toHaveBeenCalledWith(false);
        });
    });

    it('should call HandleDescriptionClick function in right way', async () => {
        const { getByTestId } = render(<PageFooterCopyright {...mockProps} />);
        const text = getByTestId('rich-text-with-links');

        await userEvent.click(text);

        expect(mockProps.trackHomepageAction).toHaveBeenCalledTimes(1);
        expect(mockProps.trackHomepageAction).toHaveBeenCalledWith(EventTypes.FooterOfferConditions, {
            location: 'Offer conditions',
            name: 'test-value',
        });
    });

    it('should call ToggleOfferConditions method when Window.location.hash is #offer-conditions', async () => {
        new MockLocation(`http://localhost?${Anchor.OfferConditions}`).onWindow(window);
        render(<PageFooterCopyright {...mockProps} />);

        expect(window.location.hash).toBe(Anchor.OfferConditions);
        await waitFor(() => expect(mockProps.toggleOfferConditions).toHaveBeenCalledTimes(1));
    });
});
