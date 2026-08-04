import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user as any
    if (!user || !user.role) return res.status(403).json({ error: 'Forbidden' })

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    return next()
  }
}
