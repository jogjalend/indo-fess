module.exports = async (req, res) => {
  res.status(200).json({
    status: "online",
    bot: "indofess menfess bot",
    channel: "@indo_fess",
    mode: "auto-post tanpa approval",
    time: new Date().toISOString()
  });
};
