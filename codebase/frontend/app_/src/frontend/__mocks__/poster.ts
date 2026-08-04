import { IPoster } from 'frontend/hooks/usePoster';

export const mockedPoster: IPoster = {
    activeId: null,
    isError: false,
    hasEjLogo: true,
    hasUMLogo: true,
    posterId: 'poster-123',
    togglePoster: jest.fn(),
    downloadPoster: jest.fn(),
    setError: jest.fn(),
    toggleEjLogo: jest.fn(),
    toggleUMLogo: jest.fn(),
};
