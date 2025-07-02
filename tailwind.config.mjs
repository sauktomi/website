/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  // Enhanced CSS optimization
  corePlugins: {
    // Disable unused core plugins to reduce CSS size
    container: false,
    float: false,
    clear: false,
    skew: false,
    caretColor: false,
    sepia: false,
    dropShadow: false,
    blur: false,
    grayscale: false,
    invert: false,
    saturate: false,
    hueRotate: false,
    backdropBlur: false,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
  },
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Inter"', 'system-ui', 'sans-serif'],
        'serif': ['"Playfair Display"', 'Georgia', 'serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '128': '32rem',
      },
      gridTemplateColumns: {
        'asymmetric': '1fr 3fr 1fr',
        'feature': '5fr 7fr',
        'gallery': 'repeat(12, 1fr)',
        'sidebar': '5rem 1fr',
        'content': '1fr minmax(auto, 65ch) 1fr',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Optimized typography settings
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': '#111827',
            '--tw-prose-headings': '#111827',
            '--tw-prose-links': '#111827',
            '--tw-prose-bold': '#111827',
            '--tw-prose-counters': '#6b7280',
            '--tw-prose-bullets': '#6b7280',
            '--tw-prose-hr': '#e5e7eb',
            '--tw-prose-quotes': '#111827',
            '--tw-prose-quote-borders': '#2563eb',
            '--tw-prose-captions': '#6b7280',
            '--tw-prose-code': '#111827',
            '--tw-prose-pre-code': '#f8fafc',
            '--tw-prose-pre-bg': '#1e293b',
            '--tw-prose-th-borders': '#e5e7eb',
            '--tw-prose-td-borders': '#e5e7eb',
            
            maxWidth: '70ch',
            lineHeight: '1.6',
            fontSize: '1rem',
            
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            
            h1: {
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: '700',
              fontSize: '2.25em',
              lineHeight: '1.1',
              marginTop: '0',
              marginBottom: '0.8888889em',
            },
            
            h2: {
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: '600',
              fontSize: '1.5em',
              lineHeight: '1.3333333',
              marginTop: '2em',
              marginBottom: '1em',
            },
            
            h3: {
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: '600',
              fontSize: '1.25em',
              lineHeight: '1.6',
              marginTop: '1.6em',
              marginBottom: '0.6em',
            },
            
            blockquote: {
              fontStyle: 'italic',
              fontWeight: '500',
              borderLeftWidth: '4px',
              borderLeftColor: 'var(--tw-prose-quote-borders)',
              paddingLeft: '1.5rem',
              marginTop: '1.6em',
              marginBottom: '1.6em',
            },
            
            img: {
              marginTop: '2em',
              marginBottom: '2em',
              borderRadius: '0.5rem',
            },
            
            'figure > img': {
              marginTop: '0',
              marginBottom: '0',
            },
            
            figcaption: {
              fontSize: '0.875em',
              lineHeight: '1.4285714',
              marginTop: '0.8571429em',
            },
            
            a: {
              color: 'var(--tw-prose-links)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--tw-prose-links)',
              fontWeight: '500',
              '&:hover': {
                color: '#2563eb',
                borderBottomColor: '#2563eb',
                borderBottomWidth: '2px',
              },
            },
            
            code: {
              color: 'var(--tw-prose-code)',
              backgroundColor: '#f1f5f9',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
              fontWeight: '500',
              '&::before': { content: '""' },
              '&::after': { content: '""' },
            },
            
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              color: 'var(--tw-prose-pre-code)',
            },
            
            pre: {
              backgroundColor: 'var(--tw-prose-pre-bg)',
              overflowX: 'auto',
              fontWeight: '400',
              fontSize: '0.875em',
              lineHeight: '1.7142857',
              marginTop: '1.7142857em',
              marginBottom: '1.7142857em',
              borderRadius: '0.375rem',
              paddingTop: '0.8571429em',
              paddingRight: '1.1428571em',
              paddingBottom: '0.8571429em',
              paddingLeft: '1.1428571em',
            },
            
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.625em',
            },
            
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.625em',
            },
            
            'ul > li': {
              position: 'relative',
              paddingLeft: '0.375em',
            },
            
            'ol > li': {
              position: 'relative',
              paddingLeft: '0.375em',
            },
            
            li: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            
            table: {
              width: '100%',
              tableLayout: 'auto',
              textAlign: 'left',
              marginTop: '2em',
              marginBottom: '2em',
              fontSize: '0.875em',
              lineHeight: '1.7142857',
            },
            
            thead: {
              borderBottomWidth: '1px',
              borderBottomColor: 'var(--tw-prose-th-borders)',
            },
            
            'thead th': {
              color: 'var(--tw-prose-headings)',
              fontWeight: '600',
              verticalAlign: 'bottom',
              paddingRight: '0.5714286em',
              paddingBottom: '0.5714286em',
              paddingLeft: '0.5714286em',
            },
            
            'tbody td': {
              verticalAlign: 'baseline',
              paddingTop: '0.5714286em',
              paddingRight: '0.5714286em',
              paddingBottom: '0.5714286em',
              paddingLeft: '0.5714286em',
            },
            
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: 'var(--tw-prose-td-borders)',
            },
          },
        },
        
        // Dark mode typography
        dark: {
          css: {
            '--tw-prose-body': '#f0f0f0',
            '--tw-prose-headings': '#f0f0f0',
            '--tw-prose-links': '#f0f0f0',
            '--tw-prose-bold': '#f0f0f0',
            '--tw-prose-counters': '#a0a0a0',
            '--tw-prose-bullets': '#a0a0a0',
            '--tw-prose-hr': '#2a2a2a',
            '--tw-prose-quotes': '#f0f0f0',
            '--tw-prose-quote-borders': '#d32f2f',
            '--tw-prose-captions': '#a0a0a0',
            '--tw-prose-code': '#f0f0f0',
            '--tw-prose-pre-code': '#f8fafc',
            '--tw-prose-pre-bg': '#0f172a',
            '--tw-prose-th-borders': '#2a2a2a',
            '--tw-prose-td-borders': '#2a2a2a',
            
            code: {
              backgroundColor: '#334155',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  // Enhanced CSS optimization
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Additional optimization settings
  blocklist: [
    // Remove potentially unused patterns
    'col-span-7',
    'col-span-8', 
    'col-span-9',
    'col-span-10',
    'col-span-11',
    'col-start-7',
    'col-start-8',
    'col-start-9',
    'col-start-10',
    'col-start-11',
    'col-start-12',
    'row-span-7',
    'row-span-8',
    'row-span-9',
    'row-span-10',
    'row-span-11',
    'row-span-12',
  ]
} 