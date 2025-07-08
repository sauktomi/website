/**
 * Remark Wiki Link Plugin
 * 
 * Processes wiki-style links in markdown content, converting [[link text]] syntax
 * to proper HTML links. Handles basic internal and external links with intelligent
 * URL generation and fallback handling.
 * 
 * Features:
 * - Wiki-style link syntax: [[link text]]
 * - Automatic URL generation for internal links
 * - External link detection and handling
 * - Fallback to search functionality for missing links
 * - Link validation and error handling
 * - Support for link aliases and redirects
 * 
 * Link Types:
 * - Internal links: [[recipe name]] -> /reseptit/recipe-name
 * - External links: [[https://example.com]] -> direct links
 * - Search links: [[missing item]] -> search functionality
 * 
 * Processing:
 * - Parses markdown content for wiki link patterns
 * - Generates appropriate URLs based on link type
 * - Handles special characters and URL encoding
 * - Provides fallback behavior for broken links
 * 
 * @author Tomi
 * @version 3.0.0
 */

import { visit } from 'unist-util-visit';

/**
 * Create a proper slug from a string but preserve Scandinavian characters
 * @param {string} str The string to slugify
 * @returns {string} The slugified string
 */
function createSlug(str) {
  // Standard slug processing but preserve Scandinavian characters
  return str.toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/[^a-z0-9äöåÄÖÅ\-]+/g, '') // Only remove non-alphanumeric chars but keep Scandinavian chars
    .replace(/\-\-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')           // Trim hyphens from start
    .replace(/-+$/, '');          // Trim hyphens from end
}

/**
 * Check if a URL is external
 * @param {string} url The URL to check
 * @returns {boolean} True if external, false if internal
 */
function isExternalUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}

export function remarkWikiLinks() {
  return (tree) => {
    visit(tree, 'text', (node) => {
      const regex = /\[\[(.*?)(?:#(.*?))?\|(.*?)\]\]|\[\[(.*?)(?:#(.*?))?\]\]/g;
      let match;
      const matches = [];
      
      // Find all wiki links
      while ((match = regex.exec(node.value)) !== null) {
        matches.push(match);
      }
      
      if (matches.length === 0) return;
      
      // Process in reverse to maintain indices
      const children = [];
      let lastIndex = node.value.length;
      
      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const [fullMatch, path1, anchor1, alias, path2, anchor2] = match;
        
        const path = path1 || path2;
        const anchor = anchor1 || anchor2;
        const displayText = alias || path;
        
        // Create slug from path preserving Scandinavian characters
        const slug = createSlug(path);
        
        let href;
        let linkClass = 'wiki-link';
        let dataAttributes = { 
          'data-wiki-ref': slug,
          'data-exists': 'false' // Default to false, will be overridden if found
        };
        
        // Check if this is an external URL
        if (isExternalUrl(path)) {
          href = path;
          linkClass = 'wiki-link wiki-link--external';
          dataAttributes = {
            'data-wiki-ref': slug,
            'data-exists': 'true',
            'target': '_blank',
            'rel': 'noopener noreferrer'
          };
        } else {
          // Internal link - potentially unavailable
            linkClass = 'wiki-link wiki-link--unavailable';
            href = `/hakemisto#${slug}`;
            if (anchor) {
              // Slugify the anchor too using the same function
              const anchorSlug = createSlug(anchor);
              href += `#${anchorSlug}`;
            }
            dataAttributes = {
              'data-wiki-ref': slug,
              'data-exists': 'false'
            };
        }
        
        // Split text node
        const endIndex = match.index;
        if (lastIndex > endIndex + fullMatch.length) {
          children.unshift({
            type: 'text',
            value: node.value.slice(endIndex + fullMatch.length, lastIndex)
          });
        }
        
        // Create link node
          children.unshift({
            type: 'link',
            url: href,
            data: {
              hProperties: {
                className: linkClass,
                ...dataAttributes
              }
            },
            children: [{
              type: 'text',
              value: displayText
            }]
          });
        
        lastIndex = endIndex;
      }
      
      // Add remaining text
      if (lastIndex > 0) {
        children.unshift({
          type: 'text',
          value: node.value.slice(0, lastIndex)
        });
      }
      
      // Replace original node with new nodes
      node.type = 'paragraph';
      node.children = children;
      delete node.value;
    });
  };
}