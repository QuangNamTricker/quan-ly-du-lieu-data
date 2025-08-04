/**
 * Customer Management System - Main Application
 * 
 * Features:
 * - CRUD operations for customers
 * - Import/Export data (Excel, CSV, PDF)
 * - Statistics and reporting
 * - Cloud sync with Google Sheets
 * - Activity logging
 * - Responsive design
 */

// Main Application Class
class CustomerManagementSystem {
    constructor() {
      // Initialize properties
      this.currentEditId = null;
      this.currentPage = 1;
      this.itemsPerPage = 10;
      this.sortField = 'time';
      this.sortDirection = 'desc';
      this.filteredData = [];
      
      // Initialize the app
      this.initDOMElements();
      this.initEventListeners();
      this.loadData();
      this.updateUI();
      
      // Initialize charts
      this.initCharts();
      
      // Load activity log
      this.loadActivityLog();
    }
    
    // Initialize DOM elements
    initDOMElements() {
      // Main elements
      this.appContainer = document.querySelector('.app-container');
      this.customerFormContainer = document.getElementById('customerFormContainer');
      this.customerForm = document.getElementById('customerForm');
      this.customerTable = document.getElementById('customerTable').querySelector('tbody');
      
      // Form elements
      this.customerNameInput = document.getElementById('customerName');
      this.customerProductInput = document.getElementById('customerProduct');
      this.customerPhoneInput = document.getElementById('customerPhone');
      this.customerCategorySelect = document.getElementById('customerCategory');
      this.customerNoteTextarea = document.getElementById('customerNote');
      this.phoneErrorElement = document.getElementById('phoneError');
      
      // Table controls
      this.customerSearchInput = document.getElementById('customerSearch');
      this.clearFiltersButton = document.getElementById('clearFilters');
      
      // Pagination elements
      this.firstPageButton = document.getElementById('firstPage');
      this.prevPageButton = document.getElementById('prevPage');
      this.nextPageButton = document.getElementById('nextPage');
      this.lastPageButton = document.getElementById('lastPage');
      this.pageNumbersContainer = document.getElementById('pageNumbers');
      this.startItemSpan = document.getElementById('startItem');
      this.endItemSpan = document.getElementById('endItem');
      this.totalItemsSpan = document.getElementById('totalItems');
      
      // Widgets
      this.totalCustomersWidget = document.getElementById('totalCustomers');
      this.popularProductWidget = document.getElementById('popularProduct');
      this.recentActivityWidget = document.getElementById('recentActivity');
      
      // Modal elements
      this.importModal = document.getElementById('importModal');
      
      // Navigation
      this.navLinks = document.querySelectorAll('nav a');
    }
    
    // Initialize event listeners
    initEventListeners() {
      // Form events
      this.customerForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
      document.getElementById('addCustomerBtn').addEventListener('click', () => this.showCustomerForm());
      document.getElementById('closeForm').addEventListener('click', () => this.hideCustomerForm());
      document.getElementById('cancelForm').addEventListener('click', () => this.hideCustomerForm());
      
      // Table controls
      this.customerSearchInput.addEventListener('input', () => this.filterCustomers());
      this.clearFiltersButton.addEventListener('click', () => this.clearFilters());
      
      // Sortable headers
      document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => this.sortTable(header.dataset.sort));
      });
      
      // Pagination
      this.firstPageButton.addEventListener('click', () => this.goToPage(1));
      this.prevPageButton.addEventListener('click', () => this.goToPage(this.currentPage - 1));
      this.nextPageButton.addEventListener('click', () => this.goToPage(this.currentPage + 1));
      this.lastPageButton.addEventListener('click', () => this.goToPage(Math.ceil(this.filteredData.length / this.itemsPerPage)));
      
      // Import/Export
      document.getElementById('importBtn').addEventListener('click', () => this.importData());
      document.getElementById('exportExcel').addEventListener('click', (e) => {
        e.preventDefault();
        this.exportData('excel');
      });
      document.getElementById('exportCSV').addEventListener('click', (e) => {
        e.preventDefault();
        this.exportData('csv');
      });
      document.getElementById('exportPDF').addEventListener('click', (e) => {
        e.preventDefault();
        this.exportData('pdf');
      });
      
      // Modal
      document.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
      document.getElementById('confirmImport').addEventListener('click', () => this.hideModal());
      
      // Navigation
      this.navLinks.forEach(link => {
        link.addEventListener('click', (e) => this.handleNavigation(e));
      });
    }
    
    // Load data from localStorage
    loadData() {
      try {
        const data = localStorage.getItem('customerData');
        this.customers = data ? JSON.parse(data) : [];
        this.filteredData = [...this.customers];
      } catch (error) {
        console.error('Error loading customer data:', error);
        this.customers = [];
        this.filteredData = [];
        this.showNotification('Lỗi khi tải dữ liệu', 'error');
      }
    }
    
    // Save data to localStorage
    saveData() {
      try {
        localStorage.setItem('customerData', JSON.stringify(this.customers));
        return true;
      } catch (error) {
        console.error('Error saving customer data:', error);
        this.showNotification('Lỗi khi lưu dữ liệu', 'error');
        return false;
      }
    }
    
    // Update UI elements
    updateUI() {
      this.renderCustomerTable();
      this.updatePagination();
      this.updateWidgets();
      this.updateProductList();
    }
    
    // Show customer form
    showCustomerForm() {
      this.customerFormContainer.classList.remove('hidden');
      this.customerNameInput.focus();
      document.getElementById('formTitle').textContent = 'Thêm Khách Hàng Mới';
      this.currentEditId = null;
    }
    
    // Hide customer form
    hideCustomerForm() {
      this.customerFormContainer.classList.add('hidden');
      this.customerForm.reset();
      this.phoneErrorElement.style.display = 'none';
      this.currentEditId = null;
    }
    
    // Handle form submission
    handleFormSubmit(e) {
      e.preventDefault();
      
      // Get form data
      const formData = {
        name: this.customerNameInput.value.trim(),
        product: this.customerProductInput.value.trim(),
        phone: this.customerPhoneInput.value.trim(),
        category: this.customerCategorySelect.value,
        note: this.customerNoteTextarea.value.trim()
      };
      
      // Validate form
      if (!this.validateForm(formData)) {
        return;
      }
      
      // Check for duplicate phone (except when editing)
      if (!this.currentEditId) {
        const duplicateCustomer = this.customers.find(c => c.phone === formData.phone);
        if (duplicateCustomer) {
          this.showDuplicatePhoneError(duplicateCustomer);
          return;
        }
      }
      
      // Create or update customer
      if (this.currentEditId) {
        this.updateCustomer(this.currentEditId, formData);
      } else {
        this.addCustomer(formData);
      }
      
      // Hide form and refresh UI
      this.hideCustomerForm();
      this.updateUI();
    }
    
    // Validate form data
    validateForm(formData) {
      let isValid = true;
      
      // Reset errors
      this.phoneErrorElement.style.display = 'none';
      
      // Validate name
      if (!formData.name) {
        this.showInputError(this.customerNameInput, 'Vui lòng nhập tên khách hàng');
        isValid = false;
      }
      
      // Validate product
      if (!formData.product) {
        this.showInputError(this.customerProductInput, 'Vui lòng nhập sản phẩm');
        isValid = false;
      }
      
      // Validate phone
      if (!formData.phone) {
        this.showInputError(this.customerPhoneInput, 'Vui lòng nhập số điện thoại');
        isValid = false;
      } else if (!this.isValidPhone(formData.phone)) {
        this.showInputError(this.customerPhoneInput, 'Số điện thoại không hợp lệ');
        isValid = false;
      }
      
      return isValid;
    }
    
    // Show input error
    showInputError(input, message) {
      const errorElement = input.nextElementSibling?.classList.contains('error-message') 
        ? input.nextElementSibling 
        : document.createElement('div');
      
      errorElement.className = 'error-message';
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      if (!input.nextElementSibling?.classList.contains('error-message')) {
        input.insertAdjacentElement('afterend', errorElement);
      }
      
      input.style.borderColor = 'var(--danger-color)';
      input.focus();
    }
    
    // Validate phone number format
    isValidPhone(phone) {
      return /^(0[3|5|7|8|9])+([0-9]{8})\b/.test(phone);
    }
    
    // Show duplicate phone error
    showDuplicatePhoneError(customer) {
      this.phoneErrorElement.textContent = `SĐT đã tồn tại cho khách hàng: ${customer.name}`;
      this.phoneErrorElement.style.display = 'block';
      this.customerPhoneInput.style.borderColor = 'var(--danger-color)';
      this.customerPhoneInput.focus();
    }
    
    // Add new customer
    addCustomer(formData) {
      const newCustomer = {
        id: Date.now(),
        time: new Date().toLocaleString(),
        ...formData
      };
      
      this.customers.unshift(newCustomer);
      
      if (this.saveData()) {
        this.logActivity('Thêm khách hàng mới', `Đã thêm khách hàng ${formData.name}`);
        this.showNotification('Thêm khách hàng thành công', 'success');
      }
    }
    
    // Update existing customer
    updateCustomer(id, formData) {
      const index = this.customers.findIndex(c => c.id === id);
      
      if (index !== -1) {
        const oldCustomer = this.customers[index];
        const updatedCustomer = {
          ...oldCustomer,
          ...formData,
          time: new Date().toLocaleString()
        };
        
        this.customers[index] = updatedCustomer;
        
        if (this.saveData()) {
          this.logActivity('Cập nhật khách hàng', `Đã cập nhật thông tin ${formData.name}`);
          this.showNotification('Cập nhật khách hàng thành công', 'success');
        }
      }
    }
    
    // Delete customer
    deleteCustomer(id) {
      const customer = this.customers.find(c => c.id === id);
      
      if (customer && confirm(`Bạn có chắc chắn muốn xóa khách hàng ${customer.name}?`)) {
        this.customers = this.customers.filter(c => c.id !== id);
        
        if (this.saveData()) {
          this.logActivity('Xóa khách hàng', `Đã xóa khách hàng ${customer.name}`);
          this.showNotification('Xóa khách hàng thành công', 'success');
          this.updateUI();
          
          // Reset form if editing the deleted customer
          if (this.currentEditId === id) {
            this.hideCustomerForm();
          }
        }
      }
    }
    
    // Edit customer
    editCustomer(id) {
      const customer = this.customers.find(c => c.id === id);
      
      if (customer) {
        this.currentEditId = id;
        this.customerNameInput.value = customer.name;
        this.customerProductInput.value = customer.product;
        this.customerPhoneInput.value = customer.phone;
        this.customerCategorySelect.value = customer.category || 'regular';
        this.customerNoteTextarea.value = customer.note || '';
        
        document.getElementById('formTitle').textContent = 'Chỉnh Sửa Khách Hàng';
        this.customerFormContainer.classList.remove('hidden');
        this.customerNameInput.focus();
        
        // Scroll to form
        this.customerFormContainer.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    // Filter customers based on search input
    filterCustomers() {
      const searchTerm = this.customerSearchInput.value.trim().toLowerCase();
      
      if (!searchTerm) {
        this.filteredData = [...this.customers];
      } else {
        this.filteredData = this.customers.filter(customer => 
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.product.toLowerCase().includes(searchTerm) ||
          customer.phone.includes(searchTerm) ||
          (customer.note && customer.note.toLowerCase().includes(searchTerm)) ||
          (customer.category && customer.category.toLowerCase().includes(searchTerm))
        );
      }
      
      this.currentPage = 1;
      this.updateUI();
    }
    
    // Clear all filters
    clearFilters() {
      this.customerSearchInput.value = '';
      this.filterCustomers();
    }
    
    // Sort table by field
    sortTable(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      
      this.filteredData.sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];
        
        // Handle dates
        if (field === 'time') {
          valueA = new Date(valueA);
          valueB = new Date(valueB);
        }
        
        // Handle case insensitive string comparison
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) {
          return this.sortDirection === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return this.sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
      
      this.updateUI();
    }
    
    // Render customer table
    renderCustomerTable() {
      this.customerTable.innerHTML = '';
      
      if (this.filteredData.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 8;
        cell.textContent = 'Không tìm thấy khách hàng nào';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        row.appendChild(cell);
        this.customerTable.appendChild(row);
        return;
      }
      
      // Calculate pagination bounds
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredData.length);
      const paginatedData = this.filteredData.slice(startIndex, endIndex);
      
      paginatedData.forEach((customer, index) => {
        const row = document.createElement('tr');
        row.className = 'animate__animated animate__fadeIn';
        
        row.innerHTML = `
          <td>${startIndex + index + 1}</td>
          <td>${customer.time}</td>
          <td>${customer.name}</td>
          <td>${customer.product}</td>
          <td>${customer.phone}</td>
          <td>
            <span class="category-badge ${customer.category || 'regular'}">
              ${this.getCategoryLabel(customer.category)}
            </span>
          </td>
          <td>${customer.note || '-'}</td>
          <td>
            <button class="action-btn edit" data-id="${customer.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" data-id="${customer.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        
        // Add event listeners to action buttons
        row.querySelector('.edit').addEventListener('click', () => this.editCustomer(customer.id));
        row.querySelector('.delete').addEventListener('click', () => this.deleteCustomer(customer.id));
        
        this.customerTable.appendChild(row);
      });
    }
    
    // Get category label
    getCategoryLabel(category) {
      switch (category) {
        case 'vip': return 'VIP';
        case 'potential': return 'Tiềm Năng';
        default: return 'Thường';
      }
    }
    
    // Update pagination controls
    updatePagination() {
      const totalItems = this.filteredData.length;
      const totalPages = Math.ceil(totalItems / this.itemsPerPage);
      
      // Update item count display
      this.startItemSpan.textContent = ((this.currentPage - 1) * this.itemsPerPage) + 1;
      this.endItemSpan.textContent = Math.min(this.currentPage * this.itemsPerPage, totalItems);
      this.totalItemsSpan.textContent = totalItems;
      
      // Update pagination buttons
      this.firstPageButton.disabled = this.currentPage === 1;
      this.prevPageButton.disabled = this.currentPage === 1;
      this.nextPageButton.disabled = this.currentPage === totalPages;
      this.lastPageButton.disabled = this.currentPage === totalPages;
      
      // Update page numbers
      this.pageNumbersContainer.innerHTML = '';
      
      const maxVisiblePages = 5;
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === this.currentPage ? 'active' : '';
        pageButton.addEventListener('click', () => this.goToPage(i));
        this.pageNumbersContainer.appendChild(pageButton);
      }
    }
    
    // Go to specific page
    goToPage(page) {
      const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
      
      if (page >= 1 && page <= totalPages) {
        this.currentPage = page;
        this.updateUI();
        
        // Scroll to top of table
        this.customerTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    
    // Update dashboard widgets
    updateWidgets() {
      // Total customers
      this.totalCustomersWidget.textContent = this.customers.length;
      
      // Popular product
      if (this.customers.length > 0) {
        const productCounts = {};
        this.customers.forEach(customer => {
          productCounts[customer.product] = (productCounts[customer.product] || 0) + 1;
        });
        
        const popularProduct = Object.entries(productCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        this.popularProductWidget.textContent = popularProduct;
      } else {
        this.popularProductWidget.textContent = '-';
      }
      
      // Recent activity
      const activities = JSON.parse(localStorage.getItem('activityLog') || '[]');
      if (activities.length > 0) {
        this.recentActivityWidget.textContent = activities[0].action;
      } else {
        this.recentActivityWidget.textContent = 'Chưa có hoạt động';
      }
    }
    
    // Update product list for autocomplete
    updateProductList() {
      const productList = document.getElementById('productList');
      productList.innerHTML = '';
      
      const uniqueProducts = [...new Set(this.customers.map(c => c.product))];
      uniqueProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        productList.appendChild(option);
      });
    }
    
    // Initialize charts
    initCharts() {
      this.customerTypeChart = new Chart(
        document.getElementById('customerTypeChart'),
        {
          type: 'doughnut',
          data: {
            labels: ['Thường', 'VIP', 'Tiềm Năng'],
            datasets: [{
              data: [0, 0, 0],
              backgroundColor: [
                '#4cc9f0',
                '#4361ee',
                '#3f37c9'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        }
      );
      
      this.popularProductsChart = new Chart(
        document.getElementById('popularProductsChart'),
        {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              label: 'Số lượng',
              data: [],
              backgroundColor: '#4361ee'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        }
      );
      
      this.updateCharts();
    }
    
    // Update charts with current data
    updateCharts() {
      // Customer type chart
      const typeCounts = {
        regular: 0,
        vip: 0,
        potential: 0
      };
      
      this.customers.forEach(customer => {
        typeCounts[customer.category || 'regular']++;
      });
      
      this.customerTypeChart.data.datasets[0].data = [
        typeCounts.regular,
        typeCounts.vip,
        typeCounts.potential
      ];
      this.customerTypeChart.update();
      
      // Popular products chart (top 5)
      const productCounts = {};
      this.customers.forEach(customer => {
        productCounts[customer.product] = (productCounts[customer.product] || 0) + 1;
      });
      
      const sortedProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      this.popularProductsChart.data.labels = sortedProducts.map(p => p[0]);
      this.popularProductsChart.data.datasets[0].data = sortedProducts.map(p => p[1]);
      this.popularProductsChart.update();
    }
    
    // Load activity log
    loadActivityLog() {
      const activityList = document.getElementById('activityList');
      activityList.innerHTML = '';
      
      const activities = JSON.parse(localStorage.getItem('activityLog') || '[]');
      
      if (activities.length === 0) {
        activityList.innerHTML = '<div class="empty-state">Chưa có hoạt động nào</div>';
        return;
      }
      
      activities.slice(0, 10).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const iconClass = activity.action.includes('Thêm') ? 'create' : 
                         activity.action.includes('Cập nhật') ? 'update' : 'delete';
        
        activityItem.innerHTML = `
          <div class="activity-icon ${iconClass}">
            <i class="fas ${
              iconClass === 'create' ? 'fa-user-plus' : 
              iconClass === 'update' ? 'fa-edit' : 'fa-trash'
            }"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${activity.action}</div>
            <div class="activity-description">${activity.description}</div>
            <div class="activity-time">${activity.timestamp}</div>
          </div>
        `;
        
        activityList.appendChild(activityItem);
      });
    }
    
    // Log activity
    logActivity(action, description) {
        const activities = JSON.parse(localStorage.getItem('activityLog') || '[]');
      
      activities.unshift({
        action,
        description,
        timestamp: new Date().toLocaleString()
      });
      
      // Keep only the last 50 activities
      if (activities.length > 50) {
        activities.pop();
      }
      
      localStorage.setItem('activityLog', JSON.stringify(activities));
      this.loadActivityLog();
    }
    
    // Show notification
    showNotification(message, type) {
      const toastSettings = {
        title: type === 'success' ? 'Thành công' : 
               type === 'error' ? 'Lỗi' : 
               type === 'warning' ? 'Cảnh báo' : 'Thông báo',
        message: message,
        position: 'topRight',
        timeout: 5000
      };
      
      switch (type) {
        case 'success':
          iziToast.success(toastSettings);
          break;
        case 'error':
          iziToast.error(toastSettings);
          break;
        case 'warning':
          iziToast.warning(toastSettings);
          break;
        default:
          iziToast.info(toastSettings);
      }
    }
    
    // Handle navigation
    handleNavigation(e) {
      e.preventDefault();
      
      const target = e.currentTarget.getAttribute('href').substring(1);
      
      // Update active nav item
      this.navLinks.forEach(link => {
        link.parentElement.classList.remove('active');
      });
      e.currentTarget.parentElement.classList.add('active');
      
      // Show/hide sections
      document.getElementById('customerSection').classList.toggle('hidden', target !== 'customers');
      document.getElementById('statisticsSection').classList.toggle('hidden', target !== 'statistics');
      document.getElementById('dashboardWidgets').classList.toggle('hidden', target !== 'dashboard');
      
      // Update page title
      document.getElementById('pageTitle').textContent = 
        target === 'customers' ? 'Quản Lý Khách Hàng' :
        target === 'statistics' ? 'Thống Kê & Báo Cáo' : 'Tổng Quan';
      
      // Update charts when statistics page is shown
      if (target === 'statistics') {
        this.updateCharts();
      }
    }
    
    // Show modal
    showModal() {
      this.importModal.classList.add('show');
    }
    
    // Hide modal
    hideModal() {
      this.importModal.classList.remove('show');
    }
  }
  
  // Initialize the application when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const app = new CustomerManagementSystem();
    
    // Make app available globally for debugging (remove in production)
    window.app = app;
  });