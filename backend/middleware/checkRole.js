module.exports = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      console.log(req.user.role);
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};