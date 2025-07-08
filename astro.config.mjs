/**
 * Astro Configuration
 * 
 * This file configures the Astro static site generator for the Finnish recipe website.
 * It includes Tailwind CSS v4, custom remark plugins for recipe processing,
 * and build optimizations for performance.
 * 
 * Key Features:
 * - Tailwind CSS v4 with custom theme system
 * - Custom remark plugins for recipe enhancement
 * - Image optimization with Sharp
 * - CSS optimization with Beasties
 * - Preact for interactive components
 * - View transitions and prefetching
 * 
 * @author Tomi
 * @version 5.10.0
 */

// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { remarkWikiLinks } from './src/remark-wiki-link.mjs';
import { remarkRecipeLinks } from './src/remark-recipe-links.mjs';
import { remarkTimerLinks } from './src/remark-timer-links.mjs';
import { remarkFigureCaption } from './src/scripts/remarkFigureCaption.mjs';

import { remarkRecipeSections } from './src/scripts/remark-recipe-sections.mjs';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';
import preact from '@astrojs/preact';
import Beasties from 'beasties';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [
    preact(),
    cssOptimizer()
  ],
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
    assetsPrefix: undefined,
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689,
        avif: { quality: 80, effort: 4 },
        webp: { quality: 80, effort: 4 },
        jpeg: { quality: 80, progressive: true },
        png: { compressionLevel: 6 }
      }
    },
    domains: ["fonts.googleapis.com", "fonts.gstatic.com"],
    remotePatterns: []
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    build: {
      cssCodeSplit: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      target: 'es2020',
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.names?.[0]?.split('.').pop();
            
            if (extType && /png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(extType)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            
            if (extType && /woff2?|ttf|eot|otf/i.test(extType)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            
            if (extType && /json|xml|txt/i.test(extType)) {
              return `assets/data/[name]-[hash][extname]`;
            }
            
            return `assets/[name]-[hash][extname]`;
          },
          manualChunks: {
            vendor: ['preact', 'preact/compat'],
          },
        }
      },
      ssr: false,
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    server: {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  },
  markdown: {
    remarkPlugins: [remarkWikiLinks, remarkRecipeLinks, remarkTimerLinks, remarkFigureCaption, remarkGfm, remarkRecipeSections],
    rehypePlugins: [rehypeAutolinkHeadings],
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  },
  legacy: {
    collections: true
  },
  security: {
    checkOrigin: true
  }
});

function cssOptimizer() {
  async function optimize(distPath) {
    async function walk(folder) {
      for (const name of readdirSync(folder)) {
        const p = join(folder, name);
        const s = statSync(p);
        if (s.isDirectory()) {
          await walk(p);
          continue;
        }
        if (extname(name) !== '.html') continue;

        try {
          const html = readFileSync(p, 'utf8');
          const beasties = new Beasties({
            path: distPath,
            publicPath: '/',
            fonts: true,
            pruneSource: false,
            reduceInlineStyles: false,
            logLevel: 'error'
          });
          const optimised = await beasties.process(html);
          writeFileSync(p, optimised);
        } catch (err) {
          console.warn(`critical-CSS ✗ ${p}`);
        }
      }
    }

    await walk(distPath);
  }

  return {
    name: 'css-optimizer',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const path = typeof dir === 'string' ? dir : dir.pathname || '';
        await optimize(path);
      }
    }
  };
}