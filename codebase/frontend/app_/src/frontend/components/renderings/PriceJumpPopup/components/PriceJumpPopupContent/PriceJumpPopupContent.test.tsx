import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockPriceJumpPopupFields } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import PriceJumpPopupContent, { IPriceJumpPopupContentProps } from './PriceJumpPopupContent';

let mockProps: IPriceJumpPopupContentProps;

const mockImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: props => {
        mockImageProps(props);

        return <div data-tid='image' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-react', () => ({
    __esModule: true,
    Text: ({ field, ...props }) => {
        mockTextProps(props);

        return <div data-tid={props['data-tid']}>{field.value}</div>;
    },
}));

describe('<PriceJumpPopupContent />', () => {
    beforeEach(() => {
        mockProps = {
            description: 'description',
            refundDescription: 'refundDescription',
            fields: mockPriceJumpPopupFields,
            isRefund: false,
            isOnlyOneButton: false,
            promoCodeSubtitle: mockSitecoreField('promoCodeSubtitle'),
        };
    });

    it('should render component', () => {
        render(<PriceJumpPopupContent {...mockProps} />);

        expect(screen.getByTestId('price-jump-popup-description')).toBeInTheDocument();
        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(mockImageProps).toHaveBeenCalledWith({
            className: 'icon',
            field: mockProps.fields!.Icon,
            ['data-tid']: 'price-jump-popup-icon',
        });

        expect(screen.getByTestId('title')).toHaveTextContent('Title');
        expect(mockTextProps).toHaveBeenCalledWith({
            className: 'title',
            'data-tid': 'title',
            tag: 'h3',
        });
        expect(mockTextProps).toHaveBeenCalledWith({
            className: 'question',
            tag: 'p',
        });
        expect(mockTextProps).toHaveBeenCalledWith({
            'data-tid': 'promo-subtitle',
            tag: 'p',
        });

        expect(screen.getByTestId('promo-subtitle')).toHaveTextContent(mockProps.promoCodeSubtitle!.value);
        expect(screen.getByText(mockProps.description)).toBeInTheDocument();
        expect(screen.queryByTestId('refund')).not.toBeInTheDocument();
        expect(screen.getByText(mockProps.fields!.QuestionLabel.value)).toBeInTheDocument();
    });

    it('should NOT render component if no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<PriceJumpPopupContent {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render refund block', () => {
        mockProps.isRefund = true;
        render(<PriceJumpPopupContent {...mockProps} />);

        expect(screen.getByTestId('refund')).toBeInTheDocument();
    });

    it('should NOT render QuestionLabel block if isOnlyOneButton', () => {
        mockProps.isOnlyOneButton = true;
        render(<PriceJumpPopupContent {...mockProps} />);

        expect(screen.queryByText(mockProps.fields!.QuestionLabel.value)).not.toBeInTheDocument();
    });
});
