import { writeFileSync } from 'fs';

const envContent = `DB_HOST=92.113.38.158
DB_PORT=3306
DB_USER=novo_usuario
DB_PASSWORD=sua_senha
DB_NAME=roleta171

PORT=3001
NODE_ENV=production

VITE_SUPABASE_URL=https://nkkeajeaniqaywdxwvuk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ra2VhamVhbmlxYXl3ZHh3dnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5MjY4OTIsImV4cCI6MjAzNzUwMjg5Mn0.kUvsDc5Jd-yetfLFgfyZLKC5tI4V2d0UCZrZv3neAuY
`;

writeFileSync('.env', envContent);
console.log('✅ Arquivo .env criado com sucesso!');
