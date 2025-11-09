import DateHelper from "./DateHelper.js";

class DataAggregationService {
  static groupByDate(items, options = {}) {
    const {
      quantityField = 'quantity',
      itemsField = 'items',
      itemFormatter = (item) => item
    } = options;

    const dailyStats = {};

    items.forEach((item) => {
      const date = DateHelper.formatDate(item.createdAt);
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          count: 0,
          quantity: 0,
          [itemsField]: []
        };
      }

      dailyStats[date].count++;
      dailyStats[date].quantity += (item[quantityField] || 0);
      dailyStats[date][itemsField].push(itemFormatter(item));
    });

    return dailyStats;
  }

  /**
   * Group invoices theo ngày
   */
  static groupInvoicesByDate(invoices) {
    return this.groupByDate(invoices, {
      quantityField: 'quantity',
      itemsField: 'invoices',
      itemFormatter: (invoice) => ({
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        quantity: invoice.quantity,
        status: invoice.status,
        createdAt: invoice.createdAt,
        ...(invoice.drug && { drug: invoice.drug }),
        ...(invoice.fromDistributor && { fromDistributor: invoice.fromDistributor }),
        ...(invoice.fromManufacturer && { fromManufacturer: invoice.fromManufacturer }),
      })
    });
  }

  static groupProductionsByDate(productions) {
    return this.groupByDate(productions, {
      quantityField: 'quantity',
      itemsField: 'productions',
      itemFormatter: (prod) => ({
        id: prod._id,
        drug: prod.drug,
        quantity: prod.quantity,
        batchNumber: prod.batchNumber,
        createdAt: prod.createdAt
      })
    });
  }

  static groupDistributionsByDate(distributions) {
    return this.groupByDate(distributions, {
      quantityField: 'distributedQuantity',
      itemsField: 'distributions',
      itemFormatter: (dist) => ({
        id: dist._id,
        drug: dist.drug,
        quantity: dist.distributedQuantity || dist.quantity,
        batchNumber: dist.batchNumber,
        createdAt: dist.createdAt
      })
    });
  }

  static groupReceiptsByDate(receipts) {
    return this.groupByDate(receipts, {
      quantityField: 'receivedQuantity',
      itemsField: 'receipts',
      itemFormatter: (rec) => ({
        id: rec._id,
        drug: rec.drug,
        quantity: rec.receivedQuantity,
        createdAt: rec.createdAt
      })
    });
  }
  
  static calculateTotalQuantity(items, quantityField = 'quantity') {
    return items.reduce((sum, item) => sum + (item[quantityField] || 0), 0);
  }
}

export default DataAggregationService;

