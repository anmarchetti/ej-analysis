import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockAncillariesParams } from 'frontend/__mocks__/ancillaries';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import PromotingBanner, { IPromotingBannerProps } from './PromotingBanner';

const createProps = (): IPromotingBannerProps => ({
    color: mockAncillariesParams.Color,
    textContent: mockSitecoreField('text content'),
    children: <div>children</div>,
});

const mockProps = createProps();

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='promoting-banner-text'>{props.field.value}</div>;
    },
}));

describe('PromotingBanner', () => {
    it('should render default component when shouldPromoteBags == true AND isLCBAddingUnavailable == false', () => {
        render(<PromotingBanner {...mockProps} />);

        const container = screen.getByTestId('promoting-banner-container');

        expect(container).toHaveClass('banner');
        expect(container).toHaveTextContent('children');
        expect(container).toHaveStyle('background: color1A');

        expect(screen.getByTestId('promoting-banner-text-content')).toHaveStyle('color: color');
        expect(screen.getByTestId('promoting-banner-text')).toHaveTextContent('text content');
    });
});
