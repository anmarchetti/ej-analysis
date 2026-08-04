import React from 'react';
import { render, screen } from '@testing-library/react';

import { PillColourVariant, TFullWidthBannerProps } from 'models/data/IFullWithBanner';
import { getMockFullWidthBannerProps } from 'frontend/components/renderings/FullWidthBanner/mocks';

import { FullWidthBannerInfo } from './FullWidthBannerInfo';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ dataId }) => <div data-tid={dataId} />,
}));

jest.mock(
    'frontend/components/renderings/FullWidthBanner/components/FullWidthBannerButton/FullWidthBannerButton',
    () => ({
        __esModule: true,
        default: () => <div data-tid='full-width-banner-button' />,
    }),
);

const mockFullWidthBannerPill = jest.fn();
jest.mock('frontend/components/renderings/FullWidthBanner/components/FullWidthBannerPill/FullWidthBannerPill', () => ({
    __esModule: true,
    default: props => {
        mockFullWidthBannerPill(props);

        return <div data-tid='full-width-banner-pill' />;
    },
}));

const resetMocks = (): TFullWidthBannerProps => getMockFullWidthBannerProps();

let mocks;

describe('<FullWidthBannerInfo />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should NOT render component when NO fields', () => {
        delete mocks.fields;
        const { container } = render(<FullWidthBannerInfo {...mocks} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should standard render', () => {
        render(<FullWidthBannerInfo {...mocks} />);

        expect(screen.getByTestId('full-width-banner-pill')).toBeInTheDocument();
        expect(screen.getByTestId('banner-title')).toHaveTextContent(mocks.fields.Title.value);
        expect(screen.getByTestId('banner-description')).toBeInTheDocument();
        expect(screen.getByTestId('full-width-banner-button')).toBeInTheDocument();
        expect(mockFullWidthBannerPill).toHaveBeenCalledWith({
            PillText: { value: 'PillText' },
            PillColour: PillColourVariant.Green,
            className: 'pill',
        });
    });

    it('Should NOT render RichTextWithLinks when Description field is an empty string', () => {
        mocks.fields.Description = '';
        render(<FullWidthBannerInfo {...mocks} />);

        expect(screen.queryByTestId('banner-description')).not.toBeInTheDocument();
    });
});
