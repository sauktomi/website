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
          

        }
      });
    }
  });
};

export default remarkRecipeSections;