document.addEventListener('DOMContentLoaded', function() {
  console.log('Category nav script loaded');

  const categoryDropdown = document.getElementById('categoryDropdown');
  const categoryNav = document.getElementById('categoryNav');
  const backButton = document.getElementById('categoryBackBtn');
  const breadcrumbTrail = document.getElementById('breadcrumbTrail');
  const categoryContainer = document.getElementById('categoryContainer');

  let currentCategory = null;

  console.log('Elements found:', {
    categoryDropdown: !!categoryDropdown,
    categoryNav: !!categoryNav,
    backButton: !!backButton,
    breadcrumbTrail: !!breadcrumbTrail,
    categoryContainer: !!categoryContainer
  });

  // Toggle main navigation visibility
  if (categoryDropdown && categoryNav) {
    categoryDropdown.addEventListener('click', function(e) {
      console.log('Dropdown clicked');
      e.preventDefault();
      e.stopPropagation();
      categoryNav.classList.toggle('show');
      
      // Reset navigation when opening
      if (categoryNav.classList.contains('show')) {
        showRootLevel();
      }
    });

    // Close navigation when clicking outside
    document.addEventListener('click', function(e) {
      if (!categoryNav.contains(e.target) && !categoryDropdown.contains(e.target)) {
        categoryNav.classList.remove('show');
      }
    });
  }

  // Handle back button clicks
  if (backButton) {
    backButton.addEventListener('click', function(e) {
      console.log('Back button clicked');
      e.preventDefault();
      if (currentCategory) {
        const parentList = currentCategory.closest('.category-list');
        if (parentList) {
          const parentItem = parentList.closest('.category-item');
          if (parentItem) {
            navigateToCategory(parentItem);
          } else {
            showRootLevel();
          }
        }
      }
    });
  }

  // Handle category clicks
  categoryContainer.addEventListener('click', function(e) {
    const categoryHeader = e.target.closest('.category-header');
    if (!categoryHeader) return;

    const categoryItem = categoryHeader.closest('.category-item');
    if (!categoryItem) return;

    console.log('Category clicked:', {
      title: categoryItem.dataset.title,
      hasSublist: !!categoryItem.querySelector('.category-list')
    });

    e.preventDefault();
    e.stopPropagation();

    const nextList = categoryItem.querySelector('.category-list');
    if (nextList) {
      // Has subcategories - navigate deeper
      navigateToCategory(categoryItem);
    } else {
      // No subcategories - navigate to the page
      const path = categoryItem.dataset.path;
      if (path) {
        window.location.href = path;
      }
    }
  });

  function showRootLevel() {
    console.log('Showing root level');
    
    // Hide all sublists
    const allLists = categoryContainer.querySelectorAll('.category-list');
    allLists.forEach(list => {
      if (list.dataset.level !== 'root') {
        list.classList.add('hidden');
      } else {
        list.classList.remove('hidden');
      }
    });

    // Hide back button
    backButton.classList.add('hidden');

    // Reset breadcrumbs
    breadcrumbTrail.innerHTML = '<span class="breadcrumb-item active">Kategoriat</span>';

    currentCategory = null;
  }

  function navigateToCategory(categoryItem) {
    console.log('Navigating to category:', categoryItem.dataset.title);
    
    // Hide all lists
    const allLists = categoryContainer.querySelectorAll('.category-list');
    allLists.forEach(list => list.classList.add('hidden'));

    // Show the clicked category's list
    const targetList = categoryItem.querySelector('.category-list');
    if (targetList) {
      targetList.classList.remove('hidden');
      console.log('Showing list for:', categoryItem.dataset.title);
    }

    // Show back button
    backButton.classList.remove('hidden');

    // Update breadcrumbs
    updateBreadcrumbs(categoryItem);

    currentCategory = categoryItem;
  }

  function updateBreadcrumbs(categoryItem) {
    console.log('Updating breadcrumbs for:', categoryItem?.dataset.title);
    
    breadcrumbTrail.innerHTML = '';
    
    // Always start with root
    const rootSpan = document.createElement('span');
    rootSpan.textContent = 'Kategoriat';
    rootSpan.classList.add('breadcrumb-item');
    if (!categoryItem) rootSpan.classList.add('active');
    breadcrumbTrail.appendChild(rootSpan);

    if (categoryItem) {
      // Build array of parent categories
      const breadcrumbs = [];
      let current = categoryItem;
      while (current) {
        if (current.dataset.title) {
          breadcrumbs.unshift({
            title: current.dataset.title,
            isLast: current === categoryItem
          });
        }
        current = current.parentElement.closest('.category-item');
      }

      console.log('Breadcrumb items:', breadcrumbs);

      // Add breadcrumbs to trail
      breadcrumbs.forEach(crumb => {
        const separator = document.createElement('span');
        separator.textContent = ' > ';
        separator.classList.add('breadcrumb-separator');
        breadcrumbTrail.appendChild(separator);

        const span = document.createElement('span');
        span.textContent = crumb.title;
        span.classList.add('breadcrumb-item');
        if (crumb.isLast) span.classList.add('active');
        breadcrumbTrail.appendChild(span);
      });
    }
  }

  // Initialize with root level
  console.log('Initializing category nav');
  showRootLevel();
});
