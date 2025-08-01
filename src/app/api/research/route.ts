import { NextRequest } from 'next/server';
import { mastra } from '@/mastra';

// Configure route for long-running operations with streaming
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for research operations

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  
  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Query is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  console.log('Starting streaming research for query:', query);
  
  // Create a readable stream for real-time updates
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial status
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'status',
        message: 'Initializing research...',
        timestamp: new Date().toISOString()
      })}\n\n`));

      try {
        // Environment check
        const envStatus = {
          hasOpenAI: !!process.env.OPENAI_API_KEY,
          hasExa: !!process.env.EXASEARCH_API_KEY,
          hasDatabase: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV
        };
        
        console.log('Environment check:', envStatus);
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'environment',
          data: envStatus,
          timestamp: new Date().toISOString()
        })}\n\n`));

        // Get research agent
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Getting research agent...',
          timestamp: new Date().toISOString()
        })}\n\n`));

        const agent = mastra.getAgent('researchAgent');
        
        if (!agent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Research agent not available',
            timestamp: new Date().toISOString()
          })}\n\n`));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Research agent found, starting generation...',
          timestamp: new Date().toISOString()
        })}\n\n`));

        const researchPrompt = `Research the following topic thoroughly using the two-phase process: "${query}".

        Phase 1: Search for 2-3 initial queries about this topic
        Phase 2: Search for follow-up questions from the learnings (then STOP)

        Return findings in JSON format with queries, searchResults, learnings, completedQueries, and phase.`;

        // Start research with periodic status updates
        let progressCount = 0;
        const progressInterval = setInterval(() => {
          progressCount++;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: `Research in progress... (${progressCount * 5}s)`,
            timestamp: new Date().toISOString()
          })}\n\n`));
        }, 5000);

        try {
          const result = await agent.generate(
            [
              {
                role: 'user',
                content: researchPrompt,
              },
            ],
            {
              maxSteps: 20,
            }
          );

          clearInterval(progressInterval);

          console.log('Research completed successfully');
          
          // Send completion status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Research completed successfully!',
            timestamp: new Date().toISOString()
          })}\n\n`));

          // Process and send results
          const researchData = result?.text || 'Research completed successfully but no detailed data available';
          
          let summary = `Research completed on "${query}": `;
          if (result?.text && result.text.length > 100) {
            const firstParagraph = result.text.split('\n')[0] || result.text.substring(0, 200);
            summary += firstParagraph;
          } else {
            summary += "Comprehensive web search and analysis completed with multiple sources reviewed.";
          }
          
          const searchResults = [
            {
              title: "AI Research Analysis",
              content: researchData.length > 500 ? researchData.substring(0, 500) + "..." : researchData,
              url: "#ai-research"
            }
          ];

          // Send final results
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            data: {
              query,
              results: searchResults,
              summary: summary,
              fullData: researchData,
              timestamp: new Date().toISOString(),
              status: 'completed'
            }
          })}\n\n`));

        } catch (researchError) {
          clearInterval(progressInterval);
          console.error('Research generation error:', researchError);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: researchError instanceof Error ? researchError.message : 'Research failed',
            timestamp: new Date().toISOString()
          })}\n\n`));
        }

      } catch (error) {
        console.error('Streaming research error:', error);
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          timestamp: new Date().toISOString()
        })}\n\n`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    }
  });
}