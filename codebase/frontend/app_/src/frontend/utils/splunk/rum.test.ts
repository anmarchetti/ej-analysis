import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import { rum } from './rum';

jest.mock('./rumPageView', () => ({
    trackPageView: jest.fn(),
}));

describe('rum', () => {
    it('should expose trackPageView that delegates to rumPageView', () => {
        const trackPageViewMock = jest.mocked(rum.trackPageView);
        trackPageViewMock.mockClear();

        rum.trackPageView(SitecoreTemplateId.HomePage);

        expect(trackPageViewMock).toHaveBeenCalledTimes(1);
        expect(trackPageViewMock).toHaveBeenCalledWith(SitecoreTemplateId.HomePage);
    });
});
