import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { ExpandableMobileBanner, IExpandableMobileBannerFields } from './ExpandableMobileBanner';

const mockExpandableBannerProps = jest.fn();
jest.mock('frontend/components/common/ExpandableBanner/ExpandableBanner', () => ({
    __esModule: true,
    default: props => {
        mockExpandableBannerProps(props);

        return <div data-tid='expandable-banner'>{props.button}</div>;
    },
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return (
            <a data-tid='router-link' className={props.className}>
                {props.children}
            </a>
        );
    },
}));

const createFields = (): IExpandableMobileBannerFields => ({
    Title: mockSitecoreField('Test Title'),
    Description: mockSitecoreField('Test Description'),
    Icon: { value: mockSitecoreImageField('/test-icon.png') },
    CTA: mockSitecoreField(mockSitecoreLinkField('/test-link', 'Learn More', SitecoreLinkType.Internal)),
});

describe('<ExpandableMobileBanner />', () => {
    it('should render null when fields are undefined', () => {
        const { container } = render(<ExpandableMobileBanner fields={undefined as any} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render ExpandableBanner with correct props', () => {
        const fields = createFields();
        render(<ExpandableMobileBanner fields={fields} />);

        expect(screen.getByTestId('expandable-banner')).toBeInTheDocument();
        expect(mockExpandableBannerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                Title: fields.Title,
                Description: fields.Description,
                Icon: fields.Icon,
                dataTidPrefix: 'expandable-mobile-banner',
                isMobileView: true,
                isDefaultOpened: true,
                mobileClassName: 'expandableBanner',
                descriptionClassName: 'expandableBannerDescription',
                titleClassName: 'expandableBannerTitle',
                iconClassName: 'expandableBannerIcon',
            }),
        );
    });

    it('should render RouterLink as button with CTA data', () => {
        const fields = createFields();
        render(<ExpandableMobileBanner fields={fields} />);

        expect(screen.getByTestId('router-link')).toBeInTheDocument();
        expect(mockRouterLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                link: fields.CTA,
                'data-tid': 'easyjet-link',
            }),
        );
        expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('should apply correct className to RouterLink', () => {
        const fields = createFields();
        render(<ExpandableMobileBanner fields={fields} />);

        expect(mockRouterLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: expect.stringContaining('btn btn--outlined'),
            }),
        );
    });

    it('should handle CTA with no text gracefully', () => {
        const fields = createFields();
        fields.CTA = mockSitecoreField(mockSitecoreLinkField('/test-link', undefined, SitecoreLinkType.Internal));

        render(<ExpandableMobileBanner fields={fields} />);

        expect(screen.getByTestId('expandable-banner')).toBeInTheDocument();
        expect(screen.getByTestId('router-link')).toBeInTheDocument();
    });
});
