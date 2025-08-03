import { NextRequest } from 'next/server';
import { mastra } from '@/mastra';

// Configure route for long-running operations with streaming
export const runtime = 'nodejs';
// Helper function to parse and structure research data
function parseResearchData(rawData: string) {
  const sections: any = {};
  const searchResults: any[] = [];
  let summary = '';

  // Split the content into sections
  const lines = rawData.split('\n').filter(line => line.trim().length > 0);
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('### ')) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
      }
      
      // Start new section
      currentSection = line.replace('### ', '').trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  
  // Save final section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }

  // Generate summary
  if (sections['Learnings']) {
    summary = sections['Learnings'].substring(0, 400) + '...';
  } else {
    // Find first meaningful content
    const meaningfulLine = lines.find(line =>
      line.length > 50 &&
      !line.startsWith('###') &&
      !line.match(/^\d+\./) &&
      !line.toLowerCase().includes('queries')
    );
    summary = meaningfulLine ? meaningfulLine.substring(0, 300) : 'Comprehensive research completed with detailed analysis.';
  }

  // Parse search results if available
  if (sections['Search Results']) {
    const searchContent = sections['Search Results'];
    const resultBlocks = searchContent.split(/\d+\.\s\*\*/).filter((block: string) => block.trim());
    
    resultBlocks.forEach((block: string, index: number) => {
      if (block.trim()) {
        const lines = block.split('\n').filter((line: string) => line.trim());
        const titleLine = lines[0]?.replace(/\*\*/g, '') || `Search Result ${index + 1}`;
        const urlMatch = lines.find((line: string) => line.includes('URL:'))?.match(/\[(.*?)\]\((.*?)\)/);
        const contentLine = lines.find((line: string) => line.includes('Content:'))?.replace('- Content:', '').trim();
        
        searchResults.push({
          title: titleLine.trim(),
          content: contentLine || lines.slice(1).join(' ').substring(0, 200) + '...',
          url: urlMatch ? urlMatch[2] : '#'
        });
      }
    });
  }

  // If no structured search results, create them from sections
  if (searchResults.length === 0) {
    Object.entries(sections).forEach(([sectionName, content]) => {
      if (sectionName !== 'Learnings' && typeof content === 'string') {
        searchResults.push({
          title: sectionName,
          content: content.substring(0, 300) + (content.length > 300 ? '...' : ''),
          url: `#${sectionName.toLowerCase().replace(/\s+/g, '-')}`
        });
      }
    });
  }

  return {
    summary,
    searchResults,
    sections
  };
}

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

        // Start research with detailed step-by-step progress updates
        let progressCount = 0;
        const progressInterval = setInterval(() => {
          progressCount++;
          const elapsed = progressCount * 2;
          
          let currentStep = 'Initializing research...';
          let stepNumber = 1;
          if (elapsed > 5) { currentStep = 'Connecting to research agent...'; stepNumber = 2; }
          if (elapsed > 10) { currentStep = 'Performing web search...'; stepNumber = 3; }
          if (elapsed > 20) { currentStep = 'Analyzing search results...'; stepNumber = 4; }
          if (elapsed > 30) { currentStep = 'Extracting key insights...'; stepNumber = 5; }
          if (elapsed > 45) { currentStep = 'Generating comprehensive summary...'; stepNumber = 6; }
          if (elapsed > 60) { currentStep = 'Finalizing research report...'; stepNumber = 7; }
          
          // Send detailed progress log
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'log',
            level: 'info',
            message: currentStep,
            timestamp: new Date().toISOString(),
            category: 'progress',
            elapsed,
            step: stepNumber,
            totalSteps: 7
          })}\n\n`));
          
          // Send progress update for UI
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: currentStep,
            timestamp: new Date().toISOString(),
            elapsed,
            step: stepNumber,
            totalSteps: 7
          })}\n\n`));
        }, 2000);

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

          // Process and send results - extract full research data
          const researchData = result?.text || 'Research completed successfully but no detailed data available';
          
          console.log('Full research result:', {
            text: result?.text?.substring(0, 200) + '...',
            textLength: result?.text?.length,
            hasSteps: !!result?.steps,
            stepsCount: result?.steps?.length
          });
          
          // Try to extract more comprehensive research data
          let fullResearchContent = researchData;
          
          // If the research data seems to be truncated, try to get more complete content
          if (result?.steps && Array.isArray(result.steps)) {
            const stepContents = result.steps
              .map(step => step.text || '')
              .filter(content => content.length > 0)
              .join('\n\n');
            
            if (stepContents.length > fullResearchContent.length) {
              fullResearchContent = stepContents;
            }
          }
          
          // Create a comprehensive summary from the research
          let summary = `Research completed on "${query}": `;
          
          // Extract meaningful insights from the research data
          const lines = fullResearchContent.split('\n').filter(line => line.trim().length > 0);
          if (lines.length > 0) {
            // Find the first substantial line that's not just a query
            const meaningfulLine = lines.find(line =>
              line.length > 50 &&
              !line.startsWith('###') &&
              !line.match(/^\d+\./) &&
              !line.toLowerCase().includes('queries')
            ) || lines[0];
            
            summary += meaningfulLine.substring(0, 300);
          } else {
            summary += "Comprehensive web search and analysis completed with multiple sources reviewed.";
          }
          
          // Create detailed search results with full content
          const searchResults = [
            {
              title: "Comprehensive Research Analysis",
              content: fullResearchContent,
              url: "#comprehensive-research"
            }
          ];
          
          // Individual research steps removed to prevent duplicate display
          // Only show the comprehensive analysis to avoid redundancy

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