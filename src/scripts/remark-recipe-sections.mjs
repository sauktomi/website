import { visit } from 'unist-util-visit';

/**
 * Remark plugin to automatically identify and wrap recipe instruction sections
 * in styled divs and add classes to instruction steps.
 */
export function remarkRecipeSections() {
  return (tree) => {
    const sectionBoundaries = [];
    const sectionsToCreate = [];

    // 1. First pass: Identify instruction headings
    visit(tree, 'heading', (node, index) => {
      const headingId = node.data?.hProperties?.id || '';
      const headingText = node.children?.[0]?.value?.toLowerCase() || '';

      const isInstructionSection = ['ohje', 'ohjeet', 'instructions'].some(term => 
        headingId.includes(term) || headingText.includes(term)
      );

      if (isInstructionSection) {
        sectionBoundaries.push({
          index,
          depth: node.depth,
        });
      }
    });

    // 2. Determine the full range of each instruction section
    sectionBoundaries.forEach((boundary, i) => {
      let endIndex = tree.children.length;
      for (let j = i + 1; j < sectionBoundaries.length; j++) {
        if (sectionBoundaries[j].depth <= boundary.depth) {
          endIndex = sectionBoundaries[j].index;
          break;
        }
      }
      sectionsToCreate.push({
        startIndex: boundary.index,
        endIndex,
      });
    });

    // 3. Wrap the identified instruction sections
    for (const section of sectionsToCreate.sort((a, b) => b.startIndex - a.startIndex)) {
      const nodesToWrap = tree.children.slice(section.startIndex, section.endIndex);

      const wrapperNode = {
        type: 'div',
        data: {
          hName: 'div',
          hProperties: {
            className: ['recipe-section', 'recipe-section--instructions'],
          },
        },
        children: nodesToWrap,
      };

      tree.children.splice(section.startIndex, nodesToWrap.length, wrapperNode);
    }

    // 4. Add classes to instruction steps within the sections
    visit(tree, 'div', (node) => {
      const hProperties = node.data?.hProperties;
      if (!hProperties || !hProperties.className) {
        return;
      }

      let classNameString;
      if (Array.isArray(hProperties.className)) {
        classNameString = hProperties.className.join(' ');
      } else if (typeof hProperties.className === 'string') {
        classNameString = hProperties.className;
      } else {
        return;
      }
      
      if (classNameString.includes('recipe-section--instructions')) {
        processInstructionSteps(node);
      }
    });
  };
}

const addClass = (node, className) => {
  if (!node.data) node.data = {};
  if (!node.data.hProperties) node.data.hProperties = {};
  
  let currentClasses = node.data.hProperties.className || [];
  
  if (typeof currentClasses === 'string') {
    currentClasses = currentClasses.split(' ').filter(Boolean);
  }

  if (!Array.isArray(currentClasses)) {
    currentClasses = [];
  }

  if (!currentClasses.includes(className)) {
    currentClasses.push(className);
  }
  
  node.data.hProperties.className = currentClasses;
};

const processInstructionSteps = (sectionNode) => {
  visit(sectionNode, 'list', (listNode) => {
    if (listNode.ordered) {
      addClass(listNode, 'recipe-instruction-steps');
      listNode.children.forEach(listItem => {
        if (listItem.type === 'listItem') {
          addClass(listItem, 'recipe-instruction-step');
          
                      // Process instruction step content
            if (listItem.children && listItem.children.length > 0) {
              let firstParagraph = null;
              let infoNote = null;
              
              // Find the first paragraph and any info note
              listItem.children.forEach(child => {
                if (child.type === 'paragraph' && !firstParagraph) {
                  firstParagraph = child;
                } else if (child.type === 'div' && 
                           child.data?.hProperties?.className?.includes('recipe-note-info')) {
                  infoNote = child;
                }
              });
            
            // If we found both a first paragraph and an info note, insert the info content inline
            if (firstParagraph && infoNote) {
              const infoContent = infoNote.children?.find(child => 
                child.data?.hProperties?.className?.includes('recipe-note-content')
              );
              
              if (infoContent && infoContent.children) {
                // Extract text content from the info note paragraphs
                let textContent = '';
                infoContent.children.forEach(paragraph => {
                  if (paragraph.type === 'paragraph' && paragraph.children) {
                    paragraph.children.forEach(child => {
                      if (child.type === 'text') {
                        textContent += child.value;
                      } else if (child.type === 'emphasis' && child.children) {
                        // Handle italic text
                        child.children.forEach(emphasisChild => {
                          if (emphasisChild.type === 'text') {
                            textContent += emphasisChild.value;
                          }
                        });
                      }
                    });
                  }
                });
                
                if (textContent.trim()) {
                  // Create inline info span with the extracted text
                  const inlineInfoSpan = {
                    type: 'span',
                    data: {
                      hName: 'span',
                      hProperties: {
                        className: 'inline-info-content'
                      }
                    },
                    children: [
                      {
                        type: 'text',
                        value: ` ${textContent.trim()}`
                      }
                    ]
                  };
                  
                  // Create info button
                  const infoButton = {
                    type: 'button',
                    data: {
                      hName: 'button',
                      hProperties: {
                        className: 'recipe-info-button',
                        'aria-label': 'Näytä lisätiedot',
                        title: 'Näytä lisätiedot'
                      }
                    },
                    children: [
                      {
                        type: 'svg',
                        data: {
                          hName: 'svg',
                          hProperties: {
                            className: 'recipe-info-icon',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                          }
                        },
                        children: [
                          {
                            type: 'circle',
                            data: {
                              hName: 'circle',
                              hProperties: {
                                cx: '12',
                                cy: '12',
                                r: '9',
                                'stroke-width': '0.5'
                              }
                            }
                          },
                          {
                            type: 'path',
                            data: {
                              hName: 'path',
                              hProperties: {
                                className: 'info-char',
                                'stroke-linecap': 'round',
                                'stroke-linejoin': 'round',
                                'stroke-width': '2',
                                d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                              }
                            }
                          }
                        ]
                      }
                    ]
                  };
                  
                  // Add the inline info span to the end of the first paragraph
                  if (!firstParagraph.children) {
                    firstParagraph.children = [];
                  }
                  
                  // Add a space before the info content if the paragraph doesn't end with space
                  const lastChild = firstParagraph.children[firstParagraph.children.length - 1];
                  if (lastChild && lastChild.type === 'text' && !lastChild.value.endsWith(' ')) {
                    firstParagraph.children.push({ type: 'text', value: ' ' });
                  }
                  
                  firstParagraph.children.push(inlineInfoSpan);
                  
                  // Add the info button at the beginning of the first paragraph
                  firstParagraph.children.unshift(infoButton);
                  
                  // Remove the original info note from the list item
                  const infoNoteIndex = listItem.children.indexOf(infoNote);
                  if (infoNoteIndex > -1) {
                    listItem.children.splice(infoNoteIndex, 1);
                  }
                }
              }
            }
          }
        }
      });
    }
  });
};

export default remarkRecipeSections;