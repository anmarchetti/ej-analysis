import React from 'react';
import { render } from '@testing-library/react';

import AmazonConnectChat from './AmazonConnectChat';

describe('<AmazonConnectChat />', () => {
    it('should return <script />', () => {
        const { container } = render(<AmazonConnectChat />);

        const scriptElement = container.firstChild;

        expect(scriptElement).toBeInTheDocument();
        expect(scriptElement?.nodeName).toBe('SCRIPT');
    });
});
