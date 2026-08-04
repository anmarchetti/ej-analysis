import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import TravelChecklistItem, { TTravelChecklistItemProps } from './TravelChecklistItem';

const createProps = (): TTravelChecklistItemProps => ({
    title: 'title',
    description: 'description',
    subtitle: 'subtitle',
    link: {
        text: 'cta',
        url: 'cta-url',
        href: 'href',
        linktype: SitecoreLinkType.External,
    },
    trackingLabel: 'tracking-label',
});

let props: TTravelChecklistItemProps;
let mockStores;

const mockRichTextWithLinksComponent = jest.fn();
const mockRouterLinkComponent = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksComponent(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkComponent(props);

        return <div data-tid='mocked-router-link'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/icons-new/ChevronUp', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-up' />,
}));

jest.mock('frontend/components/icons-new/ChevronDown', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-down' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TravelChecklistItem />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            viewBookingStore: {
                booking: { ...mockBooking, ...{ healthEntryRequirements: [] } },
            },
        });
    });

    it('should render travel checklist component on collapsed state by default', () => {
        render(<TravelChecklistItem {...props} />);

        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(screen.getByTestId('travel-checklist-item')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(props.title);
        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(props.subtitle!);

        expect(mockRichTextWithLinksComponent).toHaveBeenCalledWith(
            expect.objectContaining({ field: { value: props.description } }),
        );

        expect(screen.getByText(props.link!.text)).toBeInTheDocument();
        expect(mockRouterLinkComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                link: { value: props.link },
            }),
        );
    });

    it('should toggle display details on checkbox tick', async () => {
        render(<TravelChecklistItem {...props} />);

        const checkbox = screen.getByRole('checkbox');
        const detailsBlock = screen.getByTestId('travel-checklist-item-details');

        await userEvent.click(checkbox);
        expect(detailsBlock).toHaveClass('expanded');
        expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
        expect(checkbox).toBeChecked();

        await userEvent.click(checkbox);
        expect(detailsBlock).not.toHaveClass('expanded');
        expect(checkbox).not.toBeChecked();
        expect(screen.queryByTestId('chevron-up')).not.toBeInTheDocument();
    });

    it('should display details on arrow button click', async () => {
        render(<TravelChecklistItem {...props} />);

        const arrowButton = screen.getByRole('button');
        const detailsBlock = screen.getByTestId('travel-checklist-item-details');

        await userEvent.click(arrowButton);
        expect(detailsBlock).toHaveClass('expanded');
        expect(screen.getByRole('checkbox')).not.toBeChecked();

        await userEvent.click(arrowButton);
        expect(detailsBlock).not.toHaveClass('expanded');
    });

    it('should not display subtitle when it is not provided in props', () => {
        props.subtitle = undefined;

        render(<TravelChecklistItem {...props} />);

        expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
    });

    it('should not display description when it is not provided in props', () => {
        props.description = undefined;

        render(<TravelChecklistItem {...props} />);

        expect(mockRichTextWithLinksComponent).not.toHaveBeenCalled();
    });

    it('should not display link when link url is not provided in props', () => {
        props.link!.url = undefined;

        render(<TravelChecklistItem {...props} />);

        expect(mockRouterLinkComponent).not.toHaveBeenCalled();
    });
});
