# Website Documentation

## Overview

This is a Finnish recipe website built with **Astro** and **Tailwind CSS v4**, following a **Bold Minimalism** design philosophy. The site features a modern, bloat-free architecture with native browser APIs and container-driven responsive design.

---

## 📄 Documentation Convention (2024)

**Every non-content file in the codebase now begins with a structured file-level docblock.**

- **What is documented?**
  Everything except content files (markdown recipes, JSON/YAML data, and other user content)

### Docblock Structure
Each file-level docblock includes:
- Purpose and high-level description
- Key features and responsibilities
- Integration points and dependencies
- Author and version
- (Where relevant) usage or API notes

**Docblock Audit (2024-06):**
> As of June 2024, a full audit was completed. All non-content files (scripts, components, styles, and utilities) now have structured docblocks at the top of the file, following this convention. This is enforced project-wide.

### Docblock Extraction Methodology
To maintain clarity and avoid duplication, this project uses a systematic approach to analyze file-level documentation:

- **Docblock Extraction**: To get a true overview of the codebase's documented intent and structure, extract the full docblock content from each file (not just the file names).
- **How to use**: Run the following command to print the full docblock (from `/**` to `*/`) for every non-content file:

```sh
find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.astro" -o -name "*.css" -o -name "*.mjs" \) -exec awk '/^\/\*\*/{flag=1; doc=""; file=FILENAME} flag{doc=doc $0 ORS} /\*\// && flag{flag=0; print "File: " file "\n" doc; doc=""}' {} +
```

- **Coverage**: As of the latest audit, this command covers 100% of non-content files in the codebase.
- **Benefits**: This method provides a fast, context-rich overview of the codebase, supporting ongoing refactoring, onboarding, and architectural reviews.

This methodology is part of the project's commitment to transparency, maintainability, and minimalism.

---

## 🏗️ Architecture

### Tech Stack
- **Framework**: Astro 5.10.0 (Static Site Generator)
- **Styling**: Tailwind CSS v4 with custom theme system
- **JavaScript**: Minimal vanilla JS with TypeScript
- **Content**: Markdown-based recipe system with Astro Content Collections
- **Deployment**: Nginx with optimized build pipeline

## 📁 Project Structure

```
Website/
├── astro.config.mjs              # Astro configuration with build optimizations
├── package.json                   # Project dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vercel.json                    # Vercel deployment configuration
├── nginx-redirects.conf           # Nginx redirect rules
├── DOCUMENTATION.md               # Main project documentation
├── todo.md                        # Development tasks and roadmap
├── process-images.sh              # Image processing automation
├── deploy.sh                      # Deployment automation script
├── public/                        # Static assets
│   ├── favicon.svg               # Site favicon
│   ├── _redirects                # Netlify redirects
│   ├── images/                   # Optimized images
│   │   ├── ingredients/          # Ingredient images
│   │   └── placeholder-recipe.svg
│   ├── icons/                    # UI icons
│   ├── scripts/                  # Client-side scripts
│   └── sounds/                   # Audio files (timer alerts)
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.astro          # Main navigation component
│   │   ├── SimpleFilterSystem.jsx # Unified filtering system

│   │   ├── IngredientPopover.astro # Ingredient information popovers
│   │   ├── RecipeMetadata.astro  # Recipe metadata display
│   │   ├── RelatedItems.astro    # Related content display
│   │   └── ComparisonChartJSON.astro # Data visualization
│   ├── content/                  # Content collections
│   │   ├── config.ts             # Content collection configuration
│   │   ├── Reseptit/             # Recipe markdown files
│   │   └── data/                 # JSON data files
│   │       ├── categories/       # Ingredient categories
│   │       ├── equipment.json    # Equipment data
│   │       └── techniques.json   # Cooking techniques
│   ├── layouts/                  # Page layout templates
│   │   └── Layout.astro          # Main layout component
│   ├── pages/                    # Astro page routes
│   │   ├── index.astro           # Home page
│   │   ├── hakemisto.astro       # Directory page
│   │   ├── reseptit.astro        # Recipe listing page
│   │   └── reseptit/             # Dynamic recipe pages
│   │       └── [...slug].astro   # Individual recipe pages
│   ├── scripts/                  # JavaScript modules
│   │   ├── base-layout.ts        # Centralized initialization system
│   │   ├── recipe-timer.ts       # Timer integration
│   │   ├── recipe-interactions.ts # Recipe-specific interactions
│   │   ├── site-interactions.ts  # Site-wide event handling
│   │   ├── info-mode-manager.ts  # Info display management
│   │   ├── smart-preloader.ts    # Intelligent data preloading
│   │   ├── layout/               # Layout management
│   │   │   ├── theme-manager.ts  # Theme switching
│   │   │   ├── popover-system.ts # Native popover management
│   │   │   └── settings-manager.ts # User preferences
│   │   ├── timer/                # Kitchen timer system
│   │   │   ├── timer-state.ts    # Timer state management
│   │   │   ├── timer-events.ts   # Timer event handling
│   │   │   └── timer-ui.ts       # Timer user interface
│   │   └── remark-*.mjs          # Markdown processing plugins
│   │       ├── remark-wiki-link.mjs      # Wiki link processing
│   │       ├── remark-timer-links.mjs    # Timer link processing
│   │       ├── remark-recipe-containers.mjs # Recipe container processing
│   │       ├── remark-recipe-sections.mjs   # Recipe section processing
│   │       └── remarkFigureCaption.mjs   # Figure caption processing
│   ├── styles/                   # CSS and theme files
│   │   ├── theme.css             # Tailwind v4 theme configuration
│   │   ├── global.css            # Global styles
│   │   ├── critical.css          # Critical path CSS
│   │   ├── recipe-sections.css   # Recipe-specific styles
│   │   ├── filter-system.css     # Filter system styles
│   │   ├── unified-list-styles.css # List component styles
│   │   ├── base/                 # Base styles
│   │   │   └── base-styles.css   # Foundation styles
│   │   ├── components/           # Component styles
│   │   │   ├── components.css    # General component styles
│   │   │   ├── recipe-styles.css # Recipe component styles
│   │   │   └── popup-system.css  # Popover/popup styles
│   │   ├── layout/               # Layout styles
│   │   │   └── container-queries.css # Container query system
│   │   └── utilities/            # Utility styles
│   │       └── accessibility.css # Accessibility utilities
│   └── utils/                    # TypeScript utilities
│       ├── types.ts              # Type definitions
│       ├── dom.ts                # DOM utility functions
│       ├── ruoanlaitto-data.ts   # Recipe data processing
│       ├── ingredient-data.ts    # Ingredient data utilities
│       └── normalization.ts      # Text normalization utilities
└── generated/                    # Build output (auto-generated)
```

## 🎨 Design System

### Bold Minimalism Framework
- **Typography**: Responsive font scaling with container queries
- **Spacing**: Systematic spacing using CSS custom properties
- **Colors**: Obsidian-based color palette with semantic naming
- **Layout**: Container-driven responsive design

### Theme System (Tailwind v4)
- **Location**: `src/styles/theme.css`
- **Structure**: `@theme` directive with custom properties
- **Colors**: Primary, secondary, tertiary color systems
- **Typography**: Responsive font sizes and line heights
- **Spacing**: Systematic spacing scale
- **Container Queries**: Component-level responsive breakpoints

### Color Palette
```css
/* Primary (Mid-range Obsidian) */
--color-primary-light: #f4f4f5
--color-primary: #71717a
--color-primary-accent: #52525b
--color-primary-dark: #27272a

/* Secondary (Light Obsidian) */
--color-secondary-light: #fafafa
--color-secondary: #d4d4d8
--color-secondary-accent: #71717a
--color-secondary-dark: #52525b
```

## 🚀 Key Features

### 1. Recipe System
- **Content**: Markdown-based recipes with frontmatter
- **Categories**: Kokkaus, Leivonta, Juomat
- **Metadata**: Difficulty, time, dietary info, techniques
- **Numbering**: Automatic recipe numbering system
- **Images**: Optimized WebP images with responsive variants

### 2. Interactive Components
- **Kitchen Timer**: Native browser timer with sound alerts
- **Ingredient Popovers**: Native HTML Popover API
- **Filter System**: Unified filtering across recipes and directory
- **View Transitions**: Smooth page transitions

### 3. Responsive Design
- **Container Queries**: Component-level responsiveness
- **Mobile-First**: Touch-friendly interface
- **Progressive Enhancement**: Works without JavaScript
- **Performance**: Optimized for Core Web Vitals

## 🔧 Development

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Key Scripts
- `dev`: Development server
- `build`: Production build with optimizations
- `preview`: Preview production build
- `build:redirects`: Generate redirect rules

## 📝 Content Management

### Recipe Structure
```markdown
---
title: "Recipe Title"
description: "Recipe description"
image: "/images/recipe.jpg"
category: "kokkaus"
time:
  kokonaisaika: 45
  valmistus: 15
  kypsennys: 30
vaikeustaso: "keskitaso"
dietary:
  type: ["vegetarian", "gluten-free"]
annokset: 4
---

## Ainesosat
- Ingredient 1: 100g
- Ingredient 2: 2 kpl

## Valmistus
1. Step 1
2. Step 2
```

### Data Files
- **Ingredients**: `src/content/data/categories/`
- **Equipment**: `src/content/data/equipment.json`
- **Techniques**: `src/content/data/techniques.json`

## 🎯 Performance Optimizations

### Build Optimizations
- **CSS**: Critical CSS inlining, unused CSS removal
- **Images**: WebP/AVIF conversion, responsive variants
- **JavaScript**: Tree shaking, code splitting
- **Fonts**: Preloading, display swap

### Runtime Optimizations
- **Lazy Loading**: Native image lazy loading
- **Prefetching**: Astro view transitions
- **Caching**: Aggressive caching headers
- **Minification**: Terser for JS, CSS optimization

## 🔍 SEO & Accessibility

### SEO Features
- **Meta Tags**: Dynamic meta descriptions
- **Structured Data**: Recipe schema markup
- **Sitemap**: Automatic sitemap generation
- **Canonical URLs**: Proper canonical linking

### Accessibility
- **Semantic HTML**: Proper heading structure
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and descriptions
- **Color Contrast**: WCAG AA compliant

## 🛠️ JavaScript Architecture

### Module System
- **Centralized Initializer**: Coordinates all modules
- **Dependency Management**: Proper initialization order
- **Cleanup**: Memory leak prevention
- **Error Handling**: Graceful degradation

### Key Modules
- **Theme Manager**: Dark/light mode switching
- **Settings Manager**: User preferences
- **Popover System**: Native popover management
- **Timer System**: Kitchen timer functionality
- **Recipe Interactions**: Recipe-specific features

### Event System
- **Custom Events**: Page navigation, state changes
- **Event Delegation**: Efficient event handling
- **Memory Management**: Proper cleanup on navigation

## 🚀 Deployment

### Vercel Configuration
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Configured in Vercel dashboard
- **Redirects**: Custom redirect rules for recipe numbering

### Build Pipeline
1. **Content Processing**: Markdown parsing and enhancement
2. **Image Optimization**: WebP conversion and responsive variants
3. **CSS Processing**: Tailwind compilation and optimization
4. **JavaScript Bundling**: Module bundling and minification
5. **Static Generation**: HTML generation with optimizations

## 📊 Monitoring & Analytics

### Performance Metrics
- **Core Web Vitals**: LCP, FID, CLS monitoring
- **Lighthouse Scores**: Performance, accessibility, SEO
- **Bundle Analysis**: JavaScript and CSS size tracking

### Error Tracking
- **Console Logging**: Structured logging system
- **Error Boundaries**: Graceful error handling
- **User Feedback**: Error reporting system

## 🔄 Content Workflow

### Recipe Creation
1. Create markdown file in appropriate category
2. Add frontmatter with metadata
3. Optimize images and add to public/images
4. Test locally with development server
5. Deploy to production

### Data Updates
1. Update JSON data files in content/data
2. Rebuild site to regenerate static content
3. Test filtering and search functionality
4. Deploy updates

## 🎨 Customization

### Adding New Features
1. **Components**: Create in `src/components/`
2. **Styles**: Add to appropriate CSS file
3. **Scripts**: Create module in `src/scripts/`
4. **Content**: Add to content collections

### Theme Customization
1. **Colors**: Update `src/styles/theme.css`
2. **Typography**: Modify font variables
3. **Spacing**: Adjust spacing scale
4. **Components**: Update component styles

## 🐛 Troubleshooting

### Common Issues
- **Build Errors**: Check TypeScript types and imports
- **Styling Issues**: Verify Tailwind classes and theme variables
- **Performance**: Monitor bundle sizes and Core Web Vitals
- **Content**: Validate markdown frontmatter

### Debug Tools
- **Astro Dev Tools**: Built-in debugging
- **Browser DevTools**: Performance and debugging
- **Lighthouse**: Performance auditing
- **TypeScript**: Type checking and IntelliSense

## 📚 Resources

### Documentation
- [Astro Documentation](https://docs.astro.build/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
- [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)

### Tools
- **Development**: VS Code with Astro extension
- **Design**: Figma for design mockups
- **Performance**: Lighthouse CI, WebPageTest
- **Content**: Markdown editors, image optimization tools

---

*Last updated: December 2024*
*Maintained by: Tomi* 