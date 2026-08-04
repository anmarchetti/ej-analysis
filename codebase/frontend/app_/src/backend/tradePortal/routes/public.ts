import express from 'express';

import AxiosRequest from 'frontend/utils/request';

export const routerPublic = express.Router();

routerPublic.get('/print-image', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        res.sendStatus(400);

        return;
    }

    try {
        const axiosResp = await AxiosRequest.get(url as string, { responseType: 'stream' });

        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': axiosResp.headers['content-type'],
        });

        axiosResp.data.pipe(res);
    } catch (e) {
        res.sendStatus(400);
    }
});
