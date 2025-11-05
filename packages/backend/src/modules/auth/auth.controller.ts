import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common'
import { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { LoginDto } from './dto'
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { CurrentUser, RequestUser } from '@core/decorators/current-user.decorator'
import { Permissions } from '@core/decorators/permissions.decorator'
import { PERMISSIONS } from '@shared/constants/permissions'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const { refreshToken, ...data } = await this.authService.login(body)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('app.isProd'),
      sameSite: 'strict',
      maxAge: this.configService.get('app.jwt.refreshTokenExpiryInMinutes'),
    })

    return res.json({
      success: true,
      message: 'Login successful',
      data: data,
    })
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const { refreshToken } = req.cookies
    return await this.authService.refreshAccessToken(refreshToken)
  }

  /**
   * Logout the user by removing the refresh token from the cookie
   * @param res - The response object
   * @returns void
   */
  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('refreshToken')
    return res.json({
      success: true,
      message: 'Logout successful',
    })
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.USER_VIEW)
  async me(@CurrentUser() user: RequestUser) {
    return await this.authService.me(user.id)
  }
}
