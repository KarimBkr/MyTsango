import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * Register a new user
     */
    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        this.logger.log(`Registering new user: ${dto.email}`);

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
            },
        });

        this.logger.log(`User registered successfully: ${user.id}`);

        // Generate JWT
        const token = this.generateToken(user);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
            },
        };
    }

    /**
     * Login user
     */
    async login(dto: LoginDto): Promise<AuthResponseDto> {
        this.logger.log(`Login attempt for: ${dto.email}`);

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            this.logger.warn(`Login failed: user not found ${dto.email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            this.logger.warn(`Login failed: invalid password for ${dto.email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        this.logger.log(`User logged in successfully: ${user.id}`);

        // Generate JWT
        const token = this.generateToken(user);

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
            },
        };
    }

    /**
     * Get user profile from JWT
     */
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                kycStatus: true,
                kycApplicantId: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    /**
     * Generate JWT token
     */
    private generateToken(user: any): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }
}
