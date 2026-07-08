export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user session found',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    // Additional check: If user is an organizer, check if approved
    if (req.user.role === 'organizer' && req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your organizer account is pending admin approval. You cannot perform this action yet.',
      });
    }

    next();
  };
};
