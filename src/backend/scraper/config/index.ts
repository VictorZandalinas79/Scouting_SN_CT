import dotenv from 'dotenv';
dotenv.config();

export const config = {
  scoresway: {
    baseUrl: 'https://api.performfeeds.com/soccerdata',
    outletKey: '10effinwb8y1g1x646iax4wumw',
    referer: 'https://www.scoresway.com/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  supabase: {
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    key: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '',
  }
};
