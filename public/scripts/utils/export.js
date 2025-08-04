/**
 * Utility for exporting customer data to Excel, CSV and PDF
 */

class DataExporter {
    constructor(app) {
      this.app = app;
    }
  
    exportData(format) {
      switch (format) {
        case 'excel':
          this.exportExcel();
          break;
        case 'csv':
          this.exportCSV();
          break;
        case 'pdf':
          this.exportPDF();
          break;
        default:
          this.app.showNotification('Định dạng xuất không được hỗ trợ', 'error');
      }
    }
  
    exportExcel() {
      try {
        // Prepare data
        const headers = ['STT', 'Thời Gian', 'Tên Khách Hàng', 'Sản Phẩm', 'SĐT', 'Phân Loại', 'Ghi Chú'];
        const data = this.app.filteredData.map((customer, index) => [
          index + 1,
          customer.time,
          customer.name,
          customer.product,
          customer.phone,
          this.app.getCategoryLabel(customer.category),
          customer.note || ''
        ]);
  
        // Create workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'KhachHang');
  
        // Export to file
        XLSX.writeFile(workbook, `khach_hang_${new Date().toISOString().slice(0, 10)}.xlsx`);
        
        this.app.logActivity('Xuất dữ liệu', 'Xuất danh sách khách hàng ra Excel');
        this.app.showNotification('Xuất Excel thành công', 'success');
      } catch (error) {
        console.error('Error exporting to Excel:', error);
        this.app.showNotification('Lỗi khi xuất Excel', 'error');
      }
    }
  
    exportCSV() {
      try {
        // Prepare headers
        const headers = ['STT', 'Thời Gian', 'Tên Khách Hàng', 'Sản Phẩm', 'SĐT', 'Phân Loại', 'Ghi Chú'];
        
        // Prepare data rows
        const rows = this.app.filteredData.map((customer, index) => [
          index + 1,
          `"${customer.time}"`,
          `"${customer.name}"`,
          `"${customer.product}"`,
          `"${customer.phone}"`,
          `"${this.app.getCategoryLabel(customer.category)}"`,
          `"${customer.note || ''}"`
        ]);
  
        // Combine headers and data
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `khach_hang_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.logActivity('Xuất dữ liệu', 'Xuất danh sách khách hàng ra CSV');
        this.app.showNotification('Xuất CSV thành công', 'success');
      } catch (error) {
        console.error('Error exporting to CSV:', error);
        this.app.showNotification('Lỗi khi xuất CSV', 'error');
      }
    }
  
    exportPDF() {
      try {
        // Prepare document definition
        const docDefinition = {
          content: [
            { text: 'Danh Sách Khách Hàng', style: 'header' },
            { text: `Ngày xuất: ${new Date().toLocaleString()}`, style: 'subheader' },
            {
              table: {
                headerRows: 1,
                widths: ['auto', 'auto', '*', '*', 'auto', 'auto', '*'],
                body: [
                  [
                    { text: 'STT', style: 'tableHeader' },
                    { text: 'Thời Gian', style: 'tableHeader' },
                    { text: 'Tên Khách Hàng', style: 'tableHeader' },
                    { text: 'Sản Phẩm', style: 'tableHeader' },
                    { text: 'SĐT', style: 'tableHeader' },
                    { text: 'Phân Loại', style: 'tableHeader' },
                    { text: 'Ghi Chú', style: 'tableHeader' }
                  ],
                  ...this.app.filteredData.map((customer, index) => [
                    (index + 1).toString(),
                    customer.time,
                    customer.name,
                    customer.product,
                    customer.phone,
                    this.app.getCategoryLabel(customer.category),
                    customer.note || ''
                  ])
                ]
              }
            }
          ],
          styles: {
            header: {
              fontSize: 18,
              bold: true,
              margin: [0, 0, 0, 10]
            },
            subheader: {
              fontSize: 12,
              margin: [0, 0, 0, 10]
            },
            tableHeader: {
              bold: true,
              fontSize: 10,
              color: 'black'
            }
          },
          defaultStyle: {
            fontSize: 10
          }
        };
  
        // Generate and download PDF
        pdfMake.createPdf(docDefinition).download(`khach_hang_${new Date().toISOString().slice(0, 10)}.pdf`);
        
        this.app.logActivity('Xuất dữ liệu', 'Xuất danh sách khách hàng ra PDF');
        this.app.showNotification('Xuất PDF thành công', 'success');
      } catch (error) {
        console.error('Error exporting to PDF:', error);
        this.app.showNotification('Lỗi khi xuất PDF', 'error');
      }
    }
  }
  
  // Export as singleton
  export let dataExporter;
  
  export function initDataExporter(app) {
    dataExporter = new DataExporter(app);
  }