import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { DestinationType } from 'models/enum/DestinationType';

import DestinationCard, { ICardProps } from './DestinationCard';

const createProps = (): ICardProps => ({
    Image: mockSitecoreField(mockSitecoreImageField('image')),
    Name: mockSitecoreField('name'),
    Code: mockSitecoreField('code'),
    KSPs: [
        {
            id: '1',
            fields: { Icon: mockSitecoreField(mockSitecoreImageField('icon1')), KSP: mockSitecoreField('ksp1') },
        },
        {
            id: '2',
            fields: { Icon: mockSitecoreField(mockSitecoreImageField('icon2')), KSP: mockSitecoreField('ksp2') },
        },
    ],
    PageCategory: mockSitecoreField(DestinationType.Region),
    countries: [],
    destinationType: DestinationType.Region,
    onSelectDestination: jest.fn(),
    position: '1',
    isSelected: false,
});

let mockProps;

describe('<DestinationCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render destination-card', () => {
        render(<DestinationCard {...mockProps} />);

        expect(screen.getByTestId('destination-card')).toBeInTheDocument();
    });

    it('should render name title', () => {
        render(<DestinationCard {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent('name');
    });

    it('should NOT render name title when name value not provided', () => {
        mockProps.Name = null;
        render(<DestinationCard {...mockProps} />);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render KSP1 value', () => {
        render(<DestinationCard {...mockProps} />);

        expect(screen.getByText('ksp1')).toBeInTheDocument();
    });

    it('should render KSP2 value', () => {
        render(<DestinationCard {...mockProps} />);

        expect(screen.getByText('ksp2')).toBeInTheDocument();
    });

    it('should render 2 images', () => {
        render(<DestinationCard {...mockProps} />);

        expect(screen.getAllByRole('img').length).toBe(2);
    });

    it('should render 2 destination-ksps', () => {
        render(<DestinationCard {...mockProps} />);

        expect(screen.getAllByTestId('destination-ksp').length).toBe(2);
    });

    it('handles destination card selection', async () => {
        render(<DestinationCard {...mockProps} />);

        await userEvent.click(screen.getByTestId('destination-card'));

        expect(mockProps.onSelectDestination).toHaveBeenCalledWith({
            name: mockProps.Name.value,
            position: mockProps.position,
            category: mockProps.destinationType,
            code: mockProps.Code.value,
        });
    });
});
