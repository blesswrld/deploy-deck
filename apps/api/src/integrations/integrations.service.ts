import { Injectable } from '@nestjs/common';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async connectVercel(userId: string, token: string) {
    // Шифруем токен перед сохранением в базу
    const encryptedToken = this.encryptionService.encrypt(token);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        vercelApiToken: encryptedToken,
      },
    });

    return { message: 'Vercel account connected successfully.' };
  }
}
