import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailer: MailerService,
  ) {}

  private generateToken(
    user: { id: string; email: string, role: Role; },
    rememberMe: boolean,
  ) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const expiresIn = rememberMe ? '30d' : '1h'; // 30 days vs 1 hour

    return {
      access_token: this.jwt.sign(payload, { expiresIn }),
    };
  }

  //   Api
  async signup(
    email: string,
    password: string,
    rememberMe: boolean = false,
    name: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashed, name },
    });

    // await this.sendEmailVerification(user.id, user.email);
    return this.generateToken(user, rememberMe);
  }

  async login(email: string, password: string, rememberMe: boolean = false) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user, rememberMe);
  }

  async sendEmailVerification(userId: string, email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.emailVerificationRequest.upsert({
      where: { userId },
      update: { code, expiresAt },
      create: { userId, email, code, expiresAt },
    });

    await this.mailer.sendEmailVerification(email, code);
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    const record = await this.prisma.emailVerificationRequest.findUnique({
      where: { userId: user.id },
    });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerificationRequest.delete({
      where: { userId: user.id },
    });

    return { success: true };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async requestPasswordReset(email: string) {
    const user = await this.findByEmail(email);
    if (!user) return { message: 'If user exists, reset email sent' };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.emailVerificationRequest.upsert({
      where: { userId: user.id }, // Modify here to use userId
      update: { code, expiresAt },
      create: { userId: user.id, email, code, expiresAt },
    });

    await this.mailer.sendEmailVerification(email, code);
    return { message: 'Reset code sent' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    const record = await this.prisma.emailVerificationRequest.findUnique({
      where: { userId: user.id },
    });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    await this.prisma.emailVerificationRequest.delete({
      where: { userId: user.id },
    });

    return { success: true };
  }

  async resendCode(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.sendEmailVerification(user.id, user.email);
    return { message: 'Verification code resent' };
  }

  async getUserById(id: string) {
    if(!id){
      throw new BadRequestException("userId is missing")
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async getUsers() {
    const users = await this.prisma.user.findMany();

    return users;
  }
}
