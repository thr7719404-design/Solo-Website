import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Solo Ecommerce Backend API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        api: '/api',
        products: '/api/products',
        auth: '/api/auth',
        users: '/api/users',
        docs: '/api/docs',
      },
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
