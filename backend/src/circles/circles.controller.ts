import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { CirclesService } from './circles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    CreateCircleDto,
    InviteMemberDto,
    CircleResponseDto,
    CircleMemberResponseDto,
    RoundResponseDto,
} from './dto/circles.dto';

@ApiTags('circles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('circles')
export class CirclesController {
    constructor(private readonly circlesService: CirclesService) { }

    @Post()
    @ApiOperation({ summary: 'Créer un cercle d\'épargne (ORGANIZER only)' })
    @ApiResponse({ status: 201, description: 'Cercle créé', type: CircleResponseDto })
    @ApiResponse({ status: 403, description: 'Seuls les ORGANIZER peuvent créer des cercles' })
    async createCircle(
        @Request() req: any,
        @Body() dto: CreateCircleDto,
    ): Promise<CircleResponseDto> {
        return this.circlesService.createCircle(req.user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lister mes cercles (créés ou membre)' })
    @ApiResponse({ status: 200, type: [CircleResponseDto] })
    async getMyCircles(@Request() req: any): Promise<CircleResponseDto[]> {
        return this.circlesService.getMyCircles(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Détails d\'un cercle' })
    @ApiParam({ name: 'id', description: 'ID du cercle' })
    @ApiResponse({ status: 200, type: CircleResponseDto })
    @ApiResponse({ status: 404, description: 'Cercle non trouvé' })
    @ApiResponse({ status: 403, description: 'Non membre de ce cercle' })
    async getCircle(
        @Param('id') id: string,
        @Request() req: any,
    ): Promise<CircleResponseDto> {
        return this.circlesService.getCircle(id, req.user.id);
    }

    @Get(':id/members')
    @ApiOperation({ summary: 'Lister les membres d\'un cercle' })
    @ApiParam({ name: 'id', description: 'ID du cercle' })
    @ApiResponse({ status: 200, type: [CircleMemberResponseDto] })
    async getCircleMembers(
        @Param('id') id: string,
        @Request() req: any,
    ): Promise<CircleMemberResponseDto[]> {
        return this.circlesService.getCircleMembers(id, req.user.id);
    }

    @Post(':id/invite')
    @ApiOperation({ summary: 'Inviter un membre au cercle (Organisateur only)' })
    @ApiParam({ name: 'id', description: 'ID du cercle' })
    @ApiResponse({ status: 201, type: CircleMemberResponseDto })
    @ApiResponse({ status: 403, description: 'Seul l\'organisateur peut inviter' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    @ApiResponse({ status: 409, description: 'Utilisateur déjà membre' })
    async inviteMember(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: InviteMemberDto,
    ): Promise<CircleMemberResponseDto> {
        return this.circlesService.inviteMember(id, req.user.id, dto.email);
    }

    @Post(':id/join')
    @ApiOperation({ summary: 'Accepter l\'invitation et rejoindre le cercle' })
    @ApiParam({ name: 'id', description: 'ID du cercle' })
    @ApiResponse({ status: 200, type: CircleMemberResponseDto })
    @ApiResponse({ status: 404, description: 'Pas d\'invitation pour ce cercle' })
    async joinCircle(
        @Param('id') id: string,
        @Request() req: any,
    ): Promise<CircleMemberResponseDto> {
        return this.circlesService.joinCircle(id, req.user.id);
    }

    @Post(':id/start')
    @ApiOperation({ summary: 'Démarrer le cercle et générer les tours (Organisateur only)' })
    @ApiParam({ name: 'id', description: 'ID du cercle' })
    @ApiResponse({ status: 201, type: [RoundResponseDto] })
    @ApiResponse({ status: 403, description: 'Seul l\'organisateur peut démarrer' })
    @ApiResponse({ status: 400, description: 'Le cercle a déjà démarré ou pas assez de membres' })
    async startCircle(
        @Param('id') id: string,
        @Request() req: any,
    ): Promise<RoundResponseDto[]> {
        return this.circlesService.startCircle(id, req.user.id);
    }

    @Get(':id/rounds')
    @ApiOperation({ summary: 'Lister les tours d\'un cercle' })
    @ApiParam({ name: 'id', description: 'ID du cercle' })
    @ApiResponse({ status: 200, type: [RoundResponseDto] })
    async getCircleRounds(
        @Param('id') id: string,
        @Request() req: any,
    ): Promise<RoundResponseDto[]> {
        return this.circlesService.getCircleRounds(id, req.user.id);
    }
}
