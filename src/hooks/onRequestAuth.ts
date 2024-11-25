import { onRequestHookHandler } from "fastify";

export const onRequestAuth: onRequestHookHandler = async (req, res) => {
	try {
		await req.jwtVerify();
	} catch (e) {
		return res.send(e);
	}
};
