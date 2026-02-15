import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUser, createUser, updateUserLastLogin } from '@/lib/db';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile && 'sub' in profile) {
        try {
          const googleId = profile.sub as string;

          // Check if user exists
          const existingUser = await getUser(googleId);

          if (existingUser) {
            // Update last login
            await updateUserLastLogin(googleId);
          } else {
            // Create new user
            await createUser({
              googleId,
              email: user.email!,
              name: user.name || '',
              profilePictureUrl: user.image || undefined,
            });
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token?.sub) {
        const user = await getUser(token.sub);
        if (user) {
          session.user.id = user.id;
          session.user.googleId = user.google_id;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile && 'sub' in profile) {
        token.sub = profile.sub as string;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
