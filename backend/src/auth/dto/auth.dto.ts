import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Password123!', minLength: 8 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;
}

export class LoginDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    password: string;
}

export class AuthResponseDto {
    @ApiProperty()
    token: string;

    @ApiProperty()
    user: {
        id: string;
        email: string;
        role: string;
        kycStatus?: string;
    };
}
