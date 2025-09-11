export const token = process.env.API_TOKEN;

if (!token) {
	throw new Error("API_TOKEN environment variable is not set.");
}
