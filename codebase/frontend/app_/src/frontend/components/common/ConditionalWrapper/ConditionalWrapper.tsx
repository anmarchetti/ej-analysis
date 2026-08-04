interface IConditionalWrapperProps {
    children: JSX.Element;
    condition: boolean;
    wrapper: (children: JSX.Element) => JSX.Element;
}

const ConditionalWrapper = ({ condition, wrapper, children }: IConditionalWrapperProps) =>
    condition ? wrapper(children) : children;

export default ConditionalWrapper;
