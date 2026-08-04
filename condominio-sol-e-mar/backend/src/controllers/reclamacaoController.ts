import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { sendMail } from '../services/mailer'

const prisma = new PrismaClient()

export async function createReclamacao(req: Request, res: Response) {
  try {
    const { nome, apartamento, assunto, descricao, data } = req.body
    const rec = await prisma.reclamacao.create({ data: { nome, apartamento, assunto, descricao, data: data ? new Date(data) : new Date() } })

    // Send email to síndico (config via env)
    const sindicoEmail = process.env.SINDICO_EMAIL || 'sindico@example.com'
    await sendMail({
      to: sindicoEmail,
      subject: `Nova reclamação: ${assunto}`,
      text: `Nova reclamação de ${nome} (Apartamento ${apartamento})\n\nAssunto: ${assunto}\n\nDescrição:\n${descricao}`
    })

    return res.status(201).json(rec)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}

export async function listReclamacoes(req: Request, res: Response) {
  try {
    const recs = await prisma.reclamacao.findMany({ orderBy: { data: 'desc' } })
    return res.json(recs)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
