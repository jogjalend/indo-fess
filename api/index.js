export default async function handler(req, res) {
  res.status(200).json({ status: 'online', bot: '@indofess menfess bot', time: new Date().toISOString() });
}
