import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * @description Admin/Owner login
   * @param dto LoginDto object containing username and password
   * @returns Access token and user information
   */
  @Post('admin/login')
  @ApiOperation({ summary: 'Admin/Owner login' })
  @ApiBody({ type: LoginDto })
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  /**
   * @description Customer login
   * @param dto LoginDto object containing username and password
   * @returns Access token and user information
   */
  @Post('login')
  @ApiOperation({ summary: 'Customer login' })
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * @description Customer register
   * @param dto RegisterDto object containing user information
   * @returns Access token and user information
   */
  @Post('register')
  @ApiOperation({ summary: 'Customer register' })
  @ApiBody({ type: RegisterDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * @description Change user password
   * @param req Request object containing user information
   * @param dto ChangePasswordDto object containing password information
   * @returns Message indicating successful password change
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId || req.user.sub, dto);
  }
}
