import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { Request, Response } from 'express';
import { sonolus } from './index.js';

export const getLocalIpv4 = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];
        if (!iface) continue;
        for (const net of iface) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};

export const resolveEngineResource = (name: string) => {
    return path.join(process.cwd(), 'lib', 'sonolus-pjsekai-engine-extended', name);
}

export const getfile = () => {
    sonolus.router.get('/lib/repository/:type/:hash', async (req: Request, res: Response) => {
        const { type, hash } = req.params as { type: 'level' | 'cover' | 'bgm' | 'bgmpreview' | 'background' | 'banner' | 'skin' | 'particle' | 'effect'; hash: string };
        const filePath = path.join(process.cwd(), 'lib/repository', type, hash);

        try {
            const fileBuffer = await fs.readFile(filePath);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(fileBuffer);
        } catch (error) {
            res.status(404).send('File not found');
        }
    });
}