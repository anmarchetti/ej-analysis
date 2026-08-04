import * as React from 'react';

import { logger } from 'frontend/services/logging';

export interface ITryCatchProps {
    children?: React.ReactNode;
    /** Should redirect user to the home page instead of reloading current. Default = true. */
    redirectHome?: boolean;
    silent?: boolean;
}

export class TryCatch extends React.Component<ITryCatchProps> {
    hasError: boolean = false;
    error: Error;

    componentDidCatch(error) {
        logger.error({
            e: error,
            message: 'Unexpected React error',
        });
    }

    render() {
        return this.hasError ? !this.props.silent && <p>{this.error.message}</p> : this.props.children;
    }
}
