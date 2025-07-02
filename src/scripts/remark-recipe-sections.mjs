import { visit } from 'unist-util-visit';

/**
 * Remark plugin to automatically identify and wrap recipe sections (instructions, ingredients, mise en place)
 * in styled divs. This allows for easier and more consistent CSS targeting.
 */
export function remarkRecipeSections() {
  return (tree) => {
    const sectionBoundaries = [];
    const sectionsToCreate = [];

    // 1. First pass: Identify all headings and mark them as potential section boundaries.
    visit(tree, 'heading', (node, index) => {
      const headingId = node.data?.hProperties?.id || '';
      const headingText = node.children?.[0]?.value?.toLowerCase() || '';

      const getSectionType = () => {
        if (['ohje', 'ohjeet', 'instructions'].some(term => headingId.includes(term) || headingText.includes(term))) {
          return 'instructions';
        }
        if (['ainekset', 'ingredients'].some(term => headingId.includes(term) || headingText.includes(term))) {
          return 'ingredients';
        }
        if (['mise-en-place', 'mise', 'esivalmistelut'].some(term => headingId.includes(term) || headingText.includes(term))) {
          return 'mise';
        }
        return null;
      };

      sectionBoundaries.push({
        index,
        type: getSectionType(),
        depth: node.depth,
      });
    });

    // 2. Determine the full range of each section (from its start heading to the next heading of same/higher level).
    sectionBoundaries.forEach((boundary, i) => {
      if (!boundary.type) return;

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
        type: boundary.type,
      });
    });

    // 3. Wrap the identified sections. We process in reverse to avoid shifting indices.
    for (const section of sectionsToCreate.sort((a, b) => b.startIndex - a.startIndex)) {
      const nodesToWrap = tree.children.slice(section.startIndex, section.endIndex);

      const wrapperNode = {
        type: 'div',
        data: {
          hName: 'div',
          hProperties: {
            className: ['recipe-section', `recipe-section--${section.type}`],
          },
        },
        children: nodesToWrap,
      };

      tree.children.splice(section.startIndex, nodesToWrap.length, wrapperNode);
    }

    // 4. Second pass: Add specific classes to elements within the newly created sections.
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
        return; // Not a string or array, so we can't process it.
      }
      
      if (classNameString.includes('recipe-section--instructions')) {
        processInstructionSteps(node);
      } else if (classNameString.includes('recipe-section--ingredients')) {
        processIngredientGroups(node);
      } else if (classNameString.includes('recipe-section--mise')) {
        processMiseItems(node);
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

const processIngredientGroups = (sectionNode) => {
  visit(sectionNode, 'list', (listNode) => {
    if (!listNode.ordered) {
      addClass(listNode, 'recipe-ingredients-list');
      listNode.children.forEach(listItem => {
        if (listItem.type === 'listItem') {
          addClass(listItem, 'recipe-ingredient-item');
        }
      });
    }
  });
};

const processMiseItems = (sectionNode) => {
  visit(sectionNode, 'list', (listNode) => {
    const isTaskList = listNode.children.some(child => child.type === 'listItem' && typeof child.checked === 'boolean');
    if (isTaskList) {
      // Add both classes for compatibility
      addClass(listNode, 'contains-task-list');
      addClass(listNode, 'recipe-mise-list');
      listNode.children.forEach(listItem => {
        if (listItem.type === 'listItem') {
          addClass(listItem, 'task-list-item');
          addClass(listItem, 'recipe-mise-item');
        }
      });
    }
  });
};

export default remarkRecipeSections;