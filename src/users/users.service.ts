import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: {
    name: string;
    email: string;
    password: string;
  }) {
    const hashed = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashed,
        userType: 'STAFF',
      },
    });
  }

  async createInternshipUser(email: string) {
    return this.prisma.user.create({
      data: {
        name: email.split('@')[0], // Use email prefix as temporary name
        email: email,
        password: null,
        userType: 'INTERNSHIP',
        isActive: true,
      },
    });
  }

  async findOrCreateGoogleUser(googleData: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }) {
    // First check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email: googleData.email }
    });

    if (user) {
      // Update with Google data if user exists
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleData.googleId,
          picture: googleData.picture,
          name: googleData.name,
        },
      });
    } else {
      // Create new user if doesn't exist (should only happen if email was pre-approved)
      user = await this.prisma.user.create({
        data: {
          name: googleData.name,
          email: googleData.email,
          googleId: googleData.googleId,
          picture: googleData.picture,
          userType: 'INTERNSHIP',
          password: null,
        },
      });
    }

    return user;
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateUser(id: number, updateData: { name?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
