import { visit } from 'unist-util-visit';

/**
 * Remark plugin to handle custom markdown containers for recipe info notes
 * Supports :::info and :::notice containers only
 */
export function remarkRecipeContainers() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!node.children || node.children.length === 0) return;
      
      // Look for container syntax like :::info, :::notice
      const firstChild = node.children[0];
      if (firstChild && firstChild.type === 'text' && firstChild.value.trim().startsWith(':::')) {
        const match = firstChild.value.trim().match(/^:::(\w+)/);
        if (!match) return;
        
        const containerType = match[1].toLowerCase();
        const validTypes = ['info', 'notice'];
        
        if (!validTypes.includes(containerType)) return;
        
        // Find the closing ::: 
        let endIndex = index;
        let contentNodes = [];
        let foundClosing = false;
        
        // Check if this is a single-line container like :::type content :::
        const trimmedValue = firstChild.value.trim();
        const closingIndex = trimmedValue.lastIndexOf(':::');
        
        if (closingIndex > 3) {
          // Single line container: :::type content :::
          const content = trimmedValue.substring(match[0].length, closingIndex).trim();
          if (content) {
            contentNodes = [{
              type: 'paragraph',
              children: [{ type: 'text', value: content }]
            }];
          }
          foundClosing = true;
        } else {
          // Multi-line container - check if there's content on the same line after :::type
          const remainingText = trimmedValue.replace(/^:::\w+\s*/, '').trim();
          if (remainingText) {
            contentNodes.push({
              type: 'paragraph',
              children: [{ type: 'text', value: remainingText }]
            });
          }
          
          // Look through subsequent nodes for content and closing
          for (let i = index + 1; i < parent.children.length; i++) {
            const currentNode = parent.children[i];
            
            if (currentNode.type === 'paragraph' && 
                currentNode.children && 
                currentNode.children[0] && 
                currentNode.children[0].type === 'text' && 
                currentNode.children[0].value.trim() === ':::') {
              endIndex = i;
              foundClosing = true;
              break;
            }
            
            contentNodes.push(currentNode);
            endIndex = i;
          }
        }
        
        if (foundClosing || contentNodes.length > 0) {
          // Create the container div
          const containerDiv = {
            type: 'div',
            data: {
              hName: 'div',
              hProperties: {
                className: `recipe-note recipe-note-${containerType}`
              }
            },
            children: [
              {
                type: 'div',
                data: {
                  hName: 'div',
                  hProperties: {
                    className: 'recipe-note-title'
                  }
                },
                children: [
                  {
                    type: 'text',
                    value: getNoteTitleByType(containerType)
                  }
                ]
              },
              {
                type: 'div',
                data: {
                  hName: 'div',
                  hProperties: {
                    className: 'recipe-note-content'
                  }
                },
                children: contentNodes
              }
            ]
          };
          
          // Replace the original nodes with the container
          parent.children.splice(index, endIndex - index + 1, containerDiv);
        }
      }
    });
  };
}

function getNoteTitleByType(type) {
  const titles = {
    'info': 'Huomio',
    'notice': 'Huomio'
  };
  return titles[type] || 'Huomio';
}

export default remarkRecipeContainers; 