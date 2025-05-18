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
            const ext = event.filename ? path.extname(event.filename).toLowerCase() : '';
            if (event.filename && (ext === '.usc' || ext === '.sus')) {
                const filePath = path.join(directoryPath, event.filename);
                console.log(`update: ${filePath}`);
                
                try {
                    const buffer = await fs.promises.readFile(filePath);
                    
                    const fileType = ext.substring(1);
                    const convertedData = await convertChart(buffer, fileType);
                    
                    const fileName = path.basename(filePath, ext);
                    const outputDir = path.resolve('./lib/repository/level');
                    
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    
                    const outputPath = path.join(outputDir, `${fileName}`);
                    
                    const compressed = zlib.gzipSync(convertedData);
                    await fs.promises.writeFile(outputPath, compressed);
                    
                    console.log(`succes: ${outputPath}`);
                } catch (e) {
                    console.error(`error : ${filePath}`, e);
                }
            }
        }
    } catch (e) {
        console.error('error :', e);
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
            } catch (e) {
                console.error(`"${levelName}" error: `, e);
            }
        }
        
        console.log(`\ndone!`);
        
    } catch (e) {
        console.error('error: ', e);
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
    } catch (e) {
        console.error('error:', e);
    }
}

export const putChart = (chartName: string, coverFile: string, bgmFile: string, config: any = {}) => {
    const now = new Date();
    const dateString = now.toLocaleString('ja-JP');

    sonolus.level.items.push({
        name: chartName,
        version: 1 as const,
        title: {en: config.title || ''},
        artists: {en: config.artists || ''},
        author: {en: config.author || ''},
        rating: config.rating || 0,
        tags: config.tags || [],
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
        
        const scoreFiles: string[] = [];
        const imageFiles: string[] = [];
        const audioFiles: string[] = [];
        let configFile: string | null = null;
        
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.usc' || ext === '.sus') {
                scoreFiles.push(file);
            } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                imageFiles.push(file);
            } else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
                audioFiles.push(file);
            } else if (ext === '.json' && file.toLowerCase() === 'config.json') {
                configFile = file;
            }
        });
        
        // configの読み込み
        let config: any = {};
        if (configFile) {
            try {
                const configContent = await fs.promises.readFile(path.join(directoryPath, configFile), 'utf8');
                config = JSON.parse(configContent);
                console.log(`config loaded: ${configFile}`);
            } catch (error) {
                console.error(`config.json error: `, error);
            }
        } else if (scoreFiles.length > 0) {
            config = {
                title: path.basename(directoryPath),
                artists: '',
                author: '',
                rating: 0,
            };

            try {
                await fs.promises.writeFile(
                    path.join(directoryPath, 'config.json'),
                    JSON.stringify(config, null, 2),
                    'utf8'
                )
                console.log(`config.json created: ${path.join(directoryPath, 'config.json')}`);
            } catch (e) {
                console.error(`config.json error: `, e);
            }
        }
        
        for (const scoreFile of scoreFiles) {
            const ext = path.extname(scoreFile).toLowerCase();
            const baseName = path.basename(scoreFile, ext);
            console.log(`loading: ${baseName}`);
            
            let chartConfig = {...config};

            if (!chartConfig.title || chartConfig.title === path.basename(directoryPath)) {
                chartConfig.title = baseName;
            }

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
            
            const scorePath = path.join(directoryPath, scoreFile);
            const buffer = await fs.promises.readFile(scorePath);
            const fileType = ext.substring(1); // 先頭の'.'を除去
            const convertedData = await convertChart(buffer, fileType);
            
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
            
            // configの情報を反映させる
            putChart(baseName, coverFileName, bgmFileName, chartConfig);
            
            console.log(`${baseName} finished!`);
        }
        
    } catch (e) {
        console.error('error:', e);
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
