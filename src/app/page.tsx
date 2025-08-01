'use client'

import { useState } from 'react'
import { Search, Send, Copy, CheckCircle, FileText, ExternalLink } from 'lucide-react'

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

export default function Home() {
  const [query, setQuery] = useState('')
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError('')
    setResearchResult(null)
    
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
                case 'progress':
                  // Update loading state with progress message
                  console.log('Progress:', data.message)
                  break
                  
                case 'complete':
                  // Set final result
                  setResearchResult(data.data)
                  setIsLoading(false)
                  break
                  
                case 'error':
                  throw new Error(data.message)
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Research error:', error)
      setError(error instanceof Error ? error.message : 'Failed to conduct research')
      setIsLoading(false)
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
              {isLoading ? 'Researching...' : 'Start Research'}
            </button>
          </form>
        </div>

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
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

            {/* Sources */}
            {researchResult.results && researchResult.results.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources & References</h3>
                <div className="space-y-4">
                  {researchResult.results.map((result, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900 mb-2">{result.title}</h4>
                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 ml-4 flex-shrink-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{result.content}</p>
                      {result.url && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500 break-all">{result.url}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Examples Section */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Example Research Questions</h3>
          <div className="space-y-2 text-sm">
            <p className="text-blue-800">
              <strong>Try these research topics:</strong>
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>"What are the latest developments in renewable energy technology?"</li>
              <li>"How is artificial intelligence being used in healthcare in 2024?"</li>
              <li>"What are the current trends in remote work and digital collaboration?"</li>
              <li>"What are the recent breakthroughs in quantum computing?"</li>
            </ul>
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