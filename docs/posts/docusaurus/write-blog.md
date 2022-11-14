---
title: 블로그 쓰기
sidebar_position: 3
last_update:
  date: 2022-11-14
description: Docusaurus 에 블로그를 써봅니다.
tags: ['docusaurus']
keywords: ['docusaurus']
---

## 블로그 쓰기

도큐사우르스에서 `/blog/` 디렉토리에 마크다운파일을 생성하여 글을 쓰면 블로그글로 인식합니다.

블로그는 공통설정과 블로그 포스팅별 설정이 있습니다.

공통 설정은 docusaurus.config.js 내에서 설정할 수 있습니다.

블로그 포스팅별 설정은 각 포스팅의 프론트매터에서 할 수 있습니다.

## 설정하기 

docusaurus.config.js 의 presets 배열에 설정을 추가할 수 있습니다.

```js
module.exports = {
  // ...
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        // highlight-start
        blog: {
          blogTitle: 'TIL',
          blogDescription: 'cmjeon Today I Learned',
          blogSidebarCount: 'ALL',
          routeBasePath: '/blog',
          postsPerPage: 5,
          blogListComponent: '@theme/BlogListPage',
          blogPostComponent: '@theme/BlogPostPage',
          blogTagsListComponent: '@theme/BlogTagsListPage',
          blogTagsPostsComponent: '@theme/BlogTagsPostsPage',
          showReadingTime: true,
        },
        // highlight-end
      },
    ]
  ]
}
```

현재 블로그의 설정입니다.

- blogTitle: 블로그 페이지의 타이틀
- blogDescription: 블로그 페이지의 설명
- blogSidebarCount: 블로그 왼쪽에 표시되는 글 수, ALL 은 전부 표현됩니다.
- routeBasePath: 블로그의 디렉토리의 위치
- postsPerPage: 목록에 블로그가 표시되는 최대 글 수
- showReadingTime: 블로그에 읽는 시간 표시

모든 설정에 대한 설명은 아래 링크에 있습니다.

[https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-blog#configuration](https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-blog#configuration)

## 마크다운 프론트매터

마크다운 문서의 가장 상단에 --- 로 감싸고 있는 영역을 프론트매터라고 합니다.

프론트매터는 문서의 일종의 설정값입니다.

```markdown
---
date: 2022-11-14
title: '2022년 11월 14일'
authors: [cmjeon]
tags: ['서말']
draft: true
---

## ...
```

- date: 게시물의 생성시간
- title: 게시물 제목
- authors: 블로그의 작성자
- tags: 포스트와 관련된 태그
- draft: 초안인 경우 해당 요소를 true 로 지정하면 development 상태에서만 볼 수 있음

프론트매터의 모든 설정에 대한 설명은 아래 링크에 있습니다.

[https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-blog#markdown-front-matter](https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-blog#markdown-front-matter)

## 마크다운으로 블로그 쓰기

블로그는 마크다운으로 작성할 수 있습니다.

마크다운은 일종의 마크업 언어입니다.

[https://www.markdownguide.org/](https://www.markdownguide.org/)

마크다운은 기호 등을 이용해 문장에 서식을 정해주는 방식으로 작동합니다.

파일을 .md 확장자로 생성하여 마크다운 문법에 따라 작성합니다. 
