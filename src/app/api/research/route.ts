import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/mastra';

// Configure route for long-running operations
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for research operations

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('Starting research for query:', query);
    
    // Check environment variables
    console.log('Environment check:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasExa: !!process.env.EXASEARCH_API_KEY,
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    });

    // Use the actual Mastra workflow for research
    console.log('Getting research agent...');
    const agent = mastra.getAgent('researchAgent');
    
    if (!agent) {
      console.error('Research agent not found');
      return NextResponse.json(
        { error: 'Research agent not available' },
        { status: 500 }
      );
    }
    
    console.log('Research agent found, starting generation...');
    
    const researchPrompt = `Research the following topic thoroughly using the two-phase process: "${query}".

    Phase 1: Search for 2-3 initial queries about this topic
    Phase 2: Search for follow-up questions from the learnings (then STOP)

    Return findings in JSON format with queries, searchResults, learnings, completedQueries, and phase.`;

    // Add timeout to prevent hanging requests - increased for research workflows
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 120 seconds')), 120000);
    });
    
    const researchPromise = agent.generate(
      [
        {
          role: 'user',
          content: researchPrompt,
        },
      ],
      {
        maxSteps: 20, // Increased for thorough research
      }
    );

    const result = await Promise.race([researchPromise, timeoutPromise]) as any;

    console.log('Research completed successfully');

    // Format the response to match the frontend expectations
    const researchData = result?.text || 'No research data available';
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
    
    // Provide more detailed error information
    let errorDetails = 'Unknown error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Check for specific error types
      if (error.message.includes('timeout')) {
        statusCode = 504;
        errorDetails = 'Request timeout - this might be due to missing environment variables or database connection issues';
      } else if (error.message.includes('DATABASE_URL')) {
        statusCode = 500;
        errorDetails = 'Database configuration error: ' + error.message;
      } else if (error.message.includes('OPENAI_API_KEY')) {
        statusCode = 500;
        errorDetails = 'OpenAI API key not configured: ' + error.message;
      } else if (error.message.includes('EXASEARCH_API_KEY')) {
        statusCode = 500;
        errorDetails = 'Exa Search API key not configured: ' + error.message;
      }
    }
    
    return NextResponse.json(
      {
        error: 'Failed to conduct research',
        details: errorDetails,
        timestamp: new Date().toISOString(),
        environment: {
          hasOpenAI: !!process.env.OPENAI_API_KEY,
          hasExa: !!process.env.EXASEARCH_API_KEY,
          hasDatabase: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV
        }
      },
      { status: statusCode }
    );
  }
}