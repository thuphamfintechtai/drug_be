export class ResponseFormatterFactory {
  static formatPaginationResponse(data, total, page, limit) {
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }


  static formatSuccessResponse(data, message = null) {
    const response = {
      success: true,
      data,
    };

    if (message) {
      response.message = message;
    }

    return response;
  }


  static formatListResponse(items, total, page, limit, itemName = "items") {
    return {
      success: true,
      data: {
        [itemName]: items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  static formatStatisticsResponse(stats) {
    return {
      success: true,
      data: stats,
    };
  }
}

export default ResponseFormatterFactory;

