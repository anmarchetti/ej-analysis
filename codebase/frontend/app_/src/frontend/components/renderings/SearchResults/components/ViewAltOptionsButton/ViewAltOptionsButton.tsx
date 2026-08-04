import React from 'react';

import SvgEditFilled from 'frontend/components/icons-new/EditFilled';
import SvgExternalLink from 'frontend/components/icons-new/ExternalLink';

export interface IViewAltOptionsButtonProps {
    children: JSX.Element;
    isOfferCardsABTesting?: boolean;
}

export function ViewAltOptionsButton({ children, isOfferCardsABTesting }: IViewAltOptionsButtonProps) {
    return (
        <>
            {isOfferCardsABTesting && <SvgEditFilled />}
            {children}
            {!isOfferCardsABTesting && <SvgExternalLink />}
        </>
    );
}

export default ViewAltOptionsButton;
