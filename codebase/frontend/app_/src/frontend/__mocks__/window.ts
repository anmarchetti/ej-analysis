import { IBrowserInfo } from 'models/data/ICommitBookingRequestBody';

export const mockIntersectionObserver = () => {
    const initialObserver = window.IntersectionObserver;

    const intersectionObserverMock = () => ({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
    });

    window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);

    return () => (window.IntersectionObserver = initialObserver);
};

export const mockBrowserInfo: IBrowserInfo = {
    acceptHeader: 'application/json',
    userAgent: expect.any(String),
    colourDepth: 24,
    javaEnabled: false,
    javaScriptEnabled: true,
    language: 'en',
    screenHeight: 0,
    screenWidth: 0,
    timeZoneOffset: 0,
};
