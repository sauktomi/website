// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { remarkWikiLinks } from './src/remark-wiki-link.mjs';
import { remarkTimerLinks } from './src/remark-timer-links.mjs';
import { remarkFigureCaption } from './src/scripts/remarkFigureCaption.mjs';
import { remarkRecipeContainers } from './src/scripts/remark-recipe-containers.mjs';
import { remarkRecipeSections } from './src/scripts/remark-recipe-sections.mjs';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [
    preact()
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
  compressHTML: true,
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689,
      }
    },
    domains: [],
    remotePatterns: []
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: false,
      minify: 'esbuild',
      target: 'es2020',
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').pop();
            
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
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            
            if (id.includes('ingredient-popup') || id.includes('ingredient-data-loader')) {
              return 'ingredients';
            }
            
            if (id.includes('scripts/')) {
              return 'scripts';
            }
          }
        }
      }
    },
    optimizeDeps: {
      include: ['astro/assets'],
      exclude: []
    }
  },
  markdown: {
    remarkPlugins: [remarkWikiLinks, remarkTimerLinks, remarkFigureCaption, remarkGfm, remarkRecipeContainers, remarkRecipeSections],
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