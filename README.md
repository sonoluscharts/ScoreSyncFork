# ScoreSync
## Fearture
When the usc file or sus file is updated, it will automatically update sonolus' as well.

## Usage

Download release.zip from the [releases](https://github.com/Piliman22/ScoreSync/releases) page.

Create a folder inside the levels directory, and add a .usc, .mp3, and .png file into it.

Launch scoresync.exe.

## Thanks
[sonolus-pjsekai-engine-extended](https://github.com/sevenc-nanashi/sonolus-pjsekai-engine-extended?tab=readme-ov-file)

## 特徴
uscファイル、susファイルが更新されたら、自動でsonolusのも更新します

## 使い方
[リリース](https://github.com/Piliman22/ScoreSync/releases)から、release.zipをダウンロード
levelsの中に適当なフォルダを作り、その中に、.usc(もしくは.sus),.mp3,.pngを追加。
config.jsonに下記の内容を記述
```
{
    "title": "曲名",
    "author": "譜面作者(任意)",
    "rating": 難易度(かならず半角英数字で)
}
```

scoresync.exeを起動。

ディレクトリにconfig.jsonがない場合自動で生成されます


起動したら、localhost:3939で開きます

## 注意
> [!CAUTION]
> libフォルダは基本触らないでください。バグります。

## 推奨バージョン

Sonolusに広告機能が入りましたので、もし効率よく今後も使いたい場合Sonolusのバージョン**0.9.0**を使い、ScoreSyncのバージョン[**0.0.8**](https://github.com/Piliman22/ScoreSync/releases/tag/0.0.8)を使うことを推奨します

## Thanks
[sonolus-pjsekai-engine-extended](https://github.com/sevenc-nanashi/sonolus-pjsekai-engine-extended?tab=readme-ov-file)

