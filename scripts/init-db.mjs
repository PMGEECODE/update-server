#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

const createTables = async () => {
  console.log('Creating tables...');

  // Read and execute SQL from files
  const fs = await import('fs').then(m => m.promises);
  
  try {
    // Create tables
    const createTablesSql = await fs.readFile('./scripts/001-create-tables.sql', 'utf-8');
    const createTablesStatements = createTablesSql
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    for (const statement of createTablesStatements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error('Error:', error);
      }
    }

    // Enable RLS and create policies
    const enableRlsSql = await fs.readFile('./scripts/002-enable-rls.sql', 'utf-8');
    const enableRlsStatements = enableRlsSql
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    for (const statement of enableRlsStatements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error('Error:', error);
      }
    }

    console.log('✓ Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

createTables();
