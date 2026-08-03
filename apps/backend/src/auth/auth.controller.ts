import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { clearAuthCookies, setAuthCookies } from './cookie.util';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './jwt-payload.interface';
import { User } from '../generated/prisma/client';

function toAuthUserDto(user: User): AuthUserDto {
  const dto = new AuthUserDto();
  dto.id = user.id;
  dto.email = user.email;
  dto.role = user.role;
  return dto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create an account and start a session' })
  async signup(
    @Body() dto: SignupDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<AuthUserDto> {
    const { user, tokens } = await this.auth.signup(dto, req.headers['user-agent']);
    setAuthCookies(res, tokens);
    return toAuthUserDto(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate and start a session' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<AuthUserDto> {
    const { user, tokens } = await this.auth.login(dto, req.headers['user-agent']);
    setAuthCookies(res, tokens);
    return toAuthUserDto(user);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate the refresh session and issue a new access token' })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<AuthUserDto> {
    const rawRefreshToken = req.cookies?.['refresh_token'];
    if (!rawRefreshToken) {
      throw new UnauthorizedException('No refresh session present');
    }
    const { user, tokens } = await this.auth.refresh(rawRefreshToken, req.headers['user-agent']);
    setAuthCookies(res, tokens);
    return toAuthUserDto(user);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke the current refresh session' })
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<{ success: true }> {
    const rawRefreshToken = req.cookies?.['refresh_token'];
    if (rawRefreshToken) {
      await this.auth.revokeSession(rawRefreshToken);
    }
    clearAuthCookies(res);
    return { success: true };
  }

  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: "Return the current session's user" })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
