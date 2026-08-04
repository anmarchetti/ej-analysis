import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { HelpLinksVariant } from 'models/enum/HelpLinksVariant';
import { helpLink1 } from 'frontend/components/renderings/HelpLinks/__mocks__/helpLink';

import { HelpLink, IHelpLinkProps } from './HelpLink';

expect.extend(toHaveNoViolations);

let mockStores;
let props: IHelpLinkProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRouterLinkComponent = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkComponent(props);

        return (
            <div data-tid='router-link' onClick={props.onClick}>
                {props.children}
            </div>
        );
    },
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('HelpLink', () => {
    const resetMocks = (): IHelpLinkProps => ({
        ...helpLink1,
    });

    beforeEach(() => {
        props = resetMocks();
        mockStores = createMockStores({
            layoutStore: {
                isTradePortal: false,
            },
            trackingStore: {
                fireViewBookingEvent: jest.fn(),
            },
        });
    });

    it('should NOT render component when NO fields', () => {
        delete props.fields;

        const { container } = render(<HelpLink {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component', () => {
        render(<HelpLink {...props} />);

        expect(mockRouterLinkComponent).toHaveBeenCalledWith({
            link: props.fields!.Link,
            onClick: expect.any(Function),
            dataId: 'content-link-title',
            className: 'helpLink',
            children: expect.anything(),
        });
        expect(screen.getByTestId('router-link')).toBeInTheDocument();

        expect(mockJSSImage).toHaveBeenCalledWith({
            ['data-tid']: 'quick-link-icon',
            field: props.fields!.Icon,
            className: 'icon',
            'aria-hidden': true,
        });
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(screen.getByTestId('help-link-description')).toBeInTheDocument();
        expect(screen.getByTestId('help-link-title-wrapper')).toBeInTheDocument();

        expect(screen.getByText(props.fields!.Title.value)).toHaveClass('linkTitle');
        expect(screen.getByText(props.fields!.Description.value)).toHaveClass('description');
    });

    it('should add horizontalAlignment class when Variant is "CardWithBorder"', () => {
        render(<HelpLink {...props} Variant={HelpLinksVariant.CardWithBorder} />);

        expect(mockRouterLinkComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'helpLink horizontalAlignment',
            }),
        );
    });

    it('should add horizontalAlignment class when Variant is "HorizontalAlignment"', () => {
        render(<HelpLink {...props} Variant={HelpLinksVariant.HorizontalAlignment} />);

        expect(mockRouterLinkComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'helpLink horizontalAlignment',
            }),
        );
    });

    it('should fire tracking event on Holidays with label when TrackingLabel exists', async () => {
        render(<HelpLink {...props} />);

        await userEvent.click(screen.getByTestId('router-link'));

        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalledWith(
            ViewBookingTrackingEvents.Help,
            `Help FAQ-${props.fields!.TrackingLabel.value}`,
        );
    });

    it('should fire tracking event on Holidays without label when TrackingLabel does NOT exist', async () => {
        props.fields!.TrackingLabel.value = '';

        render(<HelpLink {...props} />);

        await userEvent.click(screen.getByTestId('router-link'));

        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalledWith(
            ViewBookingTrackingEvents.Help,
            null,
        );
    });

    it('should open chat bot', async () => {
        render(<HelpLink {...props} />);

        const dfMessenger = document.createElement('df-messenger');
        document.body.appendChild(dfMessenger);

        await userEvent.click(screen.getByTestId('router-link'));

        const attr = document.querySelector('df-messenger')!.getAttribute('expand');
        expect(attr).toBe('true');
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HelpLink {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
