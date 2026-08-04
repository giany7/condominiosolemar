import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: any
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Missing authorization header' })

  const parts = header.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid authorization header' })

  const token = parts[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
