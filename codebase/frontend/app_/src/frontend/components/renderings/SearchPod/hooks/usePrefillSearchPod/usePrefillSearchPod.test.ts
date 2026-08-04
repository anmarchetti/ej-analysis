import { IAirportCountry } from 'models/sitecore/IAirportsData';
import usePrefillSearchPod, {
    IUsePrefillSearchPodProps,
} from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod';

const mockUsePrefillOtherPages = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillOtherPages', () => ({
    __esModule: true,
    default: props => mockUsePrefillOtherPages(props),
}));

const mockUsePrefillDestinationAndHotelDetailsBrowsePage = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillDestinationAndHotelDetailsBrowsePage',
    () => ({
        __esModule: true,
        default: props => mockUsePrefillDestinationAndHotelDetailsBrowsePage(props),
    }),
);

const mockUsePrefillHomePage = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillHomePage', () => ({
    __esModule: true,
    default: props => mockUsePrefillHomePage(props),
}));

const mockUsePrefillHotelDetailsBookPage = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillHotelDetailsBookPage', () => ({
    __esModule: true,
    default: props => mockUsePrefillHotelDetailsBookPage(props),
}));

const mockUsePrefillSearchResultsPage = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchResultsPage', () => ({
    __esModule: true,
    default: props => mockUsePrefillSearchResultsPage(props),
}));

const createMockProps = () =>
    ({
        rendering: { fields: { airportsGroups: ['UK', 'ES'] } },
        fields: {
            airportsGroups: [
                {
                    code: 'LGW',
                } as IAirportCountry,
            ],
        },
        shouldSkipEffect: false,
        monthSearchDurationFromUrl: 0,
        setMonthSearchDuration: jest.fn(),
        defaultSearchPodMonthSearchDuration: 7,
        setCountries: jest.fn(),
    } as unknown as IUsePrefillSearchPodProps);

let mockProps: IUsePrefillSearchPodProps;

describe('usePrefillSearchPod', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should call all hooks', () => {
        usePrefillSearchPod(mockProps);

        expect(mockUsePrefillOtherPages).toHaveBeenCalledWith(mockProps);
        expect(mockUsePrefillDestinationAndHotelDetailsBrowsePage).toHaveBeenCalledWith(mockProps);
        expect(mockUsePrefillHomePage).toHaveBeenCalledWith(mockProps);
        expect(mockUsePrefillHotelDetailsBookPage).toHaveBeenCalledWith(mockProps);
        expect(mockUsePrefillSearchResultsPage).toHaveBeenCalledWith(mockProps);
    });

    it('should not call setMonthSearchDuration and setCountries if shouldSkipEffect is true', () => {
        mockProps.shouldSkipEffect = true;
        usePrefillSearchPod(mockProps);

        expect(mockProps.setMonthSearchDuration).not.toHaveBeenCalled();
        expect(mockProps.setCountries).not.toHaveBeenCalled();
    });

    it('should set month search duration and countries from rendering', () => {
        usePrefillSearchPod(mockProps);

        expect(mockProps.setMonthSearchDuration).toHaveBeenCalledWith(mockProps.defaultSearchPodMonthSearchDuration);
        expect(mockProps.setCountries).toHaveBeenCalledWith(mockProps.rendering.fields.airportsGroups);
    });

    it('should NOT call setMonthSearchDuration on mount when monthSearchDurationFromUrl is defined', () => {
        mockProps.monthSearchDurationFromUrl = 3;
        usePrefillSearchPod(mockProps);

        expect(mockProps.setMonthSearchDuration).not.toHaveBeenCalled();
    });

    it('should NOT call setMonthSearchDuration on mount when monthSearchDuration is defined', () => {
        mockProps.monthSearchDuration = 10;
        usePrefillSearchPod(mockProps);

        expect(mockProps.setMonthSearchDuration).not.toHaveBeenCalled();
    });
});
