import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { mockPromocodeInputFields } from 'frontend/components/renderings/PromocodeInput/__mocks__/promocodeInput.mocks';

export const mockPriceSummaryPlaceholders = {
    [PlaceholderNames.ExportHolidayDetails]: [
        {
            componentName: 'ExportButton',
            fields: {
                ExportPromoDisabled: { value: false },
                Logos: { value: { src: 'https://example.com/logo.png', alt: 'Logo' } },
                YourHolidayQuoteLabel: { value: 'Your Holiday Quote' },
                YourHolidayDisclaimerText: { value: 'Disclaimer text goes here.' },
                ExportPromoLabel: { value: 'Export Promo' },
                ExportPromoTooltip: { value: 'Tooltip for export promo' },
                LogoCheckboxLabel: { value: 'Show Logo' },
                LogoImage: { value: { src: 'https://example.com/logo.png', alt: 'Logo' } },
                ReturnLabel: { value: 'Return' },
                DownloadLabel: { value: 'Download' },
                HideDownloadButton: { value: false },
                ShowAgentLogoCheckboxLabel: { value: 'Show Agent Logo' },
                Title: { value: 'Export Holiday Details' },
                Description: { value: 'Description of the holiday details' },
                ExportAsImage: { value: false },
                ReadMoreLink: { value: { href: 'https://example.com/read-more', text: 'Read more' } },
                SkipTranslate: { value: false },
            },
        },
    ],
    [PlaceholderNames.PromocodeInput]: [
        {
            componentName: 'PromocodeInput',
            fields: mockPromocodeInputFields(),
        },
    ],
};
