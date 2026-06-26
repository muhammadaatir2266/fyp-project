import { Request, Response } from 'express'
import prisma from '../config/database'

export const getSpecialties = async (req: Request, res: Response): Promise<void> => {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { doctors: true } } },
    })
    res.json(specialties)
  } catch (error) {
    console.error('Get specialties error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createSpecialty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, iconName, aliases } = req.body as {
      name: string
      description?: string
      iconName?: string
      aliases?: string[]
    }

    if (!name?.trim()) {
      res.status(400).json({ message: 'Specialty name is required' })
      return
    }

    const existing = await prisma.specialty.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    })
    if (existing) {
      res.status(409).json({ message: 'A specialty with this name already exists' })
      return
    }

    const specialty = await prisma.specialty.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        iconName: iconName?.trim() || null,
        aliases: aliases?.map((a) => a.trim()).filter(Boolean) ?? [],
      },
      include: { _count: { select: { doctors: true } } },
    })

    res.status(201).json(specialty)
  } catch (error) {
    console.error('Create specialty error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateSpecialty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, description, iconName, aliases } = req.body as {
      name?: string
      description?: string
      iconName?: string
      aliases?: string[]
    }

    const existing = await prisma.specialty.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ message: 'Specialty not found' })
      return
    }

    if (name && name.trim() !== existing.name) {
      const conflict = await prisma.specialty.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' }, NOT: { id } },
      })
      if (conflict) {
        res.status(409).json({ message: 'A specialty with this name already exists' })
        return
      }
    }

    const updated = await prisma.specialty.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() || null }),
        ...(iconName !== undefined && { iconName: iconName.trim() || null }),
        ...(aliases !== undefined && { aliases: aliases.map((a) => a.trim()).filter(Boolean) }),
      },
      include: { _count: { select: { doctors: true } } },
    })

    res.json(updated)
  } catch (error) {
    console.error('Update specialty error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteSpecialty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const specialty = await prisma.specialty.findUnique({
      where: { id },
      include: { _count: { select: { doctors: true } } },
    })
    if (!specialty) {
      res.status(404).json({ message: 'Specialty not found' })
      return
    }

    if (specialty._count.doctors > 0) {
      res.status(409).json({
        message: `Cannot delete: ${specialty._count.doctors} doctor(s) are assigned to this specialty. Reassign them first.`,
        doctorCount: specialty._count.doctors,
      })
      return
    }

    await prisma.specialty.delete({ where: { id } })
    res.json({ message: 'Specialty deleted' })
  } catch (error) {
    console.error('Delete specialty error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
