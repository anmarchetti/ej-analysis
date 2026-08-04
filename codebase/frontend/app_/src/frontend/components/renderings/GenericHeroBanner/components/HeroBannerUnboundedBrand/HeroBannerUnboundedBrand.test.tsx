import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { HeroBannerUnboundedBrand } from './HeroBannerUnboundedBrand';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, dataId }) => <div data-tid={dataId}>{field.value}</div>,
}));

const mockHeroBannerControls = jest.fn();
jest.mock(
    'frontend/components/renderings/GenericHeroBanner/components/HeroBannerControls/HeroBannerControls',
    () =>
        ({ onClick, ...props }) => {
            mockHeroBannerControls(props);

            return <button onClick={onClick} onKeyDown={jest.fn()} data-tid='hero-banner-controls' />;
        },
);

const createProps = () => ({
    experiment: {},
    fields: {
        Title: mockSitecoreField('Unbounded Title'),
        Subtitle: mockSitecoreField('Unbounded Subtitle'),
        CTAType: mockSitecoreField('button'),
        CTA: mockSitecoreField({ href: '/Unbounded-cta', text: 'Unbounded CTA' }),
    },
    onClick: jest.fn(),
});

let mockProps;

describe('<HeroBannerUnboundedBrand />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<HeroBannerUnboundedBrand {...mockProps} />);

        expect(screen.getByTestId('hero-banner-controls')).toBeInTheDocument();
        expect(screen.getByTestId('unbounded-brand-hero-banner-subtitle')).toHaveTextContent('Unbounded Subtitle');
        expect(screen.getByTestId('unbounded-brand-hero-banner-title')).toHaveTextContent('Unbounded Title');
        expect(mockHeroBannerControls).toHaveBeenCalledWith({
            experiment: {},
            controlsFields: [mockProps.fields.CTA],
            type: 'button',
        });
    });

    it('should call onClick on HeroBannerControls onClick', async () => {
        render(<HeroBannerUnboundedBrand {...mockProps} />);

        await userEvent.click(screen.getByTestId('hero-banner-controls'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
