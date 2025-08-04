/**
 * Utility for syncing data with Google Sheets
 */

class GoogleSheetsSync {
    constructor(app) {
      this.app = app;
      this.syncButton = document.getElementById('syncNow');
      this.syncStatusElement = document.getElementById('syncStatus');
      this.setupEventListeners();
      this.checkSyncStatus();
    }
  
    setupEventListeners() {
      this.syncButton.addEventListener('click', () => this.syncData());
    }
  
    async syncData() {
      try {
        this.setSyncStatus('Đang đồng bộ...', 'syncing');
        
        // In a real implementation, you would call Google Sheets API here
        // This is a mock implementation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate successful sync
        this.setSyncStatus('Đã đồng bộ', 'synced');
        this.app.showNotification('Đồng bộ dữ liệu thành công', 'success');
        this.app.logActivity('Đồng bộ', 'Đồng bộ dữ liệu với Google Sheets');
        
        // Simulate getting some new data
        await new Promise(resolve => setTimeout(resolve, 500));
        this.setSyncStatus('Đã đồng bộ', 'synced');
        
      } catch (error) {
        console.error('Sync error:', error);
        this.setSyncStatus('Lỗi đồng bộ', 'error');
        this.app.showNotification('Lỗi khi đồng bộ dữ liệu', 'error');
      }
    }
  
    setSyncStatus(text, status) {
      this.syncStatusElement.textContent = text;
      
      // Update button icon
      const icon = this.syncButton.querySelector('i');
      icon.className = 
        status === 'syncing' ? 'fas fa-sync-alt fa-spin' :
        status === 'synced' ? 'fas fa-check-circle' :
        status === 'error' ? 'fas fa-exclamation-circle' :
        'fas fa-sync-alt';
      
      // Update button color
      this.syncButton.style.backgroundColor = 
        status === 'syncing' ? 'var(--warning-color)' :
        status === 'synced' ? 'var(--success-color)' :
        status === 'error' ? 'var(--danger-color)' :
        'var(--primary-color)';
    }
  
    checkSyncStatus() {
      // In a real app, you would check the last sync time here
      const lastSync = localStorage.getItem('lastSync');
      
      if (lastSync) {
        const lastSyncDate = new Date(lastSync);
        const now = new Date();
        const diffHours = Math.abs(now - lastSyncDate) / 36e5;
        
        if (diffHours < 24) {
          this.setSyncStatus('Đã đồng bộ', 'synced');
        } else {
          this.setSyncStatus('Cần đồng bộ', 'outdated');
        }
      } else {
        this.setSyncStatus('Chưa đồng bộ', 'not-synced');
      }
    }
  
    // This would be replaced with actual Google Sheets API calls
    async authenticateGoogle() {
      return new Promise((resolve) => {
        // In a real implementation, you would use Google's auth flow here
        console.log('Authenticating with Google...');
        setTimeout(resolve, 1000);
      });
    }
  
    async loadFromGoogleSheets() {
      await this.authenticateGoogle();
      
      // In a real implementation, you would fetch data from Google Sheets here
      return new Promise((resolve) => {
        console.log('Loading data from Google Sheets...');
        setTimeout(() => resolve([]), 1500);
      });
    }
  
    async saveToGoogleSheets(data) {
      await this.authenticateGoogle();
      
      // In a real implementation, you would save data to Google Sheets here
      return new Promise((resolve) => {
        console.log('Saving data to Google Sheets...', data);
        setTimeout(resolve, 2000);
      });
    }
  }
  
  // Export as singleton
  export let googleSheetsSync;
  
  export function initGoogleSheetsSync(app) {
    googleSheetsSync = new GoogleSheetsSync(app);
  }