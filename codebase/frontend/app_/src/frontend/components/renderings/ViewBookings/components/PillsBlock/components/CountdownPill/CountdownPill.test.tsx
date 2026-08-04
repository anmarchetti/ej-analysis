import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import CountdownPill from './CountdownPill';

const mockPricePillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/PricePill/PricePill', () => ({ children, ...props }) => {
    mockPricePillComponent(props);

    return <div>{children}</div>;
});

const resetMocks = () => ({
    departureDate: '2030-12-12',
    className: 'class',
});

let mocks = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: {
            getPhrase: jest.fn(p => p),
            getTimeUnitLabel: jest.fn(),
        },
    }),
}));

describe('<CountdownPill />', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2022, 2, 2) });
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<CountdownPill {...mocks} />);

        expect(mockPricePillComponent).toHaveBeenCalledWith({
            isLightGreen: true,
            isFullWidth: true,
            className: mocks.className,
        });
        expect(screen.getByText(SitecoreDictionary.ViewBookingsLabelsTimeDurationToGo)).toBeInTheDocument();
    });

    it('should NOT render when departureDate has expired', () => {
        mocks.departureDate = '2000-12-12';
        const { container } = render(<CountdownPill {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });
});
