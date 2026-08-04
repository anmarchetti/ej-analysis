import { render } from '@testing-library/react';
import { AppProps } from 'next/app';
import { Router } from 'next/router';
import App from 'pages/_app';

import { getExperimentMock } from 'frontend/__mocks__/experiments';
import { ISitecorePersonalizeExperiment } from 'models/sitecore/ISitecorePersonalizeExperiment';

const mockStores = {
    layoutStore: {
        updateLayout: jest.fn(),
    },
    userStore: {
        setUserLoggedIn: jest.fn(),
    },
    engageStore: {
        setExperiments: jest.fn(),
        syncExperiments: jest.fn(),
    },
    trackingStore: {
        callTagManager: jest.fn(),
        trackRumPageView: jest.fn(),
    },
};

jest.mock('frontend/store/create-store', () => ({
    getInitStoreStateFromPageProps: jest.fn(),
    useApplicationStoreBaseOnSiteName: jest.fn(() => mockStores),
}));

const experiments: ISitecorePersonalizeExperiment[] = [
    getExperimentMock('60b60241-3c24-46dd-988a-5f742593ca59', 'test-id', 'test-attr'),
];

const createProps = () => ({
    Component: () => <div />,
    pageProps: {
        layout: { sitecore: { context: { experiments } } },
        initMobxState: false,
        ssoAuthenticated: true,
        isInit: false,
    },
    router: {} as Router,
});
let props: AppProps<any> = createProps();

describe('<App />', () => {
    beforeEach(() => {
        props = createProps();
    });

    describe('useEffect', () => {
        it('should call all necessary functions on mount', () => {
            render(<App {...props} />);

            expect(mockStores.userStore.setUserLoggedIn).toHaveBeenCalledWith(true);
            expect(mockStores.layoutStore.updateLayout).toHaveBeenCalledWith(props.pageProps.layout);
            expect(mockStores.trackingStore.callTagManager).toHaveBeenCalled();
            expect(mockStores.trackingStore.trackRumPageView).toHaveBeenCalled();
            expect(mockStores.engageStore.setExperiments).toHaveBeenCalledWith(experiments);
            expect(mockStores.engageStore.syncExperiments).toHaveBeenCalled();
        });

        it('should NOT update layout on mount when initMobxState is true', () => {
            props.pageProps.initMobxState = true;

            render(<App {...props} />);

            expect(mockStores.userStore.setUserLoggedIn).toHaveBeenCalledWith(true);
            expect(mockStores.layoutStore.updateLayout).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.callTagManager).toHaveBeenCalled();
            expect(mockStores.trackingStore.trackRumPageView).toHaveBeenCalled();
        });

        it('should NOT update layout on mount when layout undefined', () => {
            props.pageProps.layout = undefined;

            render(<App {...props} />);

            expect(mockStores.userStore.setUserLoggedIn).toHaveBeenCalledWith(true);
            expect(mockStores.layoutStore.updateLayout).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.callTagManager).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.trackRumPageView).not.toHaveBeenCalled();
        });
    });

    describe('engageStore', () => {
        it('should NOT update experiments on mount when isInit is true', () => {
            props.pageProps.isInit = true;

            render(<App {...props} />);

            expect(mockStores.engageStore.setExperiments).not.toHaveBeenCalled();
            expect(mockStores.engageStore.syncExperiments).toHaveBeenCalled();
        });

        it('should NOT update and sync experiments on mount when experiments from context undefined', () => {
            props.pageProps.layout.sitecore.context.experiments = undefined;

            render(<App {...props} />);

            expect(mockStores.engageStore.setExperiments).not.toHaveBeenCalled();
            expect(mockStores.engageStore.syncExperiments).not.toHaveBeenCalled();
        });

        it('should NOT update and sync experiments on mount when experiments from context is empty array', () => {
            props.pageProps.layout.sitecore.context.experiments = [];

            render(<App {...props} />);

            expect(mockStores.engageStore.setExperiments).not.toHaveBeenCalled();
            expect(mockStores.engageStore.syncExperiments).not.toHaveBeenCalled();
        });
    });
});
