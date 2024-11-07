document.addEventListener('DOMContentLoaded', function() {
  const categoryDropdown = document.getElementById('categoryDropdown');
  const categoryNav = document.getElementById('categoryNav');

  // Toggle main navigation visibility
  if (categoryDropdown && categoryNav) {
    categoryDropdown.addEventListener('click', function() {
      categoryNav.classList.toggle('show');
    });
  }

  // Initially hide all subcategory lists
  document.querySelectorAll('.subcategory-list').forEach(list => {
    list.classList.add('hidden');
  });

  // Handle category expansion
  document.querySelectorAll('.category-header').forEach(header => {
    const item = header.closest('.category-item');
    const sublist = item?.querySelector('.subcategory-list');
    const expandIcon = header.querySelector('.expand-icon');
    
    if (sublist) {
      header.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Hide sibling sublists at the same level
        const siblings = item.parentElement.querySelectorAll('.subcategory-list');
        siblings.forEach(sibling => {
          if (sibling !== sublist) {
            sibling.classList.add('hidden');
            const siblingIcon = sibling.parentElement.querySelector('.expand-icon');
            if (siblingIcon) siblingIcon.style.transform = 'rotate(0deg)';
          }
        });

        // Toggle current sublist
        sublist.classList.toggle('hidden');
        if (expandIcon) {
          expandIcon.style.transform = sublist.classList.contains('hidden') 
            ? 'rotate(0deg)' 
            : 'rotate(180deg)';
        }
      });
    }
  });

  // Make category items without subcategories clickable for navigation
  document.querySelectorAll('.category-item').forEach(item => {
    const sublist = item.querySelector('.subcategory-list');
    if (!sublist) {
      item.addEventListener('click', function(e) {
        if (!e.target.closest('.category-header')) {
          window.location.href = this.dataset.path;
        }
      });
    }
  });
});
