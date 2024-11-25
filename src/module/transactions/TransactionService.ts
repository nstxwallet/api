import {
  Currency,
  PrismaClient,
  Transaction,
  TransactionStatus,
  TransactionType
} from "@prisma/client";

interface Transfer {
  senderId: string;
  receiverId: string;
  amount: number;
  currency: Currency;
}

export class TransactionService {
         constructor(private readonly prisma: PrismaClient) {}

         public async transfer({
           senderId,
           receiverId,
           amount,
           currency
         }: Transfer): Promise<Transaction[]> {
           return this.prisma.$transaction(async trx => {
             const sender = await trx.balance.findFirst({
               where: {
                 userId: senderId,
                 currency: currency
               }
             });

             if (!sender || sender.value < amount) {
               throw new Error("Sender has insufficient funds to transfer");
             }
             if (sender.userId === receiverId) {
               throw new Error("Sender and receiver cannot be the same components");
             }

             const receiver = await trx.balance.findFirst({
               where: {
                 userId: receiverId,
                 currency: currency
               }
             });

             if (!receiver) {
               throw new Error("Receiver not found");
             }

             await trx.balance.update({
               where: {
                 id: sender.id
               },
               data: {
                 value: {
                   decrement: +amount
                 }
               }
             });

             await trx.balance.update({
               where: {
                 id: receiver.id
               },
               data: {
                 value: {
                   increment: +amount
                 }
               }
             });

             const senderTransaction = await trx.transaction.create({
               data: {
                 amount,
                 currency,
                 userId: senderId,
                 status: TransactionStatus.completed,
                 type: TransactionType.transfer
               }
             });

             const receiverTransaction = await trx.transaction.create({
               data: {
                 amount,
                 currency,
                 userId: receiverId,
                 status: TransactionStatus.completed,
                 type: TransactionType.deposit
               }
             });
             return [senderTransaction, receiverTransaction];
           });
         }

         public async getAll(getAllProperties: {
           userId: string;
           currencies: Currency[];
           statuses: TransactionStatus[];
           types: TransactionType[];
         }): Promise<Transaction[]> {
           return this.prisma.transaction.findMany({
             where: {
               userId: getAllProperties.userId,
               currency: {
                 in: getAllProperties.currencies
               },
               status: {
                 in: getAllProperties.statuses
               },
               type: {
                 in: getAllProperties.types
               }
             }
           });
         }

         public async getForCurrency(getForCurrencyProperties: {
           userId: string;
           currency: Currency;
         }): Promise<Transaction[]> {
           return this.prisma.transaction.findMany({
             where: {
               userId: getForCurrencyProperties.userId,
               currency: getForCurrencyProperties.currency
             }
           });
         }

         public async getById(id: string): Promise<Transaction | null> {
           const transaction = await this.prisma.transaction.findFirst({
             where: {
               id: id
             }
           });
           if (!transaction) {
             return null;
           }
           return transaction;
         }
       }
