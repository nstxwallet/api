import { Balance, Currency, PrismaClient } from "@prisma/client";

export class BalanceService {
  constructor(private readonly prisma: PrismaClient) {
  }

  public async getAll(getAllProperties: {
    userId: string;
  }): Promise<Balance[]> {
    return this.prisma.balance.findMany({
      where: {
        userId: getAllProperties.userId
      }
    });
  }

  public async create(createProperties: {
    userId: string;
    currency: Currency;
  }): Promise<Balance> {
    const userBalances = await this.getAll({ userId: createProperties.userId });

    if (userBalances.some(balance => balance.currency === createProperties.currency)) {
      throw new Error("User already has a components in this currency");
    }

    return this.prisma.balance.create({
      data: {
        userId: createProperties.userId,
        currency: createProperties.currency,
        value: 0
      }
    });
  }

  public async getOne(getOneProperties: {
    id: string;
    userId: string;
  }): Promise<Balance | null> {
    return this.prisma.balance.findFirst({
      where: {
        id: getOneProperties.id,
        userId: getOneProperties.userId
      }
    });
  }
}
