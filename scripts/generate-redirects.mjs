#!/usr/bin/env node

/**
 * Generate Nginx Redirects Script
 * 
 * This script reads all recipe markdown files from src/content/Reseptit/
 * and generates nginx redirect rules based on recipe IDs.
 * 
 * It creates redirects for:
 * - /reseptit/NUMBER -> /reseptit/SLUG
 * - /reseptit/00NUMBER -> /reseptit/SLUG  
 * - /reseptit/0NUMBER -> /reseptit/SLUG
 * 
 * @author Tomi
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const RECIPES_DIR = path.join(__dirname, '../src/content/Reseptit');
const OUTPUT_FILE = path.join(__dirname, '../nginx-redirects.conf');

/**
 * Get all markdown files recursively from a directory
 */
function getMarkdownFiles(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getMarkdownFiles(fullPath));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Extract recipe ID and slug from a markdown file
 */
function extractRecipeData(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter (between --- markers)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.warn(`Warning: No frontmatter found in ${filePath}`);
      return null;
    }
    
    const frontmatter = frontmatterMatch[1];
    
    // Extract recipeId
    const recipeIdMatch = frontmatter.match(/^recipeId:\s*"([^"]+)"/m);
    if (!recipeIdMatch) {
      console.warn(`Warning: No recipeId found in ${filePath}`);
      return null;
    }
    
    const recipeId = recipeIdMatch[1];
    
    // Generate slug from file path
    const relativePath = path.relative(RECIPES_DIR, filePath);
    const slug = path.basename(relativePath, '.md')
      .toLowerCase()
      .replace(/[äÄ]/g, 'a')
      .replace(/[öÖ]/g, 'o')
      .replace(/[åÅ]/g, 'a')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    
    return { recipeId, slug };
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Generate nginx redirect rules
 */
function generateRedirects(recipes) {
  let output = `# Recipe number redirects - generated automatically
# Include this in your Nginx server block

`;
  
  // Sort by recipe ID for consistent output
  recipes.sort((a, b) => parseInt(a.recipeId) - parseInt(b.recipeId));
  
  for (const recipe of recipes) {
    const { recipeId, slug } = recipe;
    const number = parseInt(recipeId);
    
    // Generate different number formats
    const formats = [
      number.toString(),           // 1, 2, 3...
      number.toString().padStart(3, '0'),  // 001, 002, 003...
      number.toString().padStart(2, '0')   // 01, 02, 03...
    ];
    
    for (const format of formats) {
      output += `rewrite ^/reseptit/${format}$ /reseptit/${slug} permanent;\n`;
    }
  }
  
  return output;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning recipe files...');
  
  // Get all markdown files
  const markdownFiles = getMarkdownFiles(RECIPES_DIR);
  console.log(`Found ${markdownFiles.length} markdown files`);
  
  // Extract recipe data
  const recipes = [];
  for (const file of markdownFiles) {
    const data = extractRecipeData(file);
    if (data) {
      recipes.push(data);
      console.log(`  ${data.recipeId} -> ${data.slug}`);
    }
  }
  
  if (recipes.length === 0) {
    console.error('❌ No valid recipes found!');
    process.exit(1);
  }
  
  console.log(`\n📝 Generating redirects for ${recipes.length} recipes...`);
  
  // Generate nginx redirects
  const redirectContent = generateRedirects(recipes);
  
  // Write to file
  try {
    fs.writeFileSync(OUTPUT_FILE, redirectContent);
    console.log(`✅ Redirects written to ${OUTPUT_FILE}`);
    console.log(`📊 Generated ${recipes.length * 3} redirect rules`);
  } catch (error) {
    console.error('❌ Failed to write redirect file:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 