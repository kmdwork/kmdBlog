export function GET() {
  return Response.json({
    ok: true,
    env: process.env.APP_ENV,
  });
}