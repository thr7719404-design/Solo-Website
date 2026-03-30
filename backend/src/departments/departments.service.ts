import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * @deprecated Department model no longer exists in the database.
 * This service is kept as a stub to prevent import errors.
 * TODO: Remove the entire departments module once all references are cleaned up.
 */
@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(_createDepartmentDto: any): Promise<any> {
    throw new NotFoundException('Departments have been removed. Categories are now top-level.');
  }

  async findAll(): Promise<any[]> {
    return [];
  }

  async findOne(_id: string): Promise<any> {
    throw new NotFoundException('Departments have been removed. Categories are now top-level.');
  }

  async update(_id: string, _updateDepartmentDto: any): Promise<any> {
    throw new NotFoundException('Departments have been removed. Categories are now top-level.');
  }

  async remove(_id: string): Promise<any> {
    throw new NotFoundException('Departments have been removed. Categories are now top-level.');
  }
}
