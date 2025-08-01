'use client'

import { useState } from 'react'
import { Database, Send, Copy, CheckCircle } from 'lucide-react'

export default function Home() {
  const [query, setQuery] = useState('')
  const [sqlResult, setSqlResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    try {
      // Simulate API call to convert text to SQL
      // In a real implementation, this would call your AI service
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock SQL generation based on input
      const mockSQL = generateMockSQL(query)
      setSqlResult(mockSQL)
    } catch (error) {
      console.error('Error generating SQL:', error)
      setSqlResult('-- Error generating SQL query')
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockSQL = (input: string): string => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('users') && lowerInput.includes('select')) {
      return 'SELECT * FROM users WHERE active = true ORDER BY created_at DESC;'
    } else if (lowerInput.includes('orders') && lowerInput.includes('total')) {
      return 'SELECT customer_id, SUM(total_amount) as total_spent FROM orders GROUP BY customer_id ORDER BY total_spent DESC;'
    } else if (lowerInput.includes('count')) {
      return 'SELECT COUNT(*) as total_count FROM products WHERE status = \'active\';'
    } else {
      return `-- Generated SQL for: "${input}"\nSELECT column1, column2 \nFROM table_name \nWHERE condition = 'value' \nORDER BY column1 DESC;`
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlResult)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Database className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Text to SQL</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Convert natural language descriptions into SQL queries using AI. 
          Simply describe what you want to retrieve from your database in plain English.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Natural Language Query
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Show me all active users ordered by registration date"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isLoading ? 'Generating SQL...' : 'Generate SQL'}
            </button>
          </form>
        </div>

        {/* Result Section */}
        {sqlResult && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated SQL</h2>
              <button
                onClick={copyToClipboard}
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
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm font-mono border">
              <code>{sqlResult}</code>
            </pre>
          </div>
        )}

        {/* Examples Section */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Example Queries</h3>
          <div className="space-y-2 text-sm">
            <p className="text-blue-800">
              <strong>Try these examples:</strong>
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>"Show me all active users ordered by registration date"</li>
              <li>"Get the total orders amount for each customer"</li>
              <li>"Count how many products are currently active"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}