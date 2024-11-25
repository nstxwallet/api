import { PrismaClient, User } from "@prisma/client";
import { WrongCredentialsError } from "./error";
import bcrypt from "bcrypt";

export class UsersService {
	constructor(private readonly prisma: PrismaClient) {}

	public async create(createProperties: Create): Promise<User> {
		return this.prisma.user.create({
			data: {
				...createProperties,
				password: bcrypt.hashSync(createProperties.password, 10),
			},
		});
	}
	public async validateCredentials(
		credentialsProperties: ValidateCredentials,
	): Promise<User> {
		const user = await this.prisma.user.findFirst({
			where: {
				email: credentialsProperties.email,
			},
		});
		if (
			!user ||
			!bcrypt.compareSync(credentialsProperties.password, user.password)
		) {
			throw new WrongCredentialsError();
		}
		return user;
	}
	public async getById(id: string): Promise<User | null> {
		const user = await this.prisma.user.findFirst({
			where: {
				id: id,
			},
		});
		if (!user) {
			return null;
		}
		return user;
	}
}

interface Create {
	email: string;
	password: string;
	firstName: string | null;
	lastName: string | null;
}
interface ValidateCredentials {
	email: string;
	password: string;
}
