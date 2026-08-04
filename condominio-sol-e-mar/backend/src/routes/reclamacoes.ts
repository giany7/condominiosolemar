import { Router } from 'express'
import { createReclamacao, listReclamacoes } from '../controllers/reclamacaoController'
import { requireAuth } from '../middleware/auth'
import { requireRole } from '../middleware/roles'

const router = Router()

// public endpoint to create a complaint
router.post('/', createReclamacao)

// protected list, only for síndico
router.get('/', requireAuth, requireRole('SINDICO'), listReclamacoes)

export default router
