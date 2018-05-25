## pageres

[https://www.npmjs.com/package/pageres](https://www.npmjs.com/package/pageres)

### new features

#### output

##### stdout saved file path

#### Options

##### `nameType`      

Filename type: only-onlyHash; full-normal&hash; normal-without hash

## pageres-cli

[https://www.npmjs.com/package/pageres-cli](https://www.npmjs.com/package/pageres-cli)

### new features

#### Options

##### `-w`, `--width`

ViewportSize width

```
$ pageresi todomvc.com 1024x5000 --crop --width 375 --height 667
```

##### `-h`, `--height`

ViewportSize height

```
$ pageresi todomvc.com 1024x5000 --crop --width 375 --height 667
```

##### `-p`, `--dest`      

Dest save Path

```
$ pageresi todomvc.com 1024x5000 --crop --width 375 --height 667 -p "./dest"
$ pageresi todomvc.com 1024x5000 --crop --width 375 --height 667 -p "/var/test/dest"
```

##### `-type`, `--nameType`      

Filename type: only-onlyHash; full-normal&hash; normal-without hash

```
$ pageresi -d test --type only --filename "<%= date %><%= time %><%= url %>-<%= size %>" http://www.example.com/#/member/orders/48?ss=1 1024x768 1366x768 
```

