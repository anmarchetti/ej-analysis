import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SiteSettings from 'models/enum/SiteSettings';

import DurationPills, { IDurationPillsProps } from './DurationPills';

const mockPillSelectorProps = jest.fn();
jest.mock('frontend/components/common/PillSelector/PillSelector', () => ({
    __esModule: true,
    default: props => {
        mockPillSelectorProps(props);

        return <div data-tid='pill-selector' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createSettings = () => ({
    [SiteSettings.SearchPodDurationPillOptions]: [
        {
            Duration: '7',
            Label: '7 days',
        },
        {
            Duration: '10',
            Label: '10 days',
        },
    ],
});

const createProps = (): IDurationPillsProps => ({
    selectedValue: 10,
    onChange: jest.fn(),
    className: 'duration-pills-class',
});

let mockProps;
let mockStores;
let settings;

describe('DurationPills', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                getSetting: jest.fn(key => settings[key]),
            },
        });
        settings = createSettings();
    });

    it('should render OptionPills with correct props', () => {
        render(<DurationPills {...mockProps} />);

        expect(mockPillSelectorProps).toHaveBeenCalledWith({
            inputName: 'durationPills',
            selectedValue: mockProps.selectedValue,
            options: [
                { value: 7, label: '7 days' },
                { value: 10, label: '10 days' },
            ],
            onChange: mockProps.onChange,
            className: mockProps.className,
            dataTid: 'duration-pills',
        });
        expect(screen.getByTestId('pill-selector')).toBeInTheDocument();
    });

    it('should NOT render when no Duration options', () => {
        settings[SiteSettings.SearchPodDurationPillOptions] = [];
        const { container } = render(<DurationPills {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
