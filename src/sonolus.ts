import { sonolus } from "./index.js";
import { engineInfo } from "../lib/sonolus-pjsekai-engine-extended/index.js";
import { resolveEngineResource } from "./utils.js";

export const install = () => {
    sonolus.engine.items.push({
        ...engineInfo,
        version: 12,
        skin: 'chcy-pjsekai-extended-01',
        background: 'darkblue',
        effect: 'chcy-pjsekai-fixed',
        particle: 'chcy-pjsekai-v3',
        tags: [],
        thumbnail: sonolus.add(resolveEngineResource('thumbnail.png')),
        playData: sonolus.add(resolveEngineResource('EnginePlayData')),
        watchData: sonolus.add(resolveEngineResource('EngineWatchData')),
        previewData: sonolus.add(resolveEngineResource('EnginePreviewData')),
        tutorialData: sonolus.add(resolveEngineResource('EngineTutorialData')),
        configuration: sonolus.add(resolveEngineResource('EngineConfiguration')),
    })

    sonolus.skin.items.push({
        name: 'chcy-pjsekai-extended-01',
        version: 4,
        title: {en: 'PJSekai\u002B / Type 1'},
        author: {en: 'Sonolus \u002B Nanashi.'},
        subtitle: {en: 'PJSekai Extended'},
        tags: [],
        thumbnail: {
            hash: '24faf30cc2e0d0f51aeca3815ef523306b627289',
            url: '/lib/repository/skin/24faf30cc2e0d0f51aeca3815ef523306b627289'
        },
        data: {
            hash: '79c9ecbc2c0c2b5ab7d43a628eb2b1fd3f2c12ff',
            url: '/lib/repository/skin/79c9ecbc2c0c2b5ab7d43a628eb2b1fd3f2c12ff'
        
        },
        texture: {
            hash: '880800c7ca0f8f5d036f5c684ef842c1f04fb120',
            url: '/lib/repository/skin/880800c7ca0f8f5d036f5c684ef842c1f04fb120'
        }
    })

    sonolus.skin.items.push({
        name: 'chcy-pjsekai-extended-02',
        version: 4,
        title: {en: 'PJSekai\u002B / Type 2'},
        author: {en: 'Sonolus \u002B Nanashi.'},
        subtitle: {en: 'PJSekai Extended'},
        tags: [],
        thumbnail: {
            hash: 'e461178513f806606357baf92f2e039c564b9528',
            url: '/lib/repository/skin/e461178513f806606357baf92f2e039c564b9528'
        },
        data: {
            hash: '28474d0ca4975d07a37615b5e7a974fbdd0ebffe',
            url: '/lib/repository/skin/28474d0ca4975d07a37615b5e7a974fbdd0ebffe'
        
        },
        texture: {
            hash: 'c5724b7bb6e79a4e724990aa80dbe0d3a64c0232',
            url: '/lib/repository/skin/c5724b7bb6e79a4e724990aa80dbe0d3a64c0232'
        }
    })

    sonolus.particle.items.push({
        name: 'chcy-pjsekai-v1',
        version: 3,
        title: {en: 'PJSekai / v1'},
        author: {en: 'Sonolus'},
        subtitle: {en: 'From servers.sonolus.com/pjsekai'},
        tags:[],
        thumbnail: {
            hash: 'e5f439916eac9bbd316276e20aed999993653560',
            url: '/lib/repository/particle/e5f439916eac9bbd316276e20aed999993653560'
        },
        data: {
            hash: '7e104fd0d8eb38aacbeee3594a5d0aae5ababee8',
            url: '/lib/repository/particle/7e104fd0d8eb38aacbeee3594a5d0aae5ababee8'
        },
        texture: {
            hash: '57b4bd504f814150dea87b41f39c2c7a63f29518',
            url: '/lib/repository/particle/57b4bd504f814150dea87b41f39c2c7a63f29518'
        }
    })

    sonolus.particle.items.push({
        name: 'chcy-pjsekai-v3',
        version: 3,
        title: {en: 'PJSekai / v3'},
        author: {en: 'Sonolus'},
        subtitle: {en: 'From servers.sonolus.com/pjsekai'},
        tags:[],
        thumbnail: {
            hash: 'e5f439916eac9bbd316276e20aed999993653560',
            url: '/lib/repository/particle/e5f439916eac9bbd316276e20aed999993653560'
        },
        data: {
            hash: 'c85ee8e2e74001f4c999e38568e23d7b2e3f2dc8',
            url: '/lib/repository/particle/c85ee8e2e74001f4c999e38568e23d7b2e3f2dc8'
        },
        texture: {
            hash: 'fcc05aa9086f178134019f6c92922a636740f295',
            url: '/lib/repository/particle/fcc05aa9086f178134019f6c92922a636740f295'
        }
    })

    sonolus.effect.items.push({
        name: 'chcy-pjsekai-fixed',
        version: 5,
        title: {en: 'PJSekai'},
        author: {en: 'Sonolus'},
        subtitle: {en: 'From servers.sonolus.com/pjsekai'},
        tags: [],
        thumbnail: {
            hash: 'e5f439916eac9bbd316276e20aed999993653560',
            url: '/lib/repository/effect/e5f439916eac9bbd316276e20aed999993653560'
        },
        data: {
            hash: '5fe75e34f82b9539bb8d3c914c4794eed057254d',
            url: '/lib/repository/effect/5fe75e34f82b9539bb8d3c914c4794eed057254d'
        },
        audio: {
            hash: '3ac52ee309090423039c307cadcea20345d96003',
            url: '/lib/repository/effect/3ac52ee309090423039c307cadcea20345d96003'
        }
    })

    sonolus.serverInfoHandler = () => {
        return {
            title: {en: 'Score Sync'},
            description: {en: 'created by ぴぃまん'},
            buttons: [
                { type: 'level' },
                { type: 'skin' },
                { type: 'background' },
                { type: 'effect' },
                { type: 'particle' },
                { type: 'engine' },
                { type: 'configuration' }
            ],
            configuration: {
                options: []
            },
            banner: {
                hash: 'banner',
                url: '/lib/repository/banner/banner'
            }
        }
    }
}