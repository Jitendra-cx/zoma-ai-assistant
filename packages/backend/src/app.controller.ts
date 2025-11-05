import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}
  @Get('health')
  health() {
    return {
      status: 'ok',
      version: this.configService.get('app.apiVersion'),
      environment: this.configService.get('app.nodeEnv'),
      timestamp: new Date().toISOString(),
      message: `${this.configService.get('app.appName')} API provider`,
    }
  }
}
