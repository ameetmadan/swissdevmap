import { NextResponse } from 'next/server';

export function middleware(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
        const apiUrl = process.env.API_URL + url.pathname + url.search;
        console.log(apiUrl);
        return NextResponse.rewrite(apiUrl);
    }
}