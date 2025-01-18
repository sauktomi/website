document.addEventListener('DOMContentLoaded', () => {
    class SearchableTable {
      constructor(container) {
        this.container = container;
        this.table = container.querySelector('table');
        if (!this.table) return;
        this.initializeElements();
        this.setupEventListeners();
        this.initializeTable();
      }

      initializeElements() {
        this.filter = this.container.querySelector('.table-filter');
        this.search = this.container.querySelector('.table-search');
        this.headers = Array.from(this.table.querySelectorAll('th'));
        this.rows = Array.from(this.table.querySelectorAll('tbody tr'));
        this.categoryTitles = this.headers.slice(1).map(header => header.textContent);
        this.headerRow = this.table.querySelector('thead tr');
        this.resultsCount = this.createResultsCount();
        this.searchTimeout = null;
      }

      createResultsCount() {
        const resultsCount = document.createElement('div');
        resultsCount.className = 'results-count';
        this.container.querySelector('.table-controls').appendChild(resultsCount);
        return resultsCount;
      }

      setupEventListeners() {
        this.search.addEventListener('input', this.debounceSearch.bind(this));
        this.filter.addEventListener('change', () => this.filterTable());
        this.rows.forEach(row => {
          row.cells[0].addEventListener('click', () => {
            if (this.filter.value === '') {
              this.toggleRowContent(row);
            }
          });
        });
      }

      initializeTable() {
        this.simplifyHeaders();
        this.setupFilterOptions();
        this.structureCellContent();
        this.filterTable();
      }

      simplifyHeaders() {
        this.headerRow.innerHTML = `
          <th>Mauste</th>
          <th class="default-header">Käyttötavat</th>
        `;
      }

      setupFilterOptions() {
        const options = [
          '<option value="">Valitse kategoria</option>',
          '<option value="all">Kaikki kategoriat</option>',
          ...this.categoryTitles.map(title => 
            `<option value="${title}">${title}</option>`
          )
        ];
        this.filter.innerHTML = options.join('');
      }

      structureCellContent() {
        this.rows.forEach(row => {
          this.categoryTitles.forEach((title, index) => {
            const cell = row.cells[index + 1];
            const content = cell.textContent.trim();
            if (content) {
              cell.innerHTML = `<div class="category-content"><strong>${title}:</strong> ${content}</div>`;
            }
          });
        });
      }

      debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.filterTable(), 150);
      }

      updateResultsCount(visibleCount) {
        this.resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'tulos' : 'tulosta'}`;
      }

      toggleRowContent(row) {
        row.classList.toggle('active');
        this.updateHeaderVisibility();
      }

      updateHeaderVisibility() {
        const defaultHeader = this.headerRow.querySelector('.default-header');
        const selectedCategory = this.filter.value;
        
        if (selectedCategory === 'all') {
          defaultHeader.classList.add('active');
          defaultHeader.textContent = 'Käyttötavat';
        } else if (selectedCategory) {
          defaultHeader.classList.add('active');
          defaultHeader.textContent = selectedCategory;
        } else {
          const anyActiveRows = this.rows.some(row => row.classList.contains('active'));
          defaultHeader.classList.toggle('active', anyActiveRows);
          defaultHeader.textContent = 'Käyttötavat';
        }
      }

      filterTable() {
        // Reset all active states first
        this.rows.forEach(row => {
          row.classList.remove('active');
          row.querySelectorAll('td').forEach(cell => cell.classList.remove('active'));
        });
        const searchTerm = this.search.value.toLowerCase();
        const selectedCategory = this.filter.value;
        let visibleCount = 0;

        this.rows.forEach(row => {
          const showRow = !searchTerm || row.textContent.toLowerCase().includes(searchTerm);
          row.classList.toggle('hidden', !showRow);
          
          if (showRow) {
            visibleCount++;
            if (selectedCategory === 'all') {
              row.classList.add('active');
            } else if (selectedCategory && selectedCategory !== '') {
              row.classList.remove('active');
              const categoryIndex = this.categoryTitles.indexOf(selectedCategory);
              if (categoryIndex !== -1) {
                row.cells[categoryIndex + 1].classList.add('active');
              }
            } else if (searchTerm) {
              row.classList.add('active');
            } else {
              row.classList.remove('active');
            }
          } else {
            row.classList.remove('active');
            row.querySelectorAll('td').forEach(cell => cell.classList.remove('active'));
          }
          
          row.cells[0].classList.toggle('clickable', selectedCategory === '');
        });

        this.updateHeaderVisibility();
        this.updateResultsCount(visibleCount);
      }
    }

    document.querySelectorAll('.searchable-table-container').forEach(container => {
      new SearchableTable(container);
    });
});