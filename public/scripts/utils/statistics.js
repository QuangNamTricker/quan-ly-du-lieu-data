/**
 * Utility for generating statistics and reports
 */

class StatisticsManager {
    constructor(app) {
      this.app = app;
      this.timeRangeSelect = document.getElementById('timeRange');
      this.setupEventListeners();
    }
  
    setupEventListeners() {
      this.timeRangeSelect.addEventListener('change', () => this.updateCharts());
    }
  
    updateCharts() {
      const filteredData = this.filterDataByTimeRange();
      this.updateCustomerTypeChart(filteredData);
      this.updatePopularProductsChart(filteredData);
    }
  
    filterDataByTimeRange() {
      const range = this.timeRangeSelect.value;
      const now = new Date();
      
      return this.app.customers.filter(customer => {
        const customerDate = new Date(customer.time);
        
        switch (range) {
          case '7days':
            return customerDate >= new Date(now.setDate(now.getDate() - 7));
          case '30days':
            return customerDate >= new Date(now.setDate(now.getDate() - 30));
          case 'month':
            return customerDate.getMonth() === now.getMonth() && 
                   customerDate.getFullYear() === now.getFullYear();
          case 'quarter':
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            return customerDate >= quarterStart;
          case 'year':
            return customerDate.getFullYear() === now.getFullYear();
          default:
            return true; // 'all' option
        }
      });
    }
  
    updateCustomerTypeChart(data) {
      const typeCounts = {
        regular: 0,
        vip: 0,
        potential: 0
      };
      
      data.forEach(customer => {
        typeCounts[customer.category || 'regular']++;
      });
  
      this.app.customerTypeChart.data.datasets[0].data = [
        typeCounts.regular,
        typeCounts.vip,
        typeCounts.potential
      ];
      this.app.customerTypeChart.update();
    }
  
    updatePopularProductsChart(data) {
      const productCounts = {};
      data.forEach(customer => {
        productCounts[customer.product] = (productCounts[customer.product] || 0) + 1;
      });
      
      const sortedProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
  
      this.app.popularProductsChart.data.labels = sortedProducts.map(p => p[0]);
      this.app.popularProductsChart.data.datasets[0].data = sortedProducts.map(p => p[1]);
      this.app.popularProductsChart.update();
    }
  
    getCustomerGrowth() {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // This month's customers
      const thisMonthCustomers = this.app.customers.filter(c => {
        const d = new Date(c.time);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;
      
      // Last month's customers
      const lastMonthCustomers = this.app.customers.filter(c => {
        const d = new Date(c.time);
        return d.getMonth() === currentMonth - 1 || 
               (currentMonth === 0 && d.getMonth() === 11 && d.getFullYear() === currentYear - 1);
      }).length;
      
      if (lastMonthCustomers === 0) return 0;
      return ((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100;
    }
  
    getPopularProduct() {
      if (this.app.customers.length === 0) return null;
      
      const productCounts = {};
      this.app.customers.forEach(c => {
        productCounts[c.product] = (productCounts[c.product] || 0) + 1;
      });
      
      return Object.entries(productCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
  }
  
  // Export as singleton
  export let statisticsManager;
  
  export function initStatisticsManager(app) {
    statisticsManager = new StatisticsManager(app);
  }