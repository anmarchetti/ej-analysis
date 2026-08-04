import { configure as configureMobx } from 'mobx';
import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom';
import 'setimmediate';
import { configure } from '@testing-library/react';
import {
    mockNextAuthGetSession,
    mockNextAuthUseSession,
    mockNextAuthSignIn,
    mockNextAuthSignOut,
} from 'frontend/__mocks__/next-auth';

// React Testing Library configuration
configure({ testIdAttribute: 'data-tid' });

// Enable mock mobx decorators (e.g. actions)
configureMobx({ safeDescriptors: false });

global.requestAnimationFrame = callback => {
    setTimeout(callback, 0);
};

Object.assign(global, { TextDecoder, TextEncoder });

Object.defineProperty(window, 'scrollTo', {
    value: () => {},
    writable: true,
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn(() => ({
        matches: true,
    })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
    __esModule: true,
    getSession: mockNextAuthGetSession,
    signIn: mockNextAuthSignIn,
    signOut: mockNextAuthSignOut,
    useSession: mockNextAuthUseSession,
    SessionProvider: ({ children }) => <div data-tid='session-provider'>{children}</div>,
}));
