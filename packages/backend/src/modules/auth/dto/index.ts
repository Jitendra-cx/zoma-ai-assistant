import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, IsEmail } from 'class-validator'

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string

  @IsNotEmpty()
  @IsString()
  password: string
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string
}
