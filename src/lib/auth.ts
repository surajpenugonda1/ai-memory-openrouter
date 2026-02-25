import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Augment next-auth types to include custom user properties
declare module "next-auth" {
    interface User {
        isPremium?: boolean;
        memoryEnabled?: boolean;
    }
    interface Session {
        user: {
            id: string;
            isPremium?: boolean;
            memoryEnabled?: boolean;
        } & DefaultSession["user"];
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id?: string;
        isPremium?: boolean;
        memoryEnabled?: boolean;
    }
}

export const {
    handlers: { GET, POST },
    auth,
} = NextAuth({
    trustHost: true,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "m@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const userArray = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, credentials.email as string))
                    .limit(1);

                const user = userArray[0];

                if (!user || !user.passwordHash) {
                    return null;
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    isPremium: user.isPremium,
                    memoryEnabled: user.memoryEnabled,
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isPremium = user.isPremium;
                token.memoryEnabled = user.memoryEnabled;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.isPremium = token.isPremium;
                session.user.memoryEnabled = token.memoryEnabled;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
});
