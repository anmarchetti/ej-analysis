import React from 'react';
import { cleanup, render } from '@testing-library/react';

const MOCK_CMS_LAYOUTS_SYSTEM = '/holidays/layouts/system';
const MOCK_SCRIPT_URL = MOCK_CMS_LAYOUTS_SYSTEM + '/VisitorIdentification.js';
const MOCK_TIMESTAMP = 639065722767056500;

let mockSitecoreContext: Record<string, unknown> = {};

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    useSitecoreContext: () => ({ sitecoreContext: mockSitecoreContext }),
}));

jest.mock('code/env', () => ({
    envAll: { CMS_LAYOUTS_SYSTEM: '/holidays/layouts/system' },
}));

import { VisitorIdentification } from './VisitorIdentification';

describe('<VisitorIdentification />', () => {
    beforeEach(() => {
        mockSitecoreContext = {};
        document.head.innerHTML = '';
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanup();
        jest.restoreAllMocks();
    });

    it('should render nothing visually', () => {
        const { container } = render(<VisitorIdentification />);

        expect(container.innerHTML).toBe('');
    });

    it('should not inject script when visitorIdentificationTimestamp is undefined', () => {
        mockSitecoreContext = {};

        render(<VisitorIdentification />);

        expect(document.querySelector('script[data-vi-script]')).toBeNull();
        expect(document.querySelector('meta[name="VIcurrentDateTime"]')).toBeNull();
    });

    it('should not inject script when visitorIdentificationTimestamp is empty string', () => {
        mockSitecoreContext = { visitorIdentificationTimestamp: '' };

        render(<VisitorIdentification />);

        expect(document.querySelector('script[data-vi-script]')).toBeNull();
    });

    it('should inject script and meta when visitorIdentificationTimestamp is present', () => {
        mockSitecoreContext = { visitorIdentificationTimestamp: MOCK_TIMESTAMP };

        render(<VisitorIdentification />);

        const script = document.querySelector('script[data-vi-script]') as HTMLScriptElement;
        const meta = document.querySelector('meta[name="VIcurrentDateTime"]') as HTMLMetaElement;

        expect(script).not.toBeNull();
        expect(script.src).toContain(MOCK_SCRIPT_URL);
        expect(script.type).toBe('text/javascript');
        expect(script.dataset.viScript).toBe('true');

        expect(meta).not.toBeNull();
        expect(meta.content).toBe(MOCK_TIMESTAMP.toString());
    });

    it('should not inject duplicate script when already present', () => {
        const existingScript = document.createElement('script');
        existingScript.dataset.viScript = 'true';
        document.head.appendChild(existingScript);

        mockSitecoreContext = { visitorIdentificationTimestamp: MOCK_TIMESTAMP };

        render(<VisitorIdentification />);

        const scripts = document.querySelectorAll('script[data-vi-script]');

        expect(scripts.length).toBe(1);
    });

    it('should clean up script and meta on unmount', () => {
        mockSitecoreContext = { visitorIdentificationTimestamp: MOCK_TIMESTAMP };

        const { unmount } = render(<VisitorIdentification />);

        expect(document.querySelector('script[data-vi-script]')).not.toBeNull();
        expect(document.querySelector('meta[name="VIcurrentDateTime"]')).not.toBeNull();

        unmount();

        expect(document.querySelector('script[data-vi-script]')).toBeNull();
        expect(document.querySelector('meta[name="VIcurrentDateTime"]')).toBeNull();
    });

    it('should have correct displayName', () => {
        expect(VisitorIdentification.displayName).toBe('VisitorIdentification');
    });
});
