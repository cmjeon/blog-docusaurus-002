import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './index.module.css';

export default function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/category/docusaurus-블로그-만들기">
            Posts
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/blog">
            TIL
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="docs/resume">
            RESUME
          </Link>
        </div>
      </div>
    </header>
  );
}