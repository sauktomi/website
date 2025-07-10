/**
 * Remark Timer Links Plugin
 * 
 * Processes timer links in markdown content, converting [timer:duration] syntax
 * to interactive HTML elements with kitchen timer functionality.
 * 
 * Features:
 * - Timer link syntax: [timer:5min], [timer:1h 30min]
 * - Automatic time parsing and validation
 * - Interactive timer button generation
 * - Sound alerts and notifications
 * - Mobile-optimized timer controls
 * - Accessibility features for screen readers
 * 
 * Time Formats:
 * - Minutes: [timer:5min], [timer:30min]
 * - Hours and minutes: [timer:1h 30min], [timer:2h 15min]
 * - Hours only: [timer:1h], [timer:2h]
 * - Complex formats: [timer:1h 30min 45s]
 * 
 * Generated HTML:
 * - Interactive timer buttons with countdown display
 * - Start/pause/reset controls
 * - Visual feedback for timer states
 * - Integration with kitchen timer system
 * 
 * @author Tomi
 * @version 2.0.1
 */

import { visit } from 'unist-util-visit';

/**
 * Parse time text and convert to minutes
 * @param {string} timeText The time text to parse
 * @returns {number} Total minutes
 */
function parseTimeToMinutes(timeText) {
  let totalMinutes = 0;
  
  // Handle hours (t = tunti)
  const hourMatch = timeText.match(/(\d+(?:[.,]\d+)?)\s*t/i);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1].replace(',', '.'));
    totalMinutes += hours * 60;
  }
  
  // Handle minutes (m = minuutti, min = minuuttia)
  const minuteMatch = timeText.match(/(\d+(?:[.,]\d+)?)\s*(?:min|m)(?:uut|nut)?/i);
  if (minuteMatch) {
    const minutes = parseFloat(minuteMatch[1].replace(',', '.'));
    totalMinutes += minutes;
  }
  
  // Handle seconds (s = sekuntti, sek = sekuntia)
  const secondMatch = timeText.match(/(\d+(?:[.,]\d+)?)\s*(?:sek|s)(?:unt|kun)?/i);
  if (secondMatch) {
    const seconds = parseFloat(secondMatch[1].replace(',', '.'));
    totalMinutes += seconds / 60;
  }
  
  // Handle compound formats like "1.5t" or "1,5t"
  const compoundHourMatch = timeText.match(/(\d+)[.,](\d+)\s*t/i);
  if (compoundHourMatch) {
    const hours = parseInt(compoundHourMatch[1]);
    const fraction = parseInt(compoundHourMatch[2]) / Math.pow(10, compoundHourMatch[2].length);
    totalMinutes = (hours + fraction) * 60;
  }
  
  // Handle range formats like "8-10 minuuttia"
  const rangeMatch = timeText.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:min|m)/i);
  if (rangeMatch) {
    const min1 = parseInt(rangeMatch[1]);
    const min2 = parseInt(rangeMatch[2]);
    totalMinutes = Math.min(min1, min2); // Use minimum value
  }
  
  return Math.round(totalMinutes);
}

/**
 * Check if text contains a time expression
 * @param {string} text The text to check
 * @returns {Object|null} Match object with details or null
 */
function findTimeExpression(text) {
  // Comprehensive regex for Finnish time expressions
  const timeRegex = /\b(\d+(?:[.,]\d+)?\s*(?:t|tunti|tuntia)|(?:\d+\s*[-–]\s*)?\d+(?:[.,]\d+)?\s*(?:min|minuut|minuuttia|m)|(?:\d+\s*[-–]\s*)?\d+(?:[.,]\d+)?\s*(?:sek|sekunt|sekuntia|s))\b/gi;
  
  let match;
  const matches = [];
  
  while ((match = timeRegex.exec(text)) !== null) {
    const timeText = match[1];
    const totalMinutes = parseTimeToMinutes(timeText);
    
    // Only create timer links for reasonable durations (30 seconds to 24 hours)
    if (totalMinutes >= 0.5 && totalMinutes <= 1440) {
      matches.push({
        fullMatch: match[0],
        timeText: timeText,
        totalMinutes: totalMinutes,
        index: match.index
      });
    }
  }
  
  return matches.length > 0 ? matches : null;
}

/**
 * Create a timer button element using raw HTML
 * @param {string} timeText The original time text
 * @param {number} totalMinutes Total minutes for the timer
 * @returns {Object} AST node for the timer button
 */
function createTimerButton(timeText, totalMinutes) {
  const timerId = `timer-${Math.random().toString(36).substring(2, 11)}`;
  
  // Create a button element instead of a link to avoid href="#" issues
  const buttonHTML = `<button type="button" class="timer-link" data-timer-minutes="${totalMinutes}" data-timer-text="${timeText}" data-timer-id="${timerId}" data-timer-action="start" title="Aloita ${timeText} ajastin"><span>${timeText}</span></button>`;
  
  return {
    type: 'html',
    value: buttonHTML
  };
}

export function remarkTimerLinks() {
  return (tree) => {
    let inOhjeSection = false;
    
    // Process text nodes in the ohje section
    const processTextNode = (node, index, parent) => {
      // Skip if this text node is already inside a timer element
      if (parent && (
        (parent.type === 'link' && parent.data?.hProperties?.className === 'timer-link') ||
        (parent.type === 'html' && parent.value?.includes('timer-link'))
      )) {
        return;
      }
      
      // Only process text nodes if we're in the ohje section
      if (!inOhjeSection) return;
      
      const matches = findTimeExpression(node.value);
      if (!matches || matches.length === 0) return;
      
      // Process matches in reverse order to maintain indices
      const children = [];
      let lastIndex = node.value.length;
      
      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const endIndex = match.index;
        const startIndex = match.index + match.fullMatch.length;
        
        // Add text after this match
        if (lastIndex > startIndex) {
          children.unshift({
            type: 'text',
            value: node.value.slice(startIndex, lastIndex)
          });
        }
        
        // Add timer button
        children.unshift(createTimerButton(match.timeText, match.totalMinutes));
        
        lastIndex = endIndex;
      }
      
      // Add remaining text before first match
      if (lastIndex > 0) {
        children.unshift({
          type: 'text',
          value: node.value.slice(0, lastIndex)
        });
      }
      
      // Replace the text node with new nodes
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1, ...children);
      }
    };
    
    // Walk through the tree to track sections and process text
    visit(tree, (node, index, parent) => {
      // Check for h3 headers to track sections
      if (node.type === 'heading' && node.depth === 3) {
        const headingText = node.children
          .filter(child => child.type === 'text')
          .map(child => child.value)
          .join('')
          .toLowerCase()
          .trim();
        
        if (headingText === 'ohje' || headingText === 'ohjeet') {
          inOhjeSection = true;
        } else {
          inOhjeSection = false;
        }
      }
      
      // Process text nodes if we're in the right section
      if (node.type === 'text') {
        processTextNode(node, index, parent);
      }
    });
  };
}