import { Mastra } from '@mastra/core';
import { PostgresStore } from '@mastra/pg';
import { researchWorkflow } from './workflows/researchWorkflow';
import { learningExtractionAgent } from './agents/learningExtractionAgent';
import { evaluationAgent } from './agents/evaluationAgent';
import { reportAgent } from './agents/reportAgent';
import { researchAgent } from './agents/researchAgent';
import { webSummarizationAgent } from './agents/webSummarizationAgent';
import { generateReportWorkflow } from './workflows/generateReportWorkflow';

// Get database configuration for PostgreSQL
const getDatabaseConfig = () => {
  // If DATABASE_URL is provided, use PostgreSQL
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }
  
  // For build time, use a placeholder connection string
  // The actual connection will be established at runtime when DATABASE_URL is available
  if (process.env.NODE_ENV === 'production') {
    return {
      connectionString: 'postgresql://placeholder:5432/build_placeholder',
    };
  }
  
  // For local development, you can configure a local PostgreSQL instance
  // or set DATABASE_URL in your .env file
  return {
    connectionString: 'postgresql://localhost:5432/mastra_dev?sslmode=disable',
  };
};

export const mastra = new Mastra({
  storage: new PostgresStore(getDatabaseConfig()),
  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
  },
  workflows: { generateReportWorkflow, researchWorkflow },
});
