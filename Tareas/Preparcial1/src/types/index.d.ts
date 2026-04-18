import { JwtPayload } from "jsonwebtoken";

type JwtCustomPayload = {
    id: string;
    roles: string[];
} & JwtPayload;

declare global {
    namespace Express {
        interface Request {
            user?: JwtCustomPayload;
        }
    }
}

export { JwtCustomPayload };