import React from 'react';

import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RouterLink from 'frontend/components/common/RouterLink';

export interface IHotelLocationLink extends ISitecoreField<ISitecoreLink> {
    key: string;
}

interface IHotelLocationLinkProps {
    hotelLocationLinks: IHotelLocationLink[];
    isFlightAndHotelPackage?: boolean;
    itemClassName?: string;
    onClick?: (isClick: boolean, location: string) => void;
    separator?: string;
}

export const RenderedHotelLocationLinks: React.FC<IHotelLocationLinkProps> = props => {
    const onClick = (location: string): void => {
        if (props.onClick) {
            props.onClick(true, location);
        }
    };

    return !!props.hotelLocationLinks && !!props.hotelLocationLinks.length ? (
        <>
            {props.hotelLocationLinks.map((item, index) => (
                <React.Fragment key={index}>
                    {!!index && (props.separator || ` `)}
                    {props.isFlightAndHotelPackage ? (
                        <span>{decodeURIComponent(item.value.text)}</span>
                    ) : (
                        <RouterLink
                            onClick={(): void => onClick(item.value.text)}
                            link={item}
                            key={item.value.href}
                            className={props.itemClassName}
                        >
                            {decodeURIComponent(item.value.text)}
                        </RouterLink>
                    )}
                </React.Fragment>
            ))}
        </>
    ) : null;
};
