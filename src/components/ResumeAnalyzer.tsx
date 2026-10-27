import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { ResumeData } from '@/types/resumeTypes';
import ResumeAnalysisContent from '@/components/resume/ResumeAnalysisContent';
import {
  analyzeResumeWithAI,
  getStoredAISettings,
  AISettings,
} from '@/services/aiService';
import { AISettingsModal } from '@/components/AISettingsModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Settings, ShieldAlert } from 'lucide-react';

const ResumeAnalyzer: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(getStoredAISettings);
  const { toast } = useToast();

  const handleFileUpload = (file: File, text: string) => {
    setResumeData({
      file,
      text,
      analyzed: false,
      score: 0,
      improvementAreas: [],
      mistakes: [],
    });

    // Start analysis automatically when file is uploaded
    analyzeResume(file, text);
  };

  const analyzeResume = async (file: File, text: string) => {
    setAnalysisLoading(true);

    try {
      // Validate API key presence for chosen provider
      const currentSettings = getStoredAISettings();
      if (currentSettings.provider === 'gemini' && !currentSettings.geminiApiKey) {
        setSettingsOpen(true);
        throw new Error('Please enter your Gemini API Key in settings to proceed.');
      }
      if (currentSettings.provider === 'groq' && !currentSettings.groqApiKey) {
        setSettingsOpen(true);
        throw new Error('Please enter your Groq API Key in settings to proceed.');
      }

      const result = await analyzeResumeWithAI(text, currentSettings);

      setResumeData((prevData) => {
        if (!prevData) return null;
        return {
          ...prevData,
          analyzed: true,
          score: result.score,
          improvementAreas: result.improvementAreas,
          mistakes: result.mistakes,
        };
      });

      const providerLabel =
        result.providerUsed === 'gemini'
          ? 'Google Gemini'
          : result.providerUsed === 'groq'
          ? 'Groq'
          : 'Demo Mode';

      toast({
        title: `Analysis Complete (${providerLabel})`,
        description: "We've analyzed your resume and generated targeted recommendations.",
      });
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast({
        title: 'Analysis Error',
        description: error.message || 'There was an error analyzing your resume. Please check your settings.',
        variant: 'destructive',
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResumeData(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* AI Provider Status Bar */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Engine:</span>
          {aiSettings.provider === 'gemini' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-600" />
              Google Gemini ({aiSettings.geminiModel})
            </Badge>
          )}
          {aiSettings.provider === 'groq' && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-600" />
              Groq ({aiSettings.groqModel})
            </Badge>
          )}
          {aiSettings.provider === 'mock' && (
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
              Demo / Simulated Mode
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          className="h-8 gap-1.5 text-xs font-medium hover:bg-slate-100"
        >
          <Settings className="h-3.5 w-3.5" />
          Configure AI
        </Button>
      </div>

      {!resumeData && <FileUpload onFileUpload={handleFileUpload} />}

      {resumeData && (
        <ResumeAnalysisContent
          resumeData={resumeData}
          resetAnalysis={resetAnalysis}
          analysisLoading={analysisLoading}
        />
      )}

      {/* AI Settings Modal */}
      <AISettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSettingsSaved={(newSettings) => setAiSettings(newSettings)}
      />
    </div>
  );
};

export default ResumeAnalyzer;
