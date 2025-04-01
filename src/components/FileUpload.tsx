import React, { useState } from 'react';
import { Upload, LogOut, Lightbulb, Trophy, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import OpenAI from 'openai';
import { ASSISTANTS, type AssistantType, type AnalysisResult } from '../config/assistants';
import ReactMarkdown from 'react-markdown';

const initialResults: Record<AssistantType, AnalysisResult> = {
  INSIGHTS: { type: 'INSIGHTS', content: '', status: 'idle' },
  ACHIEVEMENTS: { type: 'ACHIEVEMENTS', content: '', status: 'idle' },
  RESEARCH_IDEAS: { type: 'RESEARCH_IDEAS', content: '', status: 'idle' },
};

const validateAndFormatResponse = (content: string, type: AssistantType): string => {
  // Remove any extra whitespace and ensure consistent newlines
  let formattedContent = content.trim().replace(/\r\n/g, '\n');

  // Remove any potential markdown headers or introductory text
  formattedContent = formattedContent.replace(/^#.*$/gm, '').trim();
  formattedContent = formattedContent.replace(/^Introduction:?.*$/gm, '').trim();
  formattedContent = formattedContent.replace(/^Summary:?.*$/gm, '').trim();

  // Ensure each point starts with a number or bullet
  const lines = formattedContent.split('\n');
  let formatted = lines
    .map(line => {
      // Skip empty lines
      if (!line.trim()) return '';
      
      // If line doesn't start with a number or bullet, add one
      if (!/^(\d+\.|[-*•])/.test(line.trim())) {
        return `- ${line.trim()}`;
      }
      return line.trim();
    })
    .filter(Boolean) // Remove empty lines
    .join('\n');

  // Add section headers based on type
  switch (type) {
    case 'INSIGHTS':
      formatted = `## Key Research Insights\n\n${formatted}`;
      break;
    case 'ACHIEVEMENTS':
      formatted = `## Notable Achievements\n\n${formatted}`;
      break;
    case 'RESEARCH_IDEAS':
      formatted = `## Research Opportunities\n\n${formatted}`;
      break;
  }

  return formatted;
};

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<Record<AssistantType, AnalysisResult>>(initialResults);
  const { logout } = useAuthStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setResults(initialResults);
      } else {
        setFile(null);
        setResults({
          ...initialResults,
          INSIGHTS: { ...initialResults.INSIGHTS, status: 'error', error: 'Please upload a PDF file' }
        });
      }
    }
  };

  const processWithAssistant = async (
    openai: OpenAI,
    fileId: string,
    assistantType: AssistantType
  ) => {
    try {
      setResults(prev => ({
        ...prev,
        [assistantType]: { ...prev[assistantType], status: 'loading' }
      }));

      const thread = await openai.beta.threads.create();
      
      const prompts: Record<AssistantType, string> = {
        INSIGHTS: `Analyze this research paper and provide exactly 10 key points.

RESPONSE FORMAT:
1. [Main Finding]: Brief description
   - Supporting evidence (p-value if applicable)
   - Clinical significance

2. [Main Finding]: Brief description
   - Supporting evidence
   - Clinical significance

[Continue this exact format for all 10 points]

CRITICAL RULES:
- Start IMMEDIATELY with point 1
- NO introduction or context
- NO conclusion or summary
- EXACTLY 10 points
- Each point MUST follow the format above
- Use ONLY numbers for main points (1., 2., etc.)
- Use ONLY hyphens (-) for sub-points
- Include p-values and statistics where available`,

        ACHIEVEMENTS: `List all unique and groundbreaking aspects of this research.

RESPONSE FORMAT:
1. [Achievement Type]: Brief title
   - Detailed description
   - Scientific significance
   - Impact on field

2. [Achievement Type]: Brief title
   - Detailed description
   - Scientific significance
   - Impact on field

[Continue this format for all achievements]

CRITICAL RULES:
- Start IMMEDIATELY with achievement 1
- NO introduction or context
- NO conclusion
- Each achievement MUST follow the format above
- Use ONLY numbers for main points
- Use ONLY hyphens (-) for sub-points
- [Achievement Type] must be one of:
  * Novel Methodology
  * Groundbreaking Result
  * Technical Innovation
  * Significant Improvement`,

        RESEARCH_IDEAS: `Identify research gaps and future directions.

RESPONSE FORMAT:

IMMEDIATE OPPORTUNITIES:
1. [Research Question]
   - Gap addressed
   - Proposed methodology
   - Expected impact

METHODOLOGICAL IMPROVEMENTS:
1. [Improvement Area]
   - Current limitation
   - Proposed solution
   - Potential benefits

LONG-TERM DIRECTIONS:
1. [Research Direction]
   - Scientific rationale
   - Required resources
   - Potential impact

CRITICAL RULES:
- Use EXACTLY these three sections
- Start IMMEDIATELY with first section
- NO introduction or context
- NO conclusion
- Each point MUST follow the format above
- Use ONLY numbers for main points
- Use ONLY hyphens (-) for sub-points
- At least 2 points per section`
      };

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompts[assistantType],
        attachments: [{ file_id: fileId, tools: [{ type: "file_search" }] }]
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANTS[assistantType],
      });

      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status === "queued" || runStatus.status === "in_progress") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

        if (runStatus.status === "failed") {
          throw new Error(`Analysis failed for ${assistantType}`);
        }
      }

      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find((msg) => msg.role === "assistant");

      if (!assistantMessage?.content) {
        throw new Error(`No response received for ${assistantType}`);
      }

      const content = assistantMessage.content
        .map((item) => (item.type === 'text' ? item.text?.value || "" : ""))
        .join("\n\n");

      // Validate and format the response
      const formattedContent = validateAndFormatResponse(content, assistantType);

      setResults(prev => ({
        ...prev,
        [assistantType]: { type: assistantType, content: formattedContent, status: 'complete' }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [assistantType]: {
          ...prev[assistantType],
          status: 'error',
          error: err instanceof Error ? err.message : 'Analysis failed'
        }
      }));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const fileUpload = await openai.files.create({
        file,
        purpose: "assistants",
      });

      await Promise.all(
        Object.keys(ASSISTANTS).map((type) => 
          processWithAssistant(openai, fileUpload.id, type as AssistantType)
        )
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Upload failed';
      setResults(prev => 
        Object.keys(prev).reduce((acc, key) => ({
          ...acc,
          [key]: { ...prev[key as AssistantType], status: 'error', error }
        }), {} as Record<AssistantType, AnalysisResult>)
      );
    }
  };

  const ResultCard = ({ type, icon: Icon, title, description }: {
    type: AssistantType;
    icon: typeof Lightbulb;
    title: string;
    description: string;
  }) => {
    const result = results[type];
    
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
            <Icon size={20} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-medium text-white">{title}</h2>
        </div>
        <div className="prose prose-invert max-w-none">
          {result.status === 'loading' ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              <span className="text-white/70">Analyzing...</span>
            </div>
          ) : result.status === 'error' ? (
            <div className="text-red-400">{result.error}</div>
          ) : result.status === 'complete' ? (
            <ReactMarkdown>{result.content}</ReactMarkdown>
          ) : (
            <p className="text-white/70">{description}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_center,_#1a1a2a_0%,_#0a0a14_100%)] py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-white">
            Medical Research Analyzer
          </h1>
          <button
            onClick={logout}
            className="primary-button bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="glass-card p-6">
            <div className="border border-white/10 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center">
                  <Upload size={24} className="text-blue-400" />
                </div>
                <span className="text-white text-lg">
                  {file ? file.name : 'Upload Research Paper (PDF)'}
                </span>
              </label>
              {file && (
                <button
                  onClick={handleUpload}
                  disabled={Object.values(results).some(r => r.status === 'loading')}
                  className="primary-button mt-6 mx-auto"
                >
                  <Search size={18} />
                  Analyze Paper
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <ResultCard
              type="INSIGHTS"
              icon={Lightbulb}
              title="Key Insights"
              description="Top points and key findings from the research paper"
            />
            <ResultCard
              type="ACHIEVEMENTS"
              icon={Trophy}
              title="Unique Achievements"
              description="Novel methods, groundbreaking results, and significant innovations"
            />
            <ResultCard
              type="RESEARCH_IDEAS"
              icon={Search}
              title="Research Opportunities"
              description="Future research directions and identified gaps"
            />
          </div>
        </div>
      </div>
    </div>
  );
}