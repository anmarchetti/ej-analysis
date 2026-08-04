import { getServerSideProps } from 'pages/[[...path]]';

import { createMockStores as mockCreateMockStores } from 'frontend/__mocks__';
import { createServerSidePageContext } from 'frontend/__mocks__/createServerSidePageContext';
import { getExperimentMock } from 'frontend/__mocks__/experiments';
import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { SiteName } from 'models/enum/SiteName';
import { ISitecorePersonalizeExperiment } from 'models/sitecore/ISitecorePersonalizeExperiment';

jest.mock('next-auth/next', () => ({
    __esModule: true,
    getServerSession: jest.fn(),
}));

jest.mock('pages/api/auth/[...nextauth]', () => ({
    __esModule: true,
    authOptions: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        domain: '.domain',
    },
}));

jest.mock('frontend/utils/redirect.utils', () => ({
    __esModule: true,
    getServerSidePageRedirect: jest.fn(),
}));

const mockSitecorePagePropsFactoryCreate = jest.fn();
jest.mock('lib/page-props-factory', () => ({
    __esModule: true,
    sitecorePagePropsFactory: {
        create: () => mockSitecorePagePropsFactoryCreate(),
    },
}));

jest.mock('next-auth/next', () => ({
    __esModule: true,
    getServerSession: jest.fn(),
}));

jest.mock('frontend/utils/auth/auth.utils', () => ({
    __esModule: true,
    isAuthenticated: jest.fn(),
}));

const mockDeviceDetect = jest.fn().mockReturnValue({ isMobile: false });
jest.mock('frontend/utils/mobileDetect.utils', () => ({
    __esModule: true,
    deviceDetect: (...params) => mockDeviceDetect(...params),
}));

const mockSetExperiments = jest.fn();
jest.mock('frontend/store/holidays/create-stores', () => ({
    __esModule: true,
    createHolidaysAppStores: () =>
        mockCreateMockStores({
            payStore: {
                isPaymentAllowed: true,
            },
            searchStore: {
                searchWho: { allocateManyRooms: () => jest.fn() },
            },
            engageStore: { setExperiments: mockSetExperiments },
            queryParamStore: {},
            rootStore: {
                syncUrlParamsWithStores: () => jest.fn()(),
                serialize: () => jest.fn().mockReturnValue('{}')(),
            },
        }),
    isHolidayStore: jest.fn(),
}));

const mockVerifyFphSignature = jest.fn();
jest.mock('frontend/utils/fph.utils', () => ({
    __esModule: true,
    verifyFphSignature: (...params) => mockVerifyFphSignature(...params),
}));

const createFphLayout = (templateId: string) => ({
    layout: {
        sitecore: {
            context: { site: { name: SiteName.Holidays } },
            route: { templateId },
        },
    },
});

const FPH_QUERY = {
    [QueryParamName.ExperienceContextProvider]: 'fph',
    [FlightPlusHotelQueryParamName.Signature]: 'any-sig',
    [FlightPlusHotelQueryParamName.Discount]: '15',
};

describe('<PathPage />', () => {
    let mockPageContext;

    beforeAll(() => {
        mockSitecorePagePropsFactoryCreate.mockResolvedValue({
            layout: {
                sitecore: { context: { site: { name: SiteName.Holidays } } },
            },
        });
    });

    beforeEach(() => {
        mockPageContext = createServerSidePageContext();
    });

    describe('getServerSideProps', () => {
        it('Should be called with initialize state', async () => {
            await getServerSideProps(mockPageContext);

            expect(mockDeviceDetect).toHaveBeenCalledWith(mockPageContext.req.headers['user-agent']);
            expect(mockSetExperiments).not.toHaveBeenCalled();
        });

        it("Should call MobileDetect with an empty string when no context.req.headers['user-agent']", async () => {
            mockPageContext.req.headers = {};

            await getServerSideProps(mockPageContext);

            expect(mockDeviceDetect).toHaveBeenCalledWith('');
        });

        it('Should call setExperiments with experiments when they are exists', async () => {
            const experiments: ISitecorePersonalizeExperiment[] = [
                getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'test-id', 'test-attr'),
            ];
            mockSitecorePagePropsFactoryCreate.mockResolvedValue({
                layout: {
                    sitecore: { context: { experiments, site: { name: SiteName.Holidays } } },
                },
            });

            await getServerSideProps(mockPageContext);

            expect(mockSetExperiments).toHaveBeenCalledWith(experiments);
        });
    });

    describe('FPH signature validation', () => {
        beforeEach(() => {
            mockVerifyFphSignature.mockReset();
        });

        it('should not verify signature when page is not extras or guest details', async () => {
            mockSitecorePagePropsFactoryCreate.mockResolvedValue(createFphLayout(SitecoreTemplateId.HomePage));
            mockPageContext.query = FPH_QUERY;

            await getServerSideProps(mockPageContext);

            expect(mockVerifyFphSignature).not.toHaveBeenCalled();
        });

        it('should not verify signature when ecp is not fph', async () => {
            mockSitecorePagePropsFactoryCreate.mockResolvedValue(createFphLayout(SitecoreTemplateId.ExtrasPage));
            mockPageContext.query = { [FlightPlusHotelQueryParamName.Signature]: 'any-sig' };

            await getServerSideProps(mockPageContext);

            expect(mockVerifyFphSignature).not.toHaveBeenCalled();
        });

        it('should not verify signature in edit mode', async () => {
            mockSitecorePagePropsFactoryCreate.mockResolvedValue(createFphLayout(SitecoreTemplateId.ExtrasPage));
            mockPageContext.query = FPH_QUERY;
            mockPageContext.preview = true;

            await getServerSideProps(mockPageContext);

            expect(mockVerifyFphSignature).not.toHaveBeenCalled();
        });

        it('should return props when signature is valid on extras page', async () => {
            mockSitecorePagePropsFactoryCreate.mockResolvedValue(createFphLayout(SitecoreTemplateId.ExtrasPage));
            mockPageContext.query = FPH_QUERY;
            mockVerifyFphSignature.mockReturnValue(true);

            const result = await getServerSideProps(mockPageContext);

            expect(mockVerifyFphSignature).toHaveBeenCalled();
            expect(result).not.toHaveProperty('redirect');
        });

        it('should return props when signature is valid on guest details page', async () => {
            mockSitecorePagePropsFactoryCreate.mockResolvedValue(createFphLayout(SitecoreTemplateId.GuestDetailsPage));
            mockPageContext.query = FPH_QUERY;
            mockVerifyFphSignature.mockReturnValue(true);

            const result = await getServerSideProps(mockPageContext);

            expect(mockVerifyFphSignature).toHaveBeenCalled();
            expect(result).not.toHaveProperty('redirect');
        });

        it('should redirect to home when signature is invalid on extras page', async () => {
            mockSitecorePagePropsFactoryCreate.mockResolvedValue(createFphLayout(SitecoreTemplateId.ExtrasPage));
            mockPageContext.query = FPH_QUERY;
            mockVerifyFphSignature.mockReturnValue(false);

            const result = await getServerSideProps(mockPageContext);

            expect(result).toEqual({
                redirect: {
                    destination: '/en/holidays/',
                    permanent: false,
                },
            });
        });

        it('should redirect to home when signature is invalid on guest details page', async () => {
            mockSitecorePagePropsFactoryCreate.mockResolvedValue(createFphLayout(SitecoreTemplateId.GuestDetailsPage));
            mockPageContext.query = FPH_QUERY;
            mockVerifyFphSignature.mockReturnValue(false);

            const result = await getServerSideProps(mockPageContext);

            expect(result).toEqual({
                redirect: {
                    destination: '/en/holidays/',
                    permanent: false,
                },
            });
        });
    });
});
