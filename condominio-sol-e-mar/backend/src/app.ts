import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRoutes from './routes/auth'
import usersRoutes from './routes/users'
import reclamacoesRoutes from './routes/reclamacoes'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/reclamacoes', reclamacoesRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

export default app
