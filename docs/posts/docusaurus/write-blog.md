---
title: 블로그 쓰기
sidebar_position: 3
last_update:
  date: 2022-11-14
description: Docusaurus 에 블로그를 써봅니다.
tags: ['docusaurus']
keywords: ['docusaurus']
draft: true
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
          routeBasePath: '/blog', // Serve the blog at the site's root
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

제 블로그에 설정입니다.

- blogTitle: 

모든 설정에 대한 설명은 아래 링크에 있습니다.

[https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-blog#configuration](https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-blog#configuration)



## 마크다운 프론트매터
[https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-blog#markdown-front-matter](https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-blog#markdown-front-matter)

