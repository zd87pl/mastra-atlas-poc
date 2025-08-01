import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/mastra';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Use the actual Mastra workflow for research
    const agent = mastra.getAgent('researchAgent');
    const researchPrompt = `Research the following topic thoroughly using the two-phase process: "${query}".

    Phase 1: Search for 2-3 initial queries about this topic
    Phase 2: Search for follow-up questions from the learnings (then STOP)

    Return findings in JSON format with queries, searchResults, learnings, completedQueries, and phase.`;

    const result = await agent.generate(
      [
        {
          role: 'user',
          content: researchPrompt,
        },
      ],
      {
        maxSteps: 15,
      }
    );

    // Format the response to match the frontend expectations
    const researchData = result.text;
    const summary = `Research completed on "${query}": Based on comprehensive web search and analysis, here are the key findings and insights.`;
    
    // Extract search results if available (this would be enhanced with actual search results)
    const searchResults = [
      {
        title: "Research Analysis",
        content: researchData,
        url: "#research-analysis"
      }
    ];

    return NextResponse.json({
      query,
      results: searchResults,
      summary: `${summary}\n\n${researchData}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Failed to conduct research' },
      { status: 500 }
    );
  }
}