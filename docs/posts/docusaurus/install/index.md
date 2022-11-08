---
title: 설치하기
sidebar_position: 1
last_update: 
  date: 2022-11-04
description: Docusaurus 설치하고, 로컬에서 구동해 봅니다.
tags: ['docusaurus']
keywords: ['docusaurus']
---

import Image from '@theme/IdealImage';

## Docusaurus 알아보기

> 도튜사우루스 홈페이지: [https://docusaurus.io/ko/](https://docusaurus.io/ko/)

---

도큐사우루스는 리액트 기반의 문서 생성 도구입니다.

2022년 8월에 2.0 이 출시되어 많은 관심을 받고 있습니다.

도큐사우루스를 사용하면 콘텐츠에만 집중하여 웹사이트를 빠르게 만들 수 있습니다.

## 설치하기

### nvm, nodejs 설치하기

도큐사우루스는 node.js 버전이 최소 16.14 이상이어야 합니다.

일단 node.js 버전을 확인합니다.

```shell
$ node -v
v16.18.0
```

만약 node.js 버전이 16.14 이하라면 새 버전을 설치해야 합니다.

node.js 는 nvm 을 통해 관리하는 편이 좋기 때문에 nvm 을 먼저 설치합니다.

[https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)

nvm 을 설치합니다.

```shell
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
```

nvm 이 설치되고 난 후 profile 파일의 하단에 아래 문구를 추가합니다.

~/.bash_profile, ~/.zshrc, ~/.profile, ~/.bashrc 것들이 profile 파일입니다.

아래는 vi 에디터를 사용해서 .zshrc 파일에 문구를 추가한 예시입니다.

```shell
$ vi ~/.zshrc

# .zshrc 파일 가장 하단
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

vi 에디터 사용법을 참고해서 작성할 수 있습니다.

[https://withcoding.com/112](https://withcoding.com/112)

이제 nvm 을 통해 node.js 16의 최신버전을 설치합니다.

```shell
$ nvm install 16
Downloading and installing node v16.18.0...
...
```

node.js 16.14 이상 버전이 설치되었으니 이제 도큐사우루스를 설치 할 수 있습니다.

```shell
# my-website 는 디렉토리명입니다. 원하는 디렉토리명으로 변경가능합니다.
$ npx create-docusaurus@latest my-website classic
```

전부 설치가 되었다면 디렉토리를 이동합니다.

```shell
$ cd my-website
```

저는 npm 보다 yarn 을 선호해서 패키지 관리자를 yarn 으로 변경해주겠습니다.

yarn 을 설치합니다.

```shell
# brew 를 통해 yarn 을 설치하는 방법
$ brew install yarn

# npm 을 통해 yarn 을 설치하는 방법
$ npm install -g yarn

# yarn 설치를 확인합니다.
$ yarn --version
```

npm 의 package-lock.json 을 삭제하고, yarn 을 실행합니다.

```shell
# npm 의 파일인 package-lock.json 을 삭제합니다.
$ rm -rf package-lock.json

# yarn 을 실행해 줍니다.
$ yarn install
```

이제 도큐사우루스를 실행합니다.

```shell
$ yarn start
[INFO] Starting the development server...
[SUCCESS] Docusaurus website is running at: http://localhost:3000/
```

브라우저에서 http://localhost:3000 에 접속해서 아래와 같은 화면이 표시되면 됩니다.

<Image img={require('./docusaurus-home.png')} />

[//]: # (<DocCardList />)
