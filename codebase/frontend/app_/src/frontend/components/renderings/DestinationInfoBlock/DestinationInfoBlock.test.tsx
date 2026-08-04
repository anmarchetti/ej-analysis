import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import DestinationInfoBlock from './DestinationInfoBlock';

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Description: mockSitecoreField('Description'),
    },
    params: [] as any,
    rendering: [] as any,
});

const createStores = () =>
    createMockStores({
        layoutStore: { isTradePortal: false },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text'>{field.value}</div>,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: () => <div data-tid='need-to-know' />,
    Text: ({ field }) => <div data-tid='text'>{field.value}</div>,
}));

jest.mock('frontend/components/common/InspireMeRopup/InspireMePopup', () => ({
    __esModule: true,
    default: () => <div data-tid='inspire-me-popup' />,
}));

describe('<DestinationInfoBlock />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render default', () => {
        render(<DestinationInfoBlock {...mockProps} />);
        expect(screen.getByText(mockProps.fields.Title.value)).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.Description.value)).toBeInTheDocument();
        expect(screen.queryByTestId('need-to-know')).not.toBeInTheDocument();
        expect(screen.getByTestId('inspire-me-popup')).toBeInTheDocument();
    });

    it('should render Need to know component', () => {
        mockProps.rendering = { placeholders: { [PlaceholderNames.NeedToKnow]: ['test'] } };

        render(<DestinationInfoBlock {...mockProps} />);

        expect(screen.getByTestId('need-to-know')).toBeInTheDocument();
    });

    it('should NOT render inspire me popup when it is TradePortal', () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<DestinationInfoBlock {...mockProps} />);

        expect(screen.queryByTestId('inspire-me-popup')).not.toBeInTheDocument();
    });
});
