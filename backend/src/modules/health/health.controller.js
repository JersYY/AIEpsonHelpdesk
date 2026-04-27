export const healthCheck = (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "epson-helpdesk-api",
      timestamp: new Date(),
    },
  });
};
