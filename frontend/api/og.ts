import { ImageResponse } from '@vercel/og';
import { buildCard, HEIGHT, WIDTH } from './_card';

export const config = { runtime: 'edge' };

export default function handler(request: Request): Response {
    const card = buildCard(new URL(request.url).searchParams);
    const image = new ImageResponse(card as never, { width: WIDTH, height: HEIGHT });
    image.headers.set('cache-control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    return image;
}
