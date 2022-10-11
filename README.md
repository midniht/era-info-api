# 中文 era 游戏版本信息数据中心 API - 配套脚本

## 准备

```Bash
$ git clone https://github.com/1ackbfun/era-info-api.git -b script ~/era_games_data
$ cd ~/era_games_data && chmod +x update clear_cache
$ echo "TOKEN" > ~/era_games_data/ERA_API_TOKEN
$ chmod 600 ~/era_games_data/ERA_API_TOKEN
```

## 使用

```Bash
$ ~/era_games_data/update "TOKEN"
```

> `TOKEN` 可直接省略；省略时默认读取 `~/era_games_data/ERA_API_TOKEN` 中记录的信息。

## 更新

```Bash
$ cd ~/era_games_data
$ git pull
# 如果发生冲突
$ rm update && git pull && chmod +x update clear_cache
```

```Bash
$ cd ~/era_games_data && git pull && chmod +x update clear_cache
```

## 定时清理 GitLab Runner 缓存

```Bash
$ crontab -e
```

参考 [crontab guru](https://crontab.guru/examples.html) 设置定时任务：

```
0 * * * * /home/gitlab-runner/era_games_data/clear_cache >/dev/null 2>&1
```
