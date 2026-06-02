// ============================================================
// FIRM OS — AI File Analysis Route
// POST /api/ai-analyze
// Analyzes uploaded files and returns categorization + summaries
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import type { AIAnalysisResult } from '@/types'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { file_id, file_url, file_type, file_name } = body

    if (!file_id || !file_url) {
      return NextResponse.json({ error: 'file_id and file_url are required' }, { status: 400 })
    }

    // Build prompt based on file type
    const systemPrompt = buildSystemPrompt(file_type, file_name)
    const userMessage = buildAnalysisPrompt(file_type, file_url, file_name)

    // Call Anthropic API via fetch
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!anthropicResponse.ok) {
      throw new Error(`Anthropic API error: ${anthropicResponse.statusText}`)
    }

    const aiData = await anthropicResponse.json()
    const rawText = aiData.content?.[0]?.text ?? ''

    // Parse structured JSON from AI response
    const analysis = parseAIResponse(rawText, file_type, file_name)

    // Update the file vault entry with AI results
    const adminSupabase = await createAdminSupabaseClient()
    await adminSupabase
      .from('file_vault')
      .update({
        ai_summary: analysis.summary,
        ai_tags: analysis.tags,
        ai_category: analysis.category,
        ai_processed: true,
      })
      .eq('id', file_id)

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(fileType: string, fileName: string): string {
  return `You are an AI assistant for Firm OS, a design studio management platform.
Your role is to analyze uploaded files and provide structured metadata for design studio teams.

Respond ONLY with a valid JSON object (no markdown, no preamble). Use this exact structure:
{
  "summary": "2-3 sentence description of the file content and purpose",
  "category": "one of: brand-identity, proposal, contract, presentation, reference, deliverable, asset, documentation, invoice, brief",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "confidence": 0.0-1.0
}

Context: File is "${fileName}" of type "${fileType}". 
Keep summaries professional and actionable for design studio workflows.`
}

function buildAnalysisPrompt(fileType: string, fileUrl: string, fileName: string): string {
  const typeHints: Record<string, string> = {
    PDF: 'This is a PDF document. Analyze based on the filename and likely content for a design studio.',
    IMAGE: 'This is an image file. Analyze what kind of design asset this likely represents.',
    DOC: 'This is a document file. Analyze based on the filename patterns common in design studios.',
    VIDEO: 'This is a video file. Analyze based on context for a design studio workflow.',
    OTHER: 'Analyze this file for a design studio context.',
  }

  return `${typeHints[fileType] ?? typeHints.OTHER}

File name: "${fileName}"
File URL: ${fileUrl}

Provide your structured analysis as JSON.`
}

function parseAIResponse(raw: string, fileType: string, fileName: string): AIAnalysisResult {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      summary: parsed.summary ?? `Uploaded ${fileType.toLowerCase()} file: ${fileName}`,
      category: parsed.category ?? 'asset',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    }
  } catch {
    // Fallback if JSON parse fails
    return {
      summary: `${fileType} file uploaded to the vault: ${fileName}`,
      category: fileType === 'PDF' ? 'documentation' : 'asset',
      tags: [fileType.toLowerCase(), 'uploaded'],
      confidence: 0.5,
    }
  }
}
