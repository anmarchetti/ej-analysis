import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockAccomData, mockedPoster, mockLuggageListFields } from 'frontend/__mocks__';
import { mockHotel } from 'frontend/__mocks__/hotel';
import { UserService } from 'frontend/services/user.service';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ExportHolidayDetails, { IExportHolidayDetailsFields } from './ExportHolidayDetails';

const createPoster = () => ({ ...mockedPoster });
jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div data-tid='tooltip-trigger' />,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    bookingStore: {
        totalPricePP: 362,
        hotel: mockHotel,
        selectedOffer: {
            stay: 3,
            accom: mockAccomData,
            transport: {
                routes: [
                    {
                        depDate: '2023-02-21T07:20:00+00:00',
                        depName: 'London Gatwick',
                        direction: 'outbound',
                    },
                ],
            },
            transfers: [
                {
                    type: 'SHARED',
                    isHidden: false,
                },
            ],
        },
        alternativeTransfers: [],
    },
    userStore: {
        agentInfo: {
            agentName: 'Agent Name',
        },
    },
    marketStore: {
        formatMoney: jest.fn(a => `£${a}`),
    },
});

const createProps: () => any = () => ({
    fields: {
        LogoCheckboxLabel: mockSitecoreField('Place easyJet holidays logo'),
        DownloadLabel: mockSitecoreField('Download'),
        ExportPromoLabel: mockSitecoreField('Export promotional poster'),
        ExportPromoTooltip: mockSitecoreField(`You're able to download a summary of the holiday as a PDF file.`),
        ReturnLabel: mockSitecoreField('Back to extras'),
        Title: mockSitecoreField("You're about to download a summary of the holiday as a PDF file"),
        Description: mockSitecoreField('Please have a look at a preview of the PDF'),
        YourHolidayDisclaimerText: mockSitecoreField('Holiday disclaimer text'),
        ...mockLuggageListFields,
    } as IExportHolidayDetailsFields,
    params: {},
    rendering: {},
});

let mockPoster = createPoster();
let mockStores = createStores();
let mockProps = createProps();

const mockPosterErrorComponent = jest.fn();
const mockPosterTriggerComponent = jest.fn();
const mockPosterContentComponent = jest.fn();

jest.mock('frontend/components/common/Poster', () => ({
    __esModule: true,
    Root: ({ children }) => <div data-tid='poster-root'>{children}</div>,
    Trigger: ({ children, ...props }) => {
        mockPosterTriggerComponent(props);

        return <div data-tid='poster-trigger'>{children}</div>;
    },
    Error: ({ children, ...props }) => {
        mockPosterErrorComponent(props);

        return <div data-tid='poster-error'>{children}</div>;
    },
    Content: ({ children, ...props }) => {
        mockPosterContentComponent(props);

        return <div data-tid='poster-content'>{children}</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores, ...mockPoster }),
}));

jest.mock('frontend/hooks/useAgentLogo', () => () => 'agent-logo');

describe('<ExportHolidayDetails />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
        mockPoster = createPoster();
        UserService.getUMUserInfo = jest.fn().mockResolvedValue({ data: {} });
    });

    it('should render open link', () => {
        render(<ExportHolidayDetails {...mockProps} />);

        expect(screen.getByText(mockProps.fields.ExportPromoLabel.value)).toBeInTheDocument();
    });

    it('should not render open link', () => {
        const expectedValue = mockProps.fields.ExportPromoLabel.value;
        mockProps.fields = null;
        render(<ExportHolidayDetails {...mockProps} />);

        expect(screen.queryByText(expectedValue)).not.toBeInTheDocument();
    });

    it('should render content correctly', () => {
        mockProps.fields = {
            ExportPromoLabel: mockSitecoreField('label'),
            Title: mockSitecoreField('item heading'),
            DownloadLabel: mockSitecoreField('DownloadLabel'),
            LogoCheckboxLabel: mockSitecoreField('LogoCheckboxLabel'),
            ReturnLabel: mockSitecoreField('ReturnLabel'),
            HideDownloadButton: mockSitecoreField(false),
            ExportAsImage: mockSitecoreField(false),
        };
        render(<ExportHolidayDetails {...mockProps} />);

        expect(mockPosterContentComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                DownloadLabel: mockSitecoreField('DownloadLabel'),
                LogoCheckboxLabel: mockSitecoreField('LogoCheckboxLabel'),
                ReturnLabel: mockSitecoreField('ReturnLabel'),
                hasLargeFormat: true,
                id: 'default',
                posterName: 'Hotel Example',
            }),
        );
    });

    it('should render trigger correctly', () => {
        render(<ExportHolidayDetails {...mockProps} />);

        expect(mockPosterTriggerComponent).toHaveBeenCalledWith({ id: 'default' });
    });

    it('should render error correctly', () => {
        render(<ExportHolidayDetails {...mockProps} />);

        expect(mockPosterErrorComponent).toHaveBeenCalled();
    });

    it('should render tooltip when ExportPromoTooltip is provided', () => {
        render(<ExportHolidayDetails {...mockProps} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.ExportPromoTooltip.value)).toBeInTheDocument();
    });

    it('should NOT render tooltip when ExportPromoTooltip is NOT provided', () => {
        mockProps.fields.ExportPromoTooltip = undefined;

        render(<ExportHolidayDetails {...mockProps} />);

        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
    });
});
