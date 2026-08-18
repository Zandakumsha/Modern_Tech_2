export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this area" });
    }
<<<<<<< HEAD
    return next();
=======
    next();
>>>>>>> 0338b7b7c12264ed14f0d522ed575d1042677b07
  };
}

export const requireHR = requireRole("Admin", "Manager");
export const requireEmployee = requireRole("Staff");
