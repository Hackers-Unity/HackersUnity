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

    if (searchParams.get('action') === 'get_join_requests') {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return unauthorizedResponse('You must be signed in to view join requests.');
      }
      if (!teamId) {
        return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
      }

      const { data: team } = await serverSupabase
        .from('teams')
        .select('id, leader_id')
        .eq('id', teamId)
        .maybeSingle();

      if (!team || team.leader_id !== auth.userId) {
        return NextResponse.json({ error: 'Only the squad leader can view join requests.' }, { status: 403 });
      }

      let requests: any[] = [];
      const { data: reqs, error: reqErr } = await serverSupabase
        .from('team_join_requests')
        .select('*, profiles:user_id(name, email, avatar_url, phone, college, skills)')
        .eq('team_id', teamId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (!reqErr && reqs) {
        requests = reqs.map((r: any) => ({
          id: r.id,
          teamId: r.team_id,
          eventId: r.event_id,
          userId: r.user_id,
          userName: r.user_name || r.profiles?.name || 'Applicant',
          userEmail: r.user_email || r.profiles?.email || '',
          college: r.college || r.profiles?.college,
          skills: r.skills || r.profiles?.skills || [],
          phone: r.phone || r.profiles?.phone,
          message: r.message,
          createdAt: r.created_at,
          status: r.status,
        }));
      } else {
        // Fallback: query notifications for this leader
        const { data: notifs } = await serverSupabase
          .from('user_notifications')
          .select('notification_id, notifications(*)')
          .eq('user_id', auth.userId)
          .order('created_at', { ascending: false });

        if (notifs) {
          requests = notifs
            .map((un: any) => un.notifications)
            .filter((n: any) => n?.metadata?.isJoinRequest && n.metadata.teamId === teamId && !n.metadata.resolved)
            .map((n: any) => ({
              id: n.metadata.requestId || n.id,
              notificationId: n.id,
              teamId: n.metadata.teamId,
              eventId: n.metadata.eventId,
              userId: n.metadata.requesterId,
              userName: n.metadata.requesterName,
              userEmail: n.metadata.requesterEmail,
              college: n.metadata.requesterCollege,
              skills: n.metadata.requesterSkills,
              createdAt: n.created_at,
              status: 'PENDING',
            }));
        }
      }

      return NextResponse.json({ success: true, requests });
    }

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
    const body = await req.json();
    const { action = 'create' } = body;
    const serverSupabase = createAdminClient();

    let validUserId = auth?.userId;
    let userEmail = (auth?.email || body.leaderEmail || body.userEmail || '').toLowerCase().trim();
    let userName =
      body.leaderName ||
      body.userName ||
      auth?.user?.user_metadata?.name ||
      auth?.user?.user_metadata?.full_name ||
      userEmail.split('@')[0] ||
      'Hacker';

    // If cookie/token auth wasn't present, check body.userId or body.leaderId
    const candidateUserId = body.userId || body.leaderId;
    if (!validUserId && candidateUserId) {
      const { data: prof } = await serverSupabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', candidateUserId)
        .maybeSingle();

      if (prof?.id) {
        validUserId = prof.id;
        if (!userEmail && prof.email) userEmail = prof.email.toLowerCase().trim();
        if ((!userName || userName === 'Hacker') && prof.name) userName = prof.name;
      }
    }

    if (!validUserId) {
      return unauthorizedResponse('You must be signed in to create or join a squad.');
    }

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
        phone: body.phone || auth?.user?.user_metadata?.phone || null,
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
    } else if (action === 'request_join') {
      const { teamId, message = '', phone, college, skills } = body;
      if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required to request join' }, { status: 400 });
      }

      // 1. Fetch team with leader, members, and event details
      const { data: team, error: teamErr } = await serverSupabase
        .from('teams')
        .select('id, name, event_id, leader_id, max_members, team_members(id, user_id), events(id, title, slug)')
        .eq('id', teamId)
        .maybeSingle();

      if (teamErr || !team) {
        return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
      }

      // User cannot join their own team as member if they are already the leader
      if (team.leader_id === validUserId) {
        return NextResponse.json({ error: 'You are the leader of this squad.' }, { status: 400 });
      }

      const members = (team.team_members as any[]) || [];
      if (members.some((m) => m.user_id === validUserId)) {
        return NextResponse.json({ error: 'You are already a member of this squad.' }, { status: 400 });
      }

      const limit = team.max_members || 4;
      if (members.length >= limit) {
        return NextResponse.json({ error: `This squad has reached its maximum limit of ${limit} members.` }, { status: 400 });
      }

      // 2. Insert into team_join_requests (or fallback)
      let requestId = `req_${Date.now()}`;

      const { data: reqInsert, error: reqInsertErr } = await serverSupabase
        .from('team_join_requests')
        .insert({
          team_id: team.id,
          event_id: team.event_id,
          user_id: validUserId,
          user_name: userName,
          user_email: userEmail,
          phone: phone || null,
          college: college || null,
          skills: Array.isArray(skills) ? skills : [],
          message: message || '',
          status: 'PENDING',
        })
        .select('id')
        .maybeSingle();

      if (!reqInsertErr && reqInsert?.id) {
        requestId = reqInsert.id;
      } else {
        // Fallback to team_invitations
        const reqToken = `req_${team.id.substring(0, 8)}_${validUserId.substring(0, 8)}_${Date.now()}`;
        const { data: invInsert } = await serverSupabase
          .from('team_invitations')
          .upsert({
            team_id: team.id,
            event_id: team.event_id,
            invited_by: team.leader_id,
            invited_email: `req:${userEmail}`,
            status: 'PENDING',
            invite_token: reqToken,
          }, { onConflict: 'team_id,invited_email' })
          .select('id')
          .maybeSingle();

        if (invInsert?.id) {
          requestId = invInsert.id;
        }
      }

      // 3. Mark registration record as pending squad approval
      if (team.event_id) {
        try {
          await serverSupabase.from('registrations').upsert(
            {
              event_id: team.event_id,
              user_id: validUserId,
              user_email: userEmail,
              user_name: userName,
              phone: phone || null,
              college: college || null,
              is_team: true,
              team_name: team.name,
              role: 'Squad Member (Pending Approval)',
              status: 'PENDING',
              registered_at: new Date().toISOString(),
            },
            { onConflict: 'event_id,user_id' }
          );
        } catch (regErr) {
          console.warn('[Teams API] registration pending upsert notice:', regErr);
        }
      }

      // 4. Send notification to the squad leader
      const teamEventObj: any = Array.isArray(team.events) ? team.events[0] : team.events;
      const eventTitle = teamEventObj?.title || 'Hackathon';
      const eventSlug = teamEventObj?.slug || team.event_id;

      try {
        const { data: notifRecord } = await serverSupabase
          .from('notifications')
          .insert({
            title: `🤝 Squad Join Request: ${team.name}`,
            message: `${userName} wants to join your squad "${team.name}" for ${eventTitle}. Review and approve to add them.`,
            type: 'team',
            icon: 'users',
            event_id: team.event_id,
            sender_id: validUserId,
            target_type: 'specific_user',
            action_url: `/hackathons/${eventSlug}/register`,
            metadata: {
              isJoinRequest: true,
              requestId,
              teamId: team.id,
              teamName: team.name,
              requesterId: validUserId,
              requesterName: userName,
              requesterEmail: userEmail,
              requesterCollege: college || null,
              requesterSkills: Array.isArray(skills) ? skills : [],
              eventId: team.event_id,
              eventSlug,
            },
          })
          .select('id')
          .single();

        if (notifRecord?.id && team.leader_id) {
          await serverSupabase
            .from('user_notifications')
            .upsert(
              {
                user_id: team.leader_id,
                notification_id: notifRecord.id,
                is_read: false,
              },
              { onConflict: 'user_id,notification_id' }
            );
        }
      } catch (notifErr) {
        console.warn('[Teams API] Error dispatching leader notification:', notifErr);
      }

      return NextResponse.json({
        success: true,
        message: `Join request sent to ${team.name}'s squad leader.`,
        requestId,
        team: { id: team.id, name: team.name, leader_id: team.leader_id },
      });
    } else if (action === 'get_join_requests') {
      const { teamId } = body;
      if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
      }

      const { data: team } = await serverSupabase
        .from('teams')
        .select('id, leader_id')
        .eq('id', teamId)
        .maybeSingle();

      if (!team || team.leader_id !== validUserId) {
        return NextResponse.json({ error: 'Only the squad leader can view join requests.' }, { status: 403 });
      }

      let requests: any[] = [];
      const { data: reqs, error: reqErr } = await serverSupabase
        .from('team_join_requests')
        .select('*, profiles:user_id(name, email, avatar_url, phone, college, skills)')
        .eq('team_id', teamId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (!reqErr && reqs) {
        requests = reqs.map((r: any) => ({
          id: r.id,
          teamId: r.team_id,
          eventId: r.event_id,
          userId: r.user_id,
          userName: r.user_name || r.profiles?.name || 'Applicant',
          userEmail: r.user_email || r.profiles?.email || '',
          college: r.college || r.profiles?.college,
          skills: r.skills || r.profiles?.skills || [],
          phone: r.phone || r.profiles?.phone,
          message: r.message,
          createdAt: r.created_at,
          status: r.status,
        }));
      } else {
        const { data: notifs } = await serverSupabase
          .from('user_notifications')
          .select('notification_id, notifications(*)')
          .eq('user_id', validUserId)
          .order('created_at', { ascending: false });

        if (notifs) {
          requests = notifs
            .map((un: any) => un.notifications)
            .filter((n: any) => n?.metadata?.isJoinRequest && n.metadata.teamId === teamId && !n.metadata.resolved)
            .map((n: any) => ({
              id: n.metadata.requestId || n.id,
              notificationId: n.id,
              teamId: n.metadata.teamId,
              eventId: n.metadata.eventId,
              userId: n.metadata.requesterId,
              userName: n.metadata.requesterName,
              userEmail: n.metadata.requesterEmail,
              college: n.metadata.requesterCollege,
              skills: n.metadata.requesterSkills,
              createdAt: n.created_at,
              status: 'PENDING',
            }));
        }
      }

      return NextResponse.json({ success: true, requests });
    } else if (action === 'approve_join_request') {
      const { teamId, requestId, requesterId, requesterName, requesterEmail } = body;
      if (!teamId || !requesterId) {
        return NextResponse.json({ error: 'Team ID and requester ID are required' }, { status: 400 });
      }

      // 1. Verify leader
      const { data: team, error: teamErr } = await serverSupabase
        .from('teams')
        .select('id, name, event_id, leader_id, max_members, team_members(id, user_id), events(id, title, slug)')
        .eq('id', teamId)
        .maybeSingle();

      if (teamErr || !team) {
        return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
      }

      if (team.leader_id !== validUserId) {
        return NextResponse.json({ error: 'Only the squad leader can approve join requests.' }, { status: 403 });
      }

      const members = (team.team_members as any[]) || [];
      const limit = team.max_members || 4;
      if (members.length >= limit) {
        return NextResponse.json({ error: `Squad has reached its capacity limit of ${limit} members.` }, { status: 400 });
      }

      // 2. Add requester into team_members
      const { error: joinErr } = await serverSupabase
        .from('team_members')
        .upsert({
          team_id: teamId,
          user_id: requesterId,
          role: 'MEMBER',
          status: 'ACCEPTED',
        }, { onConflict: 'team_id,user_id' });

      if (joinErr) {
        return NextResponse.json({ error: joinErr.message }, { status: 400 });
      }

      // 3. Confirm registration in registrations table
      if (team.event_id) {
        await serverSupabase
          .from('registrations')
          .upsert({
            event_id: team.event_id,
            user_id: requesterId,
            user_name: requesterName || 'Squad Member',
            user_email: requesterEmail || '',
            is_team: true,
            team_name: team.name,
            role: 'Squad Member',
            status: 'CONFIRMED',
            registered_at: new Date().toISOString(),
          }, { onConflict: 'event_id,user_id' });
      }

      // 4. Update request status in team_join_requests if table exists
      try {
        await serverSupabase
          .from('team_join_requests')
          .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
          .eq('team_id', teamId)
          .eq('user_id', requesterId);
      } catch (e) {}

      try {
        await serverSupabase
          .from('team_invitations')
          .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
          .eq('team_id', teamId)
          .eq('invited_email', `req:${requesterEmail}`);
      } catch (e) {}

      // 5. Send approval notification to requester
      const teamEventObj: any = Array.isArray(team.events) ? team.events[0] : team.events;
      const eventTitle = teamEventObj?.title || 'Hackathon';
      const eventSlug = teamEventObj?.slug || team.event_id;

      try {
        const { data: approveNotif } = await serverSupabase
          .from('notifications')
          .insert({
            title: `🎉 Squad Request Approved!`,
            message: `Your request to join "${team.name}" for ${eventTitle} was approved! You are now an official squad member.`,
            type: 'team',
            icon: 'users',
            event_id: team.event_id,
            sender_id: validUserId,
            target_type: 'specific_user',
            action_url: `/hackathons/${eventSlug}/register`,
            metadata: {
              teamId: team.id,
              teamName: team.name,
              approved: true,
              eventId: team.event_id,
              eventSlug,
            },
          })
          .select('id')
          .single();

        if (approveNotif?.id) {
          await serverSupabase
            .from('user_notifications')
            .upsert({
              user_id: requesterId,
              notification_id: approveNotif.id,
              is_read: false,
            }, { onConflict: 'user_id,notification_id' });
        }
      } catch (e) {}

      return NextResponse.json({ success: true, message: `Approved and added to squad!` });
    } else if (action === 'decline_join_request') {
      const { teamId, requestId, requesterId, requesterEmail } = body;
      if (!teamId || !requesterId) {
        return NextResponse.json({ error: 'Team ID and requester ID are required' }, { status: 400 });
      }

      // 1. Verify leader
      const { data: team } = await serverSupabase
        .from('teams')
        .select('id, name, event_id, leader_id, events(id, title, slug)')
        .eq('id', teamId)
        .maybeSingle();

      if (!team || team.leader_id !== validUserId) {
        return NextResponse.json({ error: 'Only the squad leader can decline join requests.' }, { status: 403 });
      }

      // 2. Update request status in team_join_requests
      try {
        await serverSupabase
          .from('team_join_requests')
          .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
          .eq('team_id', teamId)
          .eq('user_id', requesterId);
      } catch (e) {}

      try {
        await serverSupabase
          .from('team_invitations')
          .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
          .eq('team_id', teamId)
          .eq('invited_email', `req:${requesterEmail}`);
      } catch (e) {}

      // 3. Remove pending registration for requester
      if (team.event_id) {
        try {
          await serverSupabase
            .from('registrations')
            .delete()
            .eq('event_id', team.event_id)
            .eq('user_id', requesterId)
            .eq('status', 'PENDING');
        } catch (e) {}
      }

      // 4. Send decline notification to requester
      const teamEventObj: any = Array.isArray(team.events) ? team.events[0] : team.events;
      const eventTitle = teamEventObj?.title || 'Hackathon';
      const eventSlug = teamEventObj?.slug || team.event_id;

      try {
        const { data: decNotif } = await serverSupabase
          .from('notifications')
          .insert({
            title: `Squad Request Update`,
            message: `Your request to join "${team.name}" for ${eventTitle} was declined by the squad leader. You can apply to another squad or participate solo.`,
            type: 'team',
            icon: 'users',
            event_id: team.event_id,
            sender_id: validUserId,
            target_type: 'specific_user',
            action_url: `/hackathons/${eventSlug}/register`,
            metadata: {
              teamId: team.id,
              teamName: team.name,
              declined: true,
              eventId: team.event_id,
              eventSlug,
            },
          })
          .select('id')
          .single();

        if (decNotif?.id) {
          await serverSupabase
            .from('user_notifications')
            .upsert({
              user_id: requesterId,
              notification_id: decNotif.id,
              is_read: false,
            }, { onConflict: 'user_id,notification_id' });
        }
      } catch (e) {}

      return NextResponse.json({ success: true, message: `Request declined.` });
    } else if (action === 'cancel_join_request') {
      const { teamId, eventId } = body;
      if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
      }

      // Update/delete request in team_join_requests
      try {
        await serverSupabase
          .from('team_join_requests')
          .update({ status: 'CANCELLED' })
          .eq('team_id', teamId)
          .eq('user_id', validUserId);
      } catch (e) {}

      try {
        await serverSupabase
          .from('team_invitations')
          .delete()
          .eq('team_id', teamId)
          .eq('invited_email', `req:${userEmail}`);
      } catch (e) {}

      // Delete pending registration
      if (eventId) {
        await serverSupabase
          .from('registrations')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', validUserId)
          .eq('status', 'PENDING');
      }

      return NextResponse.json({ success: true, message: 'Request cancelled.' });
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
