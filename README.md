# Text to SQL Template - WP Engine Atlas Deployment

A Next.js application that converts natural language queries into SQL statements, designed for deployment on WP Engine Atlas.

## 🚀 Features

- **Natural Language to SQL Conversion**: Convert plain English descriptions into SQL queries
- **Clean, Responsive UI**: Built with Next.js, TypeScript, and Tailwind CSS  
- **Copy-to-Clipboard**: Easily copy generated SQL queries
- **Example Templates**: Built-in examples to guide users
- **WP Engine Atlas Ready**: Pre-configured for seamless Atlas deployment

## 📋 Prerequisites

- **WP Engine Atlas Account**: Active Atlas account with Node.js support
- **Node.js**: Version 18.x or higher
- **Git**: For version control and deployment

## 🏗️ Project Structure

```
text-to-sql-template/
├── .platform.app.yaml      # WP Engine Atlas configuration
├── package.json             # Dependencies and scripts
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout component
│       ├── page.tsx        # Main application page
│       └── globals.css     # Global styles with Tailwind
└── README.md               # This file
```

## 🛠️ Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd text-to-sql-template
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🌐 WP Engine Atlas Deployment

### Method 1: Direct from Mastra.ai (Recommended)

1. **Visit the Mastra.ai template page**: https://mastra.ai/templates/text-to-sql
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
- **Static Assets**: Optimized caching for Next.js assets
- **Environment**: Production settings with PORT 8080

### Key Configuration Features:

```yaml
name: text-to-sql-template
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
```

## 🔧 Environment Variables

The application works out-of-the-box with default settings. For customization:

- **NODE_ENV**: Set to `production` (configured automatically)
- **PORT**: Set to `8080` (Atlas requirement)

## 📝 Usage Instructions

1. **Enter Natural Language Query**: Type your database question in plain English
   - Example: "Show me all active users ordered by registration date"

2. **Generate SQL**: Click the "Generate SQL" button

3. **Copy Result**: Use the copy button to copy the generated SQL query

4. **Try Examples**: Use the provided examples to understand the capabilities

## 🎯 Example Queries

The application handles various query types:

- **User Queries**: "Show me all active users ordered by registration date"
  - Generates: `SELECT * FROM users WHERE active = true ORDER BY created_at DESC;`

- **Aggregation**: "Get the total orders amount for each customer"  
  - Generates: `SELECT customer_id, SUM(total_amount) as total_spent FROM orders GROUP BY customer_id ORDER BY total_spent DESC;`

- **Counting**: "Count how many products are currently active"
  - Generates: `SELECT COUNT(*) as total_count FROM products WHERE status = 'active';`

## 🚨 Important Notes

### Atlas-Specific Requirements:
- **Port Configuration**: Must use port 8080 (configured in `.platform.app.yaml`)
- **Build Output**: Next.js static exports work best with Atlas
- **Asset Handling**: Static assets are automatically optimized

### Performance Optimization:
- **Caching**: Static assets cached for 1 week
- **Compression**: Automatic gzip compression enabled
- **CDN**: Leverages Atlas's global CDN

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Verify Node.js version compatibility
   - Check for TypeScript errors: `npm run lint`
   - Ensure all dependencies are in `package.json`

2. **Deployment Issues**:
   - Confirm `.platform.app.yaml` is properly configured
   - Check Atlas dashboard logs for detailed error messages
   - Verify Git remote is correctly set

3. **Runtime Errors**:
   - Check that port 8080 is used in production
   - Verify environment variables are set correctly

### Getting Help:
- **WP Engine Atlas Documentation**: https://wpengine.com/atlas/
- **Next.js Documentation**: https://nextjs.org/docs
- **Mastra.ai Support**: https://mastra.ai/support

## 📦 Dependencies

### Core Dependencies:
- **Next.js 14**: React framework with SSR support
- **React 18**: UI library
- **TypeScript 5**: Type safety and development experience
- **Tailwind CSS 3**: Utility-first CSS framework

### Icons and UI:
- **Lucide React**: Beautiful, customizable icons
- **Axios**: HTTP client for API requests (future AI integration)

## 🔮 Future Enhancements

This template provides a foundation for:
- **AI Integration**: Connect to OpenAI, Anthropic, or other AI services
- **Database Connections**: Add real database connectivity
- **Query Validation**: Implement SQL syntax validation
- **User Authentication**: Add user accounts and query history
- **Export Features**: Allow exporting queries to various formats

## 📄 License

This project is based on the Mastra.ai text-to-SQL template and is suitable for both personal and commercial use.

---

**Ready to deploy?** Visit [Mastra.ai](https://mastra.ai/templates/text-to-sql) and click "Deploy to WP Engine" for the fastest setup!