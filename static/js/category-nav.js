document.addEventListener('DOMContentLoaded', function() {
  const categoryDropdown = document.getElementById('categoryDropdown');
  const categoryNav = document.getElementById('categoryNav');
  const backButton = document.getElementById('categoryBackBtn');
  const breadcrumbTrail = document.getElementById('breadcrumbTrail');
  const categoryContainer = document.getElementById('categoryContainer');

  let currentCategory = null;
  let lastFocusedItem = null;

  // Toggle main navigation visibility
  if (categoryDropdown && categoryNav) {
    categoryDropdown.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const isShowing = !categoryNav.classList.contains('show');
      categoryNav.classList.toggle('show');
      categoryDropdown.setAttribute('aria-expanded', isShowing);
      
      // Reset navigation when opening
      if (isShowing) {
        showRootLevel();
        // Focus first menu item
        const firstItem = categoryNav.querySelector('[role="menuitem"] a');
        if (firstItem) {
          firstItem.focus();
        }
      }
    });

    // Close navigation when clicking outside
    document.addEventListener('click', function(e) {
      if (!categoryNav.contains(e.target) && !categoryDropdown.contains(e.target)) {
        closeNav();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && categoryNav.classList.contains('show')) {
        closeNav();
      }
    });
  }

  function closeNav() {
    categoryNav.classList.remove('show');
    categoryDropdown.setAttribute('aria-expanded', 'false');
    categoryDropdown.focus();
  }

  // Handle back button clicks
  if (backButton) {
    backButton.addEventListener('click', function(e) {
      e.preventDefault();
      if (currentCategory) {
        const parentList = currentCategory.closest('.category-list');
        if (parentList) {
          const parentItem = parentList.closest('.category-item');
          if (parentItem) {
            navigateToCategory(parentItem);
            // Focus the parent category
            const parentLink = parentItem.querySelector('a');
            if (parentLink) {
              parentLink.focus();
            }
          } else {
            showRootLevel();
          }
        }
      }
    });
  }

  // Handle keyboard navigation
  categoryContainer.addEventListener('keydown', function(e) {
    const currentItem = e.target.closest('[role="menuitem"]');
    if (!currentItem) return;

    const currentList = currentItem.closest('[role="menu"]');
    const items = Array.from(currentList.querySelectorAll('[role="menuitem"]'));
    const currentIndex = items.indexOf(currentItem);
    let nextItem = null;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextItem = items[currentIndex + 1] || items[0];
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextItem = items[currentIndex - 1] || items[items.length - 1];
        break;
      case 'ArrowRight':
        e.preventDefault();
        const subMenu = currentItem.querySelector('[role="menu"]');
        if (subMenu && !subMenu.classList.contains('hidden')) {
          const firstSubItem = subMenu.querySelector('[role="menuitem"] a');
          if (firstSubItem) {
            firstSubItem.focus();
          }
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const parentMenu = currentItem.closest('[role="menu"]').closest('[role="menuitem"]');
        if (parentMenu) {
          const parentLink = parentMenu.querySelector('a');
          if (parentLink) {
            parentLink.focus();
          }
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.target.click();
        break;
    }

    if (nextItem) {
      const link = nextItem.querySelector('a');
      if (link) {
        link.focus();
      }
    }
  });

  // Handle category clicks
  categoryContainer.addEventListener('click', function(e) {
    const categoryHeader = e.target.closest('.category-header');
    if (!categoryHeader) return;

    const categoryItem = categoryHeader.closest('.category-item');
    if (!categoryItem) return;

    // If clicked on the link itself, let it navigate
    if (e.target.tagName === 'A') return;

    e.preventDefault();
    e.stopPropagation();

    const nextList = categoryItem.querySelector('.category-list');
    if (nextList) {
      const isExpanding = nextList.classList.contains('hidden');
      
      // Update ARIA states
      const categoryLink = categoryHeader.querySelector('a');
      if (categoryLink) {
        categoryLink.setAttribute('aria-expanded', isExpanding);
      }

      // Toggle visibility
      nextList.classList.toggle('hidden');
      
      // Toggle nav icon rotation
      const navIcon = categoryHeader.querySelector('.nav-icon');
      if (navIcon) {
        navIcon.classList.toggle('rotated');
      }

      // Focus management
      if (isExpanding) {
        const firstSubItem = nextList.querySelector('[role="menuitem"] a');
        if (firstSubItem) {
          firstSubItem.focus();
        }
      }
    }
  });

  function showRootLevel() {
    // Hide all sublists
    const allLists = categoryContainer.querySelectorAll('.category-list');
    allLists.forEach(list => {
      if (list.dataset.level !== 'root') {
        list.classList.add('hidden');
      } else {
        list.classList.remove('hidden');
      }
    });

    // Reset ARIA states
    const allItems = categoryContainer.querySelectorAll('[role="menuitem"] a');
    allItems.forEach(item => {
      item.setAttribute('aria-expanded', 'false');
    });

    // Hide back button
    backButton.classList.add('hidden');

    // Reset breadcrumbs
    updateBreadcrumbs(null);

    currentCategory = null;
  }

  function navigateToCategory(categoryItem) {
    // Hide all lists
    const allLists = categoryContainer.querySelectorAll('.category-list');
    allLists.forEach(list => list.classList.add('hidden'));

    // Show the clicked category's list
    const targetList = categoryItem.querySelector('.category-list');
    if (targetList) {
      targetList.classList.remove('hidden');
      
      // Update ARIA states
      const categoryLink = categoryItem.querySelector('a');
      if (categoryLink) {
        categoryLink.setAttribute('aria-expanded', 'true');
      }
    }

    // Show back button
    backButton.classList.remove('hidden');

    // Update breadcrumbs
    updateBreadcrumbs(categoryItem);

    currentCategory = categoryItem;
  }

  function updateBreadcrumbs(categoryItem) {
    breadcrumbTrail.innerHTML = '';
    
    // Create root link
    const rootLink = document.createElement('a');
    rootLink.href = '/reseptit/';
    rootLink.textContent = 'Reseptit';
    rootLink.classList.add('breadcrumb-item');
    rootLink.setAttribute('role', 'link');
    if (!categoryItem) {
      rootLink.classList.add('active');
      rootLink.setAttribute('aria-current', 'page');
    }
    breadcrumbTrail.appendChild(rootLink);

    if (categoryItem) {
      // Build array of parent categories
      const breadcrumbs = [];
      let current = categoryItem;
      while (current) {
        if (current.dataset.title && current.dataset.path) {
          breadcrumbs.unshift({
            title: current.dataset.title,
            path: current.dataset.path,
            isLast: current === categoryItem
          });
        }
        current = current.parentElement.closest('.category-item');
      }

      // Add breadcrumbs to trail
      breadcrumbs.forEach(crumb => {
        const separator = document.createElement('span');
        separator.textContent = ' > ';
        separator.classList.add('breadcrumb-separator');
        separator.setAttribute('aria-hidden', 'true');
        breadcrumbTrail.appendChild(separator);

        if (crumb.isLast) {
          const span = document.createElement('span');
          span.textContent = crumb.title;
          span.classList.add('breadcrumb-item', 'active');
          span.setAttribute('aria-current', 'page');
          breadcrumbTrail.appendChild(span);
        } else {
          const link = document.createElement('a');
          link.href = crumb.path;
          link.textContent = crumb.title;
          link.classList.add('breadcrumb-item');
          link.setAttribute('role', 'link');
          breadcrumbTrail.appendChild(link);
        }
      });
    }
  }

  // Initialize with root level
  showRootLevel();
});
