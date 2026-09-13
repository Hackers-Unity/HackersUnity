import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
  unauthorizedResponse,
} from '@/lib/api-auth';

async function generateUniqueInviteCode(serverSupabase: any, teamName: string): Promise<string> {
  let baseCode = teamName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!baseCode) baseCode = 'Team';

  // Check if baseCode exists in team_invitations
  const { data: existing } = await serverSupabase
    .from('team_invitations')
    .select('invite_token')
    .ilike('invite_token', `${baseCode}%`);

  const existingTokens = new Set(
    (existing || []).map((row: any) => row.invite_token?.toLowerCase())
  );

  if (!existingTokens.has(baseCode.toLowerCase())) {
    return baseCode;
  }

  // If another team has the same name, add unique suffix (e.g. -yrs)
  let candidate = '';
  do {
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    candidate = `${baseCode}-${randomSuffix}`;
  } while (existingTokens.has(candidate.toLowerCase()));

  return candidate;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inviteCode = searchParams.get('inviteCode');
    const teamId = searchParams.get('teamId');
    const serverSupabase = createAdminClient();

    if (inviteCode) {
      // 1. Look up by invite_token in team_invitations
      const { data: inv } = await serverSupabase
        .from('team_invitations')
        .select('invite_token, team_id, teams(*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date))')
        .ilike('invite_token', inviteCode.trim())
        .maybeSingle();

      if (inv?.teams) {
        return NextResponse.json({ success: true, team: inv.teams, inviteToken: inv.invite_token });
      }

      // 2. Fallback: look up by team name in teams
      const { data: teamByName } = await serverSupabase
        .from('teams')
        .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date), team_invitations(invite_token)')
        .ilike('name', inviteCode.trim())
        .maybeSingle();

      if (teamByName) {
        const token = (teamByName.team_invitations as any[])?.[0]?.invite_token || inviteCode;
        return NextResponse.json({ success: true, team: teamByName, inviteToken: token });
      }

      return NextResponse.json({ error: 'Squad not found for this invitation code' }, { status: 404 });
    }

    if (teamId) {
      const { data: team } = await serverSupabase
        .from('teams')
        .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date), team_invitations(invite_token)')
        .eq('id', teamId)
        .maybeSingle();

      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, team });
    }

    return NextResponse.json({ error: 'inviteCode or teamId is required' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return unauthorizedResponse('You must be signed in to create or join a squad.');
    }

    const body = await req.json();
    const { action = 'create' } = body;
    const serverSupabase = createAdminClient();
    const validUserId = auth.userId;
    const userEmail = (auth.email || body.leaderEmail || body.userEmail || '').toLowerCase().trim();
    const userName =
      body.leaderName ||
      body.userName ||
      auth.user.user_metadata?.name ||
      auth.user.user_metadata?.full_name ||
      userEmail.split('@')[0] ||
      'Hacker';

    // 1. Ensure user profile exists in public.profiles table (prevents teams_leader_id_fkey violation)
    const { data: existingProf } = await serverSupabase
      .from('profiles')
      .select('id')
      .eq('id', validUserId)
      .maybeSingle();

    if (!existingProf) {
      await serverSupabase.from('profiles').insert({
        id: validUserId,
        name: userName,
        email: userEmail,
        phone: body.phone || auth.user.user_metadata?.phone || null,
        college: body.college || null,
        skills: body.skills || [],
        updated_at: new Date().toISOString(),
      });
    }

    if (action === 'create') {
      const { eventId, teamName, maxMembers = 4, description = '' } = body;
      if (!eventId || !teamName) {
        return NextResponse.json(
          { error: 'Missing required team fields (eventId, teamName)' },
          { status: 400 }
        );
      }

      // Resolve event UUID if slug provided
      let targetEventId = eventId;
      const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        eventId
      );
      if (!isEventUuid) {
        const { data: eventData } = await serverSupabase
          .from('events')
          .select('id')
          .eq('slug', eventId)
          .maybeSingle();
        if (eventData?.id) {
          targetEventId = eventData.id;
        } else {
          return NextResponse.json({ success: true, localOnly: true });
        }
      }

      // 2. Create team
      const { data: team, error: teamError } = await serverSupabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          event_id: targetEventId,
          leader_id: validUserId,
          max_members: Number(maxMembers) || 4,
          description: description?.trim() || '',
        })
        .select('*, profiles:leader_id(name, email, avatar_url)')
        .single();

      if (teamError) {
        console.error('[Teams API] Team create error:', teamError);
        return NextResponse.json({ error: teamError.message }, { status: 400 });
      }

      // 3. Automatically add leader to team_members
      try {
        await serverSupabase.from('team_members').upsert(
          {
            team_id: team.id,
            user_id: validUserId,
            role: 'LEADER',
            status: 'ACCEPTED',
          },
          { onConflict: 'team_id,user_id' }
        );
      } catch (tmErr) {
        console.warn('[Teams API] team_members insert notice:', tmErr);
      }

      // 4. Generate unique team code & primary invitation link
      const inviteCode = await generateUniqueInviteCode(serverSupabase, teamName);
      try {
        await serverSupabase.from('team_invitations').insert({
          team_id: team.id,
          event_id: targetEventId,
          invited_by: validUserId,
          invited_email: `invite-link-${team.id.substring(0, 8)}@hackersunity.com`,
          invite_token: inviteCode,
          status: 'PENDING',
        });
      } catch (invErr) {
        console.warn('[Teams API] invite link creation notice:', invErr);
      }

      const teamWithInvite = {
        ...team,
        invite_token: inviteCode,
      };

      return NextResponse.json({ success: true, team: teamWithInvite, inviteToken: inviteCode });
    } else if (action === 'join') {
      const { teamId, inviteCode, maxMembers = 4 } = body;
      let targetTeamId = teamId;

      if (!targetTeamId && inviteCode) {
        // Resolve targetTeamId by inviteCode
        const { data: inv } = await serverSupabase
          .from('team_invitations')
          .select('team_id')
          .ilike('invite_token', inviteCode.trim())
          .maybeSingle();

        if (inv?.team_id) {
          targetTeamId = inv.team_id;
        } else {
          // Fallback: search by team name
          const { data: teamByName } = await serverSupabase
            .from('teams')
            .select('id')
            .ilike('name', inviteCode.trim())
            .maybeSingle();
          if (teamByName?.id) {
            targetTeamId = teamByName.id;
          }
        }
      }

      if (!targetTeamId) {
        return NextResponse.json({ error: 'Team ID or valid Invitation Link is required to join' }, { status: 400 });
      }

      // Check team capacity and existing membership
      const { data: team, error: teamFetchErr } = await serverSupabase
        .from('teams')
        .select('id, name, event_id, max_members, team_members(id, user_id)')
        .eq('id', targetTeamId)
        .maybeSingle();

      if (teamFetchErr || !team) {
        return NextResponse.json({ error: 'Squad not found or invitation link is invalid' }, { status: 404 });
      }

      const members = (team.team_members as any[]) || [];
      const isAlreadyMember = members.some((m) => m.user_id === validUserId);
      if (isAlreadyMember) {
        return NextResponse.json({ success: true, alreadyMember: true, team });
      }

      const limit = team.max_members || Number(maxMembers) || 4;
      if (members.length >= limit) {
        return NextResponse.json(
          { error: `This squad has already reached its maximum capacity of ${limit} members.` },
          { status: 400 }
        );
      }

      // Join team
      const { error: joinError } = await serverSupabase.from('team_members').upsert(
        {
          team_id: targetTeamId,
          user_id: validUserId,
          role: 'MEMBER',
          status: 'ACCEPTED',
        },
        { onConflict: 'team_id,user_id' }
      );

      if (joinError) {
        return NextResponse.json({ error: joinError.message }, { status: 400 });
      }

      // Automatically register user for this event as Squad Member in registrations table
      if (team.event_id) {
        try {
          await serverSupabase.from('registrations').upsert(
            {
              event_id: team.event_id,
              user_id: validUserId,
              user_email: userEmail,
              user_name: userName,
              is_team: true,
              team_name: team.name,
              role: 'Squad Member',
              status: 'CONFIRMED',
              registered_at: new Date().toISOString(),
            },
            { onConflict: 'event_id,user_id' }
          );
        } catch (regErr) {
          console.warn('[Teams API] registration upsert notice:', regErr);
        }
      }

      return NextResponse.json({ success: true, team });
    } else if (action === 'remove_member') {
      const { teamId, memberUserId } = body;
      if (!teamId || !memberUserId) {
        return NextResponse.json({ error: 'Team ID and member user ID are required' }, { status: 400 });
      }

      // Verify leader
      const { data: team, error: teamErr } = await serverSupabase
        .from('teams')
        .select('id, name, event_id, leader_id')
        .eq('id', teamId)
        .maybeSingle();

      if (teamErr || !team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      if (team.leader_id !== validUserId) {
        return NextResponse.json({ error: 'Only the squad leader can remove members.' }, { status: 403 });
      }

      if (memberUserId === validUserId) {
        return NextResponse.json({ error: 'The squad leader cannot be removed. You can delete the squad instead.' }, { status: 400 });
      }

      // 1. Remove from team_members
      const { error: removeErr } = await serverSupabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', memberUserId);

      if (removeErr) {
        return NextResponse.json({ error: removeErr.message }, { status: 400 });
      }

      // 2. Remove member's registration record for this event
      if (team.event_id) {
        await serverSupabase
          .from('registrations')
          .delete()
          .eq('event_id', team.event_id)
          .eq('user_id', memberUserId);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[Teams API Error]:', err);
    return NextResponse.json({ error: err.message || 'Team operation failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return unauthorizedResponse('You must be signed in to delete a squad.');
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();

    // Verify user is the squad leader
    const { data: team, error: teamErr } = await serverSupabase
      .from('teams')
      .select('id, name, leader_id, event_id')
      .eq('id', teamId)
      .maybeSingle();

    if (teamErr || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.leader_id !== auth.userId) {
      return NextResponse.json(
        { error: 'Only the squad leader can delete this team.' },
        { status: 403 }
      );
    }

    // Cascade cleanup in DB
    await serverSupabase.from('team_invitations').delete().eq('team_id', teamId);
    await serverSupabase.from('team_members').delete().eq('team_id', teamId);
    const { error: delErr } = await serverSupabase.from('teams').delete().eq('id', teamId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    // Clean up all registrations for this team & event so deleted squad never lingers
    if (team.event_id) {
      await serverSupabase
        .from('registrations')
        .delete()
        .eq('event_id', team.event_id)
        .eq('user_id', auth.userId);

      if (team.name) {
        await serverSupabase
          .from('registrations')
          .delete()
          .eq('event_id', team.event_id)
          .eq('team_name', team.name);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Teams DELETE Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete team' }, { status: 500 });
  }
}
