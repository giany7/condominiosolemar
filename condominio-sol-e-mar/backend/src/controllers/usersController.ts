import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function listUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } })
    return res.json(users)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'User already exists' })

    const bcrypt = require('bcrypt')
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { name, email, password: hashed, role } })
    return res.status(201).json({ id: user.id, email: user.email })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, email, role } = req.body
    const user = await prisma.user.update({ where: { id: Number(id) }, data: { name, email, role } })
    return res.json({ id: user.id, email: user.email })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    await prisma.user.delete({ where: { id: Number(id) } })
    return res.status(204).send()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
