import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Res,
  Delete,
  HttpCode,
  Req,
} from '@nestjs/common'
import { Response, Request } from 'express'
import { AIService } from './ai.service'
import { EnhanceDto } from './dto/enhance.dto'
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard'
import { RateLimitGuard } from '@core/guards/rate-limit.guard'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { RequestUser } from '@core/decorators/current-user.decorator'
import { Permissions } from '@core/decorators/permissions.decorator'
import { PERMISSIONS } from '@shared/constants/permissions'

@Controller('ai')
@UseGuards(RateLimitGuard, JwtAuthGuard, PermissionsGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('enhance')
  @Permissions(PERMISSIONS.AI_ENHANCE_CREATE)
  @HttpCode(200)
  async enhance(@Body() enhanceDto: EnhanceDto, @Req() req: Request): Promise<any> {
    const user = req.user as RequestUser
    return this.aiService.createEnhancementRequest(enhanceDto, user.uuid)
  }

  @Get('stream/:sessionId')
  @Permissions(PERMISSIONS.AI_STREAM_ACCESS)
  async stream(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    const user = req.user as RequestUser
    await this.aiService.streamEnhancement(sessionId, user, res)
  }

  @Get('session/:sessionId')
  @Permissions(PERMISSIONS.AI_SESSION_VIEW)
  async getSession(@Param('sessionId') sessionId: string, @Req() req: Request): Promise<any> {
    const user = req.user as RequestUser
    return this.aiService.getSession(sessionId, user.uuid)
  }

  @Delete('session/:sessionId')
  @Permissions(PERMISSIONS.AI_SESSION_MANAGE)
  @HttpCode(200)
  async cancelSession(@Param('sessionId') sessionId: string, @Req() req: Request): Promise<any> {
    const user = req.user as RequestUser
    return this.aiService.cancelSession(sessionId, user.uuid)
  }

  @Get('usage')
  @Permissions(PERMISSIONS.AI_USAGE_VIEW)
  async getUsage(@Req() req: Request): Promise<any> {
    const user = req.user as RequestUser
    return this.aiService.getUsageStats(user.uuid)
  }
}
