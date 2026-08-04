import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import HealthEntryRequirementTile from './HealthEntryRequirementTile';

const createProps = () => ({
    item: {
        title: 'title',
        description: 'description',
        image: 'image',
        icon: 'icon',
        cta: {
            text: 'cta',
            url: 'url',
        },
    },
});

const createStores = () => ({
    trackingStore: {
        fireViewBookingEvent: jest.fn(),
    },
    layoutStore: {},
});

let props;
let mockStores;

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ onClick }) => (
    <div data-tid='link-text' onClick={onClick} />
));
jest.mock('frontend/components/common/RouterLink', () => ({ onClick }) => (
    <div data-tid='router-link' onClick={onClick} />
));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HealthEntryRequirementTile/>', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores(createStores());
    });

    it('Should render full tile info', () => {
        render(<HealthEntryRequirementTile {...props} />);

        expect(screen.getByTestId('health-entry-requirement')).toBeInTheDocument();
        expect(screen.getByTestId('health-entry-requirement-background').style.backgroundImage).toBe('url(image)');
        expect(screen.getByTestId('health-entry-requirement-title')).toBeInTheDocument();
        expect(screen.getByTestId('health-entry-requirement-icon')).toBeInTheDocument();
        expect(screen.getByTestId('health-entry-requirement-footer')).toBeInTheDocument();
    });

    it('Should NOT render title', () => {
        props.item.title = '';
        render(<HealthEntryRequirementTile {...props} />);

        expect(screen.queryByTestId('health-entry-requirement-title')).not.toBeInTheDocument();
    });

    it('Should NOT render description', () => {
        props.item.description = '';
        render(<HealthEntryRequirementTile {...props} />);

        expect(screen.queryByTestId('link-text')).not.toBeInTheDocument();
    });

    it('Should NOT render link', () => {
        delete props.item.cta;
        render(<HealthEntryRequirementTile {...props} />);

        expect(screen.queryByTestId('health-entry-requirement-footer')).not.toBeInTheDocument();
    });

    it('Should NOT render background image', () => {
        delete props.item.image;
        render(<HealthEntryRequirementTile {...props} />);

        expect(screen.getByTestId('health-entry-requirement-background').style.length).toBe(0);
    });

    it('Should NOT render background icon', () => {
        delete props.item.icon;
        render(<HealthEntryRequirementTile {...props} />);

        expect(screen.queryByTestId('health-entry-requirement-icon')).not.toBeInTheDocument();
    });

    it('should fire tracking event', () => {
        const { getByTestId } = render(<HealthEntryRequirementTile {...props} />);
        fireEvent.click(getByTestId('router-link'));

        expect(mockStores.trackingStore.fireViewBookingEvent).toHaveBeenCalled();
    });
});
