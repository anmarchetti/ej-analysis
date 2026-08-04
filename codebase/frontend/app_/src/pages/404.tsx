import { FC } from 'react';
import Head from 'next/head';

const Custom404: FC = () => (
    <>
        <Head>
            <title>404 Page</title>
        </Head>
        <div style={{ padding: 10 }}>
            <h1>404 Page</h1>
            <p>Exception while loading sitecore layout</p>
        </div>
    </>
);

export default Custom404;
