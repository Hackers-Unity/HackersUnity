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
    const {
      userId,
      name,
      phone,
      bio,
      college,
      organization,
      company,
      graduationYear,
      degree,
      branch,
      professionType,
      jobTitle,
      experienceYears,
      industry,
      skills,
      avatarUrl,
      bannerUrl,
      socialLinks,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    let finalAvatarUrl: string | null = avatarUrl || null;
    let finalBannerUrl: string | null = bannerUrl || null;

    // 1. Process Avatar Image Upload to Supabase Storage if base64 data URL
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')) {
      try {
        const matches = avatarUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1] || 'image/jpeg';
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const filePath = `profiles/${userId}/avatar.${ext}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('hackathon-assets')
            .upload(filePath, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadError) {
            finalAvatarUrl = `${supabaseUrl}/storage/v1/object/public/hackathon-assets/${filePath}?t=${Date.now()}`;
          } else {
            console.warn('[Profile Update] Avatar storage upload warning:', uploadError);
          }
        }
      } catch (uploadErr) {
        console.warn('[Profile Update] Avatar upload exception:', uploadErr);
      }
    }

    // 2. Process Banner Image Upload to Supabase Storage if base64 data URL
    if (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.startsWith('data:image/')) {
      try {
        const matches = bannerUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1] || 'image/jpeg';
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const filePath = `profiles/${userId}/banner.${ext}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('hackathon-assets')
            .upload(filePath, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadError) {
            finalBannerUrl = `${supabaseUrl}/storage/v1/object/public/hackathon-assets/${filePath}?t=${Date.now()}`;
          } else {
            console.warn('[Profile Update] Banner storage upload warning:', uploadError);
          }
        }
      } catch (uploadErr) {
        console.warn('[Profile Update] Banner upload exception:', uploadErr);
      }
    }

    const cleanName = name ? String(name).trim() : undefined;
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanBio = bio ? String(bio).trim() : null;
    const cleanCollege = college ? String(college).trim() : null;
    const cleanOrg = organization ? String(organization).trim() : (company ? String(company).trim() : null);
    const cleanCompany = company ? String(company).trim() : null;
    const cleanGradYear = graduationYear ? Number(graduationYear) : 2026;
    const cleanDegree = degree ? String(degree).trim() : null;
    const cleanBranch = branch ? String(branch).trim() : null;
    const cleanProfessionType = professionType || 'STUDENT';
    const cleanJobTitle = jobTitle ? String(jobTitle).trim() : null;
    const cleanExpYears = experienceYears ? String(experienceYears).trim() : null;
    const cleanIndustry = industry ? String(industry).trim() : null;
    const cleanSkills = Array.isArray(skills) ? skills : [];

    const cleanGithub = socialLinks?.github ? String(socialLinks.github).trim() : null;
    const cleanLinkedin = socialLinks?.linkedin ? String(socialLinks.linkedin).trim() : null;
    const cleanPortfolio = socialLinks?.portfolio ? String(socialLinks.portfolio).trim() : null;

    // 3. Fetch user info from Supabase Auth to guarantee email and base metadata
    let userEmail = body.email ? String(body.email).trim().toLowerCase() : '';
    let existingMeta: Record<string, any> = {};

    try {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userRes?.user) {
        if (!userEmail) userEmail = userRes.user.email || '';
        existingMeta = userRes.user.user_metadata || {};
      }
    } catch (authFetchErr) {
      console.warn('[Profile Update] Auth fetch warning:', authFetchErr);
    }

    // 4. Upsert to Postgres `profiles` table (MUST include email since it is NOT NULL)
    const profileUpdateData: Record<string, any> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (userEmail) profileUpdateData.email = userEmail;
    if (cleanName !== undefined) profileUpdateData.name = cleanName;
    if (cleanCollege !== undefined) profileUpdateData.college = cleanCollege;
    if (cleanOrg !== undefined) profileUpdateData.organization = cleanOrg;
    if (cleanBio !== undefined) profileUpdateData.bio = cleanBio;
    if (cleanSkills !== undefined) profileUpdateData.skills = cleanSkills;
    if (finalAvatarUrl !== undefined) profileUpdateData.avatar_url = finalAvatarUrl;
    if (cleanGithub !== undefined) profileUpdateData.github_url = cleanGithub;
    if (cleanLinkedin !== undefined) profileUpdateData.linkedin_url = cleanLinkedin;
    if (cleanPortfolio !== undefined) profileUpdateData.portfolio_url = cleanPortfolio;

    try {
      const { error: profileDbError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileUpdateData, { onConflict: 'id' });

      if (profileDbError) {
        console.warn('[Profile Update] Database profiles upsert warning:', profileDbError);
      } else {
        console.log('[Profile Update] Database profiles upsert success for:', userId);
      }
    } catch (dbErr) {
      console.warn('[Profile Update] DB upsert exception:', dbErr);
    }

    // 5. Update Supabase Auth user_metadata (holds all comprehensive fields across all devices)
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingMeta,
          name: cleanName || existingMeta.name,
          full_name: cleanName || existingMeta.full_name,
          phone: cleanPhone !== null ? cleanPhone : existingMeta.phone,
          bio: cleanBio !== null ? cleanBio : existingMeta.bio,
          college: cleanCollege !== null ? cleanCollege : existingMeta.college,
          organization: cleanOrg !== null ? cleanOrg : existingMeta.organization,
          company: cleanCompany !== null ? cleanCompany : existingMeta.company,
          graduation_year: cleanGradYear,
          degree: cleanDegree !== null ? cleanDegree : existingMeta.degree,
          branch: cleanBranch !== null ? cleanBranch : existingMeta.branch,
          profession_type: cleanProfessionType,
          job_title: cleanJobTitle !== null ? cleanJobTitle : existingMeta.job_title,
          experience_years: cleanExpYears !== null ? cleanExpYears : existingMeta.experience_years,
          industry: cleanIndustry !== null ? cleanIndustry : existingMeta.industry,
          skills: cleanSkills,
          avatar_url: finalAvatarUrl || existingMeta.avatar_url,
          banner_url: finalBannerUrl !== null ? finalBannerUrl : (existingMeta.banner_url || null),
          github_url: cleanGithub !== null ? cleanGithub : existingMeta.github_url,
          linkedin_url: cleanLinkedin !== null ? cleanLinkedin : existingMeta.linkedin_url,
          portfolio_url: cleanPortfolio !== null ? cleanPortfolio : existingMeta.portfolio_url,
        },
      });
    } catch (authMetaErr) {
      console.warn('[Profile Update] Auth metadata update exception:', authMetaErr);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: finalAvatarUrl,
      bannerUrl: finalBannerUrl,
    });
  } catch (err: any) {
    console.error('[Profile Update Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
