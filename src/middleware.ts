import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Role-based redirect guards
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    if (path.startsWith('/manager') && token?.role !== 'MANAGER' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Redirect logged-in users away from root to dashboard
    if (path === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  },
  {
    callbacks: {
      // Require auth for matched routes
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/',
    }
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/manager/:path*']
};
