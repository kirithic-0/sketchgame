import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually
const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

console.log('Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  const testRecord = {
    player_name: 'Terminal Tester',
    score: 95,
    object_drawn: 'Giant Anvil',
    target_object: 'Boutique Bicycle',
    consequence: 'The boutique bicycle was compressed into a two-dimensional metal modern art piece. The hipster owner called it "genius" and sold it for $5,000.',
    location_name: 'Amsterdam, Netherlands'
  };

  console.log('\n1. Inserting test score...');
  const { data: insertData, error: insertError } = await supabase
    .from('geosketch_scores')
    .insert([testRecord])
    .select();

  if (insertError) {
    console.error('Insert failed:', insertError);
    process.exit(1);
  }
  console.log('Insert successful! Data inserted:', insertData);

  console.log('\n2. Retrieving leaderboard scores...');
  const { data: selectData, error: selectError } = await supabase
    .from('geosketch_scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);

  if (selectError) {
    console.error('Fetch failed:', selectError);
    process.exit(1);
  }
  console.log('Leaderboard scores retrieved successfully:', selectData);
}

testDatabase().catch(err => {
  console.error('Unhandled error:', err);
});
