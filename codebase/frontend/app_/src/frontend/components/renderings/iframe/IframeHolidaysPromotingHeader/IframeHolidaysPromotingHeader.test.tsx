import React from 'react';
import { render, screen } from '@testing-library/react';

import { getDaysDifference } from 'frontend/utils/date.utils';
import { ITheme } from 'models/data/IHotel';
import { HolidayThemesTypesCodes } from 'models/enum/HolidayThemes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockIframeOffer } from 'frontend/components/renderings/iframe/IframeHolidaysCarousel/__mocks__/iframe.mocks';

import IframeHolidaysHeader, { TIframeHolidaysHeaderProps } from './IframeHolidaysPromotingHeader';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: { replaceTokens: jest.fn((s, v) => `${s} ${Object.values(v).join(' ')}`) },
}));
jest.mock('frontend/utils/date.utils', () => ({
    getDaysDifference: jest.fn().mockReturnValue(1),
    formatDateL10n: jest.fn().mockReturnValue('10/01/2025'),
}));

const mockRichTextProps = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    RichText: (props: any) => {
        mockRichTextProps(props);

        return <div data-tid={props['data-tid']}>{props.field?.value}</div>;
    },
}));

const createProps = () =>
    ({
        fields: {
            Title: { value: 'Title' },
            CityBreakTitle: { value: 'City Break Title' },
            Subtitle: { value: 'Subtitle' },
        },
    } as TIframeHolidaysHeaderProps);

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    searchStore: { searchWhen: { from: new Date(), to: new Date() }, searchWho: { totalGuestsQuantity: 1 } },
    hotelsStore: { offers: [mockIframeOffer] },
});

let mockStores = createStores();
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<IframeHolidaysHeader />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should not render when no fields', () => {
        mockProps.fields = null as any;
        const { container } = render(<IframeHolidaysHeader {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('title', () => {
        it('should render title', () => {
            render(<IframeHolidaysHeader {...mockProps} />);

            expect(screen.getByText('Title')).toBeInTheDocument();
            expect(mockRichTextProps).toHaveBeenCalledWith(
                expect.objectContaining({ field: { value: 'Title' }, tag: 'h1' }),
            );
        });

        it('should render CityBreakTitle when only city breaks', () => {
            mockProps.fields.Title = null;
            mockStores.hotelsStore.offers = [
                {
                    ...mockIframeOffer,
                    accom: {
                        ...mockIframeOffer.accom,
                        theme: { ...mockIframeOffer.accom.theme, code: HolidayThemesTypesCodes.City } as ITheme,
                    },
                },
            ];
            render(<IframeHolidaysHeader {...mockProps} />);

            expect(screen.getByText('City Break Title')).toBeInTheDocument();
            expect(mockRichTextProps).toHaveBeenCalledWith(
                expect.objectContaining({ field: { value: 'City Break Title' }, tag: 'h1' }),
            );
        });

        it('should render nothing when both titles are null', () => {
            mockProps.fields.Title = null;
            mockProps.fields.CityBreakTitle = null;

            mockStores.hotelsStore.offers = [
                {
                    ...mockIframeOffer,
                    accom: {
                        ...mockIframeOffer.accom,
                        theme: { ...mockIframeOffer.accom.theme, code: HolidayThemesTypesCodes.City } as ITheme,
                    },
                },
            ];
            render(<IframeHolidaysHeader {...mockProps} />);

            expect(mockRichTextProps).toHaveBeenCalledWith(expect.objectContaining({ field: null, tag: 'h1' }));
        });
    });

    describe('subtitle', () => {
        it('should NOT render subtitle when no to', () => {
            mockStores.searchStore.searchWhen.to = null as any;
            render(<IframeHolidaysHeader {...mockProps} />);

            expect(screen.queryByTestId('subtitle')).not.toBeInTheDocument();
        });

        it('should NOT render subtitle when no from', () => {
            mockStores.searchStore.searchWhen.from = null as any;
            render(<IframeHolidaysHeader {...mockProps} />);

            expect(screen.queryByTestId('subtitle')).not.toBeInTheDocument();
        });

        it('should NOT render subtitle when no guests', () => {
            mockStores.searchStore.searchWho.totalGuestsQuantity = 0;
            render(<IframeHolidaysHeader {...mockProps} />);

            expect(screen.queryByTestId('subtitle')).not.toBeInTheDocument();
        });

        it('should NOT render subtitle when no field', () => {
            mockProps.fields.Subtitle = null;
            render(<IframeHolidaysHeader {...mockProps} />);

            expect(screen.queryByTestId('subtitle')).not.toBeInTheDocument();
        });

        it('should render subtitle for 1 guest and night', () => {
            render(<IframeHolidaysHeader {...mockProps} />);

            const expectedSubtitle = `Subtitle 10/01/2025 1 ${SitecoreDictionary.GlobalsLabelsNightSingular} 1 ${SitecoreDictionary.IframePromotingHolidaysLabelsPeopleSingular}`;
            expect(screen.getByText(expectedSubtitle)).toBeInTheDocument();
            expect(mockRichTextProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: {
                        value: expectedSubtitle,
                    },
                    tag: 'p',
                }),
            );
        });

        it('should render subtitle for multiple guests and nights', () => {
            (getDaysDifference as any).mockReturnValue(2);
            mockStores.searchStore.searchWho.totalGuestsQuantity = 2;
            render(<IframeHolidaysHeader {...mockProps} />);

            const expectedSubtitle = `Subtitle 10/01/2025 2 ${SitecoreDictionary.GlobalsLabelsNightsPlural} 2 ${SitecoreDictionary.IframePromotingHolidaysLabelsPeoplePlural}`;
            expect(screen.getByText(expectedSubtitle)).toBeInTheDocument();
            expect(mockRichTextProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: {
                        value: expectedSubtitle,
                    },
                    tag: 'p',
                }),
            );
        });
    });
});
