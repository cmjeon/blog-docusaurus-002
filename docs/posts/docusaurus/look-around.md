---
title: 둘러보기
sidebar_position: 2
last_update:
  author: cm jeon
  date: 2022-11-08
description: Docusaurus 둘러보고 대략적인 구조를 파악합니다. 
tags: ['docusaurus']
keywords: ['docusaurus']
---

## 둘러보기

도큐사우루스는 문서화를 도와주는 도구입니다.

크게 블로그형태, 문서형태, 정적사이트 형태인 3가지 종류의 문서를 게시할 수 있습니다.

## Docusaurus 구조

classic 템플릿으로 도큐사우루스를 구성했다면 프로젝트 구조는 대략 아래처럼 보이게 됩니다.

```text
my-website-root
|- blog
|  |- 2019-05-29-hello-world.md
|  `- 2020-05-30-welcome.md
|- docs
|  |- doc1.md
|  `- mdx.md
|- src
|  |- css
|  |  |- custom.css
|  `- pages
|     |- styles.module.css
|     `- index.js
|- static
|  `- img
|- docusaurus.config.js
|- package.json
|- README.md
|- sidebars.js
`- yarn.lock
```

- /blog/
  - 블로그를 게시할 때 사용하는 md 파일이 있는 디렉토리입니다.
- /docs/
  - 문서를 게시할 때 사용하는 md 파일이 있는 디렉토리입니다.
- /src/
  - md 파일이 아닌 파일들, 즉 페이지나 리액트 컴포넌트들이 있는 디렉토리입니다.
- /src/pages/
  - 웹사이트 페이지로 변환할 파일들 (jsx, tsx, mdx) 이 있는 디렉토리입니다.
- /static/
  - image 등 정적 파일이 저장되는 곳입니다.
- /docusaurus.config.js
  - 도큐사우루스 설정을 관리하는 곳입니다. 도큐사우르스에 필요한 설정은 거의 대부분 이 파일을 수정하면서 진행됩니다.
- /sidebars.js
  - 도큐사우루스의 문서중에서는 왼쪽 사이드바가 필요한 경우가 있습니다. 이 경우 사용되는 파일입니다.