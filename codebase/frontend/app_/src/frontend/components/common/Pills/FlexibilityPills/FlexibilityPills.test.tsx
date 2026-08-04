import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SiteSettings from 'models/enum/SiteSettings';
import FlexibilityPills, {
    IFlexibilityPillsProps,
} from 'frontend/components/common/Pills/FlexibilityPills/FlexibilityPills';

const createProps = (): IFlexibilityPillsProps => ({
    flexDays: 0,
    onChange: jest.fn(),
});

const createSettings = () => ({
    [SiteSettings.FlexibilityOptions]: [
        {
            Days: 0,
            Label: 'Exact Date',
        },
        {
            Days: 1,
            Label: '1 day',
        },
    ],
});

let settings;
let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPillSelectorProps = jest.fn();
jest.mock('frontend/components/common/PillSelector/PillSelector', () => ({
    __esModule: true,
    default: props => {
        mockPillSelectorProps(props);

        return <div data-tid='pill-selector' />;
    },
}));

describe('FlexibilityPills', () => {
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
        render(<FlexibilityPills {...mockProps} />);

        expect(mockPillSelectorProps).toHaveBeenCalledWith({
            inputName: 'flexDays',
            selectedValue: mockProps.flexDays,
            options: [
                { value: 0, label: 'Exact Date' },
                { value: 1, label: '1 day' },
            ],
            onChange: mockProps.onChange,
            dataTid: 'flexibility-pills',
        });
        expect(screen.getByTestId('pill-selector')).toBeInTheDocument();
    });

    it('should NOT render when no flexOptions', () => {
        settings[SiteSettings.FlexibilityOptions] = '';
        const { container } = render(<FlexibilityPills {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
