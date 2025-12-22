import {
  Body,
  Controller,
  Post,
  Param,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt.guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: SignupDto) {
    return this.authService.signup(
      body.email,
      body.password,
      body.rememberMe,
      body.name,
    );
  }

  @Post('login')
  login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    res.locals.message = 'Login successful';
    return this.authService.login(body.email, body.password);
  }

  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }

  @Post('resend-code')
  resendCode(@Body('email') email: string) {
    return this.authService.resendCode(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  getUserById(@Req() req: any) {
    const userId = req.user?.id;
    return this.authService.getUserById(userId);
  }
  @Get('users')
  getUsers() {
    return this.authService.getUsers();
  }
}

