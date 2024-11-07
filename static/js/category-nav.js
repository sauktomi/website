<script>
document.addEventListener('DOMContentLoaded', function() {
  var categoryDropdown = document.getElementById('categoryDropdown');
  var categoryNav = document.getElementById('categoryNav');

  if (categoryDropdown && categoryNav) {
    categoryDropdown.addEventListener('click', function() {
      categoryNav.classList.toggle('show');
    });
  }
});
</script>
