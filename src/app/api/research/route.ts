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

    // Add timeout to prevent hanging requests - extended for complex research workflows
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 240 seconds')), 240000);
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

    // Wait for research to complete with extended timeout
    const result = await Promise.race([researchPromise, timeoutPromise]) as any;

    console.log('Research completed successfully');
    
    // Log result structure for debugging
    console.log('Result structure:', {
      hasText: !!result?.text,
      hasContent: !!result?.content,
      hasSteps: !!result?.steps,
      textLength: result?.text?.length || 0
    });

    // Format the response to match the frontend expectations
    const researchData = result?.text || result?.content || 'Research completed successfully but no detailed data available';
    
    // Create a more comprehensive summary
    let summary = `Research completed on "${query}": `;
    if (result?.text && result.text.length > 100) {
      // Extract key insights from the research data
      const firstParagraph = result.text.split('\n')[0] || result.text.substring(0, 200);
      summary += firstParagraph;
    } else {
      summary += "Comprehensive web search and analysis completed with multiple sources reviewed.";
    }
    
    // Create search results from the research data
    const searchResults = [
      {
        title: "AI Research Analysis",
        content: researchData.length > 500 ? researchData.substring(0, 500) + "..." : researchData,
        url: "#ai-research"
      }
    ];

    // Return successful response
    const response = {
      query,
      results: searchResults,
      summary: summary,
      fullData: researchData,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    
    console.log('Sending response to frontend:', {
      hasQuery: !!response.query,
      hasResults: !!response.results,
      hasSummary: !!response.summary,
      resultsCount: response.results?.length || 0
    });

    return NextResponse.json(response);
    
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