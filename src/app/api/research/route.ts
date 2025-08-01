import { NextRequest, NextResponse } from 'next/server';
import { ResearchEngine } from '@/lib/research-engine';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const researchEngine = new ResearchEngine();
    const result = await researchEngine.conductResearch(query);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Failed to conduct research' },
      { status: 500 }
    );
  }
}