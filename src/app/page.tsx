'use client'

import { useState } from 'react'
import { Search, Send, Copy, CheckCircle, FileText, ExternalLink, Clock, Activity, CheckCircle2, AlertCircle } from 'lucide-react'

interface ResearchResult {
  query: string
  results: Array<{
    title: string
    content: string
    url: string
  }>
  summary: string
  timestamp: string
}

interface LogEntry {
  type: 'log' | 'status' | 'progress'
  level?: 'info' | 'success' | 'error' | 'warning'
  message: string
  timestamp: string
  category?: string
  details?: any
  step?: number
  totalSteps?: number
  elapsed?: number
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [currentStep, setCurrentStep] = useState<{step: number, totalSteps: number, message: string} | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError('')
    setResearchResult(null)
    setLogs([])
    setCurrentStep(null)
    
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() })
      })

      if (!response.ok) {
        throw new Error(`Research failed: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body available')
      }

      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete messages
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'status':
                case 'log':
                  // Add log entry
                  setLogs(prev => [...prev, data as LogEntry]);
                  break;
                  
                case 'progress':
                  // Update progress and add log entry
                  setLogs(prev => [...prev, data as LogEntry]);
                  if (data.step && data.totalSteps) {
                    setCurrentStep({
                      step: data.step,
                      totalSteps: data.totalSteps,
                      message: data.message
                    });
                  }
                  break;
                  
                case 'complete':
                  // Set final result
                  setResearchResult(data.data);
                  setIsLoading(false);
                  setLogs(prev => [...prev, {
                    type: 'log',
                    level: 'success',
                    message: 'Research completed successfully!',
                    timestamp: new Date().toISOString(),
                    category: 'system'
                  }]);
                  break;
                  
                case 'error':
                  throw new Error(data.message);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Research error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to conduct research';
      setError(errorMessage);
      setLogs(prev => [...prev, {
        type: 'log',
        level: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        category: 'system'
      }]);
      setIsLoading(false);
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-blue-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Mastra Deep Research</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          AI-powered research assistant using advanced web search and analysis. 
          Ask any question and get comprehensive research with sources and insights.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Research Question
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What are the latest developments in AI and machine learning in 2024?"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isLoading ? (
                currentStep ? 
                  `${currentStep.message.substring(0, 30)}...` : 
                  'Researching...'
              ) : 'Start Research'}
            </button>
          </form>
        </div>

        {/* Progress Section */}
        {isLoading && currentStep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <Activity className="h-5 w-5 animate-pulse" />
                Research Progress
              </h3>
              <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
                Step {currentStep.step} of {currentStep.totalSteps}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-blue-700 mb-2">
                <span>{currentStep.message}</span>
                <span>{Math.round((currentStep.step / currentStep.totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep.step / currentStep.totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Logs Section */}
        {(isLoading || logs.length > 0) && (
          <div className="bg-gray-900 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Runtime Logs
              </h3>
              <span className="text-xs text-gray-400">
                {logs.length} entries
              </span>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 py-1">
                  <span className="text-gray-500 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  
                  {/* Log Level Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {log.level === 'success' && (
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                    )}
                    {log.level === 'error' && (
                      <AlertCircle className="h-3 w-3 text-red-400" />
                    )}
                    {log.level === 'info' && (
                      <div className="h-3 w-3 rounded-full bg-blue-400" />
                    )}
                    {!log.level && (
                      <div className="h-3 w-3 rounded-full bg-gray-400" />
                    )}
                  </div>
                  
                  {/* Category */}
                  {log.category && (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                      log.category === 'system' ? 'bg-purple-900 text-purple-200' :
                      log.category === 'agent' ? 'bg-blue-900 text-blue-200' :
                      log.category === 'progress' ? 'bg-green-900 text-green-200' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {log.category}
                    </span>
                  )}
                  
                  {/* Message */}
                  <span className={`${
                    log.level === 'success' ? 'text-green-300' :
                    log.level === 'error' ? 'text-red-300' :
                    log.level === 'info' ? 'text-blue-300' :
                    'text-gray-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 py-1 text-gray-400">
                  <span className="text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-3 w-3 rounded-full bg-yellow-400 animate-pulse" />
                  </div>
                  <span className="text-yellow-300">Research in progress...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {researchResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Research Summary
                </h2>
                <button
                  onClick={() => copyToClipboard(researchResult.summary)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{researchResult.summary}</p>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Research completed: {new Date(researchResult.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Enhanced Sources */}
            {researchResult.results && researchResult.results.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Results</h3>
                <div className="space-y-6">
                  {researchResult.results.map((result, index) => {
                    // Try to parse JSON content for better formatting
                    let parsedContent = null;
                    try {
                      if (result.content.trim().startsWith('{') || result.content.trim().startsWith('[')) {
                        parsedContent = JSON.parse(result.content);
                      }
                    } catch (e) {
                      // Not JSON, keep as regular content
                    }

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-lg">{result.title}</h4>
                          {result.url && result.url !== '#comprehensive-research' && !result.url.startsWith('#research-step') && (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-4 flex-shrink-0 flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="text-sm">View Source</span>
                            </a>
                          )}
                        </div>

                        {/* Display parsed JSON content in structured format */}
                        {parsedContent ? (
                          <div className="space-y-4">
                            {/* Display search results */}
                            {parsedContent.searchResults && Array.isArray(parsedContent.searchResults) && (
                              <div>
                                <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                  <Search className="h-4 w-4" />
                                  Search Results ({parsedContent.searchResults.length})
                                </h5>
                                <div className="space-y-3">
                                  {parsedContent.searchResults.map((searchResult: any, idx: number) => (
                                    <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                      <div className="flex items-start justify-between mb-2">
                                        <h6 className="font-medium text-blue-900">{searchResult.title}</h6>
                                        {searchResult.url && (
                                          <a
                                            href={searchResult.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 ml-2 flex-shrink-0"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        )}
                                      </div>
                                      <p className="text-gray-600 text-sm leading-relaxed mb-2">{searchResult.content}</p>
                                      {searchResult.url && (
                                        <a
                                          href={searchResult.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 break-all"
                                        >
                                          {searchResult.url}
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Display key learnings */}
                            {parsedContent.learnings && Array.isArray(parsedContent.learnings) && (
                              <div>
                                <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Key Insights ({parsedContent.learnings.length})
                                </h5>
                                <ul className="space-y-3">
                                  {parsedContent.learnings.map((learning: any, idx: number) => (
                                    <li key={idx} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                                      {/* Main learning */}
                                      <p className="text-gray-700 text-sm leading-relaxed mb-2">
                                        {typeof learning === 'string' ? learning : learning.learning}
                                      </p>
                                      
                                      {/* Follow-up questions if present */}
                                      {learning.followUpQuestions && Array.isArray(learning.followUpQuestions) && learning.followUpQuestions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-green-200">
                                          <h6 className="text-xs font-medium text-green-700 mb-2 uppercase tracking-wide">
                                            Follow-up Questions:
                                          </h6>
                                          <ul className="space-y-1">
                                            {learning.followUpQuestions.map((question: string, qIdx: number) => (
                                              <li key={qIdx} className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded italic">
                                                "{question}"
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Display queries */}
                            {parsedContent.queries && Array.isArray(parsedContent.queries) && (
                              <div>
                                <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                  <Search className="h-4 w-4 text-purple-600" />
                                  Research Queries ({parsedContent.queries.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {parsedContent.queries.map((query: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium"
                                    >
                                      {query}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Display research phase and completion status */}
                            {(parsedContent.phase || parsedContent.completedQueries) && (
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-start justify-between">
                                  <div>
                                    {parsedContent.phase && (
                                      <div className="mb-2">
                                        <span className="inline-block bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium uppercase tracking-wide">
                                          Phase: {parsedContent.phase}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {parsedContent.completedQueries && Array.isArray(parsedContent.completedQueries) && (
                                      <div>
                                        <h6 className="text-sm font-medium text-blue-900 mb-2">
                                          Research Progress: {parsedContent.completedQueries.length} queries completed
                                        </h6>
                                        <div className="w-full bg-blue-200 rounded-full h-2">
                                          <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                              width: parsedContent.queries ?
                                                `${Math.round((parsedContent.completedQueries.length / parsedContent.queries.length) * 100)}%` :
                                                '100%'
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Display regular content with markdown-like formatting */
                          <div className="prose max-w-none">
                            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                              {result.content}
                            </div>
                          </div>
                        )}

                        {result.url && result.url !== '#comprehensive-research' && !result.url.startsWith('#research-step') && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-xs text-gray-500">Source: </span>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 break-all"
                            >
                              {result.url}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Examples Section */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Example Research Questions</h3>
          <div className="space-y-3 text-sm">
            <p className="text-blue-800">
              <strong>Try these research topics:</strong>
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              {[
                "What are the latest developments in renewable energy technology?",
                "How is artificial intelligence being used in healthcare in 2024?",
                "What are the current trends in remote work and digital collaboration?",
                "What are the recent breakthroughs in quantum computing?"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(example)}
                  className="text-left p-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded border border-blue-200 transition-colors text-xs"
                  disabled={isLoading}
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <div className="font-medium text-gray-900 mb-1">1. Web Search</div>
              <p>AI agents search the web using advanced search APIs to find relevant information</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">2. Analysis</div>
              <p>Multiple specialized agents evaluate and extract key insights from search results</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">3. Synthesis</div>
              <p>Generate comprehensive summaries with citations and actionable insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}