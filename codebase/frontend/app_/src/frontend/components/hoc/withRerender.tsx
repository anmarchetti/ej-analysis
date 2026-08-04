import React from 'react';
import { Guid } from 'guid-typescript';

export type TReactComponent<P = any> =
    | React.ClassicComponentClass<P>
    | React.ComponentClass<P>
    | React.FunctionComponent<P>
    | React.ForwardRefExoticComponent<P>;

interface IRerenderState {
    id: string;
    isClient: boolean;
}

export interface IComponentWithRerenderProps {
    wasRerendered?: boolean;
}

/**
 * Forces component to re-render on client side after ssr
 */
export function withRerender<T>(WrappedComponent: TReactComponent<T>): React.ComponentClass<T> {
    return class extends React.Component<T, IRerenderState> {
        state = {
            isClient: false,
            id: Guid.create().toString(),
        };

        componentDidMount() {
            this.setState({ isClient: true }); // this will run only on client side
        }

        render() {
            return (
                <WrappedComponent
                    key={this.state.isClient ? `client_${this.state.id}` : `server_${this.state.id}`}
                    wasRerendered={this.state.isClient}
                    {...this.props}
                />
            );
        }
    };
}
