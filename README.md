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
ディレクトリにconfig.jsonがない場合自動で生成されます
scoresync.exeを起動。

## Thanks
[sonolus-pjsekai-engine-extended](https://github.com/sevenc-nanashi/sonolus-pjsekai-engine-extended?tab=readme-ov-file)

起動したら、localhost:3939で開きます
