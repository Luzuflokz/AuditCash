import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase with service role key
// IMPORTANT: This key MUST NOT be exposed client-side.
// Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // --- Authentication and Authorization Check ---
    // This is a crucial security step. You must verify that the request
    // to delete a user's data is legitimate and authorized.
    // For a user to delete *their own* data, you'd typically send their
    // JWT from the client and verify it here.
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Authorization token not found' }, { status: 401 });
    }
    
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser || authUser.id !== userId) {
      console.error('Unauthorized deletion attempt for userId:', userId, 'by authUser:', authUser?.id, 'Auth Error:', authError);
      return NextResponse.json({ message: 'Unauthorized or invalid user token' }, { status: 403 });
    }


    // --- Delete User Data from related tables ---
    // IMPORTANT: Adjust table names and foreign key columns based on your actual schema
    // Assuming tables like 'movements', 'savings', 'budget', 'transfers', 'fixed_expenses'
    // with a 'user_id' column for foreign key relationship.
    const tablesToDeleteFrom = [
      'movements',
      'savings',
      'budget',
      'transfers',
      'fixed_expenses',
      // Add any other tables that store user-specific data
    ];

    for (const table of tablesToDeleteFrom) {
      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId); // Assuming 'user_id' is the foreign key column

      if (deleteError) {
        console.error(`Error deleting data from ${table} for user ${userId}:`, deleteError);
        // Decide whether to throw immediately or continue
        // For critical data deletion, you might want to stop on first error
        throw new Error(`Failed to delete data from ${table}.`);
      }
    }

    // --- Delete User Account from Supabase Auth ---
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userDeleteError) {
      console.error('Error deleting user account:', userDeleteError);
      return NextResponse.json({ message: `Failed to delete user account: ${userDeleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'User and associated data deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ message: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}
