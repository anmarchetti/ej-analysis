import React from 'react';
import { renderToString } from 'react-dom/server';
import { render } from '@testing-library/react';
import { MobXProviderContext } from 'mobx-react';

import { createLocalStore } from './createLocalStore';

const mockRootStore = {} as any;

const MockProvider = ({ children }) => (
    <MobXProviderContext.Provider value={{ rootStore: mockRootStore } as any}>{children}</MobXProviderContext.Provider>
);

describe('createLocalStore', () => {
    describe('SSR', () => {
        const originalWindow = globalThis.window;

        beforeEach(() => {
            Object.defineProperty(globalThis, 'window', { value: undefined, writable: true, configurable: true });
        });

        afterEach(() => {
            Object.defineProperty(globalThis, 'window', {
                value: originalWindow,
                writable: true,
                configurable: true,
            });
        });

        it('should call storeFactory on every render to prevent cross-request state leak', () => {
            const storeFactory = jest.fn((_root, props: { lang: string }) => ({ lang: props.lang }));
            const [withStore, useStore] = createLocalStore(storeFactory, { isLocalForPage: true });

            const Inner = () => {
                const store = useStore();

                return <span>{store.lang}</span>;
            };
            const Wrapped = withStore(Inner);

            const html1 = renderToString(
                <MockProvider>
                    <Wrapped lang='en' />
                </MockProvider>,
            );
            expect(html1).toContain('en');
            expect(storeFactory).toHaveBeenCalledTimes(1);

            const html2 = renderToString(
                <MockProvider>
                    <Wrapped lang='fr' />
                </MockProvider>,
            );
            expect(html2).toContain('fr');
            expect(html2).not.toContain('en');
            expect(storeFactory).toHaveBeenCalledTimes(2);
        });
    });

    describe('Client-side', () => {
        it('should call storeFactory only once when multiple components share the store', () => {
            const storeFactory = jest.fn((_root, props: { id: string }) => ({ id: props.id }));
            const [withStore] = createLocalStore(storeFactory, { isLocalForPage: true });

            const Inner = ({ id }: { id: string }) => <div>{id}</div>;
            const Wrapped = withStore(Inner);

            render(
                <MockProvider>
                    <Wrapped id='first' />
                    <Wrapped id='second' />
                </MockProvider>,
            );

            expect(storeFactory).toHaveBeenCalledTimes(1);
        });
    });
});
