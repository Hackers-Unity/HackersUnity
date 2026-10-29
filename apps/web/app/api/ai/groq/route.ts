import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroqChat(messages: Array<{ role: string; content: string }>, jsonMode = true) {
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
  let lastError = null;

  for (const model of models) {
    try {
      const payload: Record<string, any> = {
        model,
        messages,
        temperature: 0.3,
      };

      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Groq model ${model} failed with status ${res.status}: ${errorText}`);
        lastError = new Error(`Groq ${res.status}: ${errorText}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }
    } catch (err: any) {
      console.warn(`Error invoking Groq model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'find') {
      const { query, events = [] } = body;
      if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
      }

      // Catalog overview for Groq
      const catalog = events.slice(0, 15).map((e: any) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        description: e.description ? e.description.slice(0, 160) : '',
        tags: e.tags || [],
        mode: e.mode || e.eventType || 'ONLINE',
        location: e.location || 'Online',
        prize: e.prize || '',
        category: e.category || 'HACKATHON',
      }));

      const systemPrompt = `You are the AI Search & Discovery Engine for Hacker's Unity hackathon platform.
Analyze the user query and match the most relevant hackathons from the provided catalog.
Return valid JSON in this exact structure:
{
  "matchedEventIds": ["id1", "id2"],
  "rationale": "One crisp sentence explaining why these events match the user's intent.",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

      const userPrompt = `User Query: "${query}"\n\nEvents Catalog:\n${JSON.stringify(catalog, null, 2)}`;

      const responseText = await callGroqChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const parsed = JSON.parse(responseText);
      return NextResponse.json({
        success: true,
        matchedEventIds: parsed.matchedEventIds || [],
        rationale: parsed.rationale || '',
        suggestedTags: parsed.suggestedTags || [],
      });
    }

    if (action === 'build') {
      const { prompt, sourceText = '', imageBase64 } = body;
      if (!prompt && !sourceText && !imageBase64) {
        return NextResponse.json(
          { error: 'Either prompt, brochure document, or hackathon poster image is required' },
          { status: 400 }
        );
      }

      // Native Multimodal Vision Poster Analysis via Groq
      let extractedPosterText = '';
      if (imageBase64) {
        try {
          const imgUrl = imageBase64.startsWith('data:')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;

          const visionRes = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            },
            body: JSON.stringify({
              model: 'qwen/qwen3.8-27b',
              max_tokens: 600,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Analyze this hackathon / event poster thoroughly. Transcribe and extract all visible details: hackathon title, subtitle/tagline, organizing institution/college/brand, venue or city/mode, event dates, registration deadline, total prize pool & cash amounts, tracks/themes, team size, eligibility, and rules.',
                    },
                    {
                      type: 'image_url',
                      image_url: { url: imgUrl },
                    },
                  ],
                },
              ],
            }),
          });

          if (visionRes.ok) {
            const visionData = await visionRes.json();
            extractedPosterText = visionData.choices?.[0]?.message?.content || '';
          } else {
            console.warn('Groq vision endpoint status:', visionRes.status, await visionRes.text());
          }
        } catch (visionErr: any) {
          console.warn('Poster vision analysis warning:', visionErr.message);
        }
      }

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const regStartStr = now.toISOString().split('T')[0];
      const regDeadlineStr = new Date(nextMonth.getTime() - 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const eventStartStr = nextMonth.toISOString().split('T')[0];
      const eventEndStr = new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const systemPrompt = `You are the AI Event Architect for Hacker's Unity (India's premier hackathon platform).
Your task is to transform natural language instructions, event brochures, or hackathon poster/banner OCR text into a complete, professional, production-ready Hackathon specification.

Rules:
1. If text extracted from a hackathon poster is provided, carefully read every detail (hackathon title, organizing college/brand, dates, prize pool, tracks/themes, team size, venue/city) and map them accurately.
2. If location or city is mentioned (e.g. Bangalore, Delhi, Jaipur, Pune, Mumbai, Hyderabad), set eventType to 'OFFLINE' or 'HYBRID'. Otherwise default to 'ONLINE'.
3. Category must be one of: 'HACKATHON', 'HIRING_CHALLENGE', 'TECH_EVENT', 'CONFERENCE'.
4. EventType must be one of: 'ONLINE', 'OFFLINE', 'HYBRID'.
5. Dates should be in YYYY-MM-DD format (upcoming dates relative to today: ${regStartStr}).
6. Generate rich markdown in description (including # Overview, ## Problem Statements / Tracks, ## Submission Guidelines, ## Judging Criteria).
7. Return strictly valid JSON conforming to this schema:
{
  "title": "Clear, memorable hackathon title",
  "tagline": "A punchy, inspiring 1-sentence tagline",
  "institutionName": "University / College or Organization Name",
  "organizerLeadName": "Community Lead or Organizing Team",
  "organizerName": "University or Community Name",
  "category": "HACKATHON",
  "eventType": "ONLINE",
  "mode": "Online",
  "location": "Online / Discord",
  "description": "# Overview\\nDetailed markdown...",
  "rulesText": "1. All code must be written during the hackathon.\\n2. Open source libraries are allowed.\\n3. Teams must submit a working GitHub repo and demo video.",
  "prize": "₹1,00,000",
  "totalPrizeValue": 100000,
  "currency": "INR",
  "prizes": [
    { "position": "1st Place (Grand Winner)", "amount": 50000, "description": "Cash prize + incubator fast-track" },
    { "position": "2nd Place (Runner Up)", "amount": 30000, "description": "Cash prize + developer grant" },
    { "position": "3rd Place (2nd Runner Up)", "amount": 20000, "description": "Cash prize + cloud credits" }
  ],
  "tracks": [
    { "title": "Track Name 1", "prize": "₹25,000", "description": "Problem statement and deliverables" },
    { "title": "Track Name 2", "prize": "₹25,000", "description": "Problem statement and deliverables" }
  ],
  "registrationStart": "${regStartStr}",
  "registrationDeadline": "${regDeadlineStr}",
  "startDate": "${eventStartStr}",
  "endDate": "${eventEndStr}",
  "minTeamSize": 1,
  "maxTeamSize": 4,
  "difficulty": "All Levels Welcome",
  "eligibility": "Open to college students, developers, and builders worldwide",
  "tags": ["AI", "Web3", "Fullstack"]
}`;

      const userPrompt = `User Prompt: ${prompt || 'Create and configure the hackathon based on this poster/brochure'}
${extractedPosterText ? `\n--- TEXT EXTRACTED FROM HACKATHON POSTER (OCR) ---\n${extractedPosterText}\n-------------------------------------------------` : ''}
${sourceText ? `\n--- ATTACHED DOCUMENT CONTENT ---\n${sourceText}\n--------------------------------` : ''}`;

      const responseText = await callGroqChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const eventData = JSON.parse(responseText);

      return NextResponse.json({
        success: true,
        event: eventData,
        extractedPosterText: extractedPosterText || undefined,
      });
    }

    if (action === 'evaluate_product') {
      const { submission, eventTitle, eventDescription } = body;
      if (!submission) {
        return NextResponse.json({ error: 'Submission data is required' }, { status: 400 });
      }

      const systemPrompt = `You are an expert AI Product Analyst and Startup Evaluation Partner for Hacker's Unity hackathon platform.
Your task is to evaluate a participant's hackathon submission as a REAL PRODUCT AND POTENTIAL BUSINESS, not merely as a technical project or hackathon demo.

Analyze the submission across these 8 core dimensions:
1. Problem Validation & Importance (15% weight)
   - Is the problem clearly defined, real, and affecting actual users?
   - Is it solving a real pain point or an imaginary problem?
2. Product Value & Usefulness (15% weight)
   - Does the product provide clear value? Would users realistically use it?
   - Answer: "Why would someone actually use this product?"
3. Innovation & Differentiation (10% weight)
   - What makes it different? Does it introduce a meaningful improvement?
   - CRITICAL: Do NOT give a high innovation score simply because the product uses AI or popular technologies alone.
4. Product Experience & Usability (10% weight)
   - Is the product easy to understand with a logical user flow?
   - Focus on usability rather than visual beauty alone.
5. Market Potential (15% weight)
   - Who could use this product? Is there realistic demand? Startup / commercial potential?
6. Scalability & Growth Potential (10% weight)
   - Can this product grow beyond the hackathon? Can it support more users and become sustainable?
7. Product Execution & Completeness (15% weight)
   - Is the product actually functional? Is there a working prototype or MVP?
   - Classify productStage as one of: "Idea Stage", "Concept Prototype", "Functional Prototype", "MVP", "Early Product"
8. Business Model & Sustainability (10% weight)
   - Realistic monetization possibilities (e.g. SaaS, Subscription, Freemium, B2B, Marketplace, Licensing, Transaction-based, Enterprise) without forcing an unnatural model.

TECH STACK ASSESSMENT:
- Identify detected frontend, backend, database, AI/ML, cloud/APIs.
- Assess stack suitability, complexity, scalability, and recommended improvements.
- A simple, well-chosen stack (e.g. Next.js + Supabase) is preferred over an unnecessarily complex architecture.

EVALUATION CONFIDENCE:
- Classify as: "High Confidence", "Medium Confidence", or "Low Confidence".
- Explain if key data (e.g. pitch deck, live demo, monetization info) was missing.

CRITICAL RULES:
1. Only evaluate information available in the submission. Never invent features or make unsubstantiated claims.
2. If critical information is missing, explicitly state: "Insufficient information available to evaluate this aspect accurately." in the reason and list in missingInformation.
3. Treat AI APIs or AI integration alone as not automatically innovative.
4. Provide constructive, specific, actionable feedback (avoid generic advice).
5. Return scores for each of the 8 criteria as integers from 0 to 10 with clear, concise reasoning.
6. DO NOT calculate the final weighted score — the backend calculates it deterministically.
7. Return ONLY valid JSON strictly matching the following schema.

REQUIRED JSON SCHEMA:
{
  "productSummary": "Concise summary explaining what it is, who it is for, problem it solves, and how it creates value.",
  "productStage": "Idea Stage | Concept Prototype | Functional Prototype | MVP | Early Product",
  "evaluationConfidence": "High Confidence | Medium Confidence | Low Confidence",
  "scores": {
    "problemValidation": { "score": 8, "reason": "..." },
    "productValue": { "score": 7, "reason": "..." },
    "innovation": { "score": 6, "reason": "..." },
    "productExperience": { "score": 8, "reason": "..." },
    "marketPotential": { "score": 7, "reason": "..." },
    "scalability": { "score": 8, "reason": "..." },
    "productExecution": { "score": 7, "reason": "..." },
    "businessModel": { "score": 6, "reason": "..." }
  },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "targetUsers": ["Target User 1", "Target User 2"],
  "marketOpportunity": "Description of the target market opportunity and size.",
  "businessPotential": {
    "level": "High Potential | Medium Potential | Early Stage Potential | Limited Potential",
    "analysis": "Analysis of business potential and customer personas.",
    "possibleModels": ["SaaS", "Freemium"]
  },
  "techStackAnalysis": {
    "detectedStack": ["Next.js", "Tailwind CSS", "Supabase"],
    "suitability": "...",
    "complexity": "Appropriate / Minimal / Unnecessarily Complex",
    "scalability": "...",
    "recommendations": ["Recommendation 1"]
  },
  "productPotential": {
    "level": "High Potential | Medium Potential | Early Stage Potential | Limited Potential",
    "reason": "..."
  },
  "recommendations": [
    "1. Validate the problem with actual target users.",
    "2. Improve differentiation from existing solutions.",
    "3. Define a clearer monetization strategy."
  ],
  "missingInformation": []
}`;

      const userPrompt = `Evaluate this hackathon submission:
Event: ${eventTitle || 'Hackathon'}
${eventDescription ? `Event Theme/Description: ${eventDescription}` : ''}

Product Name: ${submission.projectTitle || 'Untitled'}
Tagline: ${submission.tagline || 'None provided'}
Track: ${submission.track || 'General'}
Description: ${submission.projectDescription || 'No description provided'}
Project Repository / Link: ${submission.projectLink || 'None'}
Demo Video URL: ${submission.demoVideoUrl || 'None'}
Presentation / Deck URL: ${submission.presentationUrl || 'None'}
Additional Resources / Notes: ${submission.additionalResources || 'None'}
Submitted By: ${submission.submittedByName || 'Builder'} (${submission.submittedByEmail || ''})`;

      const responseText = await callGroqChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const parsed = JSON.parse(responseText);

      // Deterministic backend calculation of the final product score (Rule 9 from judging_evolution.md)
      const scores = parsed.scores || {};
      const pVal = Number(scores.problemValidation?.score ?? 0);
      const prodVal = Number(scores.productValue?.score ?? 0);
      const innov = Number(scores.innovation?.score ?? 0);
      const exp = Number(scores.productExperience?.score ?? 0);
      const market = Number(scores.marketPotential?.score ?? 0);
      const scale = Number(scores.scalability?.score ?? 0);
      const exec = Number(scores.productExecution?.score ?? 0);
      const biz = Number(scores.businessModel?.score ?? 0);

      const weightedOutOf10 = (
        pVal * 0.15 +
        prodVal * 0.15 +
        innov * 0.10 +
        exp * 0.10 +
        market * 0.15 +
        scale * 0.10 +
        exec * 0.15 +
        biz * 0.10
      );

      const finalScore = Math.min(100, Math.max(0, Math.round(weightedOutOf10 * 10)));

      const evaluationReport = {
        ...parsed,
        finalScore,
        evaluatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        evaluation: evaluationReport,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Groq AI API Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI service error' },
      { status: 500 }
    );
  }
}
