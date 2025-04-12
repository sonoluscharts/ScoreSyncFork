import { sonolus } from "./index.js";
import * as fs from 'fs';
import * as path from 'path';
import { anyToUSC } from "usctool";
import { uscToLevelData } from "../lib/sonolus-pjsekai-engine-extended/convert.js";
import { watch } from 'fs/promises';
import * as zlib from 'zlib';
import { engineInfo } from "../lib/sonolus-pjsekai-engine-extended/index.js";

export async function convertChart(buffer: Buffer, fileType: string): Promise<Buffer> {
    const content = buffer.toString('utf-8');
    const usc = anyToUSC(new TextEncoder().encode(content));
    return Buffer.from(JSON.stringify(uscToLevelData(usc.usc)));
}

export async function watchAndConvertCharts(directoryPath: string): Promise<void> {
    try {
        console.log(`${directoryPath} watching...`);
        
        const watcher = watch(directoryPath, { recursive: true });
        
        for await (const event of watcher) {
            if (event.filename && path.extname(event.filename) === '.usc') {
                const filePath = path.join(directoryPath, event.filename);
                console.log(`update: ${filePath}`);
                
                try {
                    const buffer = await fs.promises.readFile(filePath);
                    
                    const convertedData = await convertChart(buffer, 'usc');
                    
                    const fileName = path.basename(filePath, '.usc');
                    const outputDir = path.resolve('./lib/repository/level');
                    
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    
                    const outputPath = path.join(outputDir, `${fileName}`);
                    
                    const compressed = zlib.gzipSync(convertedData);
                    await fs.promises.writeFile(outputPath, compressed);
                    
                    console.log(`succes: ${outputPath}`);
                } catch (error) {
                    console.error(`error : ${filePath}`, error);
                }
            }
        }
    } catch (error) {
        console.error('error :', error);
    }
}

export async function processLevelStructure(baseDirectoryPath: string): Promise<void> {
    try {
        // ベースディレクトリ内のサブディレクトリを取得
        const entries = await fs.promises.readdir(baseDirectoryPath, { withFileTypes: true });
        const subdirectories = entries
            .filter(entry => entry.isDirectory())
            .map(entry => path.join(baseDirectoryPath, entry.name));
        
        if (subdirectories.length === 0) {
            console.log(`error:"${baseDirectoryPath}" has no subdirectories.`);
            return;
        }
        
        console.log(`found ${subdirectories.length} score(s)`);
        
        for (const levelDir of subdirectories) {
            const levelName = path.basename(levelDir);
            console.log(`\n${levelName} started...`);
            
            try {
                await processLevelDirectory(levelDir);
            } catch (error) {
                console.error(`"${levelName}" error: `, error);
            }
        }
        
        console.log(`\ndone!`);
        
    } catch (error) {
        console.error('error: ', error);
    }
}

export async function convertExistingCharts(directoryPath: string): Promise<void> {
    try {
        const processDirectory = async (dir: string) => {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await processDirectory(fullPath);
                } else if (entry.isFile() && path.extname(entry.name) === '.usc') {
                    try {
                        const buffer = await fs.promises.readFile(fullPath);
                        const convertedData = await convertChart(buffer, 'usc');
                        const outputPath = fullPath.replace('.usc', '.json');
                        await fs.promises.writeFile(outputPath, convertedData);
                        console.log(`succes: ${fullPath} → ${outputPath}`);
                    } catch (error) {
                        console.error(`error: ${fullPath}`, error);
                    }
                }
            }
        };
        
        await processDirectory(directoryPath);
        console.log(`success`);
    } catch (error) {
        console.error('error:', error);
    }
}

export const putChart = (chartName: string, coverFile: string, bgmFile: string) => {
    const now = new Date();
    const dateString = now.toLocaleString('ja-JP');

    sonolus.level.items.push({
        name: chartName,
        version: 1 as const,
        title: {en: chartName},
        artists: {en: ''},
        author: {en: ''},
        rating: 0,
        tags: [],
        engine: engineInfo.name,
        description: {en: `Updated at: ${dateString}`},
        useSkin: {
            useDefault: true,
        },
        useBackground: {
            useDefault: true,
        },
        useEffect: {
            useDefault: true,
        },
        useParticle: {
            useDefault: true,
        },
        cover: {
            hash: 'cover',
            url: '/lib/repository/cover/' + coverFile
        },
        data: {
            hash: 'level',
            url: '/lib/repository/level/' + chartName
        },
        bgm: {
            hash: 'bgm',
            url: '/lib/repository/bgm/' + bgmFile
        }
    })
}

export async function processLevelDirectory(directoryPath: string): Promise<void> {
    try {
        const files = await fs.promises.readdir(directoryPath);
        
        const uscFiles: string[] = [];
        const imageFiles: string[] = [];
        const audioFiles: string[] = [];
        
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.usc') {
                uscFiles.push(file);
            } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                imageFiles.push(file);
            } else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
                audioFiles.push(file);
            }
        });
        
        for (const uscFile of uscFiles) {
            const baseName = path.basename(uscFile, '.usc');
            console.log(`loading: ${baseName}`);
            
            let bestMatchImage = findBestMatch(baseName, imageFiles);
            let bestMatchAudio = findBestMatch(baseName, audioFiles);
            
            if (!bestMatchImage && imageFiles.length > 0) {
                bestMatchImage = imageFiles[0] || null;
                console.log(`[!]: ${baseName}Not found. Use ${bestMatchImage}`);
            }
            
            if (!bestMatchAudio && audioFiles.length > 0) {
                bestMatchAudio = audioFiles[0] || null;
                console.log(`[!]: ${baseName}Not found. Use ${bestMatchAudio}.`);
            }
            
            const uscPath = path.join(directoryPath, uscFile);
            const buffer = await fs.promises.readFile(uscPath);
            const convertedData = await convertChart(buffer, 'usc');
            
            const levelDir = path.resolve('./lib/repository/level');
            const coverDir = path.resolve('./lib/repository/cover');
            const bgmDir = path.resolve('./lib/repository/bgm');
            
            [levelDir, coverDir, bgmDir].forEach(dir => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            });
            
            const levelOutputPath = path.join(levelDir, baseName);
            const compressed = zlib.gzipSync(convertedData);
            await fs.promises.writeFile(levelOutputPath, compressed);
            
            if (bestMatchImage) {
                const imagePath = path.join(directoryPath, bestMatchImage);
                const coverOutputPath = path.join(coverDir, baseName + path.extname(bestMatchImage));
                await fs.promises.copyFile(imagePath, coverOutputPath);
            }
            
            if (bestMatchAudio) {
                const audioPath = path.join(directoryPath, bestMatchAudio);
                const bgmOutputPath = path.join(bgmDir, baseName + path.extname(bestMatchAudio));
                await fs.promises.copyFile(audioPath, bgmOutputPath);
            }
            
            const coverFileName = bestMatchImage ? baseName + path.extname(bestMatchImage) : '';
            const bgmFileName = bestMatchAudio ? baseName + path.extname(bestMatchAudio) : '';
            
            putChart(baseName, coverFileName, bgmFileName);
            
            console.log(`${baseName} finished!`);
        }
        
    } catch (error) {
        console.error('error:', error);
    }
}

function findBestMatch(baseName: string, fileList: string[]): string | null {
    if (fileList.length === 0) return null;
    
    const lowerBaseName = baseName.toLowerCase();
    
    const exactMatch = fileList.find(file => 
        path.basename(file, path.extname(file)).toLowerCase() === lowerBaseName
    );
    if (exactMatch) return exactMatch;
    
    const partialMatches = fileList.filter(file => 
        path.basename(file, path.extname(file)).toLowerCase().includes(lowerBaseName) ||
        lowerBaseName.includes(path.basename(file, path.extname(file)).toLowerCase())
    );
    
    if (partialMatches.length > 0) {
        return partialMatches[0] || null;
    }
    
    return null;
}

export async function initializeCharts(chartDirectory: string): Promise<void> {
    console.log(`${chartDirectory} loading...`);
    
    await processLevelStructure(chartDirectory);
    
    watchAndConvertCharts(chartDirectory);
    
    console.log(`started watching ${chartDirectory}...`);
}