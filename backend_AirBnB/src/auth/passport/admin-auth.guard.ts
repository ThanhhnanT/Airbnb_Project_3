import { ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminAuthGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // First validate JWT token
    const validatedUser = super.handleRequest(err, user, info);
    
    // Then check if user is admin
    if (!validatedUser) {
      throw new ForbiddenException('Không tìm thấy thông tin người dùng');
    }

    // Check if user has admin role
    if (validatedUser.role?.type !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có quyền truy cập');
    }

    return validatedUser;
  }
}
