const sendResponse = (res, data) => {
  const responseData = {
    success: data.success,
    status_code: data.status_code,
    message: data.message || null,
    meta: data.meta || undefined,
    data: data.data !== undefined ? data.data : null,
  };

  res.status(data.status_code).json(responseData);
};

module.exports = sendResponse;
