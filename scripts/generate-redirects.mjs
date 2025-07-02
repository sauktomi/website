#!/usr/bin/env node
// scripts/generate-redirects.mjs
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Generate platform-specific redirect files for static deployment
 * Supports Netlify, Vercel, Apache, and Nginx
 */

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return null;
  
  const endIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (endIndex === -1) return null;
  
  const frontmatterLines = lines.slice(1, endIndex);
  const frontmatter = {};
  
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      
      if (key === 'title') {
        frontmatter.title = value.replace(/^['"]|['"]$/g, '');
      } else if (key === 'luotu') {
        frontmatter.luotu = value;
      }
    }
  }
  
  return frontmatter;
}

async function generateRedirects() {
  console.log('🔄 Generating static redirect files...');
  
  // Find all recipe markdown files
  const recipeFiles = await glob('src/content/Reseptit/**/*.md');
  console.log(`📁 Found ${recipeFiles.length} recipe files`);
  
  const recipes = [];
  
  // Parse each recipe file
  for (const filePath of recipeFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);
    
    if (frontmatter) {
      // Get slug from file path
      const relativePath = filePath.replace('src/content/Reseptit/', '').replace('.md', '');
      const slug = relativePath.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9äöåÄÖÅ\-\/]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      recipes.push({
        slug,
        title: frontmatter.title || 'Untitled Recipe',
        luotu: frontmatter.luotu ? new Date(frontmatter.luotu) : new Date(0),
        filePath: relativePath
      });
    }
  }
  
  // Sort by creation date for consistent numbering
  const sortedRecipes = recipes.sort((a, b) => {
    if (a.luotu.getTime() !== b.luotu.getTime()) {
      return a.luotu.getTime() - b.luotu.getTime();
    }
    
    return a.slug.localeCompare(b.slug);
  });
  
  const redirects = [];
  
  sortedRecipes.forEach((recipe, index) => {
    const number = index + 1;
    const baseSlug = recipe.slug.includes('/') ? recipe.slug.split('/').pop() : recipe.slug;
    const canonicalUrl = `/reseptit/${baseSlug}`;
    
    // Generate all number format variations
    const variations = [
      number.toString(),                    // "1", "10", "25"
      number.toString().padStart(3, '0'),   // "001", "010", "025"
    ];
    
    // Add 2-digit format only if different from unpadded (for numbers 1-9)
    const twoDigit = number.toString().padStart(2, '0');
    if (twoDigit !== number.toString()) {
      variations.push(twoDigit);
    }
    
    // Create redirects for each variation
    [...new Set(variations)].forEach(numberStr => {
      redirects.push({
        from: `/reseptit/${numberStr}`,
        to: canonicalUrl,
        status: 301,
        title: recipe.title,
        number: number
      });
    });
  });
  
  console.log(`📋 Generated ${redirects.length} redirects for ${sortedRecipes.length} recipes`);
  
  // Generate Netlify _redirects file
  const netlifyRedirects = [
    '# Recipe number redirects - generated automatically',
    '# Format: /reseptit/NUMBER /reseptit/SLUG 301',
    '',
    ...redirects.map(r => `${r.from} ${r.to} ${r.status}`)
  ].join('\n');
  
  fs.writeFileSync('public/_redirects', netlifyRedirects + '\n');
  console.log('✅ Generated public/_redirects (Netlify/Cloudflare Pages)');
  
  // Generate Vercel vercel.json
  const vercelConfig = {
    redirects: redirects.map(r => ({
      source: r.from,
      destination: r.to,
      permanent: true
    }))
  };
  
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  console.log('✅ Generated vercel.json (Vercel)');
  
  // Generate Apache .htaccess
  const htaccess = [
    '# Recipe number redirects - generated automatically',
    '',
    ...redirects.map(r => `Redirect 301 ${r.from} ${r.to}`)
  ].join('\n');
  
  fs.writeFileSync('public/.htaccess', htaccess + '\n');
  console.log('✅ Generated public/.htaccess (Apache)');
  
  // Generate Nginx redirects
  const nginxRedirects = [
    '# Recipe number redirects - generated automatically',
    '# Include this in your Nginx server block',
    '',
    ...redirects.map(r => `rewrite ^${r.from}$ ${r.to} permanent;`)
  ].join('\n');
  
  fs.writeFileSync('nginx-redirects.conf', nginxRedirects + '\n');
  console.log('✅ Generated nginx-redirects.conf (Nginx)');
  
  // Show summary
  console.log('\n📊 Redirect Summary:');
  console.log(`   Recipe #1: ${redirects.find(r => r.number === 1)?.title} → ${redirects.find(r => r.number === 1)?.to}`);
  console.log(`   Recipe #5: ${redirects.find(r => r.number === 5)?.title} → ${redirects.find(r => r.number === 5)?.to}`);
  console.log(`   Recipe #${sortedRecipes.length}: ${redirects.find(r => r.number === sortedRecipes.length)?.title} → ${redirects.find(r => r.number === sortedRecipes.length)?.to}`);
  
  console.log('\n🎉 All redirect files generated successfully!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRedirects().catch(console.error);
}

export { generateRedirects }; 