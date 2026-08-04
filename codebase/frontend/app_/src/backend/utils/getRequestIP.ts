import Net from 'net';

import Axios from 'axios';
import { Request } from 'express';

let currentPublicIP: string | undefined;

const isIP = (ip?: string) => {
    const ipNumber = Net.isIP(ip ?? '');

    return ipNumber === 4 || ipNumber === 6;
};

const removePortFromIP = (ip: string): string => {
    if (Net.isIPv6(ip)) {
        return ip;
    }

    return ip.includes(':') ? ip.split(':')[0] : ip;
};

/** Get IP from request headers */
const getIPFromHeaders = (headers, name: string) => {
    const value = headers[name];

    return value && typeof value === 'string'
        ? value
              .split(',')
              .map(ip => removePortFromIP(ip.trim()))
              .find(ip => isIP(ip))
        : undefined;
};

/** Get public IP of current machine (use the icanhazip.com service). */
const getPublicIP = async () => {
    if (!currentPublicIP) {
        try {
            const res = await Axios.get('https://icanhazip.com/');
            const ip = res.data && typeof res.data === 'string' ? res.data.trim() : undefined;
            currentPublicIP = ip && isIP(ip) ? ip : undefined;
        } catch (e) {}
    }

    return currentPublicIP;
};

/** Get client IP address of the request */
export const getRequestIP = async (serverReq: Request): Promise<string | null | undefined> => {
    // Workaround for localhost (headers return only internal IP on local env)
    if (serverReq.hostname === 'localhost') {
        return getPublicIP();
    }

    // Get IP from 'true-client-ip' header (Akamai send this header)
    return serverReq.headers ? getIPFromHeaders(serverReq.headers, 'true-client-ip') : null;
};
