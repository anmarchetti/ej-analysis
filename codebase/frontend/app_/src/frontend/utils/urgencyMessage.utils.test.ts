import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { findTestInDataLayer } from 'frontend/components/cro/Experiment/utils/experiment.utils';

import {
    getCabinBagsUrgencyMessage,
    getRoomsUrgencyMessage,
    getRoomsUrgencyMessageVisibility,
    getSeatsUrgencyMessage,
} from './urgencyMessage.utils';

let mockGetWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    setWebStorageItem: jest.fn(),
    getWebStorageItem: () => mockGetWebStorageItem(),
}));

jest.mock('frontend/components/cro/Experiment/utils/experiment.utils', () => ({
    __esModule: true,
    findTestInDataLayer: jest.fn(),
}));
const mockedFindTestInDataLayer = findTestInDataLayer as jest.MockedFn<typeof findTestInDataLayer>;

describe('getRoomsUrgencyMessageVisibility', () => {
    const mockGetSettingFunc = jest.fn();

    beforeEach(() => {
        mockedFindTestInDataLayer.mockReturnValue(undefined);
    });

    // AB TEst - EHD-315 - Urgency Message EUX
    it('returns false if activeTest in dataLayer EHD-315 and variantA', () => {
        mockGetSettingFunc.mockReturnValue(5);
        mockedFindTestInDataLayer.mockReturnValue({
            testId: ExperimentTestIds.UrgencyEUX,
            testVariant: ExperimentVariants.VariantA,
        });
        const result = getRoomsUrgencyMessageVisibility(mockGetSettingFunc, 4);
        expect(result).toBe(false);
    });

    it('returns false if availableRooms is 0', () => {
        const result = getRoomsUrgencyMessageVisibility(mockGetSettingFunc, 0);
        expect(result).toBe(false);
    });

    it('returns true if availableRooms <= SiteSettings.UrgencyMessageMaxRooms', () => {
        mockGetSettingFunc.mockReturnValue(5); // Mock the value for SiteSettings.UrgencyMessageMaxRooms
        const result = getRoomsUrgencyMessageVisibility(mockGetSettingFunc, 4);
        expect(result).toBe(true);
        expect(mockGetSettingFunc).toHaveBeenCalledWith(SiteSettings.UrgencyMessageMaxRooms);
    });

    it('returns false if availableRooms > SiteSettings.UrgencyMessageMaxRooms', () => {
        mockGetSettingFunc.mockReturnValue(10); // Mock the value for SiteSettings.UrgencyMessageMaxRooms
        const result = getRoomsUrgencyMessageVisibility(mockGetSettingFunc, 15);
        expect(result).toBe(false);
        expect(mockGetSettingFunc).toHaveBeenCalledWith(SiteSettings.UrgencyMessageMaxRooms);
    });
});

describe('getRoomsUrgencyMessage', () => {
    const mockGetSettingFunc = jest.fn();
    const mockGetPhrase = jest.fn(v => v);

    beforeEach(() => {
        mockGetSettingFunc.mockReturnValue(5);
    });

    it('returns empty string if urgency message is not visible', () => {
        const result = getRoomsUrgencyMessage(15, mockGetPhrase, mockGetSettingFunc);
        expect(result).toBe('');
    });

    it('returns plural phrase if more then 1 room left', () => {
        const result = getRoomsUrgencyMessage(3, mockGetPhrase, mockGetSettingFunc);
        expect(result).not.toBeNull();
        expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.SearchResultsLabelsHurrys);
    });

    it('returns single phrase if only 1 room left', () => {
        const result = getRoomsUrgencyMessage(1, mockGetPhrase, mockGetSettingFunc);
        expect(result).not.toBeNull();
        expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.SearchResultsLabelsHurry);
    });
});

describe('getCabinBagsUrgencyMessage', () => {
    it('should return the urgency message if there is one stored in the session storage', () => {
        mockGetWebStorageItem = jest
            .fn()
            .mockReturnValue({ urgencyMessageText: 'test cabin bags urgency message', hasUrgencyMessage: true });

        const result = getCabinBagsUrgencyMessage();
        expect(result).toEqual('test cabin bags urgency message');
    });

    it('should return null if there is no urgency message stored in the session storage', () => {
        mockGetWebStorageItem = jest
            .fn()
            .mockReturnValue({ urgencyMessageText: 'test cabin bags urgency message', hasUrgencyMessage: false });

        const result = getCabinBagsUrgencyMessage();
        expect(result).toEqual(null);
    });
});

describe('getSeatsUrgencyMessage', () => {
    it('should return the urgency message if there is one stored in the session storage', () => {
        mockGetWebStorageItem = jest
            .fn()
            .mockReturnValue({ urgencyMessageText: 'test seats urgency message', hasUrgencyMessage: true });

        const result = getSeatsUrgencyMessage();
        expect(result).toEqual('test seats urgency message');
    });

    it('should return null if there is no urgency message stored in the session storage', () => {
        mockGetWebStorageItem = jest
            .fn()
            .mockReturnValue({ urgencyMessageText: 'test seats urgency message', hasUrgencyMessage: false });

        const result = getSeatsUrgencyMessage();
        expect(result).toEqual(null);
    });
});
