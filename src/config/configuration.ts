// src/config/configuration.ts

export function getExpiresInSeconds(): number {
  const raw = process.env.JWT_EXPIRES ?? '3600';
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3600;
}

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME,
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: getExpiresInSeconds(),
});