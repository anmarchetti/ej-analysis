import { mockSitecoreField } from 'frontend/utils/tests.utils';
import ColorScheme from 'models/enum/banners/ColorScheme';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import { ValidationType } from 'models/enum/ValidationType';
import { IPromocodeInputFields } from 'frontend/components/renderings/PriceSummary/data/models';

export const validationErrorOnBlurMock = { errorMessage: 'error Message OnBlur', trigger: ValidationType.OnBlur };
export const validationErrorOnTypeMock = { errorMessage: 'error Message OnType', trigger: ValidationType.OnType };
export const innerErrorMock = { message: 'inner error message 1', code: 'inner error code 1' };
export const priceBreakdownMock = { amount: 50, code: PriceBreakdownCode.Promotions, name: 'name', quantity: 2 };

export const mockPromocodeInputFields = (): IPromocodeInputFields =>
    ({
        OfferText: mockSitecoreField('Add your promo code here to save {discount} on your holiday'),
        AppliedOfferText: mockSitecoreField('You saved {discount} on your holiday'),
        UseCodeText: mockSitecoreField('Use code:'),
        TermsAndConditions: mockSitecoreField('Sale ends 04/02/2025'),
        ApplyCodeText: mockSitecoreField('Apply code'),
        ColourScheme: mockSitecoreField(ColorScheme.Orange),
    } as IPromocodeInputFields);
