import DateHelper from "./DateHelper.js";

export default class DataAggregationService {
  static groupInvoicesByDate(invoices) {
    const grouped = {};

    invoices.forEach((invoice) => {
      const date = DateHelper.formatDate(new Date(invoice.createdAt));
      
      if (!grouped[date]) {
        grouped[date] = {
          date,
          count: 0,
          quantity: 0,
          invoices: [],
        };
      }

      grouped[date].count++;
      grouped[date].quantity += invoice.quantity || 0;
      grouped[date].invoices.push(invoice);
    });

    // Convert to array and sort by date
    return Object.values(grouped).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }

  static groupDistributionsByDate(distributions) {
    const grouped = {};

    distributions.forEach((dist) => {
      const date = DateHelper.formatDate(new Date(dist.createdAt));
      
      if (!grouped[date]) {
        grouped[date] = {
          date,
          count: 0,
          quantity: 0,
          distributions: [],
        };
      }

      grouped[date].count++;
      grouped[date].quantity += dist.distributedQuantity || 0;
      grouped[date].distributions.push(dist);
    });

    // Convert to array and sort by date
    return Object.values(grouped).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }

  static calculateTotalQuantity(items, quantityField = 'quantity') {
    return items.reduce((total, item) => {
      return total + (item[quantityField] || 0);
    }, 0);
  }

  static groupByStatus(items) {
    const grouped = {};

    items.forEach((item) => {
      const status = item.status || 'unknown';
      
      if (!grouped[status]) {
        grouped[status] = {
          status,
          count: 0,
          items: [],
        };
      }

      grouped[status].count++;
      grouped[status].items.push(item);
    });

    return grouped;
  }

  static calculateAveragePerDay(total, days) {
    if (days === 0) return 0;
    return Math.round((total / days) * 100) / 100;
  }
}

