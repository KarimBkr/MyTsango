import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
    CreateCircleDto,
    CircleResponseDto,
    CircleMemberResponseDto,
    RoundResponseDto,
} from './dto/circles.dto';
import { CircleStatus, RoundStatus, ContributionStatus, UserRole } from '@prisma/client';

@Injectable()
export class CirclesService {
    private readonly logger = new Logger(CirclesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Crée un nouveau cercle d'épargne
     * Seuls les ORGANIZER (KYC approuvé) peuvent créer des cercles
     */
    async createCircle(
        organizerId: string,
        dto: CreateCircleDto,
    ): Promise<CircleResponseDto> {
        // Vérifier que l'utilisateur est ORGANIZER
        const user = await this.prisma.user.findUnique({
            where: { id: organizerId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role !== UserRole.ORGANIZER && user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only ORGANIZER or ADMIN can create circles. Complete KYC first.');
        }

        // Créer le cercle
        const circle = await this.prisma.circle.create({
            data: {
                name: dto.name,
                description: dto.description,
                amount: dto.amount,
                frequency: dto.frequency,
                maxMembers: dto.maxMembers || 10,
                organizerId,
                status: CircleStatus.DRAFT,
            },
        });

        // Ajouter l'organisateur comme premier membre (position 1)
        await this.prisma.circleMember.create({
            data: {
                circleId: circle.id,
                userId: organizerId,
                position: 1,
                role: 'ORGANIZER',
                status: 'ACTIVE',
            },
        });

        this.logger.log(`Circle created: ${circle.id} by user ${organizerId}`);

        return {
            id: circle.id,
            name: circle.name,
            description: circle.description ?? undefined,
            amount: Number(circle.amount),
            frequency: circle.frequency,
            maxMembers: circle.maxMembers,
            status: circle.status,
            organizerId: circle.organizerId,
            startDate: circle.startDate ?? undefined,
            endDate: circle.endDate ?? undefined,
            memberCount: 1,
            currentRound: undefined,
        };
    }

    /**
     * Liste les cercles de l'utilisateur (créés ou membre)
     */
    async getMyCircles(userId: string): Promise<CircleResponseDto[]> {
        const circles = await this.prisma.circle.findMany({
            where: {
                OR: [
                    { organizerId: userId },
                    { members: { some: { userId } } },
                ],
            },
            include: {
                _count: { select: { members: true } },
                rounds: {
                    where: { status: { in: [RoundStatus.OPEN, RoundStatus.PENDING] } },
                    orderBy: { number: 'asc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return circles.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description ?? undefined,
            amount: Number(c.amount),
            frequency: c.frequency,
            maxMembers: c.maxMembers,
            status: c.status,
            organizerId: c.organizerId,
            startDate: c.startDate ?? undefined,
            endDate: c.endDate ?? undefined,
            memberCount: c._count.members,
            currentRound: c.rounds[0]?.number,
        }));
    }

    /**
     * Récupère les détails d'un cercle
     */
    async getCircle(circleId: string, userId: string): Promise<CircleResponseDto> {
        const circle = await this.prisma.circle.findUnique({
            where: { id: circleId },
            include: {
                _count: { select: { members: true } },
                members: { where: { userId } },
                rounds: {
                    where: { status: { in: [RoundStatus.OPEN, RoundStatus.PENDING] } },
                    orderBy: { number: 'asc' },
                    take: 1,
                },
            },
        });

        if (!circle) {
            throw new NotFoundException('Circle not found');
        }

        // Vérifier que l'utilisateur est membre
        if (circle.members.length === 0 && circle.organizerId !== userId) {
            throw new ForbiddenException('You are not a member of this circle');
        }

        return {
            id: circle.id,
            name: circle.name,
            description: circle.description ?? undefined,
            amount: Number(circle.amount),
            frequency: circle.frequency,
            maxMembers: circle.maxMembers,
            status: circle.status,
            organizerId: circle.organizerId,
            startDate: circle.startDate ?? undefined,
            endDate: circle.endDate ?? undefined,
            memberCount: circle._count.members,
            currentRound: circle.rounds[0]?.number,
        };
    }

    /**
     * Liste les membres d'un cercle
     */
    async getCircleMembers(circleId: string, userId: string): Promise<CircleMemberResponseDto[]> {
        // Vérifier l'accès
        await this.getCircle(circleId, userId);

        const members = await this.prisma.circleMember.findMany({
            where: { circleId },
            include: { user: { select: { email: true } } },
            orderBy: { position: 'asc' },
        });

        return members.map(m => ({
            id: m.id,
            userId: m.userId,
            email: m.user.email,
            position: m.position,
            role: m.role,
            status: m.status,
            joinedAt: m.joinedAt,
        }));
    }

    /**
     * Invite un membre au cercle par email
     */
    async inviteMember(
        circleId: string,
        organizerId: string,
        email: string,
    ): Promise<CircleMemberResponseDto> {
        const circle = await this.prisma.circle.findUnique({
            where: { id: circleId },
            include: { _count: { select: { members: true } } },
        });

        if (!circle) {
            throw new NotFoundException('Circle not found');
        }

        if (circle.organizerId !== organizerId) {
            throw new ForbiddenException('Only the organizer can invite members');
        }

        if (circle.status !== CircleStatus.DRAFT) {
            throw new BadRequestException('Cannot invite members to an active or completed circle');
        }

        if (circle._count.members >= circle.maxMembers) {
            throw new BadRequestException('Circle has reached maximum members');
        }

        // Trouver l'utilisateur par email
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }

        // Vérifier qu'il n'est pas déjà membre
        const existingMember = await this.prisma.circleMember.findUnique({
            where: { circleId_userId: { circleId, userId: user.id } },
        });

        if (existingMember) {
            throw new ConflictException('User is already a member of this circle');
        }

        // Prochaine position disponible
        const maxPosition = await this.prisma.circleMember.aggregate({
            where: { circleId },
            _max: { position: true },
        });

        const newPosition = (maxPosition._max.position || 0) + 1;

        // Créer le membre
        const member = await this.prisma.circleMember.create({
            data: {
                circleId,
                userId: user.id,
                position: newPosition,
                role: 'MEMBER',
                status: 'INVITED',
            },
            include: { user: { select: { email: true } } },
        });

        // Envoyer notification push
        await this.notificationsService.sendInvitationNotification(
            member.id,
            circleId,
        );

        this.logger.log(`User ${email} invited to circle ${circleId}`);

        return {
            id: member.id,
            userId: member.userId,
            email: member.user.email,
            position: member.position,
            role: member.role,
            status: member.status,
            joinedAt: member.joinedAt,
        };
    }

    /**
     * Accepte une invitation et rejoint le cercle
     */
    async joinCircle(circleId: string, userId: string): Promise<CircleMemberResponseDto> {
        const member = await this.prisma.circleMember.findUnique({
            where: { circleId_userId: { circleId, userId } },
            include: {
                user: { select: { email: true } },
                circle: true,
            },
        });

        if (!member) {
            throw new NotFoundException('You are not invited to this circle');
        }

        if (member.status === 'ACTIVE') {
            throw new BadRequestException('You are already an active member');
        }

        if (member.circle.status !== CircleStatus.DRAFT) {
            throw new BadRequestException('Cannot join an active or completed circle');
        }

        // Mettre à jour le statut
        const updatedMember = await this.prisma.circleMember.update({
            where: { id: member.id },
            data: { status: 'ACTIVE' },
            include: { user: { select: { email: true } } },
        });

        this.logger.log(`User ${userId} joined circle ${circleId}`);

        return {
            id: updatedMember.id,
            userId: updatedMember.userId,
            email: updatedMember.user.email,
            position: updatedMember.position,
            role: updatedMember.role,
            status: updatedMember.status,
            joinedAt: updatedMember.joinedAt,
        };
    }

    /**
     * Démarre le cercle et génère le calendrier des tours
     */
    async startCircle(circleId: string, organizerId: string): Promise<RoundResponseDto[]> {
        const circle = await this.prisma.circle.findUnique({
            where: { id: circleId },
            include: {
                members: {
                    where: { status: 'ACTIVE' },
                    orderBy: { position: 'asc' },
                    include: { user: { select: { email: true } } },
                },
            },
        });

        if (!circle) {
            throw new NotFoundException('Circle not found');
        }

        if (circle.organizerId !== organizerId) {
            throw new ForbiddenException('Only the organizer can start the circle');
        }

        if (circle.status !== CircleStatus.DRAFT) {
            throw new BadRequestException('Circle has already been started');
        }

        if (circle.members.length < 2) {
            throw new BadRequestException('At least 2 active members required to start');
        }

        // Calculer les dates des tours selon la fréquence
        const now = new Date();
        const rounds: { number: number; recipientId: string; dueDate: Date }[] = [];

        circle.members.forEach((member, index) => {
            const dueDate = new Date(now);

            switch (circle.frequency) {
                case 'weekly':
                    dueDate.setDate(dueDate.getDate() + (7 * (index + 1)));
                    break;
                case 'biweekly':
                    dueDate.setDate(dueDate.getDate() + (14 * (index + 1)));
                    break;
                case 'monthly':
                default:
                    dueDate.setMonth(dueDate.getMonth() + (index + 1));
                    break;
            }

            rounds.push({
                number: index + 1,
                recipientId: member.userId,
                dueDate,
            });
        });

        // Créer tous les tours dans une transaction
        const createdRounds = await this.prisma.$transaction(async (tx) => {
            // Mettre à jour le cercle
            await tx.circle.update({
                where: { id: circleId },
                data: {
                    status: CircleStatus.ACTIVE,
                    startDate: now,
                    endDate: rounds[rounds.length - 1].dueDate,
                },
            });

            // Créer les tours
            const roundsData = [];
            for (const round of rounds) {
                const createdRound = await tx.round.create({
                    data: {
                        circleId,
                        number: round.number,
                        recipientId: round.recipientId,
                        dueDate: round.dueDate,
                        status: round.number === 1 ? RoundStatus.OPEN : RoundStatus.PENDING,
                    },
                    include: {
                        recipient: { select: { email: true } },
                    },
                });

                // Créer les contributions pour chaque membre (sauf le récipient)
                for (const member of circle.members) {
                    await tx.contribution.create({
                        data: {
                            roundId: createdRound.id,
                            memberId: member.id,
                            amount: circle.amount,
                            status: member.userId === round.recipientId
                                ? ContributionStatus.WAIVED
                                : ContributionStatus.DUE,
                        },
                    });
                }

                roundsData.push(createdRound);
            }

            return roundsData;
        });

        // Notifier tous les membres via notification de paiement dû
        const firstRound = createdRounds[0];
        for (const member of circle.members) {
            // Notifier seulement ceux qui doivent payer (pas le recipient)
            if (member.userId !== firstRound.recipientId) {
                await this.notificationsService.sendPaymentDueNotification(
                    member.userId,
                    circleId,
                    firstRound.dueDate,
                );
            }
        }

        this.logger.log(`Circle ${circleId} started with ${createdRounds.length} rounds`);

        return createdRounds.map(r => ({
            id: r.id,
            number: r.number,
            recipientId: r.recipientId,
            recipientEmail: r.recipient.email,
            status: r.status,
            totalAmount: r.totalAmount ? Number(r.totalAmount) : undefined,
            dueDate: r.dueDate,
            completedAt: r.completedAt ?? undefined,
            contributionsCount: circle.members.length,
            paidCount: r.status === RoundStatus.OPEN ? 0 : 0,
        }));
    }

    /**
     * Liste les tours d'un cercle
     */
    async getCircleRounds(circleId: string, userId: string): Promise<RoundResponseDto[]> {
        // Vérifier l'accès
        await this.getCircle(circleId, userId);

        const rounds = await this.prisma.round.findMany({
            where: { circleId },
            include: {
                recipient: { select: { email: true } },
                contributions: true,
            },
            orderBy: { number: 'asc' },
        });

        return rounds.map(r => ({
            id: r.id,
            number: r.number,
            recipientId: r.recipientId,
            recipientEmail: r.recipient.email,
            status: r.status,
            totalAmount: r.totalAmount ? Number(r.totalAmount) : undefined,
            dueDate: r.dueDate,
            completedAt: r.completedAt ?? undefined,
            contributionsCount: r.contributions.length,
            paidCount: r.contributions.filter(c => c.status === ContributionStatus.PAID).length,
        }));
    }
}
