import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePushTokenDto {
    @ApiProperty({
        description: 'Token Expo push notification',
        example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    })
    @IsString()
    @IsNotEmpty()
    pushToken: string;
}

