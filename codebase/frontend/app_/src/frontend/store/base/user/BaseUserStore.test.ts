import { TRootStore } from 'frontend/store/IStores';

import { BaseUserStore } from './BaseUserStore';

describe('<BaseUserStore />', () => {
    const createRootStore = () =>
        ({
            queryParamsStore: {
                redirectUrlFromUrl: '',
            },
            layoutStore: {
                isExtrasPage: false,
                isTradePortal: false,
                isEditMode: false,
            },
            engageStore: { sendIdentityEvent: jest.fn() },
        } as unknown as TRootStore);

    let rootStore: TRootStore;
    let userStore: BaseUserStore;

    beforeEach(() => {
        rootStore = createRootStore();
        userStore = new BaseUserStore(rootStore);
    });

    describe('setIsLoggedIn', () => {
        it('should set isLoggedIn from argument', () => {
            expect(userStore.isLoggedIn).toBeFalsy();

            userStore.setIsLoggedIn(true);

            expect(userStore.isLoggedIn).toBeTruthy();
        });

        it('should call sendIdentityEvent', () => {
            userStore.setIsLoggedIn(true);

            expect(rootStore.engageStore.sendIdentityEvent).toHaveBeenCalled();
        });
    });

    describe('setRedirectUrl', () => {
        it('should set url from argument', () => {
            userStore.setRedirectUrl('test');

            expect(userStore.redirectUrlLocal).toBe('test');
        });
    });

    describe('getUserStoreParamsFromQueryParamsStore', () => {
        it('should set redirectUrlLocal to queryParamsStore.redirectUrlFromUrl', () => {
            (rootStore.queryParamsStore as any).redirectUrlFromUrl = 'query-url';
            userStore = new BaseUserStore(rootStore);

            userStore.getUserStoreParamsFromQueryParamsStore();

            expect(userStore.redirectUrlLocal).toEqual('query-url');
        });

        it('should set redirectUrlLocal to redirectUrlLocal', () => {
            userStore.setRedirectUrl('test');

            userStore.getUserStoreParamsFromQueryParamsStore();

            expect(userStore.redirectUrlLocal).toEqual('test');
        });
    });
});
