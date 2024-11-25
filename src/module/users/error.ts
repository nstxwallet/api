export class UniqueKeyError extends Error {
	constructor() {
		super("Unique key error");
		this.name = "UniqueKeyError";
	}
}

export class WrongCredentialsError extends Error {
	constructor() {
		super("Wrong credentials");
		this.name = "WrongCredentialsError";
	}
}
