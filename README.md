# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

## 새로운 블로그 주소

https://blog-cmjeon.vercel.app/

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

### Vercel Deployment

just `$ git push`

### 남은 문제들

- [x] navbar 에 github 아이콘이 안보임
- [ ] navbar algolia 검색창 만들기
- [ ] code block 에 vuejs syntax highlight 문제
- [ ] 다른 블로그들에 새 블로그 주소 남기기
- [x] PWA 적용하기
- [x] GA 등록하기
- [x] sitemap
- [ ] robots.txt