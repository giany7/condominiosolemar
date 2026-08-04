import { Router } from 'express'
import { listUsers } from '../controllers/usersController'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/roles'

const router = Router()

import { createUser, updateUser, deleteUser } from '../controllers/usersController'

router.get('/', requireAuth, requireRole('ADMIN'), listUsers)
router.post('/', requireAuth, requireRole('ADMIN'), createUser)
router.put('/:id', requireAuth, requireRole('ADMIN'), updateUser)
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteUser)

export default router
