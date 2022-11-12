// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
require('dotenv').config()

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Today I Learned',
  tagline: 'javascript, frontend, Project Management',
  url: 'https://blog-cmjeon.vercel.app',
  baseUrl: '/',
  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'cmjeon', // Usually your GitHub org/user name.
  projectName: 'cmjeon.github.io', // Usually your repo name.
  deploymentBranch: 'gh-pages',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ko-kr',
    locales: ['ko-kr'],
  },
  scripts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js',
      defer: true
    }
  ],
  stylesheets: [
    {
      href: "https://cdnjs.cloudflare.com/ajax/libs/mermaid/6.0.0/mermaid.css"
    }
  ],
  // ssrTemplate: `
  // <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <script>mermaid.initialize({ startOnLoad: true });</script>
  //     </head>
  //   </html>
  // `,
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl: 'https://github.com/cmjeon/cmjeon.github.io/tree/main/docs',
        },
        blog: {
          routeBasePath: '/blog', // Serve the blog at the site's root
          showReadingTime: true,
          blogSidebarCount: 'ALL',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl: 'https://github.com/cmjeon/cmjeon.github.io/tree/main/blog',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        gtag: {
          trackingID: process.env.gtagTrackingId,
          anonymizeIP: true,
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      }),
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030, // max resized image's size.
        min: 640, // min resized image's size. if original is lower, use that size.
        steps: 2, // the max number of images generated between min and max (inclusive)
        disableInDev: false,
      },
    ],
    [
      '@docusaurus/plugin-pwa',
      {
        debug: true,
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: '/img/logo.png',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: 'manifest.json', // your PWA manifest
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: 'rgb(84, 104, 255)',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-capable',
            content: 'yes',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-status-bar-style',
            content: '#000',
          },
          {
            tagName: 'link',
            rel: 'apple-touch-icon',
            href: 'img/logo.png',
          },
          {
            tagName: 'link',
            rel: 'mask-icon',
            href: 'img/logo-2.svg',
            color: 'rgb(255, 255, 255)',
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileImage',
            content: 'img/logo.png',
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileColor',
            content: '#000',
          },
        ],
      },
    ],
    'docusaurus-plugin-google-adsense',
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {name: 'naver-site-verification', content: '58c1378aa6cf5b0d7b3a58ba7816256bc2083b3b'}
      ],
      colorMode: {
        defaultMode: 'dark', // light, dark
      },
      navbar: {
        title: 'Today I Learned',
        hideOnScroll: true,
        style: 'dark', // primary, dark
        logo: {
          alt: 'Today I Learned Logo',
          src: 'img/logo-2.svg',
          href: '/',
          // target: '_self',
        },
        items: [
          // 특정 문서뭉치 표시 예시
          // {
          //   label: 'Docusaurus',
          //   type: 'docSidebar',
          //   sidebarId: 'docusaurus',
          //   position: 'right',
          // },
          // dropdown 예시
          // {
          //   label: 'Posts - dd',
          //   type: 'dropdown',
          //   position: 'right',
          //   items: [
          //     {
          //       label: 'Docusaurus',
          //       type: 'docSidebar',
          //       sidebarId: 'docusaurus',
          //     }
          //   ]
          // },
          {
            label: 'Posts',
            type: 'docSidebar',
            sidebarId: 'posts',
            position: 'left',
          },
          {
            label: 'TIL',
            to: '/blog',
            position: 'left',
          },
          {
            label: 'Resume',
            type: 'doc',
            docId: 'resume',
            position: 'left',
          },
          // {
          //   label: 'Tags',
          //   to: '/blog/tags',
          //   position: 'left',
          // },
          // {
          //   label: 'Portfolio',
          //   type: 'docSidebar',
          //   position: 'left',
          //   sidebarId: 'portfolio',
          // },
          {
            href: 'https://github.com/cmjeon',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'dark',
        // links: [
        //   {
        //     title: 'Docs',
        //     items: [
        //       {
        //         label: 'Tutorial',
        //         to: '/docs/intro',
        //       },
        //     ],
        //   },
        //   {
        //     title: 'Community',
        //     items: [
        //       {
        //         label: 'Stack Overflow',
        //         href: 'https://stackoverflow.com/questions/tagged/docusaurus',
        //       },
        //       {
        //         label: 'Discord',
        //         href: 'https://discordapp.com/invite/docusaurus',
        //       },
        //       {
        //         label: 'Twitter',
        //         href: 'https://twitter.com/docusaurus',
        //       },
        //     ],
        //   },
        //   {
        //     title: 'More',
        //     items: [
        //       {
        //         label: 'Blog',
        //         to: '/blog',
        //       },
        //       {
        //         label: 'GitHub',
        //         href: 'https://github.com/facebook/docusaurus',
        //       },
        //     ],
        //   },
        // ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer/themes/github'),
        darkTheme: require('prism-react-renderer/themes/dracula'),
        additionalLanguages: ['powershell','javascript','java'],
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 3,
      },
      googleAdsense: {
        dataAdClient: process.env.googleAdsenseDataAdClient,
      },
      algolia: {
        // 알골리아에서 제공한 appId를 사용하세요.
        appId: process.env.algoliaAppId,

        // 공개 API 키: 커밋해도 문제가 생기지 않습니다.
        apiKey: process.env.algoliaApiKey,

        indexName: 'YOUR_INDEX_NAME',

        // 옵션: 아래 문서를 참고
        contextualSearch: true,

        // 옵션: history.push 대신 window.location을 통해 탐색해야 하는 도메인을 지정합니다. 여러 문서 사이트를 크롤링하고 window.location.href를 사용하여 해당 사이트로 이동하려는 경우에 유용한 알골리아 설정입니다.
        externalUrlRegex: 'external\\.com|domain\\.com',

        // 옵션: 알골리아 검색 파라미터
        searchParameters: {},

        // 옵션: 기본적으로 활성화된 검색 페이지 경로(비활성화하려면 `false`로 설정)
        searchPagePath: 'search',

        //... 다른 알골리아 파라미터
      },
      // metadata: [
      //   {name:'google-site-verification', content:'G-360E4P1PB9'}
      // ]
    }),
};

module.exports = config;
