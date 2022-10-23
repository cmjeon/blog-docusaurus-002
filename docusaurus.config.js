// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

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
          blogSidebarCount: 10,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl: 'https://github.com/cmjeon/cmjeon.github.io/tree/main/blog',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
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
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Today I Learned',
        logo: {
          alt: 'Today I Learned Logo',
          src: 'img/logo.svg',
          href: '/',
          // target: '_self',
        },
        items: [
          {
            label: 'Posts',
            type: 'docSidebar',
            sidebarId: 'posts',
            position: 'left',
          },
          {
            label: '日日新 又日新',
            to: '/blog',
            position: 'left',
          },
          {
            label: 'RESUME',
            type: 'doc',
            docId: 'resume',
            position: 'left',
          },
          // {
          //   label: 'Portfolio',
          //   type: 'docSidebar',
          //   position: 'left',
          //   sidebarId: 'portfolio',
          // },
          {
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
            href: 'https://github.com/cmjeon',
            position: 'right',
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
        theme: require('prism-react-renderer/themes/dracula'),
        additionalLanguages: ['powershell'],
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 2,
      },
    }),
};

module.exports = config;
