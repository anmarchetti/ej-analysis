import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import NeedToKnowInformation from './NeedToKnowInformation';

const createProps = () => ({
    InformationContent: mockSitecoreField('InformationContent'),
    InformationIcon: { value: { src: 'icon' } },
});
let mockProps;

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='rich-text'>{field.value}</div>,
}));

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: () => <div data-tid='image' />,
}));

describe('<NeedToKnowInformation />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render correctly', () => {
        render(<NeedToKnowInformation {...mockProps} />);
        expect(screen.getByText(mockProps.InformationContent.value)).toBeInTheDocument();
        expect(screen.getByTestId('rich-text')).toBeInTheDocument();
        expect(screen.getByTestId('image')).toBeInTheDocument();
    });

    it('should not render Image and RichText if no content', () => {
        mockProps.InformationContent = undefined;
        mockProps.InformationIcon = undefined;
        render(<NeedToKnowInformation {...mockProps} />);
        expect(screen.queryByTestId('rich-text')).not.toBeInTheDocument();
        expect(screen.queryByTestId('image')).not.toBeInTheDocument();
    });
});
