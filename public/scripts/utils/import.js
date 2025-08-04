/**
 * Utility for importing customer data from Excel/CSV files
 */

class DataImporter {
    constructor(app) {
      this.app = app;
      this.fileInput = document.getElementById('fileImport');
      this.setupFileImport();
    }
  
    setupFileImport() {
      // Trigger file input when import button is clicked
      document.getElementById('importBtn').addEventListener('click', () => {
        this.fileInput.click();
      });
  
      // Handle file selection
      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          this.processFile(e.target.files[0]);
        }
      });
    }
  
    async processFile(file) {
      try {
        const fileType = file.name.split('.').pop().toLowerCase();
        
        if (fileType === 'csv') {
          await this.importCSV(file);
        } else if (fileType === 'xlsx' || fileType === 'xls') {
          await this.importExcel(file);
        } else {
          this.app.showNotification('Định dạng file không được hỗ trợ', 'error');
        }
      } catch (error) {
        console.error('Error processing file:', error);
        this.app.showNotification('Lỗi khi xử lý file', 'error');
      } finally {
        // Reset file input
        this.fileInput.value = '';
      }
    }
  
    async importCSV(file) {
      const fileContent = await this.readFileAsText(file);
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const results = {
        success: 0,
        errors: 0,
        errorDetails: []
      };
  
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = this.parseCSVLine(lines[i]);
        const customerData = {};
        
        try {
          headers.forEach((header, index) => {
            if (values[index]) {
              customerData[header] = values[index].trim();
            }
          });
  
          // Validate required fields
          if (!customerData['name'] || !customerData['product'] || !customerData['phone']) {
            throw new Error('Thiếu thông tin bắt buộc (tên, sản phẩm hoặc SĐT)');
          }
  
          // Check for duplicate phone
          const duplicate = this.app.customers.find(c => c.phone === customerData['phone']);
          if (duplicate) {
            throw new Error(`SĐT trùng với khách hàng: ${duplicate.name}`);
          }
  
          // Add new customer
          const newCustomer = {
            id: Date.now() + i,
            time: new Date().toLocaleString(),
            name: customerData['name'],
            product: customerData['product'],
            phone: customerData['phone'],
            category: customerData['category'] || 'regular',
            note: customerData['note'] || ''
          };
  
          this.app.customers.unshift(newCustomer);
          results.success++;
        } catch (error) {
          results.errors++;
          results.errorDetails.push({
            line: i + 1,
            data: customerData,
            error: error.message
          });
        }
      }
  
      // Save data and show results
      if (this.app.saveData()) {
        this.showImportResults(results);
        this.app.logActivity('Nhập dữ liệu', `Đã nhập ${results.success} khách hàng từ file CSV`);
        this.app.updateUI();
      }
    }
  
    async importExcel(file) {
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      const results = {
        success: 0,
        errors: 0,
        errorDetails: []
      };
  
      jsonData.forEach((row, index) => {
        const customerData = {};
        
        try {
          // Map Excel columns to our fields
          Object.keys(row).forEach(key => {
            const normalizedKey = key.trim().toLowerCase();
            if (normalizedKey.includes('name')) {
              customerData['name'] = row[key].toString().trim();
            } else if (normalizedKey.includes('product')) {
              customerData['product'] = row[key].toString().trim();
            } else if (normalizedKey.includes('phone') || normalizedKey.includes('sđt')) {
              customerData['phone'] = row[key].toString().trim();
            } else if (normalizedKey.includes('category') || normalizedKey.includes('loại')) {
              customerData['category'] = row[key].toString().trim();
            } else if (normalizedKey.includes('note') || normalizedKey.includes('ghi chú')) {
              customerData['note'] = row[key].toString().trim();
            }
          });
  
          // Validate required fields
          if (!customerData['name'] || !customerData['product'] || !customerData['phone']) {
            throw new Error('Thiếu thông tin bắt buộc (tên, sản phẩm hoặc SĐT)');
          }
  
          // Check for duplicate phone
          const duplicate = this.app.customers.find(c => c.phone === customerData['phone']);
          if (duplicate) {
            throw new Error(`SĐT trùng với khách hàng: ${duplicate.name}`);
          }
  
          // Add new customer
          const newCustomer = {
            id: Date.now() + index,
            time: new Date().toLocaleString(),
            name: customerData['name'],
            product: customerData['product'],
            phone: customerData['phone'],
            category: customerData['category'] || 'regular',
            note: customerData['note'] || ''
          };
  
          this.app.customers.unshift(newCustomer);
          results.success++;
        } catch (error) {
          results.errors++;
          results.errorDetails.push({
            line: index + 2, // +2 because Excel has header and is 1-based
            data: customerData,
            error: error.message
          });
        }
      });
  
      // Save data and show results
      if (this.app.saveData()) {
        this.showImportResults(results);
        this.app.logActivity('Nhập dữ liệu', `Đã nhập ${results.success} khách hàng từ file Excel`);
        this.app.updateUI();
      }
    }
  
    showImportResults(results) {
      document.getElementById('importSuccessCount').textContent = results.success;
      document.getElementById('importErrorCount').textContent = results.errors;
      
      const errorList = document.getElementById('importErrors');
      errorList.innerHTML = '';
      
      if (results.errors > 0) {
        results.errorDetails.forEach(error => {
          const errorItem = document.createElement('div');
          errorItem.className = 'error-item';
          errorItem.innerHTML = `
            <strong>Dòng ${error.line}:</strong> ${error.error}
            <div class="error-message">${JSON.stringify(error.data)}</div>
          `;
          errorList.appendChild(errorItem);
        });
      } else {
        errorList.innerHTML = '<div class="empty-state">Không có lỗi nào</div>';
      }
      
      this.app.showModal();
    }
  
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    }
  
    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
      });
    }
  
    parseCSVLine(line) {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      
      values.push(current);
      return values.map(v => v.trim().replace(/^"(.*)"$/, '$1'));
    }
  }
  
  // Export as singleton
  export let dataImporter;
  
  export function initDataImporter(app) {
    dataImporter = new DataImporter(app);
  }