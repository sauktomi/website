import { visit } from 'unist-util-visit';

/**
 * A remark plugin that transforms markdown images to figures with captions.
 * It wraps images with a <figure> element and adds the alt text as a <figcaption>.
 * 
 * Also handles the special case where an italicized text follows the image
 * and uses that as the caption instead of the alt text.
 * 
 * Before:
 * ![Alt text](/path/to/image.jpg)
 * _Caption text that differs from alt_
 * 
 * After:
 * <figure>
 *   <img src="/path/to/image.jpg" alt="Alt text">
 *   <figcaption>Caption text that differs from alt</figcaption>
 * </figure>
 * 
 * Note: "Kuva: " prefix is added via CSS ::before pseudo-element, not in the content itself
 */
export function remarkFigureCaption() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      // Check if paragraph contains an image (possibly followed by other content)
      if (node.children.length > 0 && node.children[0].type === 'image') {
        const imageNode = node.children[0];
        let captionText = imageNode.alt || '';
        let hasItalicizedCaption = false;
        
        // Skip if this is already inside a figure (to avoid nesting)
        if (parent.type === 'figure') return;
        
        // Check if there's an italicized text right after the image (common pattern in recipes)
        // This would be an emphasis node right after the image, or as the only sibling
        if (node.children.length > 1 && 
            ((node.children.length === 2 && node.children[1].type === 'emphasis') || 
             (node.children.length === 3 && node.children[1].type === 'text' && 
              node.children[1].value.trim() === '' && node.children[2].type === 'emphasis'))) {
          
          // Get the last non-empty child which should be the emphasis node
          const emphasisNode = node.children[node.children.length - 1];
          if (emphasisNode.type === 'emphasis' && emphasisNode.children.length > 0) {
            // Use the italicized text as caption instead of alt text
            captionText = '';
            emphasisNode.children.forEach(child => {
              if (child.type === 'text') {
                // Remove "Kuva: " prefix if it exists in the caption text
                let text = child.value;
                if (text.startsWith('Kuva: ')) {
                  text = text.substring(6);
                }
                captionText += text;
              }
            });
            hasItalicizedCaption = true;
          }
        }
        
        // Create a new figure node with the image and caption
        const figureNode = {
          type: 'html',
          value: `<figure>
  <img src="${imageNode.url}" alt="${imageNode.alt || ''}">
  <figcaption>${captionText}</figcaption>
</figure>`
        };
        
        // Replace the paragraph node with the figure node
        parent.children.splice(index, 1, figureNode);
        
        // If there's a following paragraph that consists only of an italicized caption
        // that we already included, remove that paragraph
        if (!hasItalicizedCaption && index + 1 < parent.children.length) {
          const nextNode = parent.children[index + 1];
          if (nextNode.type === 'paragraph' && nextNode.children.length === 1 && 
              nextNode.children[0].type === 'emphasis') {
            // This looks like a standalone italicized caption paragraph, remove it
            parent.children.splice(index + 1, 1);
          }
        }
        
        return [visit.SKIP, index + 1];
      }
    });
  };
} 