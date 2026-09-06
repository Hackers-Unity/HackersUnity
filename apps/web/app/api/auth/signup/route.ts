import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://qifwhjfisipxkytsqxez.supabase.co';

const supabaseServiceRoleKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZndoamZpc2lweGt5dHNxeGV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5NDYyOSwiZXhwIjoyMDkzMzcwNjI5fQ._yH8fbwEEsBz3YGeJFHgxFUwxoRbrH5cOsydLTDwZVg';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, phone, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);
    const cleanName = String(name || '').trim() || cleanEmail.split('@')[0];
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanRole = role || 'PARTICIPANT';

    // 1. Check if user already exists
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update password, auto-confirm email, and update user metadata
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            ...existingUser.user_metadata,
            name: cleanName,
            full_name: cleanName,
            phone: cleanPhone || existingUser.user_metadata?.phone,
            role: cleanRole,
          },
        }
      );

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
    } else {
      // 2. Create new user with email_confirm = true
      const { data: createData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            name: cleanName,
            full_name: cleanName,
            phone: cleanPhone,
            role: cleanRole,
          },
        });

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }

      if (!createData.user) {
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      userId = createData.user.id;
    }

    // 3. Upsert profile in `profiles` table
    try {
      await supabaseAdmin.from('profiles').upsert(
        {
          id: userId,
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          role: cleanRole,
        },
        { onConflict: 'id' }
      );
    } catch (profileErr) {
      console.warn('[Signup API] Profile upsert warning:', profileErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created and confirmed successfully!',
      userId,
    });
  } catch (err: any) {
    console.error('[Signup API Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
