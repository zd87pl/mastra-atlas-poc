# Mastra Deep Research - WP Engine Atlas Deployment

A comprehensive AI-powered research application built with [Mastra](https://mastra.ai) and deployed on WP Engine Atlas. This application performs deep research using multiple AI agents to provide comprehensive analysis and insights on any topic.

## 🚀 Features

- **AI-Powered Research**: Multi-agent research system using Mastra framework
- **Web Search Integration**: Real-time web search using Exa API
- **Streaming Results**: Server-sent events for real-time progress updates
- **PostgreSQL Database**: Cloud-hosted data persistence using Supabase
- **Responsive Interface**: Modern UI built with Next.js and Tailwind CSS

## 📋 Prerequisites

- **WP Engine Atlas Account**: Active Atlas account with Node.js support
- **PostgreSQL Database**: Supabase or compatible PostgreSQL database
- **OpenAI API Key**: For AI research capabilities
- **Exa API Key**: For web search functionality
- **Node.js**: Version 18.x or higher
- **Git**: For version control and deployment

## 🏗️ Project Structure

```
mastra-deep-research/
├── .platform.app.yaml           # WP Engine Atlas configuration
├── package.json                  # Dependencies and scripts
├── next.config.js               # Next.js configuration
├── mastra.config.ts             # Mastra framework configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── .env.example                 # Environment variables template
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Main application page
│   │   ├── globals.css          # Global styles with Tailwind
│   │   └── api/
│   │       └── research/
│   │           └── route.ts     # Research API endpoint with streaming
│   └── mastra/
│       ├── index.ts             # Mastra configuration
│       ├── agents/
│       │   └── researchAgent.ts # AI research agent
│       ├── workflows/
│       │   └── researchWorkflow.ts # Research workflow
│       └── tools/
│           └── webSearchTool.ts # Web search integration
└── README.md                    # This file
```

## 🛠️ Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd mastra-deep-research
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and database URL
   ```

4. **Required Environment Variables**:
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/database?pgbouncer=true
   OPENAI_API_KEY=your_openai_api_key
   EXASEARCH_API_KEY=your_exa_api_key
   ```

5. **Initialize database**:
   ```bash
   npm run db:push
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser** and navigate to `http://localhost:3000`

## 🌐 WP Engine Atlas Deployment

### Method 1: Direct from Mastra.ai (Recommended)

1. **Visit the Mastra.ai template page**: https://mastra.ai/templates/deep-research
2. **Click "Deploy to WP Engine"** button
3. **Connect your Atlas account** when prompted
4. **Follow the deployment wizard** to complete setup

### Method 2: Manual Git Deployment

1. **Prepare your Atlas environment**:
   - Log into your WP Engine Atlas dashboard
   - Create a new application
   - Note your Git remote URL

2. **Configure the application**:
   - Ensure `.platform.app.yaml` is in your project root
   - Verify all dependencies are listed in `package.json`

3. **Deploy via Git**:
   ```bash
   # Add Atlas remote
   git remote add atlas <your-atlas-git-url>
   
   # Deploy to Atlas
   git push atlas main
   ```

4. **Monitor deployment**:
   - Watch the deployment logs in Atlas dashboard
   - Wait for build completion (typically 2-5 minutes)

## ⚙️ Atlas Configuration Details

The `.platform.app.yaml` file configures:

- **Runtime**: Node.js 18
- **Build Process**: `npm ci` followed by `npm run build`
- **Start Command**: `npm start`
- **Extended Timeouts**: 300-second timeouts for long-running research operations
- **Environment**: Production settings with PORT 8080

### Key Configuration Features:

```yaml
name: mastra-deep-research
type: nodejs:18

build:
  flavor: none

hooks:
  build: |
    npm ci --no-audit --prefer-offline --no-progress
    npm run build

web:
  commands:
    start: "npm start"
  
  # Extended timeout configurations for AI research workflows
  upstream:
    socket_timeout: 300
    timeout: 300
  
  locations:
    "/api/research":
      timeout: 300
      keepalive_timeout: 300
```

## 🔧 Environment Variables

Configure the following environment variables in your Atlas dashboard:

- **DATABASE_URL**: PostgreSQL connection string (use Supabase pooler format for best performance)
- **OPENAI_API_KEY**: Your OpenAI API key for AI research capabilities
- **EXASEARCH_API_KEY**: Your Exa API key for web search functionality
- **NODE_ENV**: Set to `production` (configured automatically)
- **PORT**: Set to `8080` (Atlas requirement)

### Example Configuration:
```bash
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
OPENAI_API_KEY=sk-...
EXASEARCH_API_KEY=...
```

## 📝 Usage Instructions

1. **Enter Research Question**: Type your research topic or question in the text area
   - Example: "What are the latest developments in AI and machine learning in 2024?"

2. **Start Research**: Click the "Start Research" button to begin AI-powered analysis

3. **Monitor Progress**: Watch real-time progress updates as the research proceeds

4. **Review Results**: Get comprehensive summaries with sources and detailed analysis

5. **Copy Results**: Use the copy button to copy research summaries for further use

## 🎯 Example Research Topics

The application handles various research topics:

- **Technology Trends**: "What are the latest developments in renewable energy technology?"
- **Industry Analysis**: "How is artificial intelligence being used in healthcare in 2024?"
- **Business Insights**: "What are the current trends in remote work and digital collaboration?"
- **Scientific Research**: "What are the recent breakthroughs in quantum computing?"

## 🚨 Important Notes

### Atlas-Specific Requirements:
- **Port Configuration**: Must use port 8080 (configured in `.platform.app.yaml`)
- **Extended Timeouts**: Configured for AI research workflows that may take several minutes
- **Database Connection**: Uses PostgreSQL connection pooling for optimal performance
- **Environment Variables**: All API keys must be configured in Atlas dashboard

### Performance Optimization:
- **Streaming API**: Server-sent events bypass 30-second Cloudflare timeout limits
- **Connection Pooling**: PostgreSQL pooler connection format for database efficiency
- **Caching**: Static assets cached for optimal performance
- **CDN**: Leverages Atlas's global CDN for fast content delivery

### AI Research Features:
- **Multi-Agent System**: Uses specialized AI agents for different research tasks
- **Web Search Integration**: Real-time web search with Exa API
- **Progress Streaming**: Real-time updates during research workflows
- **Database Persistence**: Research state and results stored in PostgreSQL

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Verify Node.js version compatibility
   - Check for TypeScript errors: `npm run lint`
   - Ensure all dependencies are in `package.json`
   - Verify environment variables are set during build

2. **Database Connection Issues**:
   - Use Supabase pooler connection format with `?pgbouncer=true`
   - Verify DATABASE_URL in Atlas environment variables
   - Check database credentials and network connectivity

3. **API Key Issues**:
   - Ensure OPENAI_API_KEY is valid and has sufficient credits
   - Verify EXASEARCH_API_KEY is configured correctly
   - Check API key permissions and rate limits

4. **Timeout Issues**:
   - Research workflows can take several minutes - this is normal
   - Streaming API provides real-time updates during long operations
   - Check Atlas logs if research fails to complete

5. **Runtime Errors**:
   - Check that port 8080 is used in production
   - Verify all environment variables are set correctly in Atlas dashboard
   - Monitor Atlas application logs for detailed error information

### Getting Help:
- **WP Engine Atlas Documentation**: https://wpengine.com/atlas/
- **Mastra Documentation**: https://mastra.ai/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Supabase Documentation**: https://supabase.com/docs

## 📦 Dependencies

### Core Dependencies:
- **Next.js 14**: React framework with SSR support
- **React 18**: UI library
- **TypeScript 5**: Type safety and development experience
- **Tailwind CSS 3**: Utility-first CSS framework

### Mastra Framework:
- **@mastra/core**: Core Mastra framework for AI workflows
- **@mastra/pg**: PostgreSQL integration for Mastra
- **Mastra Agents**: AI agents for specialized research tasks

### AI and Search:
- **OpenAI**: GPT models for research and analysis
- **Exa API**: Advanced web search capabilities
- **PostgreSQL**: Database for workflow state and results

### Icons and UI:
- **Lucide React**: Beautiful, customizable icons

## 🔮 Architecture Overview

This application uses a sophisticated AI architecture:

- **Research Agent**: Specialized AI agent for conducting comprehensive research
- **Web Search Tool**: Integration with Exa API for real-time web search
- **Research Workflow**: Multi-step workflow with suspend/resume capabilities
- **PostgreSQL Store**: Persistent storage for workflow state and research results
- **Streaming API**: Server-sent events for real-time progress updates
- **Timeout Management**: Extended configurations for long-running AI operations

## 📄 License

This project is based on the Mastra.ai deep research template and is suitable for both personal and commercial use.

---

**Ready to deploy?** Visit [Mastra.ai](https://mastra.ai/templates/deep-research) and click "Deploy to WP Engine" for the fastest setup!