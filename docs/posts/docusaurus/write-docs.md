---
title: 문서 작성하기
sidebar_position: 4
last_update:
  author: cm jeon
  date: 2022-11-26
description: Docusaurus 에 문서를 작성해 봅니다.
tags: ['docusaurus']
keywords: ['docusaurus']
---

## 문서 작성하기

도큐사우르스에서 `/docs/` 디렉토리내에서 마크다운파일을 생성하면 문서로로 인식합니다.

문서 역시 공통설정과 문서별 설정이 있습니다.

공통 설정은 docusaurus.config.js 내에서 설정할 수 있습니다.

문서별 설정은 각 문서의 프론트매터에서 할 수 있습니다.

## 설정하기

docusaurus.config.js 의 presets 배열에 설정을 추가할 수 있습니다.

```js title="docusaurus.config.js"
module.exports = {
  // ...
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        // highlight-start
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          sidebarCollapsed: true,
          sidebarCollapsible: true,
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        // highlight-end
      },
    ]
  ]
}
```

현재 문서의 설정입니다.

- sidebarPath: 문서의 사이드바가 설정되어있는 파일의 위치입니다.
- sidebarCollapsed: 최초에 문서의 사이드바가 접힌채로 표현될지를 결정합니다.
- sidebarCollapsible: 사이드바에 접히는 기능을 부여할지 결정합니다. 
- showLastUpdateAuthor: 최종버전을 업데이트한 작성자를 표시할지 결정합니다.
- showLastUpdateTime: 최종버전이 업데이트된 시점을 표시할지 결정합니다.
- breadcrumbs: 문서의 위치를 표시할지 결정합니다.

:::info

모든 설정에 대한 설명은 아래 링크에 있습니다.

[https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-docs#configuration](https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-docs#configuration)

:::

## 마크다운 프론트매터

마크다운 문서의 가장 상단에 --- 로 감싸고 있는 영역을 프론트매터라고 합니다.

프론트매터는 문서의 일종의 설정값입니다.

> 문서의 프론트매터 설정값은 블로그와는 약간 다릅니다.

```markdown
---
title: 블로그 작성하기
sidebar_position: 3
last_update:
  author: cm jeon
  date: 2022-11-14
description: Docusaurus 에 블로그를 작성해 봅니다.
tags: ['docusaurus']
keywords: ['docusaurus']
---

## ...
```

- title: 문서 제목
- sidebar_position: 게시물이 사이드바의 몇번째 문서인지 지정
- last_update: 
- author: 문서의 작성자, 문자열로만 표현가능합니다.
- date: 문서의 생성시간을 표현합니다.
- description: 문서의 설명
- tags: 문서와 관련된 태그
- draft: 초안인 경우 해당 요소를 true 로 지정하면 development 상태에서만 볼 수 있습니다.
- toc_min_heading_level: 문서에 있는 헤딩영역 중 콘텐츠 테이블에 표현되어야 하는 최소 레벨
- toc_max_heading_level: 문서에 있는 헤딩영역 중 콘텐츠 테이블에 표현되어야 하는 최대 레벨

:::note

toc 는 Table Of Content 의 약자입니다.

:::

:::info

프론트매터의 모든 설정에 대한 설명은 아래 링크에 있습니다.

[https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-docs#markdown-front-matter](https://docusaurus.io/ko/docs/api/plugins/@docusaurus/plugin-content-docs#markdown-front-matter)

:::

## 마크다운으로 문서 작성하기

문서는 마크다운으로 작성할 수 있습니다.

## 참고

[https://docusaurus.io/ko/docs/docs-introduction](https://docusaurus.io/ko/docs/docs-introduction)