import { FC, Fragment } from 'react';

interface IMapperProps {
    items: string[];
    dataTid?: string;
}

const Mapper: FC<IMapperProps> = ({ items, dataTid }) => {
    if (!items.length) {
        return null;
    }

    return (
        <Fragment>
            {items.map(item => (
                <div data-tid={dataTid} key={item}>
                    {item}
                </div>
            ))}
        </Fragment>
    );
};

export default Mapper;
